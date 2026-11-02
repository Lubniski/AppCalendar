"use client";

import { Bell, Check, ChevronRight, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { uid } from "@/lib/store";
import { REMINDER_OPTIONS, autoReminders, intensity, reminderCount } from "@/lib/reminders";
import { DIFFICULTY_LABELS, PRIORITY_LABELS, type Level, type Tag } from "@/lib/types";
import { Field, LevelBars, LevelPicker, Sheet, inputCls, primaryBtn } from "./Sheet";

const PALETTE = ["#cf5682", "#e79cb4", "#b5838d", "#8e6a9e", "#5b5f97", "#7c8db5", "#6f9e8f", "#c97b63", "#d9a441", "#7a6f73"];

type Props = {
  tags: Tag[];
  onSave: (t: Tag) => void;
  onDelete: (id: string) => void;
  onClose: () => void;
};

export function TagSheet({ tags, onSave, onDelete, onClose }: Props) {
  const [editing, setEditing] = useState<Tag | null>(null);

  if (editing) {
    return <TagForm tag={editing} onCancel={() => setEditing(null)} onSave={(t) => { onSave(t); setEditing(null); }} />;
  }

  return (
    <Sheet title="Etiquetas" onClose={onClose}>
      <ul className="mb-5 divide-y divide-line overflow-hidden rounded-xl border border-line">
        {tags.map((t) => (
          <li key={t.id} className="flex items-center gap-3 bg-surface px-3.5 py-3">
            <span className="h-8 w-8 shrink-0 rounded-lg" style={{ background: t.color }} />
            <button className="flex min-w-0 flex-1 items-center gap-2 text-left" onClick={() => setEditing(t)}>
              <span className="min-w-0 flex-1">
                <span className="block truncate font-medium">{t.name}</span>
                <span className="flex items-center gap-3 text-xs text-muted">
                  <span className="flex items-center gap-1.5">
                    <LevelBars level={t.priority} color={t.color} /> {PRIORITY_LABELS[t.priority]}
                  </span>
                  <span>·</span>
                  <span>{DIFFICULTY_LABELS[t.difficulty]}</span>
                  <span>·</span>
                  <span className="flex items-center gap-1"><Bell size={11} />{reminderCount(t)}</span>
                </span>
              </span>
              <ChevronRight size={16} className="text-muted" />
            </button>
            <button onClick={() => onDelete(t.id)} aria-label={`Eliminar ${t.name}`} className="flex h-8 w-8 items-center justify-center rounded-lg text-muted active:bg-bg">
              <Trash2 size={16} />
            </button>
          </li>
        ))}
      </ul>
      <button
        onClick={() => setEditing({ id: "", name: "", color: PALETTE[0], priority: 2, difficulty: 2 })}
        className={`${primaryBtn} mb-2 flex items-center justify-center gap-2`}
      >
        <Plus size={18} /> Nueva etiqueta
      </button>
    </Sheet>
  );
}

function TagForm({ tag, onSave, onCancel }: { tag: Tag; onSave: (t: Tag) => void; onCancel: () => void }) {
  const [t, setT] = useState<Tag>(tag);
  const set = <K extends keyof Tag>(k: K, v: Tag[K]) => setT((p) => ({ ...p, [k]: v }));
  const level = intensity(t);
  const mode = level >= 7 ? "Intenso, incluye alerta de derretimiento" : level >= 5 ? "Frecuente" : "Moderado";
  const custom = t.reminders !== undefined;
  const count = reminderCount(t);

  const toggleReminder = (before: number) => {
    const current = t.reminders ?? [];
    set("reminders", current.includes(before) ? current.filter((b) => b !== before) : [...current, before]);
  };

  return (
    <Sheet title={tag.id ? "Editar etiqueta" : "Nueva etiqueta"} onClose={onCancel}>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (!t.name.trim()) return;
          onSave({ ...t, id: t.id || uid(), name: t.name.trim() });
        }}
      >
        <Field label="Nombre">
          <div className="flex items-center gap-3">
            <span className="h-11 w-11 shrink-0 rounded-xl" style={{ background: t.color }} />
            <input className={inputCls} value={t.name} onChange={(e) => set("name", e.target.value)} placeholder="Ej. Facultad" autoFocus />
          </div>
        </Field>
        <Field label="Color">
          <div className="flex flex-wrap items-center gap-2.5">
            {PALETTE.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => set("color", c)}
                aria-label={c}
                className={`h-8 w-8 rounded-full transition ${t.color === c ? "ring-2 ring-offset-2" : ""}`}
                style={{ background: c, ["--tw-ring-color" as string]: c }}
              />
            ))}
            <label className="relative flex h-8 w-8 cursor-pointer items-center justify-center rounded-full border border-dashed border-line text-muted">
              <Plus size={14} />
              <input type="color" value={t.color} onChange={(e) => set("color", e.target.value)} className="absolute inset-0 opacity-0" aria-label="Color personalizado" />
            </label>
          </div>
        </Field>
        <Field label="Prioridad">
          <LevelPicker<Level> value={t.priority} labels={PRIORITY_LABELS} onChange={(v) => set("priority", v)} />
        </Field>
        <Field label="Dificultad">
          <LevelPicker<Level> value={t.difficulty} labels={DIFFICULTY_LABELS} onChange={(v) => set("difficulty", v)} />
        </Field>
        <Field label="Recordatorios">
          <div className="mb-3 grid grid-cols-2 gap-1 rounded-xl bg-bg p-1">
            {[
              { value: false, label: "Automático" },
              { value: true, label: "Elegir yo" },
            ].map((o) => (
              <button
                key={o.label}
                type="button"
                // Start from what automatic would give, so it's easy to tweak.
                onClick={() => set("reminders", o.value ? t.reminders ?? autoReminders(t) : undefined)}
                className={`rounded-lg py-2 text-[13px] font-medium transition ${
                  custom === o.value ? "bg-surface text-brand-600 shadow-sm ring-1 ring-line" : "text-muted"
                }`}
              >
                {o.label}
              </button>
            ))}
          </div>

          <div className="mb-3 flex items-start gap-2.5 rounded-xl bg-brand-50 px-3.5 py-3 text-sm text-brand-700">
            <Bell size={16} className="mt-0.5 shrink-0" />
            <span>
              {count === 0 ? (
                <b className="font-semibold">Sin recordatorios</b>
              ) : (
                <>
                  <b className="font-semibold">{count} {count === 1 ? "recordatorio" : "recordatorios"}</b> por evento
                </>
              )}
              {custom ? " · elegidos por vos" : ` · ${mode}, según prioridad y dificultad`}
            </span>
          </div>

          {custom && (
            <>
              <p className="mb-2 text-xs text-muted">Tocá cuándo querés que te avise antes de cada evento:</p>
              <div className="grid grid-cols-3 gap-1.5">
                {REMINDER_OPTIONS.map((o) => {
                  const on = t.reminders?.includes(o.before) ?? false;
                  return (
                    <button
                      key={o.before}
                      type="button"
                      aria-pressed={on}
                      onClick={() => toggleReminder(o.before)}
                      className={`flex items-center justify-center gap-1 rounded-lg border px-1 py-2 text-[13px] font-medium transition ${
                        on ? "border-brand-500 bg-brand-500 text-white" : "border-line text-ink active:bg-bg"
                      }`}
                    >
                      {on && <Check size={13} strokeWidth={3} />}
                      {o.short}
                    </button>
                  );
                })}
              </div>
            </>
          )}
        </Field>
        <button className={`${primaryBtn} mb-2`}>Guardar etiqueta</button>
      </form>
    </Sheet>
  );
}
