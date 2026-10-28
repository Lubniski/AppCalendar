import type { CalendarEvent } from "./types";

export type ViewMode = "agenda" | "day" | "3day" | "week" | "month";

export const VIEW_LABELS: Record<ViewMode, string> = {
  agenda: "Agenda",
  day: "Día",
  "3day": "3 días",
  week: "Semana",
  month: "Mes",
};

const pad = (n: number) => String(n).padStart(2, "0");

export function dayKey(d: Date) {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function fromKey(key: string) {
  return new Date(`${key}T00:00`);
}

export function addDays(d: Date, n: number) {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
}

export function addMonths(d: Date, n: number) {
  return new Date(d.getFullYear(), d.getMonth() + n, 1);
}

/** Monday-first week start. */
export function startOfWeek(d: Date) {
  const x = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  return addDays(x, -((x.getDay() + 6) % 7));
}

export function hhmm(minutes: number) {
  const m = ((minutes % 1440) + 1440) % 1440;
  return `${pad(Math.floor(m / 60))}:${pad(m % 60)}`;
}

export function toMinutes(time: string) {
  const [h, m] = time.split(":").map(Number);
  return h * 60 + m;
}

export const DEFAULT_DURATION = 60;

export function startMinutes(e: CalendarEvent) {
  return toMinutes(e.date.slice(11, 16));
}

export function endMinutes(e: CalendarEvent) {
  return Math.min(1440, startMinutes(e) + (e.duration ?? DEFAULT_DURATION));
}

export function timeRange(e: CalendarEvent) {
  return `${e.date.slice(11, 16)} – ${hhmm(startMinutes(e) + (e.duration ?? DEFAULT_DURATION))}`;
}

/** Days shown by a view around the cursor date. */
export function visibleDays(view: ViewMode, cursor: Date): Date[] {
  if (view === "day") return [cursor];
  if (view === "3day") return [0, 1, 2].map((i) => addDays(cursor, i));
  const start = startOfWeek(cursor);
  return Array.from({ length: 7 }, (_, i) => addDays(start, i));
}

export function shiftCursor(view: ViewMode, cursor: Date, dir: 1 | -1) {
  if (view === "month" || view === "agenda") {
    const m = addMonths(cursor, dir);
    return m;
  }
  const step = view === "day" ? 1 : view === "3day" ? 3 : 7;
  return addDays(cursor, step * dir);
}

export function groupByDay(events: CalendarEvent[]) {
  const map = new Map<string, CalendarEvent[]>();
  for (const e of [...events].sort((a, b) => a.date.localeCompare(b.date))) {
    const k = e.date.slice(0, 10);
    map.set(k, [...(map.get(k) ?? []), e]);
  }
  return map;
}
