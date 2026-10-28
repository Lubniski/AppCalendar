"use client";

import { AlignLeft, Bell, Check, Clock, Plus, Tag as TagIcon, Trash2, X } from "lucide-react";
import { useState } from "react";
import { DEFAULT_DURATION, hhmm, toMinutes } from "@/lib/dates";
import { remindersFor } from "@/lib/reminders";
import { uid } from "@/lib/store";
import { DIFFICULTY_LABELS, PRIORITY_LABELS, type CalendarEvent, type Tag } from "@/lib/types";

type Props = {
  initial: CalendarEvent | null;
  defaultDay: string;
  defaultTime?: string;
  tags: Tag[];
  onSave: (e: CalendarEvent) => void;
  onDelete: (id: string) => void;
  onClose: () => void;
  onManageTags: () => void;
};

const row = "flex gap-4 border-b border-line px-5 py-4";
const fieldCls = "rounded-lg bg-bg px-3 py-2 text-[15px] outline-none focus:ring-2 focus:ring-brand-200";

export function EventSheet({ initial, defaultDay, defaultTime, tags, onSave, onDelete, onClose, onManageTags }: Props) {
  const startInit = initial?.date.slice(11, 16) ?? defaultTime ?? "10:00";
  const [title, setTitle] = useState(initial?.title ?? "");
  const [day, setDay] = useState(initial?.date.slice(0, 10) ?? defaultDay);
  const [start, setStart] = useState(startInit);
  const [end, setEnd] = useState(hhmm(toMinutes(startInit) + (initial?.duration ?? DEFAULT_DURATION)));
  const [notes, setNotes] = useState(initial?.notes ?? "");
  const [tagId, setTagId] = useState(initial?.tagId ?? tags[0]?.id ?? "");

  const tag = tags.find((t) => t.id === tagId);
  const span = toMinutes(end) - toMinutes(start);
  const draft: CalendarEvent = {
    id: initial?.id ?? "draft",
    title,
    date: `${day}T${start}`,
    duration: span > 0 ? span : DEFAULT_DURATION,
    notes,
    tagId,
    done: initial?.done ?? false,
  };
  const reminderCount = remindersFor(draft, tag).length;

  function changeStart(v: string) {
    // keep the same length when moving the start, like Google Calendar
    const len = span > 0 ? span : DEFAULT_DURATION;
    setStart(v);
    setEnd(hhmm(Math.min(toMinutes(v) + len, 1439)));
  }

  function submit(ev: React.FormEvent) {
    ev.preventDefault();
    if (!title.trim()) return;
    onSave({ ...draft, id: initial?.id ?? uid(), title: title.trim() });
    onClose();
  }

  return (
    <div className="anim-sheet fixed inset-0 z-40 flex justify-center bg-surface">
      <form onSubmit={submit} className="safe-top safe-bottom flex w-full max-w-md flex-col overflow-y-auto">
        <div className="flex items-center justify-between px-2 py-1">
          <button type="button" onClick={onClose} aria-label="Cerrar" className="flex h-11 w-11 items-center justify-center rounded-full active:bg-bg">
            <X size={22} />
          </button>
          <button className="rounded-full bg-brand-500 px-6 py-2 text-sm font-semibold text-white active:bg-brand-600 disabled:opacity-40" disabled={!title.trim()}>
            Guardar
          </button>
        </div>

        <div className="border-b border-line py-3 pl-[60px] pr-5">
          <input
            className="w-full bg-transparent text-2xl outline-none placeholder:text-muted/60"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Agregar título"
            autoFocus={!initial}
          />
        </div>

        <div className={row}>
          <Clock size={20} className="mt-2 shrink-0 text-muted" />
          <div className="flex flex-1 flex-col gap-2">
            <input type="date" className={fieldCls} value={day} onChange={(e) => setDay(e.target.value)} required />
            <div className="flex items-center gap-2">
              <input type="time" className={`${fieldCls} flex-1`} value={start} onChange={(e) => changeStart(e.target.value)} required />
              <span className="text-muted">–</span>
              <input type="time" className={`${fieldCls} flex-1`} value={end} onChange={(e) => setEnd(e.target.value)} required />
            </div>
          </div>
        </div>

        <div className={row}>
          <TagIcon size={20} className="mt-1.5 shrink-0 text-muted" />
          <div className="flex flex-1 flex-wrap gap-2">
            {tags.map((t) => {
              const active = t.id === tagId;
              return (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setTagId(t.id)}
                  className="flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm transition"
                  style={active ? { borderColor: t.color, background: t.color, color: "#fff" } : { borderColor: "var(--line)" }}
                >
                  {active ? <Check size={14} strokeWidth={3} /> : <span className="h-2.5 w-2.5 rounded-full" style={{ background: t.color }} />}
                  {t.name}
                </button>
              );
            })}
            <button type="button" onClick={onManageTags} className="flex items-center gap-1 rounded-full border border-dashed border-line px-3 py-1.5 text-sm text-muted">
              <Plus size={14} /> Nueva
            </button>
          </div>
        </div>

        <div className={row}>
          <Bell size={20} className="mt-0.5 shrink-0 text-muted" />
          <div className="text-[15px]">
            <p>{reminderCount} recordatorios</p>
            {tag && (
              <p className="text-sm text-muted">
                Prioridad {PRIORITY_LABELS[tag.priority].toLowerCase()} · {DIFFICULTY_LABELS[tag.difficulty].toLowerCase()}
              </p>
            )}
          </div>
        </div>

        <div className={row}>
          <AlignLeft size={20} className="mt-0.5 shrink-0 text-muted" />
          <textarea
            className="min-h-24 flex-1 resize-none bg-transparent text-[15px] outline-none placeholder:text-muted/60"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Agregar descripción"
          />
        </div>

        {initial && (
          <div className="flex gap-2 px-5 py-5">
            <button
              type="button"
              onClick={() => { onSave({ ...initial, done: !initial.done }); onClose(); }}
              className="flex flex-1 items-center justify-center gap-2 rounded-full border border-line py-2.5 text-sm font-medium active:bg-bg"
            >
              <Check size={16} /> {initial.done ? "Marcar pendiente" : "Marcar hecho"}
            </button>
            <button
              type="button"
              onClick={() => { onDelete(initial.id); onClose(); }}
              className="flex flex-1 items-center justify-center gap-2 rounded-full border border-line py-2.5 text-sm font-medium text-brand-700 active:bg-bg"
            >
              <Trash2 size={16} /> Eliminar
            </button>
          </div>
        )}
      </form>
    </div>
  );
}
