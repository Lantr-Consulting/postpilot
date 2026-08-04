"use client";

import { DRAFTS, TODAY, WEEK_DATES } from "@/lib/mock";
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
    toast("success", `${fmtDate(date)} 的发布内容已复制，请前往对应平台发布。`);
  }

  return (
    <div className="flex flex-col gap-5">
      <SectionHeading
        title="内容日历"
        sub="通过审核的内容会排到这里。复制当天内容后，由你前往对应平台发布。"
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
              title={`${fmtDate(date)}${isToday ? " · 今天" : ""}`}
              action={
                drafts.length > 0 ? (
                  <button
                    onClick={() => copyPack(date)}
                    className="btn-ghost px-2.5 py-1 text-[11px]"
                  >
                    复制当天内容
                  </button>
                ) : undefined
              }
            >
              {drafts.length === 0 ? (
                <p className="text-xs text-ink-muted">
                  {num % 2 === 0 ? "今天不发布内容。" : "还有空余时段。"}
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

      <Card title="发布流程">
        <ol className="flex list-decimal flex-col gap-1.5 pl-5 text-sm text-ink-2">
          <li>在内容工作台中审核初稿，产品会再次检查最终文字。</li>
          <li>通过的内容会按平台和日期排进日历。</li>
          <li>复制当天内容，粘贴到对应平台，再由你亲自发布。</li>
          <li>发布后记录数据，内容顾问会根据实际表现提出下一轮建议。</li>
        </ol>
      </Card>
    </div>
  );
}
