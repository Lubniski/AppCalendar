import "server-only";

import { Client } from "@upstash/qstash";
import { Redis } from "@upstash/redis";
import webpush, { type PushSubscription } from "web-push";
import type { PushReminder } from "@/lib/notifCopy";

/** QStash's free plan caps delays at 7 days; the daily cron schedules the rest later. */
export const SCHEDULE_WINDOW_MS = 7 * 24 * 60 * 60 * 1000;

export type StoredReminder = PushReminder & { scheduled: boolean };

const keys = {
  devices: "devices",
  sub: (device: string) => `dev:${device}:sub`,
  reminders: (device: string) => `dev:${device}:rem`,
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

function fireUrl() {
  const host = process.env.VERCEL_PROJECT_PRODUCTION_URL;
  if (!host) throw new Error("VERCEL_PROJECT_PRODUCTION_URL is not set");
  return `https://${host}/api/push/fire`;
}

export async function saveSubscription(device: string, sub: PushSubscription) {
  await redis().set(keys.sub(device), sub);
  await redis().sadd(keys.devices, device);
}

export async function removeDevice(device: string) {
  await redis().del(keys.sub(device), keys.reminders(device));
  await redis().srem(keys.devices, device);
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
      url: fireUrl(),
      body: { device, id: r.id, at: r.at },
      notBefore: Math.floor(r.at / 1000),
      // QStash only accepts [A-Za-z0-9_-] here
      deduplicationId: `${device}_${r.id}_${r.at}`.replace(/[^A-Za-z0-9_-]/g, "_"),
    });
    await redis().hset(keys.reminders(device), { [r.id]: { ...r, scheduled: true } });
  }
  return due.length;
}

/** Send one reminder if it still exists with the same time (edits/deletes make old messages no-ops). */
export async function fireReminder(device: string, id: string, at: number) {
  const reminder = await redis().hget<StoredReminder>(keys.reminders(device), id);
  if (!reminder || reminder.at !== at) return "stale";
  const sub = await redis().get<PushSubscription>(keys.sub(device));
  await redis().hdel(keys.reminders(device), id);
  if (!sub) return "no-subscription";

  ensureVapid();
  const url = `/?n=${encodeURIComponent(reminder.id)}`;
  try {
    await webpush.sendNotification(
      sub,
      JSON.stringify({ title: reminder.title, body: reminder.body, tag: reminder.id, url, reminder }),
      { TTL: 60 * 60, urgency: reminder.style === "melt" || reminder.style === "urgent" ? "high" : "normal" },
    );
    return "sent";
  } catch (err) {
    const status = (err as { statusCode?: number }).statusCode;
    // The subscription is gone (app removed / permission revoked).
    if (status === 404 || status === 410) await removeDevice(device);
    else throw err;
    return "expired";
  }
}
