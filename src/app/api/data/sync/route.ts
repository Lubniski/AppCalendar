import { auth } from "@clerk/nextjs/server";
import { cleanReminderOffsets } from "@/lib/reminders";
import { redis } from "@/lib/server/pushStore";
import { EMPTY_DOC, docKey, isEmptyDoc, mergeDocs, type SyncDoc } from "@/lib/sync";

const MAX_BYTES = 900_000; // Upstash request limit is 1 MB
const MAX_ITEMS = 5000;

const str = (v: unknown, max: number) => typeof v === "string" && v.length <= max;
const num = (v: unknown) => typeof v === "number" && Number.isFinite(v);

/** Keep only well-formed fields so a bad client can't store junk. */
function sanitize(input: Partial<SyncDoc> | undefined): SyncDoc {
  const events = (Array.isArray(input?.events) ? input.events : [])
    .filter((e) => str(e?.id, 64) && str(e.title, 300) && str(e.date, 20) && str(e.notes ?? "", 5000) && str(e.tagId, 64))
    .slice(0, MAX_ITEMS)
    .map((e) => ({
      id: e.id, title: e.title, date: e.date, notes: e.notes ?? "", tagId: e.tagId, done: !!e.done,
      ...(num(e.duration) ? { duration: e.duration } : {}),
      ...(num(e.updatedAt) ? { updatedAt: e.updatedAt } : {}),
    }));
  const tags = (Array.isArray(input?.tags) ? input.tags : [])
    .filter((t) => str(t?.id, 64) && str(t.name, 60) && str(t.color, 9) && [1, 2, 3, 4].includes(t.priority) && [1, 2, 3, 4].includes(t.difficulty))
    .slice(0, 200)
    .map((t) => ({
      id: t.id, name: t.name, color: t.color, priority: t.priority, difficulty: t.difficulty,
      ...(cleanReminderOffsets(t.reminders) ? { reminders: cleanReminderOffsets(t.reminders) } : {}),
      ...(num(t.updatedAt) ? { updatedAt: t.updatedAt } : {}),
    }));
  const todos = (Array.isArray(input?.todos) ? input.todos : [])
    .filter((t) => str(t?.id, 64) && str(t.text, 200) && t.text.trim() && num(t.createdAt))
    .slice(0, 500)
    .map((t) => ({ id: t.id, text: t.text, createdAt: t.createdAt, ...(num(t.updatedAt) ? { updatedAt: t.updatedAt } : {}) }));
  const deleted: Record<string, number> = {};
  if (input?.deleted && typeof input.deleted === "object") {
    for (const [k, v] of Object.entries(input.deleted).slice(0, MAX_ITEMS)) if (str(k, 70) && num(v)) deleted[k] = v;
  }
  const p = input?.profile;
  const profile =
    p && str(p.name, 40) && str(p.color, 9) ? { name: p.name, color: p.color, ...(num(p.updatedAt) ? { updatedAt: p.updatedAt } : {}) } : null;
  return { events, tags, todos, deleted, profile };
}

/**
 * Two-way sync for the signed-in user: the app sends its copy, the server
 * merges it with the stored one and returns the result.
 */
export async function POST(req: Request) {
  const { userId } = await auth();
  if (!userId) return Response.json({ error: "unauthorized" }, { status: 401 });

  const raw = await req.text();
  if (raw.length > MAX_BYTES) return Response.json({ error: "too large" }, { status: 413 });
  const body = (() => {
    try {
      return JSON.parse(raw) as { doc?: Partial<SyncDoc> };
    } catch {
      return null;
    }
  })();
  const key = `user:${userId}`;
  const stored = (await redis().get<SyncDoc>(key)) ?? EMPTY_DOC;
  const merged = mergeDocs(sanitize(stored), sanitize(body?.doc));

  if (!isEmptyDoc(merged) && docKey(merged) !== docKey(stored)) {
    if (JSON.stringify(merged).length > MAX_BYTES) return Response.json({ error: "too large" }, { status: 413 });
    await redis().set(key, merged);
  }
  return Response.json({ doc: merged, found: !isEmptyDoc(stored) });
}
