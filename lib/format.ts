// Small formatting helpers shared across screens.

export function fmtDate(iso: string): string {
  const d = new Date(`${iso}T12:00:00`);
  return d.toLocaleDateString("zh-CN", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

export function fmtDayShort(iso: string): { day: string; num: number } {
  const d = new Date(`${iso}T12:00:00`);
  return {
    day: d.toLocaleDateString("zh-CN", { weekday: "narrow" }),
    num: d.getDate(),
  };
}

export function fmtNum(n: number): string {
  if (n >= 100_000_000) return `${(n / 100_000_000).toFixed(1)} 亿`;
  if (n >= 10_000) return `${(n / 10_000).toFixed(n >= 100_000 ? 0 : 1)} 万`;
  return n.toLocaleString("zh-CN");
}

export function fmtTime(iso: string): string {
  return new Date(iso).toLocaleTimeString("zh-CN", {
    hour: "numeric",
    minute: "2-digit",
  });
}
