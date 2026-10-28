"use client";

import { CalendarPlus } from "lucide-react";
import { dayKey, fromKey, groupByDay, timeRange } from "@/lib/dates";
import type { CalendarEvent, Tag } from "@/lib/types";

type Props = {
  now: number;
  events: CalendarEvent[];
  tagById: Map<string, Tag>;
  onOpenDay: (d: Date) => void;
  onOpenEvent: (e: CalendarEvent) => void;
  onCreate: () => void;
};

export function AgendaView({ now, events, tagById, onOpenDay, onOpenEvent, onCreate }: Props) {
  const today = dayKey(new Date(now));
  const byDay = groupByDay(events.filter((e) => e.date.slice(0, 10) >= today));
  if (!byDay.has(today)) byDay.set(today, []);
  const keys = [...byDay.keys()].sort();
  const monthOf = (k: string) => fromKey(k).toLocaleDateString("es-AR", { month: "long", year: "numeric" });

  return (
    <div className="h-full overflow-y-auto px-3 pb-28">
      {keys.map((k, i) => {
        const d = fromKey(k);
        const list = byDay.get(k)!;
        const month = monthOf(k);
        const showMonth = i === 0 || month !== monthOf(keys[i - 1]);
        const isToday = k === today;
        return (
          <section key={k}>
            {showMonth && <h3 className="px-1 pb-2 pt-5 text-lg font-medium first-letter:uppercase">{month}</h3>}
            <div className="flex gap-3 py-1.5">
              <button onClick={() => onOpenDay(d)} className="flex w-11 shrink-0 flex-col items-center pt-0.5">
                <span className={`text-[11px] font-medium uppercase ${isToday ? "text-brand-600" : "text-muted"}`}>
                  {d.toLocaleDateString("es-AR", { weekday: "short" }).replace(".", "")}
                </span>
                <span
                  className={`flex h-9 w-9 items-center justify-center rounded-full text-xl tabular-nums ${
                    isToday ? "bg-brand-500 font-semibold text-white" : "text-ink"
                  }`}
                >
                  {d.getDate()}
                </span>
              </button>
              <div className="min-w-0 flex-1 space-y-1.5 pt-1">
                {list.length === 0 ? (
                  <button onClick={onCreate} className="flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-left text-sm text-muted active:bg-brand-50">
                    <CalendarPlus size={16} /> Nada planificado para hoy
                  </button>
                ) : (
                  list.map((e) => {
                    const tag = tagById.get(e.tagId);
                    return (
                      <button
                        key={e.id}
                        onClick={() => onOpenEvent(e)}
                        className={`block w-full rounded-lg px-3 py-2 text-left text-white ${e.done ? "opacity-50" : ""}`}
                        style={{ background: tag?.color ?? "var(--brand-500)" }}
                      >
                        <span className={`block truncate text-sm font-semibold ${e.done ? "line-through" : ""}`}>{e.title}</span>
                        <span className="block truncate text-xs opacity-90">
                          {timeRange(e)}
                          {tag && ` · ${tag.name}`}
                        </span>
                      </button>
                    );
                  })
                )}
              </div>
            </div>
          </section>
        );
      })}
    </div>
  );
}
