"use client";

import { DRAFTS, TODAY, WEEK_DATES } from "@/lib/mock.en";
import { fmtDate, fmtDayShort } from "@/lib/format";
import { useToast } from "@/components/toast";
import { Card, DraftBadge, PlatformChip, SectionHeading } from "@/components/ui";

export default function CalendarPage() {
  const toast = useToast();
  const slotted = DRAFTS.filter((d) => d.slotDate);

  function copyPack(date: string) {
    const pack = DRAFTS.filter((d) => d.slotDate === date)
      .map((d) => `[${d.platform.toUpperCase()}]\n${d.text}${d.hashtags.length ? `\n${d.hashtags.join(" ")}` : ""}`)
      .join("\n\n---\n\n");
    navigator.clipboard?.writeText(pack).catch(() => {});
    toast("success", `Export pack for ${fmtDate(date)} copied. Go post it!`);
  }

  return (
    <div className="flex flex-col gap-5">
      <SectionHeading
        title="Calendar"
        sub="Approved drafts, slotted. Copy a day's export pack and post it yourself — you're the actuator."
      />

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        {WEEK_DATES.map((date) => {
          const drafts = slotted.filter((d) => d.slotDate === date);
          const isToday = date === TODAY;
          const { num } = fmtDayShort(date);
          return (
            <Card
              key={date}
              className={isToday ? "ring-1 ring-accent/50" : ""}
              title={`${fmtDate(date)}${isToday ? " · today" : ""}`}
              action={
                drafts.length > 0 ? (
                  <button
                    onClick={() => copyPack(date)}
                    className="btn-ghost px-2.5 py-1 text-[11px]"
                  >
                    Copy pack
                  </button>
                ) : undefined
              }
            >
              {drafts.length === 0 ? (
                <p className="text-xs text-ink-muted">
                  {num % 2 === 0 ? "Rest day — nothing slotted." : "Open slot."}
                </p>
              ) : (
                <ul className="flex flex-col gap-2.5">
                  {drafts.map((d) => (
                    <li key={d.id} className="rounded-xl bg-surface-2 p-3">
                      <div className="flex items-center justify-between gap-2">
                        <PlatformChip platform={d.platform} />
                        <DraftBadge status={d.status} />
                      </div>
                      <p className="mt-2 line-clamp-3 whitespace-pre-line text-xs leading-relaxed text-ink-2">
                        {d.text}
                      </p>
                    </li>
                  ))}
                </ul>
              )}
            </Card>
          );
        })}
      </div>

      <Card title="How posting works">
        <ol className="flex list-decimal flex-col gap-1.5 pl-5 text-sm text-ink-2">
          <li>Approve drafts in the Studio — the editorial engine re-checks the final text.</li>
          <li>They land here on their slot day, tailored per platform.</li>
          <li>Copy the day&apos;s pack, paste into each platform, hit post yourself.</li>
          <li>Log the results in Performance — the Growth Lead learns from what worked.</li>
        </ol>
      </Card>
    </div>
  );
}
