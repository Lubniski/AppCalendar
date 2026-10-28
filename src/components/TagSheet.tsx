"use client";

import { Bell, ChevronRight, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { uid } from "@/lib/store";
import { intensity, reminderCount } from "@/lib/reminders";
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
        <div className="mb-5 flex items-start gap-2.5 rounded-xl bg-brand-50 px-3.5 py-3 text-sm text-brand-700">
          <Bell size={16} className="mt-0.5 shrink-0" />
          <span>
            <b className="font-semibold">{reminderCount(t)} recordatorios</b> por evento · {mode}
          </span>
        </div>
        <button className={`${primaryBtn} mb-2`}>Guardar etiqueta</button>
      </form>
    </Sheet>
  );
}
