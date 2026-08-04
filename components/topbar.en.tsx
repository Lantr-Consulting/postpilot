"use client";

import { useEffect, useState } from "react";
import { LanguageToggle } from "@/components/language-toggle";
import { CREATOR, TODAY } from "@/lib/mock.en";
import { fmtDate } from "@/lib/format";
import { useLive } from "@/lib/use-live";

// Sun/moon toggle. Dark is the default set; "light" is stored in
// localStorage and applied pre-paint by the inline script in layout.tsx.
function ThemeToggle() {
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
      aria-label={theme === "light" ? "Switch to dark mode" : "Switch to light mode"}
      title={theme === "light" ? "Dark mode" : "Light mode"}
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

export function TopBar() {
  const { live, checking } = useLive();
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
      <div className="flex items-center gap-2">
        <span
          className={`rounded-full px-2.5 py-1 text-[11px] font-medium ${
            live
              ? "bg-good/10 text-good"
              : "border border-hairline text-ink-muted"
          }`}
        >
          {checking ? "…" : live ? "Live" : "Sample data"}
        </span>
        <LanguageToggle />
        <ThemeToggle />
      </div>
    </header>
  );
}
