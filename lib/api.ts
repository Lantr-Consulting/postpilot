// Typed client for the PostPilot backend. Every call degrades gracefully:
// callers catch and fall back to sample data, so the app works with no
// network at all (the Milestone 1 experience is the fallback).

import type { IpProfile, TrendItem } from "./types";

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
