import type { PushSubscription } from "web-push";
import type { PushReminder } from "@/lib/notifCopy";
import { DEVICE_RE, ensureTodoSchedule, removeDevice, replaceReminders, saveSubscription, saveTodos, scheduleDue, sendTodos } from "@/lib/server/pushStore";
import { sanitizePrefs, type TodoPrefs } from "@/lib/todos";
const STYLES = new Set(["cute", "heads-up", "urgent", "melt"]);
const MAX_REMINDERS = 1000;

type Body = {
  device?: string;
  subscription?: PushSubscription | null;
  reminders?: PushReminder[];
  todos?: { items?: unknown[]; prefs?: Partial<TodoPrefs>; tz?: string };
  /** Show the list on the lock screen right away (sent when the app goes to the background). */
  notifyTodos?: boolean;
};

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

/** The app sends its push subscription, every upcoming reminder and its to-do list after each change. */
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
  let scheduled = 0;
  // Leave reminders untouched when the request only carries the to-do list.
  if (Array.isArray(body.reminders)) {
    const reminders = body.reminders.filter(isReminder).filter((r) => r.at > now).slice(0, MAX_REMINDERS);
    scheduled = await scheduleDue(device, await replaceReminders(device, reminders), now);
  }

  if (body.todos) {
    const items = (Array.isArray(body.todos.items) ? body.todos.items : [])
      .filter((t): t is string => typeof t === "string" && t.trim().length > 0)
      .map((t) => t.slice(0, 200))
      .slice(0, 100);
    const prefs = sanitizePrefs(body.todos.prefs);
    const tz = typeof body.todos.tz === "string" && body.todos.tz.length < 64 ? body.todos.tz : "UTC";
    await saveTodos(device, { items, prefs, tz });
    if (prefs.enabled) await ensureTodoSchedule();
    // At most one immediate refresh every 20 s, so quick edits don't send a burst.
    if (body.notifyTodos) await sendTodos(device, 20);
  }
  return Response.json({ ok: true, scheduled });
}
