import { Receiver } from "@upstash/qstash";
import { fireReminder } from "@/lib/server/pushStore";

/** Called by QStash at the exact time a reminder is due. */
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

  const { device, id, at } = JSON.parse(raw) as { device: string; id: string; at: number };
  const result = await fireReminder(device, id, at);
  return Response.json({ result });
}
