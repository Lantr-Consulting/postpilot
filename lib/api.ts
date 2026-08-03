// Typed client for the PostPilot backend. Every call degrades gracefully:
// callers catch and fall back to sample data, so the app works signed-out
// and with no network at all (the Milestone 1 experience is the fallback).

import { supabase } from "./supabase";
import type {
  Atom,
  Draft,
  EditorialRules,
  Idea,
  IpProfile,
  Material,
  Platform,
  ResultLog,
  RuleCheck,
  TrendItem,
} from "./types";

const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8020";

export class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

export function isSignedOut(e: unknown): boolean {
  return e instanceof ApiError && e.status === 401;
}

async function authHeaders(): Promise<Record<string, string>> {
  try {
    const { data } = await supabase.auth.getSession();
    const token = data.session?.access_token;
    return token ? { Authorization: `Bearer ${token}` } : {};
  } catch {
    return {};
  }
}

async function req<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(await authHeaders()),
      ...init?.headers,
    },
  });
  if (!res.ok) {
    let detail = res.statusText;
    try {
      const body = await res.json();
      detail = typeof body.detail === "string" ? body.detail : detail;
    } catch {}
    throw new ApiError(res.status, detail);
  }
  return res.json();
}

export function health(): Promise<{ ok: boolean; llm: boolean; youtube: boolean }> {
  return req("/health");
}

// ---------- Account ----------

export interface Me {
  email: string;
  ipProfile: IpProfile;
  editorialRules: EditorialRules;
  platforms: Platform[];
  niche: { topics: string[]; subreddits: string[]; queries: string[] };
  activated: boolean;
  paused: boolean;
}

export function getMe(): Promise<Me> {
  return req("/me");
}

export function patchSettings(fields: {
  editorialRules?: EditorialRules;
  platforms?: Platform[];
  niche?: Me["niche"];
  paused?: boolean;
}): Promise<Omit<Me, "email">> {
  return req("/me/settings", { method: "PATCH", body: JSON.stringify(fields) });
}

export function activate(): Promise<Omit<Me, "email">> {
  return req("/me/activate", { method: "POST" });
}

// ---------- Niche radar ----------

export function getTrends(niche: {
  topics: string[];
  subreddits: string[];
  queries: string[];
}): Promise<TrendItem[]> {
  const params = new URLSearchParams({
    topics: niche.topics.join(","),
    subreddits: niche.subreddits.join(","),
    queries: niche.queries.join(","),
  });
  return req<{ items: TrendItem[] }>(`/trends?${params}`).then((r) => r.items);
}

// The interpreter: signed out it just returns the brand book; signed in it
// SAVES it as the next (inactive) version — Activate blesses it.
export function interpretProfile(
  text: string
): Promise<{ profile: Omit<IpProfile, "version" | "updatedAt"> & Partial<IpProfile> }> {
  return req("/interpret-profile", { method: "POST", body: JSON.stringify({ text }) });
}

export function chat(args: {
  message: string;
  history?: { role: "user" | "assistant"; content: string }[];
  profile?: IpProfile;
  threadId?: string | null;
}): Promise<{ reply: string; threadId: string | null }> {
  return req("/chat", { method: "POST", body: JSON.stringify(args) });
}

export function getThreads(): Promise<{ id: string; title: string; updatedAt: string }[]> {
  return req<{ threads: { id: string; title: string; updatedAt: string }[] }>(
    "/threads"
  ).then((r) => r.threads);
}

export function getThreadMessages(
  threadId: string
): Promise<{ id: string; role: "user" | "assistant"; text: string; at: string }[]> {
  return req<{ messages: { id: string; role: "user" | "assistant"; text: string; at: string }[] }>(
    `/threads/${threadId}/messages`
  ).then((r) => r.messages);
}

// ---------- The workspace (per-user rows in Supabase) ----------

export interface Workspace {
  materials: Material[];
  atoms: Atom[];
  ideas: Idea[];
  drafts: Draft[];
}

export function getWorkspace(): Promise<Workspace> {
  return req("/workspace");
}

export function addMaterial(args: {
  title: string;
  kind: string;
  text: string;
}): Promise<Material> {
  return req("/materials", { method: "POST", body: JSON.stringify(args) });
}

export function ingestMaterial(
  id: string
): Promise<{ material: Material; atoms: Atom[] }> {
  return req(`/materials/${id}/ingest`, { method: "POST" });
}

export function runResearch(mission?: string): Promise<{ ideas: Idea[] }> {
  return req("/research", { method: "POST", body: JSON.stringify({ mission }) });
}

export function acceptIdea(id: string): Promise<{ drafts: Draft[] }> {
  return req(`/ideas/${id}/accept`, { method: "POST" });
}

export function declineIdea(id: string, reason: string): Promise<Idea> {
  return req(`/ideas/${id}/decline`, {
    method: "POST",
    body: JSON.stringify({ reason }),
  });
}

export function editDraft(id: string, text: string): Promise<Draft> {
  return req(`/drafts/${id}`, { method: "PATCH", body: JSON.stringify({ text }) });
}

// Approve re-checks the FINAL text server-side; 409 means the engine
// vetoed — the error carries the fresh check rows.
export async function approveDraft(
  id: string,
  text: string
): Promise<{ draft: Draft | null; blockedChecks: RuleCheck[] | null }> {
  const res = await fetch(`${API}/drafts/${id}/approve`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...(await authHeaders()) },
    body: JSON.stringify({ text }),
  });
  const body = await res.json();
  if (res.status === 409 && body.detail?.checks) {
    return { draft: null, blockedChecks: body.detail.checks as RuleCheck[] };
  }
  if (!res.ok) throw new ApiError(res.status, body.detail ?? res.statusText);
  return { draft: body as Draft, blockedChecks: null };
}

export function declineDraft(id: string, reason: string): Promise<Draft> {
  return req(`/drafts/${id}/decline`, {
    method: "POST",
    body: JSON.stringify({ reason }),
  });
}

export function exportDraft(id: string): Promise<Draft> {
  return req(`/drafts/${id}/export`, { method: "POST" });
}

// ---------- Results (self-reported) ----------

export function getResults(): Promise<ResultLog[]> {
  return req<{ results: ResultLog[] }>("/results").then((r) => r.results);
}

export function logResult(args: {
  draftId?: string;
  title: string;
  platform: Platform;
  postedAt: string;
  metrics: { views: number; likes: number; comments: number; saves: number; follows: number };
  notes?: string;
}): Promise<ResultLog> {
  return req("/results", { method: "POST", body: JSON.stringify(args) });
}
