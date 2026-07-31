import type { ReactNode } from "react";
import type {
  AtomKind,
  DraftStatus,
  IdeaStatus,
  Platform,
  RuleCheck,
} from "@/lib/types";
import { PLATFORM_LABEL } from "@/lib/types";

export function DisclaimerBanner() {
  return (
    <div className="flex items-center gap-2 border-b border-hairline bg-page px-5 py-1.5 text-[11px] text-ink-muted">
      <span aria-hidden className="inline-block size-2 rounded-full bg-accent" />
      <span>
        <strong className="font-semibold text-ink">
          AI-generated drafts — you review everything before it&apos;s posted.
        </strong>{" "}
        Performance data is self-reported. PostPilot never publishes on your
        behalf.
      </span>
    </div>
  );
}

export function Card({
  title,
  action,
  children,
  className = "",
}: {
  title?: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={`rounded-2xl bg-surface p-5 ${className}`}>
      {(title || action) && (
        <div className="mb-4 flex items-center justify-between gap-3">
          {title && (
            <h2 className="text-sm font-semibold tracking-tight">{title}</h2>
          )}
          {action}
        </div>
      )}
      {children}
    </section>
  );
}

export function Stat({
  label,
  value,
  hint,
}: {
  label: string;
  value: string | number;
  hint?: string;
}) {
  return (
    <div className="rounded-2xl bg-surface p-4">
      <div className="text-xs text-ink-muted">{label}</div>
      <div
        className="mt-1 text-2xl font-semibold tracking-tight"
        style={{ fontVariantNumeric: "tabular-nums" }}
      >
        {value}
      </div>
      {hint && <div className="mt-0.5 text-xs text-ink-muted">{hint}</div>}
    </div>
  );
}

const IDEA_STYLES: Record<IdeaStatus, { label: string; cls: string }> = {
  proposed: { label: "Awaiting your call", cls: "bg-accent/15 text-accent" },
  accepted: { label: "Accepted", cls: "bg-good/10 text-good" },
  declined: { label: "Declined", cls: "bg-white/10 text-ink-2" },
  superseded: { label: "Superseded", cls: "bg-white/10 text-ink-muted" },
};

export function IdeaBadge({ status }: { status: IdeaStatus }) {
  const s = IDEA_STYLES[status];
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${s.cls}`}
    >
      {s.label}
    </span>
  );
}

const DRAFT_STYLES: Record<DraftStatus, { label: string; cls: string }> = {
  draft: { label: "Needs review", cls: "bg-accent/15 text-accent" },
  approved: { label: "Approved", cls: "bg-good/10 text-good" },
  exported: { label: "Exported", cls: "bg-atom-stat/15 text-atom-stat" },
  posted: { label: "Posted", cls: "bg-white/10 text-ink-2" },
  declined: { label: "Declined", cls: "bg-white/10 text-ink-muted" },
};

export function DraftBadge({ status }: { status: DraftStatus }) {
  const s = DRAFT_STYLES[status];
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${s.cls}`}
    >
      {s.label}
    </span>
  );
}

const PLATFORM_STYLES: Record<Platform, string> = {
  x: "bg-white/10 text-ink",
  linkedin: "bg-[#0a66c2]/20 text-[#6ab4f7]",
  instagram: "bg-[#e1306c]/15 text-[#f27ba4]",
  bluesky: "bg-[#0085ff]/15 text-[#57b8ff]",
  youtube: "bg-[#ff0033]/15 text-[#ff7a8a]",
};

export function PlatformChip({ platform }: { platform: Platform }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold ${PLATFORM_STYLES[platform]}`}
    >
      {PLATFORM_LABEL[platform]}
    </span>
  );
}

const ATOM_STYLES: Record<AtomKind, string> = {
  story: "bg-atom-story/15 text-atom-story",
  take: "bg-atom-take/15 text-atom-take",
  lesson: "bg-atom-lesson/15 text-atom-lesson",
  quote: "bg-atom-quote/15 text-atom-quote",
  stat: "bg-atom-stat/15 text-atom-stat",
};

export function AtomBadge({ kind }: { kind: AtomKind }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide ${ATOM_STYLES[kind]}`}
    >
      {kind}
    </span>
  );
}

// The editorial engine's verdict lines, rendered exactly as persisted.
export function CheckList({ checks }: { checks: RuleCheck[] }) {
  if (checks.length === 0) return null;
  return (
    <ul className="grid gap-x-6 gap-y-1.5">
      {checks.map((c, i) => (
        <li key={`${c.rule}-${i}`} className="flex items-start gap-2 text-sm">
          <span
            aria-hidden
            className={`mt-0.5 inline-flex size-4 shrink-0 items-center justify-center rounded-full text-[10px] font-bold text-page ${
              c.pass ? "bg-good" : "bg-critical"
            }`}
          >
            {c.pass ? "✓" : "!"}
          </span>
          <span>
            <span className="text-ink-2">{c.detail}</span>
            <span className="ml-1.5 text-xs text-ink-muted">({c.source})</span>
            <span className="sr-only">{c.pass ? " (clear)" : " (flagged)"}</span>
          </span>
        </li>
      ))}
    </ul>
  );
}

export function SectionHeading({
  title,
  sub,
}: {
  title: string;
  sub?: string;
}) {
  return (
    <div className="mb-4">
      <h1 className="font-display text-[26px] font-semibold leading-tight">
        {title}
      </h1>
      {sub && <p className="mt-1.5 text-sm text-ink-2">{sub}</p>}
    </div>
  );
}

// Platform accent edges for draft cards — the variant's platform reads at a
// glance before any text does.
export const PLATFORM_EDGE: Record<Platform, string> = {
  x: "border-l-[#e7e9ea]/50",
  linkedin: "border-l-[#0a66c2]",
  instagram: "border-l-[#e1306c]",
  bluesky: "border-l-[#0085ff]",
  youtube: "border-l-[#ff0033]",
};
