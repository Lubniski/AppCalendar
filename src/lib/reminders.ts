import type { CalendarEvent, NotifStyle, Reminder, Tag } from "./types";

const MIN = 60_000;
const HOUR = 60 * MIN;
const DAY = 24 * HOUR;

/**
 * Every offset (ms before the event) unlocks at a minimum "intensity".
 * Intensity = priority + difficulty (2..8), so harder / more important
 * tags get reminded more often and earlier.
 */
const OFFSETS: { before: number; minIntensity: number; label: string }[] = [
  { before: 14 * DAY, minIntensity: 8, label: "en 2 semanas" },
  { before: 7 * DAY, minIntensity: 7, label: "en 1 semana" },
  { before: 3 * DAY, minIntensity: 6, label: "en 3 días" },
  { before: 2 * DAY, minIntensity: 5, label: "pasado mañana" },
  { before: 1 * DAY, minIntensity: 2, label: "mañana" },
  { before: 12 * HOUR, minIntensity: 6, label: "en 12 horas" },
  { before: 6 * HOUR, minIntensity: 5, label: "en 6 horas" },
  { before: 3 * HOUR, minIntensity: 4, label: "en 3 horas" },
  { before: 1 * HOUR, minIntensity: 2, label: "en 1 hora" },
  { before: 30 * MIN, minIntensity: 5, label: "en 30 minutos" },
  { before: 15 * MIN, minIntensity: 3, label: "en 15 minutos" },
  { before: 5 * MIN, minIntensity: 6, label: "en 5 minutos" },
  { before: 0, minIntensity: 2, label: "ahora" },
];

export function intensity(tag: Tag | undefined) {
  return tag ? tag.priority + tag.difficulty : 4;
}

/** How many reminders an event with this tag gets. */
export function reminderCount(tag: Tag | undefined) {
  const level = intensity(tag);
  return OFFSETS.filter((o) => level >= o.minIntensity).length;
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
  const level = intensity(tag);
  return OFFSETS.filter((o) => level >= o.minIntensity).map((o) => ({
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
