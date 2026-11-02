"use client";

import { BellRing, Check, Lock, Plus, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import type { TodoItem, TodoPrefs } from "@/lib/todos";
import { LevelPicker } from "./Sheet";

const EVERY_LABELS: Record<TodoPrefs["every"], string> = { 1: "Cada 1 h", 2: "Cada 2 h", 3: "Cada 3 h", 24: "1 por día" };
const HOURS = Array.from({ length: 24 }, (_, h) => h);

type Props = {
  todos: TodoItem[];
  prefs: TodoPrefs;
  pushOn: boolean;
  onAdd: (text: string) => void;
  onEdit: (id: string, text: string) => void;
  onComplete: (id: string) => void;
  onRestore: (item: TodoItem) => void;
  onPrefs: (p: TodoPrefs) => void;
  onOpenSettings: () => void;
  onClose: () => void;
};

export function TodoSheet({ todos, prefs, pushOn, onAdd, onEdit, onComplete, onRestore, onPrefs, onOpenSettings, onClose }: Props) {
  const [draft, setDraft] = useState("");
  const [editing, setEditing] = useState<string | null>(null);
  const [checking, setChecking] = useState<string[]>([]);
  const [undo, setUndo] = useState<TodoItem | null>(null);
  const undoTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(() => () => clearTimeout(undoTimer.current), []);

  function add(e: React.FormEvent) {
    e.preventDefault();
    const text = draft.trim();
    if (!text) return;
    onAdd(text);
    setDraft("");
  }

  function complete(item: TodoItem) {
    // Show the tick for a moment, then the item leaves the list.
    setChecking((c) => [...c, item.id]);
    setTimeout(() => {
      onComplete(item.id);
      setChecking((c) => c.filter((id) => id !== item.id));
      setUndo(item);
      clearTimeout(undoTimer.current);
      undoTimer.current = setTimeout(() => setUndo(null), 4000);
    }, 350);
  }

  const setPrefs = (patch: Partial<TodoPrefs>) => {
    const next = { ...prefs, ...patch };
    onPrefs({ ...next, to: Math.max(next.from, next.to) });
  };

  return (
    <div className="anim-sheet fixed inset-0 z-40 flex justify-center bg-surface">
      <div className="safe-top safe-bottom flex w-full max-w-md flex-col overflow-y-auto">
        <div className="flex items-center gap-2 px-2 py-1">
          <button onClick={onClose} aria-label="Cerrar" className="flex h-11 w-11 items-center justify-center rounded-full active:bg-bg">
            <X size={22} />
          </button>
          <h2 className="flex-1 text-xl font-medium">Cosas para hacer</h2>
          {todos.length > 0 && <span className="mr-3 text-sm text-muted">{todos.length} pendientes</span>}
        </div>

        <form onSubmit={add} className="flex items-center gap-2 border-b border-line px-4 py-3">
          <input
            className="min-w-0 flex-1 rounded-xl bg-bg px-3.5 py-2.5 text-[15px] outline-none placeholder:text-muted/60 focus:ring-2 focus:ring-brand-200"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="Agregar algo para hacer…"
            maxLength={200}
            enterKeyHint="done"
          />
          <button aria-label="Agregar" disabled={!draft.trim()} className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-500 text-white active:bg-brand-600 disabled:opacity-40">
            <Plus size={22} />
          </button>
        </form>

        {todos.length === 0 ? (
          <p className="px-6 py-10 text-center text-muted">No tenés nada pendiente.</p>
        ) : (
          <ul className="divide-y divide-line">
            {todos.map((t) => {
              const done = checking.includes(t.id);
              return (
                <li key={t.id} className={`flex items-center gap-3 px-4 py-2.5 transition-opacity ${done ? "opacity-40" : ""}`}>
                  <button
                    onClick={() => complete(t)}
                    aria-label={`Marcar como hecho: ${t.text}`}
                    disabled={done}
                    className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full border-2 transition ${
                      done ? "border-brand-500 bg-brand-500 text-white" : "border-brand-300 text-transparent active:bg-brand-50"
                    }`}
                  >
                    <Check size={16} strokeWidth={3} />
                  </button>
                  {editing === t.id ? (
                    <input
                      autoFocus
                      defaultValue={t.text}
                      maxLength={200}
                      enterKeyHint="done"
                      className="min-w-0 flex-1 rounded-lg bg-bg px-2 py-1.5 text-[15px] outline-none focus:ring-2 focus:ring-brand-200"
                      onKeyDown={(e) => e.key === "Enter" && e.currentTarget.blur()}
                      onBlur={(e) => {
                        const text = e.currentTarget.value.trim();
                        if (text && text !== t.text) onEdit(t.id, text);
                        setEditing(null);
                      }}
                    />
                  ) : (
                    <button onClick={() => setEditing(t.id)} className={`min-w-0 flex-1 py-1.5 text-left text-[15px] ${done ? "line-through" : ""}`}>
                      {t.text}
                    </button>
                  )}
                </li>
              );
            })}
          </ul>
        )}

        <div className="mt-auto border-t border-line px-4 pb-6 pt-5">
          <div className="mb-3 flex items-center gap-3">
            <Lock size={18} className="shrink-0 text-muted" />
            <span className="flex-1 text-[15px] font-medium">Mostrar en la pantalla bloqueada</span>
            <button
              role="switch"
              aria-checked={prefs.enabled}
              onClick={() => setPrefs({ enabled: !prefs.enabled })}
              className={`relative h-7 w-12 shrink-0 rounded-full transition ${prefs.enabled ? "bg-brand-500" : "bg-line"}`}
            >
              <span className={`absolute top-0.5 h-6 w-6 rounded-full bg-white shadow transition-all ${prefs.enabled ? "left-[22px]" : "left-0.5"}`} />
            </button>
          </div>

          {prefs.enabled && (
            <>
              <LevelPicker<TodoPrefs["every"]> value={prefs.every} labels={EVERY_LABELS} onChange={(every) => setPrefs({ every })} />
              <div className="mt-3 flex items-center gap-2 text-sm text-muted">
                <span>{prefs.every === 24 ? "A las" : "De"}</span>
                <select value={prefs.from} onChange={(e) => setPrefs({ from: Number(e.target.value) })} className="rounded-lg bg-bg px-2 py-1.5 text-ink">
                  {HOURS.map((h) => (
                    <option key={h} value={h}>{String(h).padStart(2, "0")}:00</option>
                  ))}
                </select>
                {prefs.every !== 24 && (
                  <>
                    <span>a</span>
                    <select value={prefs.to} onChange={(e) => setPrefs({ to: Number(e.target.value) })} className="rounded-lg bg-bg px-2 py-1.5 text-ink">
                      {HOURS.filter((h) => h >= prefs.from).map((h) => (
                        <option key={h} value={h}>{String(h).padStart(2, "0")}:00</option>
                      ))}
                    </select>
                  </>
                )}
              </div>
              <p className="mt-3 text-xs leading-relaxed text-muted">
                La lista llega como notificación y reemplaza a la anterior, así siempre hay una sola y vuelve a quedar arriba. También se actualiza cuando salís de la app después de cambiarla. Tocala para abrir la lista y tildar.
              </p>
              {!pushOn && (
                <button onClick={onOpenSettings} className="mt-3 flex w-full items-center gap-2.5 rounded-xl bg-brand-50 px-3.5 py-3 text-left text-sm text-brand-700">
                  <BellRing size={16} className="shrink-0" /> Para verla en la pantalla bloqueada, activá las notificaciones en Ajustes.
                </button>
              )}
            </>
          )}
        </div>
      </div>

      {undo && (
        <div className="anim-fade fixed inset-x-0 bottom-0 z-50 flex justify-center px-4 pb-[max(env(safe-area-inset-bottom),16px)]">
          <div className="flex w-full max-w-md items-center gap-3 rounded-xl bg-ink px-4 py-3 text-sm text-white shadow-lg">
            <span className="min-w-0 flex-1 truncate">Hecho: {undo.text}</span>
            <button
              onClick={() => {
                onRestore(undo);
                setUndo(null);
              }}
              className="font-semibold text-brand-300"
            >
              Deshacer
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
