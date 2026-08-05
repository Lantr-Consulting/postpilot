"use client";

import { useEffect, useState, type ReactNode } from "react";
import { useLanguage } from "@/lib/language";

// Stateful demo screens remount on a language change so their fallback
// records are initialized from the same locale as the surrounding UI.
export function LanguageBoundary({ children }: { children: ReactNode }) {
  const language = useLanguage();
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const frame = requestAnimationFrame(() => setHydrated(true));
    return () => cancelAnimationFrame(frame);
  }, []);

  // The localized demo-record proxies intentionally read the browser language.
  // Wait until hydration completes so their first client read cannot disagree
  // with the server's Chinese fallback.
  if (!hydrated) return <div className="contents" aria-hidden />;

  return (
    <div key={language} className="contents">
      {children}
    </div>
  );
}
