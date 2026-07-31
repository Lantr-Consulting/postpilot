import Link from "next/link";
import {
  CREATOR,
  DRAFTS,
  LATEST_INSIGHT,
  PIPELINE_COUNTS,
  STREAK_DAYS,
  TODAY,
  WEEK_DATES,
} from "@/lib/mock";
import { fmtDayShort } from "@/lib/format";
import { Card, DraftBadge, PlatformChip, SectionHeading, Stat } from "@/components/ui";

export default function TodayPage() {
  const todaysDrafts = DRAFTS.filter((d) => d.slotDate === TODAY);

  return (
    <div className="flex flex-col gap-5">
      <SectionHeading
        title={`Good morning, ${CREATOR.name.split(" ")[0]}`}
        sub={CREATOR.ipProfile.positioning}
      />

      {/* Week strip */}
      <Card>
        <div className="grid grid-cols-7 gap-2">
          {WEEK_DATES.map((date) => {
            const slotted = DRAFTS.filter((d) => d.slotDate === date);
            const isToday = date === TODAY;
            const { day, num } = fmtDayShort(date);
            return (
              <Link
                key={date}
                href="/calendar"
                className={`flex flex-col items-center gap-1 rounded-xl px-1 py-2.5 text-center transition-colors ${
                  isToday
                    ? "bg-accent/15 text-accent"
                    : "hover:bg-white/5"
                }`}
              >
                <span className="text-[11px] uppercase text-ink-muted">{day}</span>
                <span className="text-lg font-semibold" style={{ fontVariantNumeric: "tabular-nums" }}>
                  {num}
                </span>
                <span className="flex h-2 items-center gap-0.5">
                  {slotted.map((d) => (
                    <span
                      key={d.id}
                      aria-hidden
                      className={`size-1.5 rounded-full ${
                        d.status === "posted" ? "bg-ink-muted" : "bg-accent"
                      }`}
                    />
                  ))}
                </span>
              </Link>
            );
          })}
        </div>
      </Card>

      {/* Pipeline counts */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
        <Stat
          label="Materials to mine"
          value={PIPELINE_COUNTS.materialsToMine}
          hint="in the Library"
        />
        <Stat
          label="Ideas awaiting you"
          value={PIPELINE_COUNTS.ideasAwaiting}
          hint="in the Studio"
        />
        <Stat
          label="Drafts to review"
          value={PIPELINE_COUNTS.draftsToApprove}
          hint="checked by the engine"
        />
        <Stat
          label="Ready to export"
          value={PIPELINE_COUNTS.readyToExport}
          hint="approved, on the calendar"
        />
        <Stat label="Posting streak" value={`${STREAK_DAYS}d`} hint="you post; we count" />
      </div>

      {/* Growth Lead insight — pinned to the desk like an index card */}
      <Card title="From your Growth Lead">
        <div className="index-card rounded-xl px-4 pb-4 pt-3">
          <p className="font-display text-[17px] leading-[28px] text-ink">
            {LATEST_INSIGHT}
          </p>
        </div>
        <div className="mt-4 flex gap-2">
          <Link href="/studio" className="btn-primary px-4 py-2 text-sm">
            Open the Studio
          </Link>
          <Link href="/growth-lead" className="btn-ghost px-4 py-2 text-sm">
            Ask about it
          </Link>
        </div>
      </Card>

      {/* Today's slotted drafts */}
      <Card title="On the calendar today">
        {todaysDrafts.length === 0 ? (
          <p className="text-sm text-ink-muted">
            Nothing slotted for today. The Studio has {PIPELINE_COUNTS.ideasAwaiting}{" "}
            ideas waiting.
          </p>
        ) : (
          <ul className="flex flex-col gap-3">
            {todaysDrafts.map((d) => (
              <li
                key={d.id}
                className="flex items-start justify-between gap-3 rounded-xl bg-surface-2 p-4"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <PlatformChip platform={d.platform} />
                    <span className="truncate text-xs text-ink-muted">
                      {d.ideaTitle}
                    </span>
                  </div>
                  <p className="mt-2 line-clamp-2 whitespace-pre-line text-sm text-ink-2">
                    {d.text}
                  </p>
                </div>
                <DraftBadge status={d.status} />
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}
