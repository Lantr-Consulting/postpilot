// Typed client for the PostPilot backend. Every call degrades gracefully:
// callers catch and fall back to sample data, so the app works with no
// network at all (the Milestone 1 experience is the fallback).

import type {
  Atom,
  Draft,
  Idea,
  IpProfile,
  Material,
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

async function req<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API}${path}`, {
    ...init,
    headers: { "Content-Type": "application/json", ...init?.headers },
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

// The interpreter returns the brand book WITHOUT version bookkeeping —
// versions are client-side until Supabase lands at Milestone 5.
export function interpretProfile(
  text: string
): Promise<{ profile: Omit<IpProfile, "version" | "updatedAt"> }> {
  return req("/interpret-profile", { method: "POST", body: JSON.stringify({ text }) });
}

export function chat(args: {
  message: string;
  history?: { role: "user" | "assistant"; content: string }[];
  profile?: IpProfile;
}): Promise<{ reply: string }> {
  return req("/chat", { method: "POST", body: JSON.stringify(args) });
}

// ---------- The workspace (Milestone 4: server file store; M5: Supabase) ----------

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
  id: string,
  profile: IpProfile
): Promise<{ material: Material; atoms: Atom[] }> {
  return req(`/materials/${id}/ingest`, {
    method: "POST",
    body: JSON.stringify({ profile }),
  });
}

export function runResearch(profile: object): Promise<{ ideas: Idea[] }> {
  return req("/research", { method: "POST", body: JSON.stringify({ profile }) });
}

export function acceptIdea(
  id: string,
  args: { profile: IpProfile; rules: object; platforms: string[] }
): Promise<{ drafts: Draft[] }> {
  return req(`/ideas/${id}/accept`, { method: "POST", body: JSON.stringify(args) });
}

export function declineIdea(id: string, reason: string): Promise<Idea> {
  return req(`/ideas/${id}/decline`, {
    method: "POST",
    body: JSON.stringify({ reason }),
  });
}

export function editDraft(id: string, text: string, rules: object): Promise<Draft> {
  return req(`/drafts/${id}`, {
    method: "PATCH",
    body: JSON.stringify({ text, rules }),
  });
}

// Approve re-checks the FINAL text server-side; 409 means the engine
// vetoed — the error carries the fresh check rows.
export async function approveDraft(
  id: string,
  text: string,
  rules: object
): Promise<{ draft: Draft | null; blockedChecks: RuleCheck[] | null }> {
  const res = await fetch(`${API}/drafts/${id}/approve`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text, rules }),
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
