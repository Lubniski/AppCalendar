import type { CalendarEvent, NotifStyle, Reminder, Tag } from "./types";

const MIN = 60_000;
const HOUR = 60 * MIN;
const DAY = 24 * HOUR;

/**
 * Every offset (ms before the event) unlocks at a minimum "intensity".
 * Intensity = priority + difficulty (2..8), so harder / more important
 * tags get reminded more often and earlier.
 */
const OFFSETS: { before: number; minIntensity: number; label: string; short: string }[] = [
  { before: 14 * DAY, minIntensity: 8, label: "en 2 semanas", short: "2 semanas" },
  { before: 7 * DAY, minIntensity: 7, label: "en 1 semana", short: "1 semana" },
  { before: 3 * DAY, minIntensity: 6, label: "en 3 días", short: "3 días" },
  { before: 2 * DAY, minIntensity: 5, label: "pasado mañana", short: "2 días" },
  { before: 1 * DAY, minIntensity: 2, label: "mañana", short: "1 día" },
  { before: 12 * HOUR, minIntensity: 6, label: "en 12 horas", short: "12 horas" },
  { before: 6 * HOUR, minIntensity: 5, label: "en 6 horas", short: "6 horas" },
  { before: 3 * HOUR, minIntensity: 4, label: "en 3 horas", short: "3 horas" },
  { before: 1 * HOUR, minIntensity: 2, label: "en 1 hora", short: "1 hora" },
  { before: 30 * MIN, minIntensity: 5, label: "en 30 minutos", short: "30 min" },
  { before: 15 * MIN, minIntensity: 3, label: "en 15 minutos", short: "15 min" },
  { before: 5 * MIN, minIntensity: 6, label: "en 5 minutos", short: "5 min" },
  { before: 0, minIntensity: 2, label: "ahora", short: "Al empezar" },
];

/** Moments a tag can be set to remind at, for choosing them by hand. */
export const REMINDER_OPTIONS = OFFSETS.map(({ before, short }) => ({ before, short }));
const VALID_OFFSETS = new Set(OFFSETS.map((o) => o.before));

export function intensity(tag: Tag | undefined) {
  return tag ? tag.priority + tag.difficulty : 4;
}

/** The offsets priority + difficulty would pick for this tag. */
export function autoReminders(tag: Tag | undefined) {
  const level = intensity(tag);
  return OFFSETS.filter((o) => level >= o.minIntensity).map((o) => o.before);
}

function offsetsFor(tag: Tag | undefined) {
  const chosen = tag?.reminders ? new Set(tag.reminders) : new Set(autoReminders(tag));
  return OFFSETS.filter((o) => chosen.has(o.before));
}

/** Keep only known offsets, without repeats (for data coming from other devices). */
export function cleanReminderOffsets(list: unknown): number[] | undefined {
  if (!Array.isArray(list)) return undefined;
  return [...new Set(list.filter((v): v is number => typeof v === "number" && VALID_OFFSETS.has(v)))];
}

/** How many reminders an event with this tag gets. */
export function reminderCount(tag: Tag | undefined) {
  return offsetsFor(tag).length;
}

export function styleFor(before: number, tag: Tag | undefined): NotifStyle {
  const hard = (tag?.difficulty ?? 1) >= 4;
  if (hard && before <= 1 * HOUR) return "melt";
  if (before <= 1 * HOUR || (tag?.priority ?? 1) >= 4) return "urgent";
  if (before <= 1 * DAY) return "heads-up";
  return "cute";
}

export function remindersFor(event: CalendarEvent, tag: Tag | undefined): Reminder[] {
  if (event.done) return [];
  const start = new Date(event.date).getTime();
  return offsetsFor(tag).map((o) => ({
    id: `${event.id}@${o.before}`,
    eventId: event.id,
    at: start - o.before,
    style: styleFor(o.before, tag),
    label: o.label,
  }));
}

export function allReminders(events: CalendarEvent[], tags: Tag[]): Reminder[] {
  const byId = new Map(tags.map((t) => [t.id, t]));
  return events
    .flatMap((e) => remindersFor(e, byId.get(e.tagId)))
    .sort((a, b) => a.at - b.at);
}

/** Reminders that are due and not older than the grace window (so we don't spam old ones). */
export function dueReminders(reminders: Reminder[], fired: Set<string>, now = Date.now()) {
  const grace = 10 * MIN;
  return reminders.filter((r) => !fired.has(r.id) && r.at <= now && now - r.at < grace);
}
