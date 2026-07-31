"use client";

import { useState } from "react";
import { ATOMS, DRAFTS, IDEAS, TRENDS } from "@/lib/mock";
import type { Draft, Idea, TrendSource } from "@/lib/types";
import { useToast } from "@/components/toast";
import {
  Card,
  CheckList,
  DraftBadge,
  IdeaBadge,
  PLATFORM_EDGE,
  PlatformChip,
  SectionHeading,
} from "@/components/ui";

const SOURCE_LABEL: Record<TrendSource, string> = {
  youtube: "YouTube",
  reddit: "Reddit",
  bluesky: "Bluesky",
  news: "News",
  trends: "Trends",
};

export default function StudioPage() {
  const toast = useToast();
  const [ideas, setIdeas] = useState<Idea[]>(IDEAS);
  const [drafts, setDrafts] = useState<Draft[]>(DRAFTS);
  const [editing, setEditing] = useState<string | null>(null);

  function decideIdea(id: string, status: "accepted" | "declined") {
    if (status === "declined") {
      const reason = window.prompt("Why? Your reason becomes a standing lesson.");
      if (reason === null) return;
      setIdeas((xs) =>
        xs.map((i) => (i.id === id ? { ...i, status, declineReason: reason } : i))
      );
      toast("info", "Declined — the reason feeds back into the next run.");
      return;
    }
    setIdeas((xs) => xs.map((i) => (i.id === id ? { ...i, status } : i)));
    toast("success", "Idea accepted — drafts will appear below. (Sample data)");
  }

  function decideDraft(id: string, status: Draft["status"]) {
    setDrafts((xs) => xs.map((d) => (d.id === id ? { ...d, status } : d)));
    if (status === "approved")
      toast("success", "Approved — the engine re-checked the final text.");
    if (status === "exported") toast("success", "Copied to your clipboard. Go post it!");
    if (status === "declined")
      toast("info", "Declined — the reason feeds back into generation.");
  }

  return (
    <div className="flex flex-col gap-5">
      <SectionHeading
        title="Studio"
        sub="Niche radar → ideas with evidence → checked drafts you approve and export."
      />

      <div className="grid gap-5 lg:grid-cols-[1fr_300px]">
        <div className="flex flex-col gap-5">
          {/* Ideas */}
          <Card title="Ideas">
            <ul className="flex flex-col gap-3">
              {ideas.map((idea) => (
                <li key={idea.id} className="rounded-xl bg-surface-2 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="text-sm font-semibold">{idea.title}</div>
                      <div className="mt-0.5 text-xs text-ink-muted">
                        {idea.pillar}
                      </div>
                    </div>
                    <IdeaBadge status={idea.status} />
                  </div>
                  <p className="mt-2 text-sm leading-relaxed text-ink-2">
                    {idea.angle}
                  </p>
                  <ul className="mt-3 flex flex-col gap-1.5">
                    {idea.evidence.map((e, i) => (
                      <li key={i} className="flex items-start gap-2 text-xs">
                        <span
                          className={`mt-px inline-flex shrink-0 items-center rounded-full px-1.5 py-0.5 font-semibold ${
                            e.atomId
                              ? "bg-atom-story/15 text-atom-story"
                              : "bg-white/10 text-ink-2"
                          }`}
                        >
                          {e.atomId ? "Your material" : e.source}
                        </span>
                        <span className="text-ink-muted">{e.datum}</span>
                      </li>
                    ))}
                  </ul>
                  {idea.declineReason && (
                    <p className="mt-2 rounded-lg bg-white/5 px-3 py-2 text-xs text-ink-muted">
                      Standing lesson: {idea.declineReason}
                    </p>
                  )}
                  {idea.status === "proposed" && (
                    <div className="mt-3 flex gap-2">
                      <button
                        onClick={() => decideIdea(idea.id, "accepted")}
                        className="btn-primary px-3.5 py-1.5 text-xs"
                      >
                        Accept → draft it
                      </button>
                      <button
                        onClick={() => decideIdea(idea.id, "declined")}
                        className="btn-ghost px-3.5 py-1.5 text-xs"
                      >
                        Decline…
                      </button>
                    </div>
                  )}
                </li>
              ))}
            </ul>
          </Card>

          {/* Drafts */}
          <Card title="Drafts">
            <ul className="flex flex-col gap-3">
              {drafts.map((d) => {
                const blocked = d.checks.some((c) => !c.pass);
                const cited = ATOMS.filter((a) => d.atomIds.includes(a.id));
                return (
                  <li
                    key={d.id}
                    className={`rounded-xl border-l-2 bg-surface-2 p-4 ${PLATFORM_EDGE[d.platform]}`}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2">
                        <PlatformChip platform={d.platform} />
                        {d.sponsored && (
                          <span className="rounded-full bg-critical/15 px-2 py-0.5 text-[11px] font-semibold text-critical">
                            Sponsored
                          </span>
                        )}
                        <span className="truncate text-xs text-ink-muted">
                          {d.ideaTitle}
                        </span>
                      </div>
                      <DraftBadge status={d.status} />
                    </div>

                    {editing === d.id ? (
                      <textarea
                        defaultValue={d.text}
                        onBlur={(e) => {
                          setDrafts((xs) =>
                            xs.map((x) =>
                              x.id === d.id ? { ...x, text: e.target.value } : x
                            )
                          );
                          setEditing(null);
                          toast("info", "Edited — approve to re-run the checks.");
                        }}
                        autoFocus
                        rows={6}
                        className="mt-3 w-full rounded-lg border border-hairline bg-page p-3 text-sm text-ink"
                      />
                    ) : (
                      <p className="mt-3 whitespace-pre-line rounded-lg bg-page/60 p-3 text-sm leading-relaxed text-ink-2">
                        {d.text}
                        {d.hashtags.length > 0 && (
                          <span className="mt-2 block text-accent">
                            {d.hashtags.join(" ")}
                          </span>
                        )}
                      </p>
                    )}

                    {cited.length > 0 && (
                      <p className="mt-2 text-xs text-ink-muted">
                        Grounded in:{" "}
                        {cited.map((a) => a.materialTitle).filter((v, i, s) => s.indexOf(v) === i).join(" · ")}
                      </p>
                    )}

                    <div className="mt-3">
                      <CheckList checks={d.checks} />
                    </div>

                    {(d.status === "draft" || d.status === "approved") && (
                      <div className="mt-3 flex flex-wrap gap-2">
                        {d.status === "draft" && (
                          <>
                            <button
                              onClick={() => decideDraft(d.id, "approved")}
                              disabled={blocked}
                              className="btn-primary px-3.5 py-1.5 text-xs"
                              title={blocked ? "Fix the flagged checks first" : undefined}
                            >
                              Approve
                            </button>
                            <button
                              onClick={() => setEditing(d.id)}
                              className="btn-ghost px-3.5 py-1.5 text-xs"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => decideDraft(d.id, "declined")}
                              className="btn-ghost px-3.5 py-1.5 text-xs"
                            >
                              Decline
                            </button>
                          </>
                        )}
                        {d.status === "approved" && (
                          <button
                            onClick={() => decideDraft(d.id, "exported")}
                            className="btn-primary px-3.5 py-1.5 text-xs"
                          >
                            Copy &amp; export
                          </button>
                        )}
                        {blocked && (
                          <span className="self-center text-xs text-critical">
                            Blocked by the editorial engine until flags clear.
                          </span>
                        )}
                      </div>
                    )}
                  </li>
                );
              })}
            </ul>
          </Card>
        </div>

        {/* Niche radar rail */}
        <div className="flex flex-col gap-5">
          <Card title="Niche radar" action={<span className="text-xs text-ink-muted">live at M3</span>}>
            <ul className="flex flex-col gap-3">
              {TRENDS.map((t) => (
                <li key={t.id} className="rounded-xl bg-surface-2 p-3">
                  <span className="rounded-full bg-white/10 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-ink-muted">
                    {SOURCE_LABEL[t.source]}
                  </span>
                  <p className="mt-1.5 text-xs leading-relaxed text-ink-2">
                    {t.title}
                  </p>
                  <p className="mt-1 text-[11px] text-ink-muted">{t.datum}</p>
                </li>
              ))}
            </ul>
          </Card>
        </div>
      </div>
    </div>
  );
}
