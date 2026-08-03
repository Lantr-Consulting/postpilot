// PostPilot core records. In Milestone 1 these are filled with mock data
// (lib/mock.ts); later milestones swap the mocks for real API responses
// without reshaping the UI. Mirrored by backend/schema.sql from Milestone 5.

// ---------- Platforms ----------

export type Platform = "x" | "linkedin" | "instagram" | "bluesky" | "youtube";

export const PLATFORM_LABEL: Record<Platform, string> = {
  x: "X",
  linkedin: "LinkedIn",
  instagram: "Instagram",
  bluesky: "Bluesky",
  youtube: "YouTube",
};

// ---------- Creator IP (one per user) ----------

export type NarrativeStatus = "seed" | "running" | "resolved";

export interface Narrative {
  title: string;
  arc: string; // where the story is going, in one line
  status: NarrativeStatus;
}

export interface Voice {
  tone: string;
  do: string[];
  dont: string[];
  catchphrases: string[];
}

export interface Goal {
  statement: string;
  horizon: string; // e.g. "by October"
}

// The versioned brand book. Interpreted from plain English, shown for
// review, and never active without an explicit Activate.
export interface IpProfile {
  version: number;
  updatedAt: string; // ISO date
  positioning: string; // what the creator wants to be known for
  pillars: string[];
  backgroundMd: string;
  narratives: Narrative[];
  voice: Voice;
  audience: string;
  goals: Goal[];
  lessons?: string[]; // standing instructions from accepted review moves
}

// The user-blessed rules editorial.py enforces. The user owns every rule.
export interface EditorialRules {
  bannedPhrases: string[];
  sponsoredDisclosure: string; // e.g. "#ad" — required when sponsored (16 CFR 255)
  maxHashtags: number;
  maxEmoji: number;
}

export interface Creator {
  name: string;
  handle: string;
  niche: { topics: string[]; subreddits: string[]; queries: string[] };
  platforms: Platform[];
  ipProfile: IpProfile;
  editorialRules: EditorialRules;
  activated: boolean;
  paused: boolean;
}

// ---------- Library: materials in, atoms out ----------

export type MaterialKind = "transcript" | "notes" | "post" | "newsletter" | "other";
export type MaterialStatus = "uploaded" | "ingesting" | "mined";

export interface Material {
  id: string;
  title: string;
  kind: MaterialKind;
  addedAt: string; // ISO date
  words: number;
  status: MaterialStatus;
  atomCount: number;
  excerpt: string;
}

export type AtomKind = "story" | "take" | "lesson" | "quote" | "stat";

// A content atom: one reusable piece of the creator's IP, mined from a
// material. Drafts cite atoms — the agent never invents the creator's life.
export interface Atom {
  id: string;
  materialId: string;
  materialTitle: string;
  kind: AtomKind;
  text: string;
  pillars: string[];
  narrative?: string;
  usedCount: number;
}

// ---------- Pipeline: ideas → drafts → results ----------

export interface EvidenceRow {
  source: string; // "YouTube", "Reddit r/fitness", "Library"
  datum: string; // the fact that motivated the idea
  url?: string;
  atomId?: string; // set when the evidence is the creator's own material
}

export type IdeaStatus = "proposed" | "accepted" | "declined" | "superseded";

export interface Idea {
  id: string;
  title: string;
  angle: string;
  pillar: string;
  rationale: string;
  evidence: EvidenceRow[];
  status: IdeaStatus;
  narrative?: string | null; // the arc this idea advances, if any
  declineReason?: string;
  runId: string;
}

// One editorial-engine verdict line, rendered exactly as persisted.
export interface RuleCheck {
  rule: string; // e.g. "ftc_disclosure", "platform_length"
  detail: string;
  source: string; // the citation, e.g. "16 CFR 255", "X docs: 280 chars"
  pass: boolean;
}

export type DraftStatus = "draft" | "approved" | "exported" | "posted" | "declined";

export interface Draft {
  id: string;
  ideaId: string;
  ideaTitle: string;
  platform: Platform;
  text: string;
  hashtags: string[];
  sponsored: boolean;
  atomIds: string[];
  checks: RuleCheck[];
  status: DraftStatus;
  slotDate?: string; // YYYY-MM-DD on the calendar
  declineReason?: string;
}

export interface Metrics {
  views: number;
  likes: number;
  comments: number;
  saves: number;
  follows: number;
}

export interface ResultLog {
  id: string;
  draftId: string;
  title: string;
  platform: Platform;
  postedAt: string; // ISO date
  metrics: Metrics; // self-reported
  notes?: string;
}

// ---------- Runs, chat, campaigns, reviews ----------

export type RunKind = "research" | "ingestion" | "review";
export type RunStatus = "queued" | "running" | "done" | "failed";

export interface Run {
  id: string;
  kind: RunKind;
  status: RunStatus;
  startedAt: string;
  report?: string;
}

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  text: string;
  at: string;
}

export interface Thread {
  id: string;
  title: string;
  updatedAt: string;
  messages: ChatMessage[];
}

export type CampaignCadence = "manual" | "daily" | "weekly";

export interface Campaign {
  id: string;
  title: string;
  prompt: string;
  cadence: CampaignCadence;
  hourLocal: number;
  enabled: boolean;
  builtIn?: boolean; // the weekly growth review ships built in
  lastRunAt?: string;
  lastReport?: string;
}

export type MoveStatus = "proposed" | "accepted" | "declined";

export interface StrategyMove {
  id?: string;
  title: string;
  rationale: string;
  lesson?: string; // the standing instruction an acceptance writes into the book
  status: MoveStatus; // accepted moves amend the IP profile
}

export interface GrowthReview {
  id: string;
  at: string;
  summary: string;
  moves: StrategyMove[];
}

// ---------- Niche radar (public trends) ----------

export type TrendSource = "youtube" | "reddit" | "bluesky" | "news" | "trends";

export interface TrendItem {
  id: string;
  source: TrendSource;
  title: string;
  datum: string; // "1.2M views in 3 days", "top of r/fitness"
  url?: string;
}
