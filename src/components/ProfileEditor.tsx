"use client";

import { Check, Plus } from "lucide-react";
import { COLOR_PRESETS, appName, iconGradient, initialOf, safeColor, type Profile } from "@/lib/theme";
import { inputCls } from "./Sheet";

/** The home-screen icon as it will look: initial in script on the chosen color. */
export function AppIconPreview({ profile, size = 64 }: { profile: Profile; size?: number }) {
  return (
    <span
      className="flex shrink-0 items-center justify-center font-script text-white shadow-md"
      style={{
        width: size,
        height: size,
        borderRadius: size * 0.225,
        background: iconGradient(profile.color),
        fontSize: size * 0.6,
        paddingTop: size * 0.04,
        lineHeight: 1,
      }}
    >
      {initialOf(profile.name)}
    </span>
  );
}

export function Wordmark({ profile, className = "" }: { profile: Profile | null; className?: string }) {
  const name = appName(profile);
  return (
    <span className={`font-display font-semibold tracking-tight ${className}`}>
      {name.slice(0, -3)}
      <span className="text-brand-500">Org</span>
    </span>
  );
}

type Props = { profile: Profile; onChange: (p: Profile) => void; autoFocus?: boolean };

export function ProfileEditor({ profile, onChange, autoFocus }: Props) {
  const color = safeColor(profile.color);
  const custom = !COLOR_PRESETS.some((p) => p.color === color);

  return (
    <div>
      <div className="mb-5 flex items-center gap-4 rounded-2xl bg-brand-50 p-4">
        <AppIconPreview profile={profile} />
        <div className="min-w-0">
          <Wordmark profile={profile} className="block truncate text-2xl" />
          <span className="text-xs text-muted">Así se va a ver tu app</span>
        </div>
      </div>

      <label className="mb-5 block">
        <span className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-muted">Tu nombre</span>
        <input
          className={inputCls}
          value={profile.name}
          maxLength={20}
          autoFocus={autoFocus}
          autoComplete="given-name"
          placeholder="Ej. Romi"
          onChange={(e) => onChange({ ...profile, name: e.target.value })}
        />
      </label>

      <span className="mb-2 block text-xs font-medium uppercase tracking-wider text-muted">Color de la app</span>
      <div className="grid grid-cols-6 gap-3">
        {COLOR_PRESETS.map((p) => {
          const active = p.color === color;
          return (
            <button
              key={p.color}
              type="button"
              onClick={() => onChange({ ...profile, color: p.color })}
              aria-label={p.name}
              aria-pressed={active}
              className="flex aspect-square items-center justify-center rounded-full transition"
              style={{ background: p.color, boxShadow: active ? `0 0 0 3px var(--surface), 0 0 0 5px ${p.color}` : undefined }}
            >
              {active && <Check size={18} strokeWidth={3} className="text-white" />}
            </button>
          );
        })}
        <label
          className="relative flex aspect-square cursor-pointer items-center justify-center rounded-full border-2 border-dashed border-line text-muted"
          style={custom ? { background: color, borderStyle: "solid", borderColor: color, color: "#fff" } : undefined}
          aria-label="Otro color"
        >
          {custom ? <Check size={18} strokeWidth={3} /> : <Plus size={18} />}
          <input
            type="color"
            value={color}
            onChange={(e) => onChange({ ...profile, color: e.target.value })}
            className="absolute inset-0 cursor-pointer opacity-0"
          />
        </label>
      </div>
    </div>
  );
}
