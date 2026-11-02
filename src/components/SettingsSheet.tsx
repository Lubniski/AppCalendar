"use client";

import { AlertTriangle, Bell, ChevronRight, Clock, Droplet, Share, type LucideIcon } from "lucide-react";
import { useState } from "react";
import { pushEnabled, pushSupported } from "@/lib/push";
import type { CalendarEvent, NotifStyle, Tag } from "@/lib/types";
import { DEFAULT_COLOR, appName, type Profile } from "@/lib/theme";
import type { ActiveNotif } from "./NotificationLayer";
import { AppIconPreview, ProfileEditor } from "./ProfileEditor";
import { Sheet, primaryBtn } from "./Sheet";

const DEMOS: { style: NotifStyle; name: string; desc: string; label: string; Icon: LucideIcon }[] = [
  { style: "cute", name: "Recordatorio", desc: "Con tiempo de sobra", label: "en 3 días", Icon: Bell },
  { style: "heads-up", name: "Se acerca", desc: "Falta un día o menos", label: "mañana", Icon: Clock },
  { style: "urgent", name: "Urgente", desc: "Menos de una hora, o prioridad urgente", label: "en 15 minutos", Icon: AlertTriangle },
  { style: "melt", name: "Derretimiento", desc: "Dificultad máxima y está por empezar", label: "en 15 minutos", Icon: Droplet },
];

let demoCount = 0;

function demoEvent(tagId: string): CalendarEvent {
  const d = new Date(Date.now() + 15 * 60_000);
  const pad = (n: number) => String(n).padStart(2, "0");
  const date = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  return { id: "demo", title: "Parcial de Anatomía", date, notes: "", tagId, done: false };
}

type Props = {
  sync: React.ReactNode;
  profile: Profile | null;
  onProfile: (p: Profile) => void;
  tags: Tag[];
  onPreview: (n: ActiveNotif) => void;
  onEnablePush: () => Promise<void>;
  onClose: () => void;
};

export function SettingsSheet({ sync, profile, onProfile, tags, onPreview, onEnablePush, onClose }: Props) {
  const [perm, setPerm] = useState<NotificationPermission | "unsupported">(() =>
    typeof Notification === "undefined" ? "unsupported" : Notification.permission,
  );
  const [standalone] = useState(
    () =>
      window.matchMedia("(display-mode: standalone)").matches ||
      (navigator as Navigator & { standalone?: boolean }).standalone === true,
  );

  const [pushOn, setPushOn] = useState(pushEnabled);
  const [pushError, setPushError] = useState(false);

  async function enable() {
    if (typeof Notification === "undefined") return;
    const result = await Notification.requestPermission();
    setPerm(result);
    if (result === "granted") await connectPush();
  }

  async function connectPush() {
    setPushError(false);
    try {
      await onEnablePush();
      setPushOn(true);
    } catch {
      setPushError(true);
    }
  }

  function demo(style: NotifStyle, label: string) {
    const tag = style === "melt" ? tags.find((t) => t.difficulty === 4) ?? tags[0] : tags[0];
    onPreview({ key: `demo-${style}-${++demoCount}`, style, label, event: demoEvent(tag?.id ?? ""), tag });
    onClose();
  }

  const status = {
    granted: pushOn ? "Activadas. Te llegan aunque la app esté cerrada." : "Permitidas, pero falta conectar este dispositivo.",
    denied: `Bloqueadas. Activalas en Ajustes del iPhone → Notificaciones → ${appName(profile)}.`,
    default: "Todavía no están activadas.",
    unsupported: "No disponibles en este navegador. En iPhone, primero instalá la app.",
  }[perm];

  return (
    <Sheet title="Ajustes" onClose={onClose}>
      {!standalone && (
        <div className="mb-5 rounded-xl border border-line p-3.5 text-sm">
          <div className="mb-3 flex items-center gap-3">
            <AppIconPreview profile={profile ?? { name: "", color: DEFAULT_COLOR }} size={52} />
            <p className="leading-snug text-muted">
              Se va a guardar en tu pantalla de inicio como
              <span className="block text-base font-semibold text-ink">{appName(profile)}</span>
            </p>
          </div>
          <p className="flex gap-2 leading-relaxed text-muted">
            <Share size={16} className="mt-0.5 shrink-0 text-brand-500" />
            <span>
              En Safari tocá <b className="font-medium text-ink">Compartir</b> → <b className="font-medium text-ink">Agregar a pantalla de inicio</b>. Es necesario para recibir notificaciones.
            </span>
          </p>
        </div>
      )}

      <h3 className="mb-3 text-xs font-medium uppercase tracking-wider text-muted">Personalización</h3>
      <div className="mb-6">
        <ProfileEditor profile={profile ?? { name: "", color: DEFAULT_COLOR }} onChange={onProfile} />
        <p className="mt-3 text-xs leading-relaxed text-muted">
          {standalone
            ? "Los cambios se ven al toque dentro de la app. Para que cambie el nombre y el ícono de la pantalla de inicio, borrala y volvé a agregarla desde Safari (tus datos quedan en tu cuenta)."
            : "El nombre y el ícono se toman al agregarla a la pantalla de inicio. Si después los cambiás, borrala y volvé a agregarla."}
        </p>
      </div>

      <h3 className="mb-2 text-xs font-medium uppercase tracking-wider text-muted">Tu cuenta</h3>
      {sync}

      <h3 className="mb-2 text-xs font-medium uppercase tracking-wider text-muted">Notificaciones</h3>
      <div className="mb-6 rounded-xl border border-line p-3.5">
        <div className="flex items-center justify-between gap-3">
          <p className="text-sm text-muted">{status}</p>
          {perm === "granted" && pushOn && <span className="h-2 w-2 shrink-0 rounded-full bg-emerald-500" />}
        </div>
        {perm === "default" && (
          <button onClick={enable} className={`${primaryBtn} mt-3`}>
            Activar notificaciones
          </button>
        )}
        {perm === "granted" && !pushOn && pushSupported() && (
          <button onClick={connectPush} className={`${primaryBtn} mt-3`}>
            Conectar este dispositivo
          </button>
        )}
        {pushError && <p className="mt-2 text-sm text-brand-700">No se pudo conectar. Revisá tu conexión e intentá de nuevo.</p>}
      </div>

      <h3 className="mb-2 text-xs font-medium uppercase tracking-wider text-muted">Vista previa de alertas</h3>
      <ul className="mb-4 divide-y divide-line overflow-hidden rounded-xl border border-line">
        {DEMOS.map(({ style, name, desc, label, Icon }) => (
          <li key={style}>
            <button onClick={() => demo(style, label)} className="flex w-full items-center gap-3 px-3.5 py-3 text-left active:bg-bg">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-brand-500">
                <Icon size={17} />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-[15px] font-medium">{name}</span>
                <span className="block text-xs text-muted">{desc}</span>
              </span>
              <ChevronRight size={16} className="text-muted" />
            </button>
          </li>
        ))}
      </ul>
    </Sheet>
  );
}
