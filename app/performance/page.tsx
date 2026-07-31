"use client";

import { RESULTS } from "@/lib/mock";
import { fmtDate, fmtNum } from "@/lib/format";
import { useToast } from "@/components/toast";
import { Card, PlatformChip, SectionHeading, Stat } from "@/components/ui";

export default function PerformancePage() {
  const toast = useToast();

  const totals = RESULTS.reduce(
    (acc, r) => ({
      views: acc.views + r.metrics.views,
      saves: acc.saves + r.metrics.saves,
      follows: acc.follows + r.metrics.follows,
    }),
    { views: 0, saves: 0, follows: 0 }
  );

  const maxViews = Math.max(...RESULTS.map((r) => r.metrics.views));

  return (
    <div className="flex flex-col gap-5">
      <SectionHeading
        title="Performance"
        sub="Self-reported, and that's fine — the loop closes because you log it."
      />

      <div className="grid grid-cols-3 gap-3">
        <Stat label="Views (last 5 posts)" value={fmtNum(totals.views)} />
        <Stat label="Saves" value={fmtNum(totals.saves)} hint="future subscribers" />
        <Stat label="New follows" value={fmtNum(totals.follows)} />
      </div>

      <Card title="Views by post">
        <ul className="flex flex-col gap-2.5">
          {RESULTS.map((r) => (
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

      <Card
        title="Logged results"
        action={
          <button
            onClick={() =>
              toast("success", "Open a posted draft to log its numbers. (Sample data)")
            }
            className="btn-primary px-3.5 py-1.5 text-xs"
          >
            Log a result
          </button>
        }
      >
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
              {RESULTS.map((r) => (
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
      </Card>

      <Card title="What the Growth Lead sees">
        <ul className="flex flex-col gap-1.5 text-sm text-ink-2">
          <li>· Number-led hooks outperform question hooks ~5x on views.</li>
          <li>· The burnout narrative drives the most comments and follows per view.</li>
          <li>· Client stories are your best follows-per-view — and under-used.</li>
        </ul>
        <p className="mt-3 text-xs text-ink-muted">
          Insights become standing lessons in the next generation run.
        </p>
      </Card>
    </div>
  );
}
