"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { useLive } from "@/lib/use-live";
import { LanguageToggle } from "@/components/language-toggle";
import { pick, useLanguage } from "@/lib/language";
import { supabase } from "@/lib/supabase";

const PRIMARY_NAV = [
  { href: "/today", zh: "今日", en: "Today" },
  { href: "/studio", zh: "内容工作台", en: "Studio" },
  { href: "/library", zh: "素材库", en: "Library" },
  { href: "/calendar", zh: "内容日历", en: "Calendar" },
] as const;

function Wordmark() {
  const language = useLanguage();
  return (
    <Link href="/today" className="flex shrink-0 items-center gap-2.5" aria-label="PostPilot">
      <span className="flex size-8 items-center justify-center rounded-xl bg-accent shadow-[0_8px_24px_var(--glow)]">
        <svg
          aria-hidden
          viewBox="0 0 32 32"
          className="size-[18px]"
          fill="none"
          stroke="var(--accent-ink)"
          strokeWidth={2.5}
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M16 4l8 8-6.5 14.5a2 2 0 0 1-3 .9L8.5 22 16 4z" />
          <path d="M16 4 8.5 22" />
          <circle cx="14.5" cy="19" r="1.6" fill="var(--accent-ink)" stroke="none" />
        </svg>
      </span>
      <span className="leading-none">
        <span className="font-display block text-[17px] font-semibold tracking-tight">PostPilot</span>
        <span className="mt-1 hidden text-[10px] font-medium text-ink-muted xl:block">
          {pick(language, "把想法写成好内容", "Ideas into publishable content")}
        </span>
      </span>
    </Link>
  );
}

// Sun/moon toggle. Dark is the default set; "light" is stored in
// localStorage and applied pre-paint by the inline script in layout.tsx.
function ThemeToggle() {
  const language = useLanguage();
  const [theme, setTheme] = useState<"dark" | "light" | null>(null);

  useEffect(() => {
    // Deferred: reading the pre-paint data-theme, then a state set — kept
    // out of the synchronous effect body per the React compiler rules.
    const id = requestAnimationFrame(() =>
      setTheme(document.documentElement.dataset.theme === "light" ? "light" : "dark")
    );
    return () => cancelAnimationFrame(id);
  }, []);

  function toggle() {
    const next = theme === "light" ? "dark" : "light";
    setTheme(next);
    if (next === "light") {
      document.documentElement.dataset.theme = "light";
    } else {
      delete document.documentElement.dataset.theme;
    }
    try {
      localStorage.setItem("pp-theme", next);
    } catch {}
  }

  return (
    <button
      onClick={toggle}
      aria-label={theme === "light" ? pick(language, "切换到深色模式", "Switch to dark mode") : pick(language, "切换到浅色模式", "Switch to light mode")}
      title={theme === "light" ? pick(language, "深色模式", "Dark mode") : pick(language, "浅色模式", "Light mode")}
      className="btn-ghost size-8 !rounded-full"
    >
      {theme === null ? null : theme === "light" ? (
        <svg
          aria-hidden
          viewBox="0 0 24 24"
          className="size-4"
          fill="none"
          stroke="currentColor"
          strokeWidth={1.75}
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8Z" />
        </svg>
      ) : (
        <svg
          aria-hidden
          viewBox="0 0 24 24"
          className="size-4"
          fill="none"
          stroke="currentColor"
          strokeWidth={1.75}
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <circle cx="12" cy="12" r="4" />
          <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
        </svg>
      )}
    </button>
  );
}

function AccountControl() {
  const language = useLanguage();
  const [account, setAccount] = useState<{ email: string; demo: boolean } | null | undefined>(undefined);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const read = (user: { email?: string; user_metadata?: Record<string, unknown> } | undefined) =>
      user ? { email: user.email ?? "", demo: user.user_metadata?.demo_kind === "lantr-private-demo" } : null;
    supabase.auth.getSession().then(({ data }) => setAccount(read(data.session?.user)));
    const { data: subscription } = supabase.auth.onAuthStateChange((_event, session) => {
      setAccount(read(session?.user));
    });
    return () => subscription.subscription.unsubscribe();
  }, []);

  if (account === undefined) {
    return <span aria-hidden className="size-8 rounded-full border border-hairline" />;
  }

  if (account === null) {
    return (
      <Link href="/signin" className="btn-ghost h-8 gap-1.5 px-3 text-xs">
        <svg aria-hidden viewBox="0 0 24 24" className="size-3.5" fill="none" stroke="currentColor" strokeWidth={1.8}>
          <circle cx="12" cy="8" r="4" />
          <path d="M5 21a7 7 0 0 1 14 0" />
        </svg>
        <span className="hidden sm:inline">{pick(language, "登录", "Sign in")}</span>
      </Link>
    );
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        aria-label={pick(language, "账户菜单", "Account menu")}
        className="flex size-8 items-center justify-center rounded-full border border-hairline bg-surface text-xs font-semibold text-ink-2 transition-colors hover:text-ink"
      >
        {account.demo ? "D" : account.email.slice(0, 1).toUpperCase()}
      </button>
      {open && (
        <>
          <button className="fixed inset-0 z-40 cursor-default" aria-label={pick(language, "关闭账户菜单", "Close account menu")} onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-10 z-50 w-64 rounded-2xl border border-hairline bg-surface p-2 shadow-2xl">
            <div className="px-3 py-2 text-xs text-ink-muted">{account.demo ? pick(language, "临时访客工作区", "Private guest workspace") : account.email}</div>
            <Link href="/settings" onClick={() => setOpen(false)} className="block rounded-lg px-3 py-2 text-sm text-ink-2 hover:bg-wash hover:text-ink">
              {pick(language, "设置", "Settings")}
            </Link>
            <button
              type="button"
              onClick={() => supabase.auth.signOut().then(() => window.location.assign("/"))}
              className="w-full rounded-lg px-3 py-2 text-left text-sm text-ink-2 hover:bg-wash hover:text-ink"
            >
              {account.demo ? pick(language, "退出演示", "Leave demo") : pick(language, "退出登录", "Sign out")}
            </button>
          </div>
        </>
      )}
    </div>
  );
}

