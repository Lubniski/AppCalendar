/** "Cosas para hacer": a simple list shown in the app and on the lock screen. */

export type TodoItem = {
  id: string;
  text: string;
  createdAt: number;
  /** Last edit time (ms), used to merge copies across devices. */
  updatedAt?: number;
};

export type TodoPrefs = {
  /** Show the list as a notification on the lock screen. */
  enabled: boolean;
  /** Hours between refreshes (24 = once a day, at `from`). */
  every: 1 | 2 | 3 | 24;
  /** Local hours (0-23) of the first and last refresh of the day. */
  from: number;
  to: number;
};

export const DEFAULT_TODO_PREFS: TodoPrefs = { enabled: true, every: 1, from: 8, to: 22 };

export const TODO_TAG = "romiorg-todos";
const MAX_LINES = 12;

/** The lock-screen notification for a list of pending items. */
export function todoNotification(items: string[]) {
  const lines = items.slice(0, MAX_LINES).map((t) => `○ ${t}`);
  if (items.length > MAX_LINES) lines.push(`y ${items.length - MAX_LINES} más…`);
  return {
    kind: "todos",
    title: items.length === 1 ? "Para hacer · 1 pendiente" : `Para hacer · ${items.length} pendientes`,
    body: lines.join("\n"),
    tag: TODO_TAG,
    url: "/?todos=1",
  };
}

/** Is `hour` (local, 0-23) one of the refresh hours for these preferences? */
export function isRefreshHour(prefs: TodoPrefs, hour: number) {
  if (prefs.every === 24) return hour === prefs.from;
  return hour >= prefs.from && hour <= prefs.to && (hour - prefs.from) % prefs.every === 0;
}

export function localHour(tz: string, at = new Date()) {
  try {
    return Number(new Intl.DateTimeFormat("en-US", { hour: "numeric", hourCycle: "h23", timeZone: tz }).format(at));
  } catch {
    return at.getUTCHours();
  }
}

export function sanitizePrefs(p: Partial<TodoPrefs> | undefined): TodoPrefs {
  const hour = (v: unknown, d: number) => (typeof v === "number" && Number.isInteger(v) && v >= 0 && v <= 23 ? v : d);
  const every = [1, 2, 3, 24].includes(p?.every as number) ? (p!.every as TodoPrefs["every"]) : DEFAULT_TODO_PREFS.every;
  const from = hour(p?.from, DEFAULT_TODO_PREFS.from);
  return { enabled: p?.enabled !== false, every, from, to: Math.max(from, hour(p?.to, DEFAULT_TODO_PREFS.to)) };
}
