"use client";

import { useEffect, useState } from "react";
import {
  acceptIdea,
  approveDraft,
  declineDraft,
  declineIdea,
  editDraft,
  exportDraft,
  getTrends,
  runResearch,
} from "@/lib/api";
import { useWorkspace } from "@/lib/use-workspace";
import { ATOMS, CREATOR, DRAFTS, IDEAS, TRENDS } from "@/lib/mock";
import type { Draft, Idea, TrendItem, TrendSource } from "@/lib/types";
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

function apiMessage(e: unknown, fallback: string): string {
  return e instanceof Error && e.message.length > 3 ? e.message : fallback;
}

export default function StudioPage() {
  const toast = useToast();
  const { ws, live, refresh } = useWorkspace();

  // Mock-mode local state — the offline fallback keeps its M1 interactivity.
  const [mockIdeas, setMockIdeas] = useState<Idea[]>(IDEAS);
  const [mockDrafts, setMockDrafts] = useState<Draft[]>(DRAFTS);

  const ideas = live && ws ? ws.ideas : mockIdeas;
  const drafts = live && ws ? ws.drafts : mockDrafts;
  const atoms = live && ws ? ws.atoms : ATOMS;

  const [editing, setEditing] = useState<string | null>(null);
  const [researching, setResearching] = useState(false);
  const [draftingIdea, setDraftingIdea] = useState<string | null>(null);
  const [busyDraft, setBusyDraft] = useState<string | null>(null);

  const [trends, setTrends] = useState<TrendItem[]>(TRENDS);
  const [radarLive, setRadarLive] = useState(false);
  useEffect(() => {
    getTrends(CREATOR.niche)
      .then((items) => {
        if (items.length) {
          setTrends(items);
          setRadarLive(true);
        }
      })
      .catch(() => {}); // offline → the M1 sample rail stands
  }, []);

  async function research() {
    if (!live) {
      toast("info", "Sign in to build your own pipeline — this is sample data.");
      return;
    }
    setResearching(true);
    try {
      const { ideas: fresh } = await runResearch();
      await refresh();
      toast("success", `${fresh.length} ideas proposed — evidence attached.`);
    } catch (e) {
      toast("error", apiMessage(e, "The researcher came back empty. Try again in a minute."));
    }
    setResearching(false);
  }

  async function decideIdea(id: string, status: "accepted" | "declined") {
    if (status === "declined") {
      const reason = window.prompt("Why? Your reason becomes a standing lesson.");
      if (reason === null) return;
      if (live) {
        await declineIdea(id, reason).catch(() => {});
        await refresh();
      } else {
        setMockIdeas((xs) =>
          xs.map((i) => (i.id === id ? { ...i, status, declineReason: reason } : i))
        );
      }
      toast("info", "Declined — the reason feeds the next research run.");
      return;
    }
    if (live) {
      setDraftingIdea(id);
      try {
        const { drafts: fresh } = await acceptIdea(id);
        await refresh();
        toast("success", `${fresh.length} platform variants drafted and checked.`);
      } catch (e) {
        toast("error", apiMessage(e, "Drafting failed — try accepting again."));
      }
      setDraftingIdea(null);
    } else {
      setMockIdeas((xs) => xs.map((i) => (i.id === id ? { ...i, status } : i)));
      toast("success", "Idea accepted — drafts will appear below. (Sample data)");
    }
  }

  async function saveEdit(d: Draft, text: string) {
    setEditing(null);
    if (live) {
      await editDraft(d.id, text).catch(() => {});
      await refresh();
      toast("info", "Edited — the engine re-checked your text.");
    } else {
      setMockDrafts((xs) => xs.map((x) => (x.id === d.id ? { ...x, text } : x)));
      toast("info", "Edited — approve to re-run the checks.");
    }
  }

  async function approve(d: Draft) {
    if (!live) {
      setMockDrafts((xs) =>
        xs.map((x) => (x.id === d.id ? { ...x, status: "approved" } : x))
      );
      toast("success", "Approved — the engine re-checked the final text.");
      return;
    }
    setBusyDraft(d.id);
    try {
      const { blockedChecks } = await approveDraft(d.id, d.text);
      await refresh();
      if (blockedChecks) {
        toast("error", "The editorial engine blocked this draft — see the flagged checks.");
      } else {
        toast("success", "Approved and slotted on the calendar.");
      }
    } catch {
      toast("error", "Approve failed — is the backend up?");
    }
    setBusyDraft(null);
  }

  async function decline(d: Draft) {
    const reason = window.prompt("Why? Your reason becomes a standing lesson.");
    if (reason === null) return;
    if (live) {
      await declineDraft(d.id, reason).catch(() => {});
      await refresh();
    } else {
      setMockDrafts((xs) =>
        xs.map((x) => (x.id === d.id ? { ...x, status: "declined" } : x))
      );
    }
    toast("info", "Declined — the reason feeds back into generation.");
  }

  async function copyExport(d: Draft) {
    const pack = d.text + (d.hashtags.length ? `\n${d.hashtags.join(" ")}` : "");
    navigator.clipboard?.writeText(pack).catch(() => {});
    if (live) {
      await exportDraft(d.id).catch(() => {});
      await refresh();
    } else {
      setMockDrafts((xs) =>
        xs.map((x) => (x.id === d.id ? { ...x, status: "exported" } : x))
      );
    }
    toast("success", "Copied to your clipboard. Go post it!");
  }

  const knownAtoms = new Map(atoms.map((a) => [a.id, a.materialTitle]));

  return (
    <div className="flex flex-col gap-5">
      <SectionHeading
        title="Studio"
        sub="Niche radar → ideas with evidence → checked drafts you approve and export."
      />

      <div className="grid gap-5 lg:grid-cols-[1fr_300px]">
        <div className="flex flex-col gap-5">
          {/* Ideas */}
          <Card
            title="Ideas"
            action={
              <button
                onClick={research}
                disabled={researching}
                className="btn-primary px-3.5 py-1.5 text-xs"
              >
                {researching ? "Researching your niche… ~1 min" : "Run research"}
              </button>
            }
          >
            {ideas.length === 0 ? (
              <p className="text-sm text-ink-muted">
                No ideas yet. Run research — the agent scans your niche and
                your Library, and comes back with evidence.
              </p>
            ) : (
              <ul className="flex flex-col gap-3">
                {ideas.map((idea) => (
                  <li key={idea.id} className="rounded-xl bg-surface-2 p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="text-sm font-semibold">{idea.title}</div>
                        <div className="mt-0.5 flex flex-wrap items-center gap-1.5 text-xs text-ink-muted">
                          {idea.pillar}
                          {idea.narrative && (
                            <span className="rounded-full bg-atom-quote/15 px-2 py-0.5 text-[10px] font-medium text-atom-quote">
                              arc: {idea.narrative}
                            </span>
                          )}
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
                                : "bg-wash-2 text-ink-2"
                            }`}
                          >
                            {e.atomId ? "Your material" : e.source}
                          </span>
                          <span className="text-ink-muted">{e.datum}</span>
                        </li>
                      ))}
                    </ul>
                    {idea.declineReason && (
                      <p className="mt-2 rounded-lg bg-wash px-3 py-2 text-xs text-ink-muted">
                        Standing lesson: {idea.declineReason}
                      </p>
                    )}
                    {idea.status === "proposed" && (
                      <div className="mt-3 flex gap-2">
                        <button
                          onClick={() => decideIdea(idea.id, "accepted")}
                          disabled={draftingIdea !== null}
                          className="btn-primary px-3.5 py-1.5 text-xs"
                        >
                          {draftingIdea === idea.id
                            ? "Drafting variants…"
                            : "Accept → draft it"}
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
            )}
          </Card>

          {/* Drafts */}
          <Card title="Drafts">
            {drafts.length === 0 ? (
              <p className="text-sm text-ink-muted">
                Accept an idea above and its platform variants land here,
                each already checked by the editorial engine.
              </p>
            ) : (
              <ul className="flex flex-col gap-3">
                {drafts.map((d) => {
                  const blocked = d.checks.some((c) => !c.pass);
                  const cited = d.atomIds
                    .map((id) => knownAtoms.get(id))
                    .filter((v, i, s): v is string => !!v && s.indexOf(v) === i);
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
                          onBlur={(e) => saveEdit(d, e.target.value)}
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
                          Grounded in: {cited.join(" · ")}
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
                                onClick={() => approve(d)}
                                disabled={blocked || busyDraft === d.id}
                                className="btn-primary px-3.5 py-1.5 text-xs"
                                title={blocked ? "Fix the flagged checks first" : undefined}
                              >
                                {busyDraft === d.id ? "Checking…" : "Approve"}
                              </button>
                              <button
                                onClick={() => setEditing(d.id)}
                                className="btn-ghost px-3.5 py-1.5 text-xs"
                              >
                                Edit
                              </button>
                              <button
                                onClick={() => decline(d)}
                                className="btn-ghost px-3.5 py-1.5 text-xs"
                              >
                                Decline
                              </button>
                            </>
                          )}
                          {d.status === "approved" && (
                            <button
                              onClick={() => copyExport(d)}
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
            )}
          </Card>
        </div>

        {/* Niche radar rail */}
        <div className="flex flex-col gap-5">
          <Card
            title="Niche radar"
            action={
              <span
                className={`text-xs font-medium ${radarLive ? "text-good" : "text-ink-muted"}`}
              >
                {radarLive ? "live" : "sample"}
              </span>
            }
          >
            <ul className="flex flex-col gap-3">
              {trends.map((t) => (
                <li key={t.id} className="rounded-xl bg-surface-2 p-3">
                  <span className="rounded-full bg-wash-2 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-ink-muted">
                    {SOURCE_LABEL[t.source]}
                  </span>
                  <p className="mt-1.5 text-xs leading-relaxed text-ink-2">
                    {t.url ? (
                      <a
                        href={t.url}
                        target="_blank"
                        rel="noreferrer"
                        className="hover:text-ink hover:underline"
                      >
                        {t.title}
                      </a>
                    ) : (
                      t.title
                    )}
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
