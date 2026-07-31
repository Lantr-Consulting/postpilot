"use client";

import { useState } from "react";
import { CAMPAIGNS } from "@/lib/mock";
import type { Campaign } from "@/lib/types";
import { fmtDate } from "@/lib/format";
import { useToast } from "@/components/toast";
import { Card, SectionHeading } from "@/components/ui";

const CADENCE_LABEL: Record<Campaign["cadence"], string> = {
  manual: "Run manually",
  daily: "Daily",
  weekly: "Weekly",
};

export default function CampaignsPage() {
  const toast = useToast();
  const [campaigns, setCampaigns] = useState<Campaign[]>(CAMPAIGNS);

  function toggle(id: string) {
    setCampaigns((cs) =>
      cs.map((c) => (c.id === id ? { ...c, enabled: !c.enabled } : c))
    );
    toast("info", "Saved. The scheduler claims due campaigns once a minute. (Sample data)");
  }

  return (
    <div className="flex flex-col gap-5">
      <SectionHeading
        title="Campaigns"
        sub="Standing missions on a schedule. Reports land here; ideas land in the Studio."
      />

      <div className="grid gap-4 lg:grid-cols-2">
        {campaigns.map((c) => (
          <Card
            key={c.id}
            title={c.title}
            action={
              <div className="flex items-center gap-2">
                {c.builtIn && (
                  <span className="rounded-full bg-wash-2 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-ink-muted">
                    Built in
                  </span>
                )}
                <button
                  role="switch"
                  aria-checked={c.enabled}
                  onClick={() => toggle(c.id)}
                  className={`relative h-5 w-9 rounded-full transition-colors ${
                    c.enabled ? "bg-accent" : "bg-wash-2"
                  }`}
                >
                  <span
                    className={`absolute top-0.5 size-4 rounded-full bg-page transition-transform ${
                      c.enabled ? "translate-x-4" : "translate-x-0.5"
                    }`}
                  />
                </button>
              </div>
            }
          >
            <p className="rounded-lg bg-surface-2 px-3 py-2 text-xs italic leading-relaxed text-ink-2">
              “{c.prompt}”
            </p>
            <p className="mt-2 text-[11px] text-ink-muted">
              {CADENCE_LABEL[c.cadence]}
              {c.cadence !== "manual" && ` at ${c.hourLocal}:00`}
              {c.lastRunAt && ` · last ran ${fmtDate(c.lastRunAt)}`}
            </p>
            {c.lastReport && (
              <div className="mt-3 rounded-xl border border-hairline p-3">
                <h3 className="text-[11px] font-semibold uppercase tracking-wide text-ink-muted">
                  Latest report
                </h3>
                <p className="mt-1 text-xs leading-relaxed text-ink-2">
                  {c.lastReport}
                </p>
              </div>
            )}
            <button
              onClick={() =>
                toast("success", "Run queued — progress appears here. (Sample data)")
              }
              className="btn-ghost mt-3 px-3.5 py-1.5 text-xs"
            >
              Run now
            </button>
          </Card>
        ))}

        <Card title="New campaign">
          <p className="text-xs leading-relaxed text-ink-muted">
            Write a standing mission in plain English — “every Friday, draft a
            newsletter CTA post from my best atom of the week.”
          </p>
          <textarea
            rows={3}
            placeholder="Every …"
            className="mt-3 w-full rounded-lg border border-hairline bg-page p-3 text-sm text-ink placeholder:text-ink-muted"
          />
          <button
            onClick={() => toast("success", "Campaign saved. (Sample data)")}
            className="btn-primary mt-3 px-3.5 py-2 text-sm"
          >
            Create campaign
          </button>
        </Card>
      </div>
    </div>
  );
}
