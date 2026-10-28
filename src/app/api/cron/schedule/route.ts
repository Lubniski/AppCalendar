import { getReminders, listDevices, scheduleDue } from "@/lib/server/pushStore";

/**
 * Daily Vercel Cron: reminders further than 7 days away can't be queued in
 * QStash yet, so each day we queue the ones that entered the window.
 */
export async function GET(req: Request) {
  if (req.headers.get("authorization") !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response("Unauthorized", { status: 401 });
  }
  let scheduled = 0;
  for (const device of await listDevices()) {
    scheduled += await scheduleDue(device, await getReminders(device));
  }
  return Response.json({ scheduled });
}
