"use client";

import type { ReactNode } from "react";
import { useLanguage } from "@/lib/language";

// Stateful demo screens remount on a language change so their fallback
// records are initialized from the same locale as the surrounding UI.
export function LanguageBoundary({ children }: { children: ReactNode }) {
  const language = useLanguage();
  return (
    <div key={language} className="contents">
      {children}
    </div>
  );
}
