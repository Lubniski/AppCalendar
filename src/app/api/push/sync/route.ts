import type { PushSubscription } from "web-push";
import type { PushReminder } from "@/lib/notifCopy";
import { removeDevice, replaceReminders, saveSubscription, scheduleDue } from "@/lib/server/pushStore";

const DEVICE_RE = /^[a-f0-9-]{16,64}$/i;
const STYLES = new Set(["cute", "heads-up", "urgent", "melt"]);
const MAX_REMINDERS = 1000;

type Body = { device?: string; subscription?: PushSubscription | null; reminders?: PushReminder[] };

function isReminder(r: PushReminder) {
  return (
    typeof r?.id === "string" && r.id.length < 120 &&
    typeof r.eventId === "string" &&
    typeof r.at === "number" && Number.isFinite(r.at) &&
    STYLES.has(r.style) &&
    typeof r.title === "string" && r.title.length < 200 &&
    typeof r.body === "string" && r.body.length < 400 &&
    typeof r.label === "string"
  );
}

/** The app sends its push subscription plus every upcoming reminder after each change. */
export async function POST(req: Request) {
  const body = (await req.json().catch(() => null)) as Body | null;
  if (!body?.device || !DEVICE_RE.test(body.device)) {
    return Response.json({ error: "invalid device" }, { status: 400 });
  }
  const { device } = body;

  if (body.subscription === null) {
    await removeDevice(device);
    return Response.json({ ok: true, removed: true });
  }
  if (body.subscription) {
    if (typeof body.subscription.endpoint !== "string" || !body.subscription.endpoint.startsWith("https://")) {
      return Response.json({ error: "invalid subscription" }, { status: 400 });
    }
    await saveSubscription(device, body.subscription);
  }

  const now = Date.now();
  const reminders = (body.reminders ?? []).filter(isReminder).filter((r) => r.at > now).slice(0, MAX_REMINDERS);
  const stored = await replaceReminders(device, reminders);
  const scheduled = await scheduleDue(device, stored, now);
  return Response.json({ ok: true, reminders: stored.length, scheduled });
}
