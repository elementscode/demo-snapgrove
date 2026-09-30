/** "now", "5m", "3h", "2d", then a date. Short, the way a feed shows time. */
export function timeAgo(d: Date | string | null | undefined): string {
  if (!d) {
    return "now";
  }

  let seconds = Math.max(0, (Date.now() - new Date(d).getTime()) / 1000);

  if (seconds < 60) {
    return "now";
  }

  if (seconds < 3600) {
    return `${Math.floor(seconds / 60)}m`;
  }

  if (seconds < 86400) {
    return `${Math.floor(seconds / 3600)}h`;
  }

  if (seconds < 7 * 86400) {
    return `${Math.floor(seconds / 86400)}d`;
  }

  return new Date(d).toLocaleDateString("en", { month: "short", day: "numeric" });
}

export function plural(n: number, one: string, many: string = one + "s"): string {
  return `${n.toLocaleString("en")} ${n === 1 ? one : many}`;
}
