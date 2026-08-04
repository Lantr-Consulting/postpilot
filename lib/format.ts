// Small formatting helpers shared across screens.

import type { Language } from "./language";

export function fmtDate(iso: string, language: Language = "zh"): string {
  const d = new Date(`${iso}T12:00:00`);
  return d.toLocaleDateString(language === "zh" ? "zh-CN" : "en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

export function fmtDayShort(iso: string, language: Language = "zh"): { day: string; num: number } {
  const d = new Date(`${iso}T12:00:00`);
  return {
    day: d.toLocaleDateString(language === "zh" ? "zh-CN" : "en-US", { weekday: "narrow" }),
    num: d.getDate(),
  };
}

export function fmtNum(n: number, language: Language = "zh"): string {
  if (language === "en") {
    if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(n >= 10_000_000 ? 0 : 1)}M`;
    if (n >= 1_000) return `${(n / 1_000).toFixed(n >= 100_000 ? 0 : 1)}K`;
    return n.toLocaleString("en-US");
  }
  if (n >= 100_000_000) return `${(n / 100_000_000).toFixed(1)} 亿`;
  if (n >= 10_000) return `${(n / 10_000).toFixed(n >= 100_000 ? 0 : 1)} 万`;
  return n.toLocaleString("zh-CN");
}

export function fmtTime(iso: string, language: Language = "zh"): string {
  return new Date(iso).toLocaleTimeString(language === "zh" ? "zh-CN" : "en-US", {
    hour: "numeric",
    minute: "2-digit",
  });
}
