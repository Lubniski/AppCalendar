/** Personalization: the user's name ("<Name>Org") and the app's main color. */

export type Profile = { name: string; color: string; updatedAt?: number };

export const DEFAULT_COLOR = "#cf5682";
export const DEFAULT_NAME = "Mi";

export const COLOR_PRESETS: { name: string; color: string }[] = [
  { name: "Rosa", color: "#cf5682" },
  { name: "Frambuesa", color: "#b8325f" },
  { name: "Durazno", color: "#dd7b5e" },
  { name: "Mostaza", color: "#c99a2e" },
  { name: "Salvia", color: "#5e9a7f" },
  { name: "Turquesa", color: "#2f9a9a" },
  { name: "Azul", color: "#4a72c4" },
  { name: "Lavanda", color: "#8a6bc4" },
  { name: "Ciruela", color: "#8e4f86" },
  { name: "Grafito", color: "#5d5960" },
];

const HEX_RE = /^#[0-9a-f]{6}$/i;

export function safeColor(c: string | null | undefined) {
  if (!c) return DEFAULT_COLOR;
  const hex = c.startsWith("#") ? c : `#${c}`;
  return HEX_RE.test(hex) ? hex.toLowerCase() : DEFAULT_COLOR;
}

export function cleanName(name: string) {
  const n = name.trim().replace(/\s+/g, " ").slice(0, 20);
  return n ? n.charAt(0).toUpperCase() + n.slice(1) : "";
}

export function displayName(profile: Profile | null) {
  return cleanName(profile?.name ?? "") || DEFAULT_NAME;
}

export function appName(profile: Profile | null) {
  return `${displayName(profile).replace(/\s/g, "")}Org`;
}

export function initialOf(name: string) {
  const first = [...cleanName(name)][0];
  return first && /\p{L}/u.test(first) ? first.toUpperCase() : "R";
}

function rgb(hex: string) {
  const n = parseInt(hex.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

/** Blend `hex` toward `target` by `amount` (0 = hex, 1 = target). */
export function mix(hex: string, target: string, amount: number) {
  const a = rgb(hex);
  const b = rgb(target);
  return `#${a
    .map((v, i) => Math.round(v + (b[i] - v) * amount).toString(16).padStart(2, "0"))
    .join("")}`;
}

/** Full set of CSS variables derived from one color. */
export function themeVars(color: string): Record<string, string> {
  const c = safeColor(color);
  return {
    "--brand-50": mix(c, "#ffffff", 0.93),
    "--brand-100": mix(c, "#ffffff", 0.85),
    "--brand-200": mix(c, "#ffffff", 0.68),
    "--brand-300": mix(c, "#ffffff", 0.45),
    "--brand-400": mix(c, "#ffffff", 0.22),
    "--brand-500": c,
    "--brand-600": mix(c, "#000000", 0.12),
    "--brand-700": mix(c, "#000000", 0.28),
    "--bg": mix(c, "#ffffff", 0.97),
    "--line": mix(c, "#ececec", 0.9),
    "--muted": mix(c, "#7a7a7a", 0.85),
  };
}

export function iconGradient(color: string) {
  const c = safeColor(color);
  return `linear-gradient(160deg, ${mix(c, "#ffffff", 0.2)} 0%, ${c} 55%, ${mix(c, "#000000", 0.12)} 100%)`;
}

/** URL of the home-screen icon for this name and color. */
export function iconUrl(profile: Profile | null, size: number) {
  const c = safeColor(profile?.color).slice(1);
  return `/pwa-icon/${size}?l=${encodeURIComponent(initialOf(profile?.name ?? ""))}&c=${c}`;
}

export function manifestUrl(profile: Profile | null) {
  return `/app-manifest?n=${encodeURIComponent(displayName(profile))}&c=${safeColor(profile?.color).slice(1)}`;
}
