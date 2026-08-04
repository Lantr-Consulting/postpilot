"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import { CREATOR } from "@/lib/mock.localized";
import { pick, useLanguage } from "@/lib/language";
import { supabase } from "@/lib/supabase";

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
    href: "/today",
    label: { zh: "今日", en: "Today" },
    icon: (
      <Icon>
        <circle cx="12" cy="12" r="4" />
        <path d="M12 2v3M12 19v3M4.2 4.2l2.1 2.1M17.7 17.7l2.1 2.1M2 12h3M19 12h3M4.2 19.8l2.1-2.1M17.7 6.3l2.1-2.1" />
      </Icon>
    ),
  },
  {
    href: "/studio",
    label: { zh: "内容工作台", en: "Content studio" },
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
    label: { zh: "材料库", en: "Library" },
    icon: (
      <Icon>
        <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
        <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
      </Icon>
    ),
  },
  {
    href: "/calendar",
    label: { zh: "内容日历", en: "Calendar" },
    icon: (
      <Icon>
        <rect x="3" y="4" width="18" height="17" rx="2" />
        <path d="M3 9h18M8 2v4M16 2v4" />
      </Icon>
    ),
  },
  {
    href: "/settings",
    label: { zh: "设置", en: "Settings" },
    icon: (
      <Icon>
        <circle cx="12" cy="12" r="3" />
        <path d="M19.4 15a1.7 1.7 0 0 0 .34 1.87l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.7 1.7 0 0 0-1.87-.34 1.7 1.7 0 0 0-1 1.55V21a2 2 0 1 1-4 0v-.09a1.7 1.7 0 0 0-1-1.55 1.7 1.7 0 0 0-1.87.34l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.7 1.7 0 0 0 .34-1.87 1.7 1.7 0 0 0-1.55-1H3a2 2 0 1 1 0-4h.09a1.7 1.7 0 0 0 1.55-1 1.7 1.7 0 0 0-.34-1.87l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.7 1.7 0 0 0 1.87.34h.09a1.7 1.7 0 0 0 1-1.55V3a2 2 0 1 1 4 0v.09a1.7 1.7 0 0 0 1 1.55 1.7 1.7 0 0 0 1.87-.34l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.7 1.7 0 0 0-.34 1.87v.09a1.7 1.7 0 0 0 1.55 1H21a2 2 0 1 1 0 4h-.09a1.7 1.7 0 0 0-1.55 1z" />
      </Icon>
    ),
  },
];

function Wordmark() {
  const language = useLanguage();
  return (
    <div className="flex items-center gap-2.5 px-3 pb-6 pt-1">
      <span className="flex size-7 items-center justify-center rounded-lg bg-accent">
        <svg
          aria-hidden
          viewBox="0 0 32 32"
          className="size-4.5"
          fill="none"
          stroke="var(--accent-ink)"
          strokeWidth={2.5}
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          {/* pen nib */}
          <path d="M16 4l8 8-6.5 14.5a2 2 0 0 1-3 .9L8.5 22 16 4z" />
          <path d="M16 4 8.5 22" />
          <circle cx="14.5" cy="19" r="1.6" fill="var(--accent-ink)" stroke="none" />
        </svg>
      </span>
      <span>
        <span className="font-display block text-[16px] font-semibold leading-tight">
          PostPilot
        </span>
        <span className="block text-[11px] leading-tight text-ink-muted">
          {pick(language, "内容创作助手 · 演示数据", "Content assistant · Demo data")}
        </span>
      </span>
    </div>
  );
}

export function Sidebar() {
  const pathname = usePathname();
  const language = useLanguage();
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
                  ? "bg-wash-2 font-medium text-ink"
                  : "text-ink-2 hover:bg-wash hover:text-ink"
              }`}
            >
              <span className={active ? "text-accent" : "text-ink-muted"}>
                {item.icon}
              </span>
              {item.label[language]}
            </Link>
          );
        })}
      </nav>
      <div className="mt-auto flex flex-col gap-3 px-3">
        <AccountBox />
        <div className="text-[11px] leading-relaxed text-ink-muted">
          {pick(language, "Lantr 往届学生作品 · 课程结束后继续托管。", "Past Lantr student project · Hosted after the program.")}
          <br />
          {pick(language, "初稿由你审核，也由你亲自发布。", "You review every draft and publish it yourself.")}
        </div>
      </div>
    </aside>
  );
}

function AccountBox() {
  const language = useLanguage();
  const [email, setEmail] = useState<string | null | undefined>(undefined);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setEmail(data.session?.user.email ?? null);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      setEmail(session?.user.email ?? null);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  if (email === undefined) return null;

  if (email === null) {
    return (
      <div className="flex flex-col gap-2">
        <div className="rounded-lg border border-hairline px-3 py-2">
          <div className="truncate text-xs font-medium">{CREATOR.name}</div>
          <div className="mt-0.5 text-xs text-ink-muted">
            {CREATOR.handle} · {pick(language, "演示创作者", "demo creator")}
          </div>
        </div>
        <Link
          href="/signin"
          className="btn-ghost px-3 py-2 text-center text-sm font-medium"
        >
          {pick(language, "登录", "Sign in")}
        </Link>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-hairline px-3 py-2">
      <div className="truncate text-xs font-medium">{email}</div>
      <button
        onClick={() => supabase.auth.signOut().then(() => window.location.assign("/"))}
        className="mt-0.5 text-xs text-ink-muted hover:text-ink"
      >
        {pick(language, "退出登录", "Sign out")}
      </button>
    </div>
  );
}

export function MobileNav() {
  const pathname = usePathname();
  const language = useLanguage();
  return (
    <nav className="flex gap-1 overflow-x-auto border-b border-hairline bg-page px-3 py-2 md:hidden">
      {NAV.map((item) => {
        const active = pathname === item.href;
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`whitespace-nowrap rounded-lg px-3 py-1.5 text-sm ${
              active ? "bg-wash-2 font-medium text-ink" : "text-ink-2"
            }`}
          >
            {item.label[language]}
          </Link>
        );
      })}
    </nav>
  );
}
