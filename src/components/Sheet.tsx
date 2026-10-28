"use client";

import { X } from "lucide-react";
import type { ReactNode } from "react";

export function Sheet({ title, onClose, children }: { title: string; onClose: () => void; children: ReactNode }) {
  return (
    <div className="anim-fade fixed inset-0 z-40 flex items-end justify-center bg-ink/25" onClick={onClose}>
      <div
        className="anim-sheet safe-bottom max-h-[92vh] w-full max-w-md overflow-y-auto rounded-t-2xl bg-surface px-5 pt-2.5"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-line" />
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-lg font-semibold tracking-tight">{title}</h2>
          <button onClick={onClose} aria-label="Cerrar" className="flex h-8 w-8 items-center justify-center rounded-full bg-bg text-muted">
            <X size={16} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

export function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="mb-5">
      <span className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-muted">{label}</span>
      {children}
    </div>
  );
}

export const inputCls =
  "w-full rounded-xl border border-line bg-surface px-3.5 py-2.5 text-[15px] outline-none transition placeholder:text-muted/60 focus:border-brand-400 focus:ring-3 focus:ring-brand-100";

export const primaryBtn =
  "w-full rounded-xl bg-brand-500 py-3 text-[15px] font-semibold text-white transition active:bg-brand-600";

export const secondaryBtn =
  "w-full rounded-xl border border-line bg-surface py-3 text-[15px] font-medium text-ink transition active:bg-bg";

export function LevelPicker<T extends number>({
  value,
  labels,
  onChange,
}: {
  value: T;
  labels: Record<T, string>;
  onChange: (v: T) => void;
}) {
  const entries = Object.entries(labels) as [string, string][];
  return (
    <div className="grid grid-cols-4 gap-1 rounded-xl bg-bg p-1">
      {entries.map(([k, label]) => {
        const n = Number(k) as T;
        const active = n === value;
        return (
          <button
            key={k}
            type="button"
            onClick={() => onChange(n)}
            className={`rounded-lg px-1 py-2 text-[13px] font-medium transition ${
              active ? "bg-surface text-brand-600 shadow-sm ring-1 ring-line" : "text-muted"
            }`}
          >
            {label}
          </button>
        );
      })}
    </div>
  );
}

/** Small level indicator: four bars, filled up to `level`. */
export function LevelBars({ level, color }: { level: number; color: string }) {
  return (
    <span className="inline-flex items-end gap-[2px]" aria-hidden>
      {[1, 2, 3, 4].map((i) => (
        <span
          key={i}
          className="w-[3px] rounded-full"
          style={{ height: 4 + i * 2, background: i <= level ? color : "var(--line)" }}
        />
      ))}
    </span>
  );
}
