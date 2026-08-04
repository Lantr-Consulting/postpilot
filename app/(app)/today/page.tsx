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
        title={`${CREATOR.name.split(" ")[0]}，你好`}
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
          label="待整理的材料"
          value={PIPELINE_COUNTS.materialsToMine}
          hint="在材料库中"
        />
        <Stat
          label="待确认的选题"
          value={PIPELINE_COUNTS.ideasAwaiting}
          hint="在内容工作台中"
        />
        <Stat
          label="待审核的初稿"
          value={PIPELINE_COUNTS.draftsToApprove}
          hint="已完成规则检查"
        />
        <Stat
          label="可以导出的内容"
          value={PIPELINE_COUNTS.readyToExport}
          hint="已通过并排入日历"
        />
        <Stat label="连续发布" value={`${STREAK_DAYS} 天`} hint="由你发布，产品负责记录" />
      </div>

      {/* Growth Lead insight — pinned to the desk like an index card */}
      <Card title="内容顾问的建议">
        <div className="index-card rounded-xl px-4 pb-4 pt-3">
          <p className="font-display text-[17px] leading-[28px] text-ink">
            {LATEST_INSIGHT}
          </p>
        </div>
        <div className="mt-4 flex gap-2">
          <Link href="/studio" className="btn-primary px-4 py-2 text-sm">
            打开内容工作台
          </Link>
          <Link href="/growth-lead" className="btn-ghost px-4 py-2 text-sm">
            继续讨论
          </Link>
        </div>
      </Card>

      {/* Today's slotted drafts */}
      <Card title="今天计划发布">
        {todaysDrafts.length === 0 ? (
          <p className="text-sm text-ink-muted">
            今天还没有安排内容。内容工作台里有 {PIPELINE_COUNTS.ideasAwaiting}{" "}
            个选题等待确认。
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
