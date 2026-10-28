"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { ActiveNotif } from "@/components/NotificationLayer";
import { NOTIF_TITLES, notifBody } from "./notifCopy";
import { pushEnabled } from "./push";
import { allReminders, dueReminders } from "./reminders";
import { loadFired, saveFired } from "./store";
import type { CalendarEvent, Tag } from "./types";

async function systemNotify(n: ActiveNotif) {
  // With push enabled the server already sends this one.
  if (pushEnabled() || typeof Notification === "undefined" || Notification.permission !== "granted") return;
  const reg = await navigator.serviceWorker?.getRegistration();
  const opts: NotificationOptions = { body: notifBody(n.event.title, n.label), tag: n.key, icon: "/pwa-icon/192", badge: "/pwa-icon/96" };
  if (reg) await reg.showNotification(NOTIF_TITLES[n.style], opts);
  else new Notification(NOTIF_TITLES[n.style], opts);
}

/**
 * Shows in-app animations for due reminders while the app is open (every 15s
 * and whenever it comes back to the foreground), and when the user taps a push
 * notification. Delivery with the app closed is done by the server via Web Push.
 */
export function useReminderEngine(events: CalendarEvent[], tags: Tag[], ready: boolean) {
  const [queue, setQueue] = useState<ActiveNotif[]>([]);
  const fired = useRef<Set<string> | null>(null);

  const check = useCallback(() => {
    if (!ready) return;
    fired.current ??= loadFired();
    const tagById = new Map(tags.map((t) => [t.id, t]));
    const evById = new Map(events.map((e) => [e.id, e]));
    const due = dueReminders(allReminders(events, tags), fired.current);
    if (!due.length) return;

    // Only the most intense reminder per event, so one event doesn't stack popups.
    const rank = { cute: 0, "heads-up": 1, urgent: 2, melt: 3 };
    const best = new Map<string, (typeof due)[number]>();
    for (const r of due) {
      fired.current.add(r.id);
      const prev = best.get(r.eventId);
      if (!prev || rank[r.style] > rank[prev.style]) best.set(r.eventId, r);
    }
    saveFired(fired.current);

    const notifs = [...best.values()].map((r) => {
      const event = evById.get(r.eventId)!;
      return { key: r.id, style: r.style, label: r.label, event, tag: tagById.get(event.tagId) };
    });
    notifs.forEach((n) => void systemNotify(n));
    setQueue((q) => [...q, ...notifs]);
  }, [events, tags, ready]);

  useEffect(() => {
    check();
    const id = setInterval(check, 15_000);
    const onVis = () => document.visibilityState === "visible" && check();
    document.addEventListener("visibilitychange", onVis);
    return () => {
      clearInterval(id);
      document.removeEventListener("visibilitychange", onVis);
    };
  }, [check]);

  // Tapping a push notification: ?n=<reminderId> on a fresh launch, or a
  // message from the service worker when the app was already open.
  const showReminder = useCallback(
    (id: string) => {
      const r = allReminders(events, tags).find((x) => x.id === id);
      const event = r && events.find((e) => e.id === r.eventId);
      if (!r || !event) return;
      fired.current ??= loadFired();
      fired.current.add(r.id);
      saveFired(fired.current);
      const n = { key: r.id, style: r.style, label: r.label, event, tag: tags.find((t) => t.id === event.tagId) };
      setQueue((q) => (q.some((x) => x.key === n.key) ? q : [...q, n]));
    },
    [events, tags],
  );

  useEffect(() => {
    if (!ready) return;
    const params = new URLSearchParams(window.location.search);
    const id = params.get("n");
    let launch: ReturnType<typeof setTimeout> | undefined;
    if (id) {
      launch = setTimeout(() => showReminder(id), 0);
      window.history.replaceState(null, "", window.location.pathname);
    }
    const onMessage = (e: MessageEvent) => {
      if (e.data?.type === "romiorg:reminder" && e.data.reminder?.id) showReminder(e.data.reminder.id);
    };
    navigator.serviceWorker?.addEventListener("message", onMessage);
    return () => {
      clearTimeout(launch);
      navigator.serviceWorker?.removeEventListener("message", onMessage);
    };
  }, [ready, showReminder]);

  const current = queue[0] ?? null;
  const dismiss = useCallback(() => setQueue((q) => q.slice(1)), []);
  const preview = useCallback((n: ActiveNotif) => setQueue((q) => [...q, n]), []);

  return { current, dismiss, preview };
}
