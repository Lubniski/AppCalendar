"use client";

import { useEffect, useRef } from "react";
import { dayKey, endMinutes, groupByDay, hhmm, startMinutes, timeRange } from "@/lib/dates";
import type { CalendarEvent, Tag } from "@/lib/types";

const HOUR_PX = 52;
const HOURS = Array.from({ length: 24 }, (_, h) => h);

type Props = {
  days: Date[];
  now: number;
  events: CalendarEvent[];
  tagById: Map<string, Tag>;
  onOpenDay: (d: Date) => void;
  onOpenEvent: (e: CalendarEvent) => void;
  onCreateAt: (day: string, time: string) => void;
};

type Placed = { event: CalendarEvent; start: number; end: number; col: number; cols: number };

/** Side-by-side columns for overlapping events, like Google Calendar. */
function layoutDay(events: CalendarEvent[]): Placed[] {
  const items = events
    .map((event) => ({ event, start: startMinutes(event), end: Math.max(endMinutes(event), startMinutes(event) + 20), col: 0, cols: 1 }))
    .sort((a, b) => a.start - b.start || b.end - a.end);

  const placed: Placed[] = [];
  let cluster: Placed[] = [];
  let colEnds: number[] = [];
  let clusterEnd = -1;

  const flush = () => {
    for (const p of cluster) p.cols = colEnds.length;
    placed.push(...cluster);
    cluster = [];
    colEnds = [];
  };

  for (const it of items) {
    if (it.start >= clusterEnd) flush();
    let col = colEnds.findIndex((end) => end <= it.start);
    if (col === -1) col = colEnds.push(0) - 1;
    colEnds[col] = it.end;
    it.col = col;
    cluster.push(it);
    clusterEnd = Math.max(clusterEnd, it.end);
  }
  flush();
  return placed;
}

export function TimeGridView({ days, now, events, tagById, onOpenDay, onOpenEvent, onCreateAt }: Props) {
  const scroller = useRef<HTMLDivElement>(null);
  const byDay = groupByDay(events);
  const today = dayKey(new Date(now));
  const nowDate = new Date(now);
  const nowMin = nowDate.getHours() * 60 + nowDate.getMinutes();
  const compact = days.length > 3;

  useEffect(() => {
    scroller.current?.scrollTo({ top: HOUR_PX * 7 });
  }, []);

  return (
    <div className="flex h-full flex-col">
      <div className="flex border-b border-line pl-12">
        {days.map((d) => {
          const k = dayKey(d);
          const isToday = k === today;
          return (
            <button key={k} onClick={() => onOpenDay(d)} className="flex flex-1 flex-col items-center py-1.5">
              <span className={`text-[11px] font-medium uppercase ${isToday ? "text-brand-600" : "text-muted"}`}>
                {d.toLocaleDateString("es-AR", { weekday: "short" }).replace(".", "")}
              </span>
              <span
                className={`flex items-center justify-center rounded-full tabular-nums ${compact ? "h-7 w-7 text-sm" : "h-9 w-9 text-xl"} ${
                  isToday ? "bg-brand-500 font-semibold text-white" : "text-ink"
                }`}
              >
                {d.getDate()}
              </span>
            </button>
          );
        })}
      </div>

      <div ref={scroller} className="relative flex-1 overflow-y-auto">
        <div className="relative flex" style={{ height: HOUR_PX * 24 }}>
          <div className="w-12 shrink-0">
            {HOURS.map((h) => (
              <div key={h} className="relative text-right" style={{ height: HOUR_PX }}>
                {h > 0 && <span className="absolute -top-2 right-2 text-[10px] tabular-nums text-muted">{hhmm(h * 60)}</span>}
              </div>
            ))}
          </div>

          {days.map((d) => {
            const k = dayKey(d);
            const placed = layoutDay(byDay.get(k) ?? []);
            return (
              <div key={k} className="relative flex-1 border-l border-line">
                {HOURS.map((h) => (
                  <button
                    key={h}
                    aria-label={`Crear evento ${k} ${hhmm(h * 60)}`}
                    onClick={() => onCreateAt(k, hhmm(h * 60))}
                    className="block w-full border-t border-line first:border-t-0 active:bg-brand-50"
                    style={{ height: HOUR_PX }}
                  />
                ))}

                {placed.map(({ event, start, end, col, cols }) => {
                  const tag = tagById.get(event.tagId);
                  const height = ((end - start) / 60) * HOUR_PX;
                  return (
                    <button
                      key={event.id}
                      onClick={() => onOpenEvent(event)}
                      className={`absolute overflow-hidden rounded-md border border-white px-1.5 py-0.5 text-left text-white ${event.done ? "opacity-50" : ""}`}
                      style={{
                        top: (start / 60) * HOUR_PX,
                        height: height - 1,
                        left: `calc(${(col / cols) * 100}% + 1px)`,
                        width: `calc(${100 / cols}% - 3px)`,
                        background: tag?.color ?? "var(--brand-500)",
                      }}
                    >
                      <span className={`block truncate text-[11px] font-semibold leading-tight ${event.done ? "line-through" : ""}`}>{event.title}</span>
                      {height > 34 && <span className="block truncate text-[10px] leading-tight opacity-90">{timeRange(event)}</span>}
                    </button>
                  );
                })}

                {k === today && (
                  <div className="pointer-events-none absolute inset-x-0 z-10" style={{ top: (nowMin / 60) * HOUR_PX }}>
                    <span className="absolute -left-1.5 -top-1.5 h-3 w-3 rounded-full bg-brand-600" />
                    <span className="block h-0.5 bg-brand-600" />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
