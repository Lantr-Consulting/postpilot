"use client";

import type { ReactNode } from "react";
import type {
  AtomKind,
  DraftStatus,
  IdeaStatus,
  Platform,
  RuleCheck,
} from "@/lib/types";
import { PLATFORM_LABEL } from "@/lib/types";
import { pick, useLanguage } from "@/lib/language";

export function DisclaimerBanner() {
  const language = useLanguage();
  return (
    <div className="flex items-center gap-2 border-b border-hairline bg-page px-5 py-1.5 text-[11px] text-ink-muted">
      <span aria-hidden className="inline-block size-2 rounded-full bg-accent" />
      <span>
        <strong className="font-semibold text-ink">
          {pick(language, "AI 只负责准备初稿，发布前的每一项内容都由你审核。", "AI prepares drafts; you review every item before it goes anywhere.")}
        </strong>{" "}
        {pick(language, "内容表现由用户自行记录，PostPilot 不会代替你发布。", "You log results yourself, and PostPilot never publishes for you.")}
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

const IDEA_STYLES: Record<IdeaStatus, { zh: string; en: string; cls: string }> = {
  proposed: { zh: "等待确认", en: "Awaiting review", cls: "bg-accent/15 text-accent" },
  accepted: { zh: "已采用", en: "Accepted", cls: "bg-good/10 text-good" },
  declined: { zh: "未采用", en: "Declined", cls: "bg-wash-2 text-ink-2" },
  superseded: { zh: "已有新版本", en: "Superseded", cls: "bg-wash-2 text-ink-muted" },
};

export function IdeaBadge({ status }: { status: IdeaStatus }) {
  const language = useLanguage();
  const s = IDEA_STYLES[status];
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${s.cls}`}
    >
      {s[language]}
    </span>
  );
}

const DRAFT_STYLES: Record<DraftStatus, { zh: string; en: string; cls: string }> = {
  draft: { zh: "等待审核", en: "Draft", cls: "bg-accent/15 text-accent" },
  approved: { zh: "已通过", en: "Approved", cls: "bg-good/10 text-good" },
  exported: { zh: "已导出", en: "Exported", cls: "bg-atom-stat/15 text-atom-stat" },
  posted: { zh: "已发布", en: "Posted", cls: "bg-wash-2 text-ink-2" },
  declined: { zh: "未采用", en: "Declined", cls: "bg-wash-2 text-ink-muted" },
};

export function DraftBadge({ status }: { status: DraftStatus }) {
  const language = useLanguage();
  const s = DRAFT_STYLES[status];
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${s.cls}`}
    >
      {s[language]}
    </span>
  );
}

const PLATFORM_STYLES: Record<Platform, string> = {
  x: "bg-wash-2 text-(--pf-x)",
  linkedin: "bg-[#0a66c2]/15 text-(--pf-li)",
  instagram: "bg-[#e1306c]/12 text-(--pf-ig)",
  bluesky: "bg-[#0085ff]/12 text-(--pf-bs)",
  youtube: "bg-[#ff0033]/10 text-(--pf-yt)",
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

const ATOM_LABEL: Record<AtomKind, { zh: string; en: string }> = {
  story: { zh: "经历", en: "Story" },
  take: { zh: "观点", en: "Take" },
  lesson: { zh: "经验", en: "Lesson" },
  quote: { zh: "原话", en: "Quote" },
  stat: { zh: "数据", en: "Stat" },
};

export function AtomBadge({ kind }: { kind: AtomKind }) {
  const language = useLanguage();
  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide ${ATOM_STYLES[kind]}`}
    >
      {ATOM_LABEL[kind][language]}
    </span>
  );
}

// The editorial engine's verdict lines, rendered exactly as persisted.
export function CheckList({ checks }: { checks: RuleCheck[] }) {
  const language = useLanguage();
  if (checks.length === 0) return null;
  return (
    <ul className="grid gap-x-6 gap-y-1.5">
      {checks.map((c, i) => {
        const englishDetail: Record<string, string> = {
          platform_length: c.pass ? "Within the platform character limit" : "Over the platform character limit",
          ftc_disclosure: c.pass ? "Required sponsorship disclosure is present" : "Required sponsorship disclosure is missing",
          banned_phrases: c.pass ? "No blocked phrases found" : "Contains a blocked phrase",
          hashtag_cap: c.pass ? "Within the hashtag limit" : "Over the hashtag limit",
          emoji_cap: c.pass ? "Within the emoji limit" : "Over the emoji limit",
          duplicate_distance: c.pass ? "Distinct from previously published posts" : "Too similar to a previous post",
          atom_citation: c.pass ? "Every personal claim resolves to source material" : "A cited source item is missing",
        };
        const source = language === "zh"
          ? c.source
          : c.source
              .replace("你的内容检查规则", "Your editorial rules")
              .replace("PostPilot 材料引用规则", "PostPilot source-grounding rule")
              .replace("发布格式", "publishing format")
              .replace("美国联邦贸易委员会（FTC）广告背书指南", "FTC Endorsement Guides");
        return (
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
            <span className="text-ink-2">{language === "zh" ? c.detail : (englishDetail[c.rule] ?? c.detail)}</span>
            <span className="ml-1.5 text-xs text-ink-muted">({source})</span>
            <span className="sr-only">{c.pass ? pick(language, "（通过）", "(passed)") : pick(language, "（需要处理）", "(needs attention)")}</span>
          </span>
        </li>
      );})}
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
  x: "border-l-(--pf-x-edge)",
  linkedin: "border-l-[#0a66c2]",
  instagram: "border-l-[#e1306c]",
  bluesky: "border-l-[#0085ff]",
  youtube: "border-l-[#ff0033]",
};
