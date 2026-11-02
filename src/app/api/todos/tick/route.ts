import { Receiver } from "@upstash/qstash";
import { getTodos, listTodoDevices, sendTodos } from "@/lib/server/pushStore";
import { isRefreshHour, localHour } from "@/lib/todos";

/** Called by QStash every hour: re-sends each device's list if it's one of its refresh hours. */
export async function POST(req: Request) {
  const raw = await req.text();
  const receiver = new Receiver({
    currentSigningKey: process.env.QSTASH_CURRENT_SIGNING_KEY!,
    nextSigningKey: process.env.QSTASH_NEXT_SIGNING_KEY!,
  });
  const valid = await receiver
    .verify({ signature: req.headers.get("upstash-signature") ?? "", body: raw })
    .catch(() => false);
  if (!valid) return new Response("Invalid signature", { status: 401 });

  let sent = 0;
  for (const device of await listTodoDevices()) {
    const todos = await getTodos(device);
    if (!todos || !isRefreshHour(todos.prefs, localHour(todos.tz))) continue;
    if ((await sendTodos(device)) === "sent") sent++;
  }
  return Response.json({ sent });
}
