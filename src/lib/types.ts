export type Level = 1 | 2 | 3 | 4;

export type Tag = {
  id: string;
  name: string;
  color: string;
  priority: Level;
  difficulty: Level;
  /**
   * Reminders chosen by hand, as ms before the event (values from REMINDER_OPTIONS).
   * When missing, they come from priority + difficulty.
   */
  reminders?: number[];
  /** Last edit time (ms), used to merge copies across devices. */
  updatedAt?: number;
};

export type CalendarEvent = {
  id: string;
  title: string;
  /** ISO local date-time, e.g. 2026-10-27T15:30 */
  date: string;
  /** Minutes; defaults to 60 for events created before this existed. */
  duration?: number;
  notes: string;
  tagId: string;
  done: boolean;
  /** Last edit time (ms), used to merge copies across devices. */
  updatedAt?: number;
};

export type NotifStyle = "cute" | "heads-up" | "urgent" | "melt";

export type Reminder = {
  id: string;
  eventId: string;
  at: number;
  style: NotifStyle;
  label: string;
};

export const PRIORITY_LABELS: Record<Level, string> = {
  1: "Baja",
  2: "Media",
  3: "Alta",
  4: "Urgente",
};

export const DIFFICULTY_LABELS: Record<Level, string> = {
  1: "Fácil",
  2: "Normal",
  3: "Difícil",
  4: "Re difícil",
};
