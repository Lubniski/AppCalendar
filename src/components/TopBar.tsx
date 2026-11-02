"use client";

import { CalendarDays, ChevronDown, ChevronLeft, ChevronRight, ListChecks, Menu } from "lucide-react";
import { useState } from "react";
import { addDays, addMonths, dayKey, startOfWeek } from "@/lib/dates";
import type { CalendarEvent } from "@/lib/types";

type Props = {
  initial: string;
  todoCount: number;
  onTodos: () => void;
  cursor: Date;
  showMonthLink: boolean;
  today: Date;
  events: CalendarEvent[];
  onMenu: () => void;
  onPick: (d: Date) => void;
  onToday: () => void;
  onAvatar: () => void;
  onMonthView: () => void;
};

export function TopBar({ initial, todoCount, onTodos, cursor, showMonthLink, today, events, onMenu, onPick, onToday, onAvatar, onMonthView }: Props) {
  const [open, setOpen] = useState(false);
  const sameYear = cursor.getFullYear() === today.getFullYear();
  const title = cursor.toLocaleDateString("es-AR", sameYear ? { month: "long" } : { month: "long", year: "numeric" });

  return (
    <div className="relative z-20 bg-surface safe-top">
      <header className="flex h-14 items-center gap-1 px-2">
        <button onClick={onMenu} aria-label="Menú" className="flex h-11 w-11 items-center justify-center rounded-full text-ink active:bg-bg">
          <Menu size={22} />
        </button>
        <button onClick={() => setOpen((o) => !o)} className="flex items-center gap-1 rounded-lg px-2 py-1.5 active:bg-bg">
          <span className="text-[22px] font-normal first-letter:uppercase">{title}</span>
          <ChevronDown size={18} className={`text-muted transition ${open ? "rotate-180" : ""}`} />
        </button>
        <div className="flex-1" />
        <button onClick={onTodos} aria-label={`Cosas para hacer (${todoCount})`} className="relative flex h-11 w-11 items-center justify-center rounded-full text-ink active:bg-bg">
          <ListChecks size={22} />
          {todoCount > 0 && (
            <span className="absolute right-1 top-1 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-brand-500 px-1 text-[10px] font-semibold text-white">
              {todoCount > 99 ? "99+" : todoCount}
            </span>
          )}
        </button>
        <button onClick={onToday} aria-label="Ir a hoy" className="flex h-11 w-11 items-center justify-center rounded-full active:bg-bg">
          <span className="relative flex h-[22px] w-[22px] items-center justify-center rounded-[5px] border-2 border-ink text-[10px] font-bold">
            <span className="absolute inset-x-0 -top-px h-[3px] bg-ink" />
            <span className="mt-0.5">{today.getDate()}</span>
          </span>
        </button>
        <button onClick={onAvatar} aria-label="Ajustes" className="ml-1 mr-1 flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-brand-400 to-brand-600 pt-0.5 font-script text-base text-white">
          {initial}
        </button>
      </header>
      {open && (
        <>
          {/* Floats over the current view instead of pushing it down. */}
          <div className="fixed inset-0 top-[calc(56px+max(env(safe-area-inset-top),12px))] bg-ink/20" onClick={() => setOpen(false)} />
          <div className="anim-fade absolute inset-x-0 top-full rounded-b-2xl bg-surface shadow-xl shadow-ink/10">
            <MiniMonth
              cursor={cursor}
              today={today}
              events={events}
              onPick={(d) => { onPick(d); setOpen(false); }}
            />
            {showMonthLink && (
              <button
                onClick={() => { onMonthView(); setOpen(false); }}
                className="flex w-full items-center justify-center gap-2 border-t border-line py-3 text-sm font-medium text-brand-600 active:bg-bg"
              >
                <CalendarDays size={16} /> Ver mes completo
              </button>
            )}
          </div>
        </>
      )}
    </div>
  );
}

function MiniMonth({ cursor, today, events, onPick }: { cursor: Date; today: Date; events: CalendarEvent[]; onPick: (d: Date) => void }) {
  const [month, setMonth] = useState(() => new Date(cursor.getFullYear(), cursor.getMonth(), 1));
  const start = startOfWeek(month);
  const days = Array.from({ length: 42 }, (_, i) => addDays(start, i));
  const withEvents = new Set(events.map((e) => e.date.slice(0, 10)));
  const todayKey = dayKey(today);
  const cursorKey = dayKey(cursor);

  return (
    <div className="px-4 pb-3">
      <div className="mb-1 flex items-center justify-between">
        <span className="text-sm font-medium first-letter:uppercase">
          {month.toLocaleDateString("es-AR", { month: "long", year: "numeric" })}
        </span>
        <div className="flex">
          <button aria-label="Mes anterior" onClick={() => setMonth(addMonths(month, -1))} className="flex h-8 w-8 items-center justify-center rounded-full text-muted active:bg-bg">
            <ChevronLeft size={18} />
          </button>
          <button aria-label="Mes siguiente" onClick={() => setMonth(addMonths(month, 1))} className="flex h-8 w-8 items-center justify-center rounded-full text-muted active:bg-bg">
            <ChevronRight size={18} />
          </button>
        </div>
      </div>
      <div className="grid grid-cols-7 text-center text-[11px] text-muted">
        {["L", "M", "M", "J", "V", "S", "D"].map((w, i) => (
          <span key={i} className="py-1">{w}</span>
        ))}
        {days.map((d) => {
          const k = dayKey(d);
          const inMonth = d.getMonth() === month.getMonth();
          return (
            <button key={k} onClick={() => onPick(d)} className="flex flex-col items-center py-0.5">
              <span
                className={`flex h-8 w-8 items-center justify-center rounded-full text-[13px] tabular-nums ${
                  k === todayKey
                    ? "bg-brand-500 font-semibold text-white"
                    : k === cursorKey
                      ? "bg-brand-100 font-semibold text-brand-700"
                      : inMonth
                        ? "text-ink"
                        : "text-muted/40"
                }`}
              >
                {d.getDate()}
              </span>
              <span className={`h-1 w-1 rounded-full ${withEvents.has(k) && inMonth ? "bg-brand-400" : ""}`} />
            </button>
          );
        })}
      </div>
    </div>
  );
}