export function TopBar() {
  const { live, checking } = useLive();
  const language = useLanguage();
  const pathname = usePathname();
  return (
    <header className="relative z-30 shrink-0 border-b border-hairline bg-page/95 backdrop-blur-xl">
      <div className="mx-auto flex h-16 w-full max-w-[1440px] items-center gap-5 px-4 sm:px-6 lg:px-8">
        <Wordmark />
        <nav className="hidden min-w-0 flex-1 items-center gap-1 md:flex" aria-label={pick(language, "主导航", "Primary navigation")}>
          {PRIMARY_NAV.map((item) => {
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={`rounded-full px-3.5 py-2 text-sm font-medium transition-colors ${
                  active ? "bg-wash-2 text-ink" : "text-ink-2 hover:bg-wash hover:text-ink"
                }`}
              >
                {item[language]}
              </Link>
            );
          })}
        </nav>
        <div className="ml-auto flex shrink-0 items-center gap-2">
          <span
            className={`hidden rounded-full px-2.5 py-1 text-[11px] font-medium lg:inline-flex ${
              live ? "bg-good/10 text-good" : "border border-hairline text-ink-muted"
            }`}
          >
            {checking ? "…" : live ? pick(language, "实时工作区", "Live workspace") : pick(language, "互动演示", "Interactive demo")}
          </span>
          <LanguageToggle />
          <ThemeToggle />
          <Link
            href="/settings"
            aria-label={pick(language, "设置", "Settings")}
            aria-current={pathname === "/settings" ? "page" : undefined}
            className={`hidden size-8 items-center justify-center rounded-full border border-hairline sm:flex ${pathname === "/settings" ? "bg-wash-2 text-ink" : "text-ink-2 hover:bg-wash hover:text-ink"}`}
          >
            <svg aria-hidden viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="3" />
              <path d="M19.4 15a1.7 1.7 0 0 0 .34 1.87l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.7 1.7 0 0 0-1.87-.34 1.7 1.7 0 0 0-1 1.55V21a2 2 0 1 1-4 0v-.09a1.7 1.7 0 0 0-1-1.55 1.7 1.7 0 0 0-1.87.34l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.7 1.7 0 0 0 4.64 14 1.7 1.7 0 0 0 3.09 13H3a2 2 0 1 1 0-4h.09a1.7 1.7 0 0 0 1.55-1 1.7 1.7 0 0 0-.34-1.87l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.7 1.7 0 0 0 9 4.64h.09A1.7 1.7 0 0 0 10 3.09V3a2 2 0 1 1 4 0v.09a1.7 1.7 0 0 0 1 1.55 1.7 1.7 0 0 0 1.87-.34l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.7 1.7 0 0 0 19.36 9h.09A1.7 1.7 0 0 0 21 10h.09a2 2 0 1 1 0 4H21a1.7 1.7 0 0 0-1.6 1Z" />
            </svg>
          </Link>
          <AccountControl />
        </div>
      </div>
      <nav className="flex gap-1 overflow-x-auto border-t border-hairline px-3 py-2 md:hidden" aria-label={pick(language, "主导航", "Primary navigation")}>
        {[...PRIMARY_NAV, { href: "/settings", zh: "设置", en: "Settings" } as const].map((item) => {
          const active = pathname === item.href;
          return (
            <Link key={item.href} href={item.href} aria-current={active ? "page" : undefined} className={`whitespace-nowrap rounded-full px-3 py-1.5 text-sm ${active ? "bg-wash-2 font-medium text-ink" : "text-ink-2"}`}>
              {item[language]}
            </Link>
          );
        })}
      </nav>
    </header>
  );
}
