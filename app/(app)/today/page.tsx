"use client";

import Link from "next/link";
import {
  CREATOR,
  DRAFTS,
  PIPELINE_COUNTS,
  STREAK_DAYS,
  TODAY,
  WEEK_DATES,
  latestInsight,
} from "@/lib/mock.localized";
import { fmtDayShort } from "@/lib/format";
import { Card, DraftBadge, PlatformChip, SectionHeading, Stat } from "@/components/ui";
import { pick, useLanguage } from "@/lib/language";

export default function TodayPage() {
  const language = useLanguage();
  const todaysDrafts = DRAFTS.filter((d) => d.slotDate === TODAY);

  return (
    <div className="flex flex-col gap-5">
      <SectionHeading
        title={pick(language, `${CREATOR.name.split(" ")[0]}，你好`, `Good morning, ${CREATOR.name}`)}
        sub={CREATOR.ipProfile.positioning}
      />

      {/* Week strip */}
      <Card>
        <div className="grid grid-cols-7 gap-2">
          {WEEK_DATES.map((date) => {
            const slotted = DRAFTS.filter((d) => d.slotDate === date);
            const isToday = date === TODAY;
            const { day, num } = fmtDayShort(date, language);
            return (
              <Link
                key={date}
                href="/calendar"
                className={`flex flex-col items-center gap-1 rounded-xl px-1 py-2.5 text-center transition-colors ${
                  isToday
                    ? "bg-accent/15 text-accent"
                    : "hover:bg-wash"
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
          label={pick(language, "待整理的材料", "Materials to mine")}
          value={PIPELINE_COUNTS.materialsToMine}
          hint={pick(language, "在材料库中", "in the Library")}
        />
        <Stat
          label={pick(language, "待确认的选题", "Ideas awaiting you")}
          value={PIPELINE_COUNTS.ideasAwaiting}
          hint={pick(language, "在内容工作台中", "in the Studio")}
        />
        <Stat
          label={pick(language, "待审核的初稿", "Drafts to review")}
          value={PIPELINE_COUNTS.draftsToApprove}
          hint={pick(language, "已完成规则检查", "checked by the engine")}
        />
        <Stat
          label={pick(language, "可以导出的内容", "Ready to export")}
          value={PIPELINE_COUNTS.readyToExport}
          hint={pick(language, "已通过并排入日历", "approved and on the calendar")}
        />
        <Stat label={pick(language, "连续发布", "Posting streak")} value={pick(language, `${STREAK_DAYS} 天`, `${STREAK_DAYS}d`)} hint={pick(language, "由你发布，产品负责记录", "you post; PostPilot counts")} />
      </div>

      {/* Growth Lead insight — pinned to the desk like an index card */}
      <Card title={pick(language, "内容顾问的建议", "From your content advisor")}>
        <div className="index-card rounded-xl px-4 pb-4 pt-3">
          <p className="font-display text-[17px] leading-[28px] text-ink">
            {latestInsight()}
          </p>
        </div>
        <div className="mt-4 flex gap-2">
          <Link href="/studio" className="btn-primary px-4 py-2 text-sm">
            {pick(language, "打开内容工作台", "Open the Studio")}
          </Link>
          <Link href="/growth-lead" className="btn-ghost px-4 py-2 text-sm">
            {pick(language, "继续讨论", "Ask about it")}
          </Link>
        </div>
      </Card>

      {/* Today's slotted drafts */}
      <Card title={pick(language, "今天计划发布", "On the calendar today")}>
        {todaysDrafts.length === 0 ? (
          <p className="text-sm text-ink-muted">
            {pick(language, `今天还没有安排内容。内容工作台里有 ${PIPELINE_COUNTS.ideasAwaiting} 个选题等待确认。`, `Nothing is scheduled today. The Studio has ${PIPELINE_COUNTS.ideasAwaiting} ideas waiting.`)}
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
