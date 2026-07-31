"use client";

import { CREATOR, TODAY } from "@/lib/mock";
import { fmtDate } from "@/lib/format";

export function TopBar() {
  return (
    <header className="flex items-center justify-between gap-3 border-b border-hairline bg-page px-5 py-3">
      <div className="flex items-center gap-2 text-sm text-ink-2">
        <svg
          aria-hidden
          viewBox="0 0 24 24"
          className="size-4 text-ink-muted"
          fill="none"
          stroke="currentColor"
          strokeWidth={1.75}
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M12 19l7-7 3 3-7 7-3-3z" />
          <path d="M18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5z" />
        </svg>
        <span className="font-medium text-ink">
          {CREATOR.ipProfile.pillars.length} pillars ·{" "}
          {CREATOR.niche.topics[0]}
        </span>
        <span className="text-ink-muted">· {fmtDate(TODAY)}</span>
      </div>
      <span className="rounded-full border border-hairline px-2.5 py-1 text-[11px] font-medium text-ink-muted">
        Sample data
      </span>
    </header>
  );
}
