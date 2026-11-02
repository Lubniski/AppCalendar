import "server-only";

import { Client } from "@upstash/qstash";
import { Redis } from "@upstash/redis";
import webpush, { type PushSubscription } from "web-push";
import type { PushReminder } from "@/lib/notifCopy";
import { todoNotification, type TodoPrefs } from "@/lib/todos";

/** QStash's free plan caps delays at 7 days; the daily cron schedules the rest later. */
export const SCHEDULE_WINDOW_MS = 7 * 24 * 60 * 60 * 1000;

export type StoredReminder = PushReminder & { scheduled: boolean };

/** The to-do list a device shows on the lock screen, and when. */
export type DeviceTodos = { items: string[]; prefs: TodoPrefs; tz: string };

export const DEVICE_RE = /^[a-f0-9-]{16,64}$/i;

const keys = {
  devices: "devices",
  todoDevices: "todo-devices",
  sub: (device: string) => `dev:${device}:sub`,
  reminders: (device: string) => `dev:${device}:rem`,
  todos: (device: string) => `dev:${device}:todos`,
  todosThrottle: (device: string) => `dev:${device}:todos-sent`,
};

let redisClient: Redis | null = null;
let qstashClient: Client | null = null;
let vapidReady = false;

export function redis() {
  redisClient ??= Redis.fromEnv();
  return redisClient;
}

function qstash() {
  qstashClient ??= new Client({ token: process.env.QSTASH_TOKEN!, baseUrl: process.env.QSTASH_URL });
  return qstashClient;
}

function ensureVapid() {
  if (vapidReady) return;
  webpush.setVapidDetails(
    process.env.VAPID_SUBJECT ?? "https://romiorg.vercel.app",
    process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
    process.env.VAPID_PRIVATE_KEY!,
  );
  vapidReady = true;
}

function publicUrl(path: string) {
  const host = process.env.VERCEL_PROJECT_PRODUCTION_URL;
  if (!host) throw new Error("VERCEL_PROJECT_PRODUCTION_URL is not set");
  return `https://${host}${path}`;
}

export async function saveSubscription(device: string, sub: PushSubscription) {
  await redis().set(keys.sub(device), sub);
  await redis().sadd(keys.devices, device);
}

export async function removeDevice(device: string) {
  await redis().del(keys.sub(device), keys.reminders(device), keys.todos(device));
  await redis().srem(keys.devices, device);
  await redis().srem(keys.todoDevices, device);
}

export async function listDevices() {
  return redis().smembers(keys.devices);
}

export async function getReminders(device: string): Promise<StoredReminder[]> {
  const all = await redis().hgetall<Record<string, StoredReminder>>(keys.reminders(device));
  return all ? Object.values(all) : [];
}

/** Replace the device's reminders, keeping the "already scheduled" flag for unchanged ones. */
export async function replaceReminders(device: string, incoming: PushReminder[]) {
  const existing = new Map((await getReminders(device)).map((r) => [r.id, r]));
  const next: StoredReminder[] = incoming.map((r) => {
    const prev = existing.get(r.id);
    return { ...r, scheduled: !!prev?.scheduled && prev.at === r.at };
  });
  await redis().del(keys.reminders(device));
  if (next.length) {
    await redis().hset(keys.reminders(device), Object.fromEntries(next.map((r) => [r.id, r])));
  }
  return next;
}

/** Publish a delayed QStash message for every reminder due inside the window. */
export async function scheduleDue(device: string, reminders: StoredReminder[], now = Date.now()) {
  const due = reminders.filter((r) => !r.scheduled && r.at > now - 60_000 && r.at - now < SCHEDULE_WINDOW_MS);
  for (const r of due) {
    await qstash().publishJSON({
      url: publicUrl("/api/push/fire"),
      body: { device, id: r.id, at: r.at },
      notBefore: Math.floor(r.at / 1000),
      // QStash only accepts [A-Za-z0-9_-] here
      deduplicationId: `${device}_${r.id}_${r.at}`.replace(/[^A-Za-z0-9_-]/g, "_"),
    });
    await redis().hset(keys.reminders(device), { [r.id]: { ...r, scheduled: true } });
  }
  return due.length;
}

/** Deliver one Web Push message; forgets the device if its subscription is gone. */
async function sendPush(device: string, payload: object, urgency: "normal" | "high" = "normal") {
  const sub = await redis().get<PushSubscription>(keys.sub(device));
  if (!sub) return "no-subscription";
  ensureVapid();
  try {
    await webpush.sendNotification(sub, JSON.stringify(payload), { TTL: 60 * 60, urgency });
    return "sent";
  } catch (err) {
    const status = (err as { statusCode?: number }).statusCode;
    // The subscription is gone (app removed / permission revoked).
    if (status === 404 || status === 410) await removeDevice(device);
    else throw err;
    return "expired";
  }
}

/** Send one reminder if it still exists with the same time (edits/deletes make old messages no-ops). */
export async function fireReminder(device: string, id: string, at: number) {
  const reminder = await redis().hget<StoredReminder>(keys.reminders(device), id);
  if (!reminder || reminder.at !== at) return "stale";
  await redis().hdel(keys.reminders(device), id);
  const url = `/?n=${encodeURIComponent(reminder.id)}`;
  return sendPush(
    device,
    { title: reminder.title, body: reminder.body, tag: reminder.id, url, reminder },
    reminder.style === "melt" || reminder.style === "urgent" ? "high" : "normal",
  );
}

// ---- to-do list on the lock screen ----

export async function saveTodos(device: string, todos: DeviceTodos) {
  await redis().set(keys.todos(device), todos);
  if (todos.prefs.enabled) await redis().sadd(keys.todoDevices, device);
  else await redis().srem(keys.todoDevices, device);
}

export async function listTodoDevices() {
  return redis().smembers(keys.todoDevices);
}

export async function getTodos(device: string) {
  return redis().get<DeviceTodos>(keys.todos(device));
}

/**
 * Show the list as a notification. It always uses the same tag, so each one
 * replaces the previous and jumps back to the top of the lock screen.
 * `minGapSeconds` keeps quick edits from sending a burst of notifications.
 */
export async function sendTodos(device: string, minGapSeconds = 0) {
  const todos = await getTodos(device);
  if (!todos?.prefs.enabled || todos.items.length === 0) return "skip";
  if (minGapSeconds > 0) {
    const first = await redis().set(keys.todosThrottle(device), 1, { nx: true, ex: minGapSeconds });
    if (!first) return "throttled";
  }
  return sendPush(device, todoNotification(todos.items));
}

let todoScheduleReady = false;

/** One QStash schedule, every hour on the hour, drives all lock-screen list refreshes. */
export async function ensureTodoSchedule() {
  if (todoScheduleReady) return;
  await qstash().schedules.create({
    scheduleId: "romiorg-todos-hourly",
    destination: publicUrl("/api/todos/tick"),
    cron: "0 * * * *",
    retries: 0,
  });
  todoScheduleReady = true;
}
