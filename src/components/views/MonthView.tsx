"use client";

import { CalendarPlus, ChevronRight } from "lucide-react";
import { addDays, dayKey, groupByDay, startOfWeek, timeRange } from "@/lib/dates";
import type { CalendarEvent, Tag } from "@/lib/types";

const WEEKDAYS = ["L", "M", "M", "J", "V", "S", "D"];

type Props = {
  cursor: Date;
  today: string;
  events: CalendarEvent[];
  tagById: Map<string, Tag>;
  onSelectDay: (d: Date) => void;
  onOpenDay: (d: Date) => void;
  onOpenEvent: (e: CalendarEvent) => void;
  onCreate: (day: string) => void;
};

/** Compact month of square days, with the selected day's events listed below. */
export function MonthView({ cursor, today, events, tagById, onSelectDay, onOpenDay, onOpenEvent, onCreate }: Props) {
  const first = new Date(cursor.getFullYear(), cursor.getMonth(), 1);
  const start = startOfWeek(first);
  const last = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 0);
  const weeks = Math.ceil((((first.getDay() + 6) % 7) + last.getDate()) / 7);
  const days = Array.from({ length: weeks * 7 }, (_, i) => addDays(start, i));
  const byDay = groupByDay(events);
  const selected = dayKey(cursor);
  const selectedEvents = byDay.get(selected) ?? [];
  const selectedLabel = cursor.toLocaleDateString("es-AR", { weekday: "long", day: "numeric", month: "long" });

  return (
    <div className="flex h-full flex-col">
      <div className="px-3 pb-2">
        <div className="grid grid-cols-7 text-center text-[11px] font-medium text-muted">
          {WEEKDAYS.map((w, i) => (
            <div key={i} className="py-1.5">{w}</div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-1">
          {days.map((d) => {
            const k = dayKey(d);
            const inMonth = d.getMonth() === cursor.getMonth();
            const list = byDay.get(k) ?? [];
            const isToday = k === today;
            const isSel = k === selected;
            return (
              <button
                key={k}
                onClick={() => onSelectDay(d)}
                aria-label={d.toLocaleDateString("es-AR", { weekday: "long", day: "numeric", month: "long" })}
                aria-pressed={isSel}
                className={`flex aspect-square flex-col items-center justify-center gap-1 rounded-xl transition ${
                  isSel && !isToday ? "bg-brand-100" : "active:bg-bg"
                }`}
              >
                <span
                  className={`flex h-8 w-8 items-center justify-center rounded-full text-[15px] tabular-nums ${
                    isToday
                      ? "bg-brand-500 font-semibold text-white"
                      : isSel
                        ? "font-semibold text-brand-700"
                        : inMonth
                          ? "text-ink"
                          : "text-muted/40"
                  }`}
                >
                  {d.getDate()}
                </span>
                <span className="flex h-1.5 items-center gap-[3px]">
                  {list.slice(0, 3).map((e) => (
                    <span
                      key={e.id}
                      className="h-1.5 w-1.5 rounded-full"
                      style={{ background: tagById.get(e.tagId)?.color ?? "var(--brand-500)", opacity: e.done || !inMonth ? 0.35 : 1 }}
                    />
                  ))}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto border-t border-line px-4 pb-28 pt-3">
        <div className="mb-2.5 flex items-center justify-between">
          <h3 className="font-medium first-letter:uppercase">{selectedLabel}</h3>
          <button onClick={() => onOpenDay(cursor)} className="flex items-center gap-0.5 rounded-lg px-2 py-1 text-sm font-medium text-brand-600 active:bg-bg">
            Ver día <ChevronRight size={16} />
          </button>
        </div>
        {selectedEvents.length === 0 ? (
          <button
            onClick={() => onCreate(selected)}
            className="flex w-full items-center gap-2 rounded-xl border border-dashed border-line px-3 py-3 text-left text-sm text-muted active:bg-bg"
          >
            <CalendarPlus size={16} /> Sin eventos · Agregar
          </button>
        ) : (
          <ul className="space-y-1.5">
            {selectedEvents.map((e) => {
              const tag = tagById.get(e.tagId);
              return (
                <li key={e.id}>
                  <button
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
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
