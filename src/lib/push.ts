"use client";

import { NOTIF_TITLES, notifBody, type PushReminder } from "./notifCopy";
import { allReminders } from "./reminders";
import { TODO_TAG, type TodoItem, type TodoPrefs } from "./todos";
import type { CalendarEvent, Tag } from "./types";

const DEVICE_KEY = "romiorg.device";
const PUSH_KEY = "romiorg.push";

export function pushSupported() {
  return typeof window !== "undefined" && "serviceWorker" in navigator && "PushManager" in window && !!process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
}

function deviceId() {
  let id = localStorage.getItem(DEVICE_KEY);
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem(DEVICE_KEY, id);
  }
  return id;
}

export function pushEnabled() {
  try {
    return localStorage.getItem(PUSH_KEY) === "1";
  } catch {
    return false;
  }
}

function urlBase64ToUint8Array(base64: string) {
  const padding = "=".repeat((4 - (base64.length % 4)) % 4);
  const raw = atob((base64 + padding).replace(/-/g, "+").replace(/_/g, "/"));
  return Uint8Array.from(raw, (c) => c.charCodeAt(0));
}

function upcoming(events: CalendarEvent[], tags: Tag[]): PushReminder[] {
  const now = Date.now();
  const byId = new Map(events.map((e) => [e.id, e]));
  return allReminders(events, tags)
    .filter((r) => r.at > now)
    .map((r) => {
      const title = byId.get(r.eventId)!.title;
      return { id: r.id, eventId: r.eventId, at: r.at, style: r.style, label: r.label, title: NOTIF_TITLES[r.style], body: notifBody(title, r.label) };
    });
}

function todosPayload(todos: TodoItem[], prefs: TodoPrefs) {
  return { items: todos.map((t) => t.text), prefs, tz: Intl.DateTimeFormat().resolvedOptions().timeZone };
}

async function post(body: unknown, keepalive = false) {
  const res = await fetch("/api/push/sync", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
    keepalive,
  });
  if (!res.ok) throw new Error(`sync failed: ${res.status}`);
}

/** Ask for permission, subscribe this device and upload its reminders and to-do list. */
export async function enablePush(events: CalendarEvent[], tags: Tag[], todos: TodoItem[], prefs: TodoPrefs) {
  const reg = await navigator.serviceWorker.ready;
  const sub =
    (await reg.pushManager.getSubscription()) ??
    (await reg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!),
    }));
  await post({ device: deviceId(), subscription: sub.toJSON(), reminders: upcoming(events, tags), todos: todosPayload(todos, prefs) });
  localStorage.setItem(PUSH_KEY, "1");
}

/** Re-upload reminders and the to-do list after anything changes. */
export async function syncPush(events: CalendarEvent[], tags: Tag[], todos: TodoItem[], prefs: TodoPrefs) {
  if (!pushEnabled()) return;
  await post({ device: deviceId(), reminders: upcoming(events, tags), todos: todosPayload(todos, prefs) });
}

/**
 * Upload the list and put it on the lock screen now. Called as the app goes to
 * the background, so `keepalive` lets the request finish after the page hides.
 */
export function refreshTodoNotification(todos: TodoItem[], prefs: TodoPrefs) {
  if (!pushEnabled()) return;
  void post({ device: deviceId(), todos: todosPayload(todos, prefs), notifyTodos: true }, true).catch(() => {});
}

/** Remove the list notification already on screen (e.g. after finishing everything). */
export async function closeTodoNotifications() {
  const reg = await navigator.serviceWorker?.getRegistration();
  const shown = (await reg?.getNotifications({ tag: TODO_TAG })) ?? [];
  shown.forEach((n) => n.close());
}

/** Stop sending this device's reminders (on sign-out). */
export async function disablePush() {
  if (!pushEnabled()) return;
  localStorage.removeItem(PUSH_KEY);
  await post({ device: deviceId(), subscription: null }).catch(() => {});
}
