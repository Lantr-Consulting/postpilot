"use client";

import { useEffect, useState } from "react";
import { getResults, getReviews, logResult, type Review } from "@/lib/api";
import { useWorkspace } from "@/lib/use-workspace";
import { RESULTS } from "@/lib/mock.en";
import type { Metrics, Platform, ResultLog } from "@/lib/types";
import { fmtDate, fmtNum } from "@/lib/format";
import { useToast } from "@/components/toast";
import { Card, PlatformChip, SectionHeading, Stat } from "@/components/ui";

const METRIC_KEYS = ["views", "likes", "comments", "saves", "follows"] as const;

export default function PerformancePage() {
  const toast = useToast();
  const { ws, live, refresh } = useWorkspace();

  const [liveResults, setLiveResults] = useState<ResultLog[] | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  useEffect(() => {
    if (!live) return;
    let alive = true;
    getResults().then((r) => alive && setLiveResults(r)).catch(() => {});
    getReviews().then((r) => alive && setReviews(r)).catch(() => {});
    return () => {
      alive = false;
    };
  }, [live]);

  const results = live && liveResults !== null ? liveResults : RESULTS;

  // The log form — you posted it, now close the loop.
  const [logging, setLogging] = useState(false);
  const [draftId, setDraftId] = useState<string>("");
  const [metrics, setMetrics] = useState<Metrics>({ views: 0, likes: 0, comments: 0, saves: 0, follows: 0 });
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);

  const loggable = (ws?.drafts ?? []).filter(
    (d) => d.status === "exported" || d.status === "approved"
  );

  async function submitLog() {
    const draft = loggable.find((d) => d.id === draftId);
    if (!draft) return;
    setSaving(true);
    try {
      await logResult({
        draftId: draft.id,
        title: draft.ideaTitle || draft.text.slice(0, 60),
        platform: draft.platform as Platform,
        postedAt: new Date().toISOString().slice(0, 10),
        metrics,
        notes: notes || undefined,
      });
      setLiveResults(await getResults());
      await refresh();
      setLogging(false);
      setDraftId("");
      setMetrics({ views: 0, likes: 0, comments: 0, saves: 0, follows: 0 });
      setNotes("");
      toast("success", "Logged — the Growth Lead learns from this in the next review.");
    } catch (e) {
      toast("error", e instanceof Error ? e.message : "Logging failed.");
    }
    setSaving(false);
  }

  const totals = results.reduce(
    (acc, r) => ({
      views: acc.views + r.metrics.views,
      saves: acc.saves + r.metrics.saves,
      follows: acc.follows + r.metrics.follows,
    }),
    { views: 0, saves: 0, follows: 0 }
  );
  const maxViews = Math.max(1, ...results.map((r) => r.metrics.views));

  return (
    <div className="flex flex-col gap-5">
      <SectionHeading
        title="Performance"
        sub="Self-reported, and that's fine — the loop closes because you log it."
      />

      <div className="grid grid-cols-3 gap-3">
        <Stat label={`Views (last ${results.length} posts)`} value={fmtNum(totals.views)} />
        <Stat label="Saves" value={fmtNum(totals.saves)} hint="future subscribers" />
        <Stat label="New follows" value={fmtNum(totals.follows)} />
      </div>

      {results.length > 0 && (
        <Card title="Views by post">
          <ul className="flex flex-col gap-2.5">
            {results.map((r) => (
              <li key={r.id} className="flex items-center gap-3">
                <span className="w-40 truncate text-xs text-ink-2 sm:w-56">
                  {r.title}
                </span>
                <span className="relative h-5 flex-1 overflow-hidden rounded-full bg-surface-2">
                  <span
                    aria-hidden
                    className="absolute inset-y-0 left-0 rounded-full bg-accent/70"
                    style={{ width: `${(r.metrics.views / maxViews) * 100}%` }}
                  />
                </span>
                <span
                  className="w-12 text-right text-xs text-ink-muted"
                  style={{ fontVariantNumeric: "tabular-nums" }}
                >
                  {fmtNum(r.metrics.views)}
                </span>
              </li>
            ))}
          </ul>
        </Card>
      )}

      <Card
        title="Logged results"
        action={
          <button
            onClick={() => {
              if (!live) {
                toast("info", "Sign in to log your own results. (Sample data)");
                return;
              }
              if (loggable.length === 0) {
                toast("info", "Nothing to log yet — export a draft and post it first.");
                return;
              }
              setLogging((v) => !v);
            }}
            className="btn-primary px-3.5 py-1.5 text-xs"
          >
            {logging ? "Close" : "Log a result"}
          </button>
        }
      >
        {logging && (
          <div className="mb-4 rounded-xl border border-hairline p-4">
            <label className="text-xs font-medium text-ink-2" htmlFor="log-draft">
              Which post?
            </label>
            <select
              id="log-draft"
              value={draftId}
              onChange={(e) => setDraftId(e.target.value)}
              className="mt-1.5 w-full rounded-lg border border-hairline bg-page px-3 py-2 text-sm text-ink"
            >
              <option value="">Pick an exported draft…</option>
              {loggable.map((d) => (
                <option key={d.id} value={d.id}>
                  [{d.platform}] {(d.ideaTitle || d.text).slice(0, 60)}
                </option>
              ))}
            </select>
            <div className="mt-3 grid grid-cols-5 gap-2">
              {METRIC_KEYS.map((k) => (
                <label key={k} className="text-[11px] text-ink-muted">
                  {k}
                  <input
                    type="number"
                    min={0}
                    value={metrics[k] || ""}
                    onChange={(e) =>
                      setMetrics((m) => ({ ...m, [k]: Math.max(0, Number(e.target.value) || 0) }))
                    }
                    className="mt-1 w-full rounded-lg border border-hairline bg-page px-2 py-1.5 text-sm text-ink"
                    style={{ fontVariantNumeric: "tabular-nums" }}
                  />
                </label>
              ))}
            </div>
            <input
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Notes — what do you think made it work (or not)?"
              className="mt-3 w-full rounded-lg border border-hairline bg-page px-3 py-2 text-sm text-ink placeholder:text-ink-muted"
            />
            <button
              onClick={submitLog}
              disabled={!draftId || saving}
              className="btn-primary mt-3 px-3.5 py-1.5 text-xs"
            >
              {saving ? "Saving…" : "Save result"}
            </button>
          </div>
        )}

        {results.length === 0 ? (
          <p className="text-sm text-ink-muted">
            No results yet. Export a draft, post it yourself, then log how it
            did — that&apos;s the loop.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[560px] text-left text-sm">
              <thead>
                <tr className="border-b border-hairline text-xs text-ink-muted">
                  <th className="pb-2 pr-3 font-medium">Post</th>
                  <th className="pb-2 pr-3 font-medium">Platform</th>
                  <th className="pb-2 pr-3 font-medium">Date</th>
                  <th className="pb-2 pr-3 text-right font-medium">Views</th>
                  <th className="pb-2 pr-3 text-right font-medium">Likes</th>
                  <th className="pb-2 pr-3 text-right font-medium">Saves</th>
                  <th className="pb-2 text-right font-medium">Follows</th>
                </tr>
              </thead>
              <tbody>
                {results.map((r) => (
                  <tr key={r.id} className="border-b border-hairline/50">
                    <td className="max-w-52 truncate py-2.5 pr-3 text-ink-2">
                      {r.title}
                    </td>
                    <td className="py-2.5 pr-3">
                      <PlatformChip platform={r.platform} />
                    </td>
                    <td className="py-2.5 pr-3 text-xs text-ink-muted">
                      {fmtDate(r.postedAt)}
                    </td>
                    {(["views", "likes", "saves", "follows"] as const).map((k) => (
                      <td
                        key={k}
                        className="py-2.5 pr-3 text-right text-ink-2 last:pr-0"
                        style={{ fontVariantNumeric: "tabular-nums" }}
                      >
                        {fmtNum(r.metrics[k])}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <Card title="What the Growth Lead sees">
        {live && reviews.length > 0 ? (
          <>
            <p className="text-sm leading-relaxed text-ink-2">{reviews[0].summary}</p>
            <p className="mt-3 text-xs text-ink-muted">
              From your latest growth review ({fmtDate(reviews[0].at)}) —
              accepted moves become standing lessons.
            </p>
          </>
        ) : (
          <>
            <ul className="flex flex-col gap-1.5 text-sm text-ink-2">
              <li>· Number-led hooks outperform question hooks ~5x on views.</li>
              <li>· The burnout narrative drives the most comments and follows per view.</li>
              <li>· Client stories are your best follows-per-view — and under-used.</li>
            </ul>
            <p className="mt-3 text-xs text-ink-muted">
              {live
                ? "Run a growth review to get your own reading."
                : "Insights become standing lessons in the next generation run."}
            </p>
          </>
        )}
      </Card>
    </div>
  );
}
