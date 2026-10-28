import type { NotifStyle } from "./types";

export const NOTIF_TITLES: Record<NotifStyle, string> = {
  cute: "Recordatorio",
  "heads-up": "Se acerca",
  urgent: "Urgente",
  melt: "🫠 Esto se derrite",
};

export function notifBody(title: string, label: string) {
  return `${title} · empieza ${label}`;
}

/** What the server needs to deliver one reminder as a push notification. */
export type PushReminder = {
  id: string;
  eventId: string;
  at: number;
  style: NotifStyle;
  label: string;
  title: string;
  body: string;
};
