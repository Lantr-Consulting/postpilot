"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { CREATOR } from "@/lib/mock";

function Icon({ children }: { children: ReactNode }) {
  return (
    <svg
      aria-hidden
      viewBox="0 0 24 24"
      className="size-4 shrink-0"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.75}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {children}
    </svg>
  );
}

const NAV = [
  {
    href: "/",
    label: "Today",
    icon: (
      <Icon>
        <circle cx="12" cy="12" r="4" />
        <path d="M12 2v3M12 19v3M4.2 4.2l2.1 2.1M17.7 17.7l2.1 2.1M2 12h3M19 12h3M4.2 19.8l2.1-2.1M17.7 6.3l2.1-2.1" />
      </Icon>
    ),
  },
  {
    href: "/studio",
    label: "Studio",
    icon: (
      <Icon>
        <path d="M12 19l7-7 3 3-7 7-3-3z" />
        <path d="M18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5z" />
        <path d="M2 2l7.586 7.586" />
        <circle cx="11" cy="11" r="2" />
      </Icon>
    ),
  },
  {
    href: "/library",
    label: "Library",
    icon: (
      <Icon>
        <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
        <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
      </Icon>
    ),
  },
  {
    href: "/growth-lead",
    label: "Growth Lead",
    icon: (
      <Icon>
        <path d="M21 11.5a8.5 8.5 0 0 1-8.5 8.5 8.4 8.4 0 0 1-3.8-.9L3 21l1.9-5.7a8.4 8.4 0 0 1-.9-3.8A8.5 8.5 0 0 1 12.5 3a8.5 8.5 0 0 1 8.5 8.5Z" />
      </Icon>
    ),
  },
  {
    href: "/calendar",
    label: "Calendar",
    icon: (
      <Icon>
        <rect x="3" y="4" width="18" height="17" rx="2" />
        <path d="M3 9h18M8 2v4M16 2v4" />
      </Icon>
    ),
  },
  {
    href: "/creator-ip",
    label: "Creator IP",
    icon: (
      <Icon>
        <circle cx="12" cy="8" r="4" />
        <path d="M4 21c0-4 3.6-6.5 8-6.5s8 2.5 8 6.5" />
      </Icon>
    ),
  },
  {
    href: "/campaigns",
    label: "Campaigns",
    icon: (
      <Icon>
        <circle cx="12" cy="12" r="9" />
        <polyline points="12 7 12 12 15.5 14" />
      </Icon>
    ),
  },
  {
    href: "/performance",
    label: "Performance",
    icon: (
      <Icon>
        <path d="M3 3v18h18" />
        <path d="M7 15l4-5 3 3 5-7" />
      </Icon>
    ),
  },
  {
    href: "/settings",
    label: "Settings",
    icon: (
      <Icon>
        <circle cx="12" cy="12" r="3" />
        <path d="M19.4 15a1.7 1.7 0 0 0 .34 1.87l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.7 1.7 0 0 0-1.87-.34 1.7 1.7 0 0 0-1 1.55V21a2 2 0 1 1-4 0v-.09a1.7 1.7 0 0 0-1-1.55 1.7 1.7 0 0 0-1.87.34l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.7 1.7 0 0 0 .34-1.87 1.7 1.7 0 0 0-1.55-1H3a2 2 0 1 1 0-4h.09a1.7 1.7 0 0 0 1.55-1 1.7 1.7 0 0 0-.34-1.87l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.7 1.7 0 0 0 1.87.34h.09a1.7 1.7 0 0 0 1-1.55V3a2 2 0 1 1 4 0v.09a1.7 1.7 0 0 0 1 1.55 1.7 1.7 0 0 0 1.87-.34l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.7 1.7 0 0 0-.34 1.87v.09a1.7 1.7 0 0 0 1.55 1H21a2 2 0 1 1 0 4h-.09a1.7 1.7 0 0 0-1.55 1z" />
      </Icon>
    ),
  },
];

function Wordmark() {
  return (
    <div className="flex items-center gap-2.5 px-3 pb-6 pt-1">
      <span className="flex size-7 items-center justify-center rounded-lg bg-accent">
        <svg
          aria-hidden
          viewBox="0 0 32 32"
          className="size-4.5"
          fill="none"
          stroke="#1c1204"
          strokeWidth={2.5}
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          {/* pen nib */}
          <path d="M16 4l8 8-6.5 14.5a2 2 0 0 1-3 .9L8.5 22 16 4z" />
          <path d="M16 4 8.5 22" />
          <circle cx="14.5" cy="19" r="1.6" fill="#1c1204" stroke="none" />
        </svg>
      </span>
      <span>
        <span className="font-display block text-[16px] font-semibold leading-tight">
          PostPilot
        </span>
        <span className="block text-[11px] leading-tight text-ink-muted">
          Your AI Growth Lead · sample data
        </span>
      </span>
    </div>
  );
}

export function Sidebar() {
  const pathname = usePathname();
  return (
    <aside className="flex h-screen w-60 shrink-0 flex-col border-r border-hairline bg-page px-3 py-5 max-md:hidden">
      <Wordmark />
      <nav className="flex flex-col gap-0.5">
        {NAV.map((item) => {
          const active = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition-colors ${
                active
                  ? "bg-white/10 font-medium text-ink"
                  : "text-ink-2 hover:bg-white/5 hover:text-ink"
              }`}
            >
              <span className={active ? "text-accent" : "text-ink-muted"}>
                {item.icon}
              </span>
              {item.label}
            </Link>
          );
        })}
      </nav>
      <div className="mt-auto flex flex-col gap-3 px-3">
        <div className="rounded-lg border border-hairline px-3 py-2">
          <div className="truncate text-xs font-medium">{CREATOR.name}</div>
          <div className="mt-0.5 text-xs text-ink-muted">
            {CREATOR.handle} · demo creator
          </div>
        </div>
        <div className="text-[11px] leading-relaxed text-ink-muted">
          A Lantr sample project.
          <br />
          Drafts, not guarantees — you post.
        </div>
      </div>
    </aside>
  );
}

export function MobileNav() {
  const pathname = usePathname();
  return (
    <nav className="flex gap-1 overflow-x-auto border-b border-hairline bg-page px-3 py-2 md:hidden">
      {NAV.map((item) => {
        const active = pathname === item.href;
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`whitespace-nowrap rounded-lg px-3 py-1.5 text-sm ${
              active ? "bg-white/10 font-medium text-ink" : "text-ink-2"
            }`}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
