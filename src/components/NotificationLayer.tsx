"use client";

import { AlertTriangle, Bell, Clock } from "lucide-react";
import type { CalendarEvent, NotifStyle, Tag } from "@/lib/types";

export type ActiveNotif = {
  key: string;
  style: NotifStyle;
  label: string;
  event: CalendarEvent;
  tag?: Tag;
};

type Props = { notif: ActiveNotif | null; onClose: () => void };

export function NotificationLayer({ notif, onClose }: Props) {
  if (!notif) return null;
  switch (notif.style) {
    case "cute":
      return <SoftNotif n={notif} onClose={onClose} />;
    case "heads-up":
      return <HeadsUpNotif n={notif} onClose={onClose} />;
    case "urgent":
      return <UrgentNotif n={notif} onClose={onClose} />;
    case "melt":
      return <MeltNotif n={notif} onClose={onClose} />;
  }
}

type NProps = { n: ActiveNotif; onClose: () => void };

function timeOf(e: CalendarEvent) {
  return new Date(e.date).toLocaleString("es-AR", {
    weekday: "short",
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  });
}

function capitalize(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function SoftNotif({ n, onClose }: NProps) {
  return (
    <div className="fixed inset-x-0 top-0 z-50 safe-top px-3" onClick={onClose}>
      <div className="anim-drop-in mx-auto flex max-w-md items-center gap-3 rounded-2xl border border-line bg-surface/95 p-3.5 shadow-lg shadow-ink/5 backdrop-blur">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-500">
          <Bell size={18} />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-xs text-muted">Recordatorio · {n.tag?.name ?? "General"}</p>
          <p className="truncate font-semibold">{n.event.title}</p>
          <p className="text-sm text-muted">Empieza {n.label} · {timeOf(n.event)}</p>
        </div>
      </div>
    </div>
  );
}

function HeadsUpNotif({ n, onClose }: NProps) {
  const color = n.tag?.color ?? "var(--brand-500)";
  return (
    <div className="fixed inset-x-0 top-0 z-50 safe-top px-3" onClick={onClose}>
      <div
        className="anim-drop-in mx-auto flex max-w-md items-center gap-3 overflow-hidden rounded-2xl border border-line bg-surface p-3.5 shadow-xl shadow-ink/10"
        style={{ borderLeft: `4px solid ${color}` }}
      >
        <span className="anim-ring flex h-10 w-10 shrink-0 items-center justify-center rounded-xl" style={{ background: n.tag ? `${n.tag.color}18` : "var(--brand-50)", color }}>
          <Clock size={18} />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-xs font-medium" style={{ color }}>{capitalize(n.label)}</p>
          <p className="truncate font-semibold">{n.event.title}</p>
          <p className="text-sm text-muted">{timeOf(n.event)} · {n.tag?.name ?? "General"}</p>
        </div>
      </div>
    </div>
  );
}

function UrgentNotif({ n, onClose }: NProps) {
  return (
    <div className="anim-fade fixed inset-0 z-50 flex items-start justify-center bg-ink/30 safe-top px-3 backdrop-blur-sm" onClick={onClose}>
      <div className="anim-drop-in w-full max-w-md">
        <div className="anim-shake rounded-2xl bg-ink p-5 text-white shadow-2xl">
          <div className="flex items-start gap-3">
            <span className="anim-pulse flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-brand-500">
              <AlertTriangle size={20} />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold uppercase tracking-wider text-brand-300">Urgente</p>
              <p className="text-lg font-semibold leading-snug">{n.event.title}</p>
              <p className="text-sm text-white/60">Empieza {n.label} · {timeOf(n.event)}</p>
            </div>
          </div>
          <button className="mt-4 w-full rounded-xl bg-brand-500 py-2.5 font-semibold active:bg-brand-600">Entendido</button>
        </div>
      </div>
    </div>
  );
}

const DRIPS = [
  { left: "6%", w: 16, len: "62vh", dur: "3.4s", delay: "0.6s" },
  { left: "17%", w: 26, len: "78vh", dur: "4.2s", delay: "0.9s" },
  { left: "31%", w: 12, len: "45vh", dur: "3s", delay: "1.3s" },
  { left: "44%", w: 32, len: "85vh", dur: "4.6s", delay: "0.5s" },
  { left: "58%", w: 18, len: "55vh", dur: "3.6s", delay: "1.1s" },
  { left: "69%", w: 24, len: "72vh", dur: "4s", delay: "0.7s" },
  { left: "82%", w: 14, len: "50vh", dur: "3.2s", delay: "1.5s" },
  { left: "91%", w: 20, len: "66vh", dur: "3.8s", delay: "0.8s" },
];

function MeltNotif({ n, onClose }: NProps) {
  const goo = n.tag?.color ?? "var(--brand-500)";
  return (
    <div className="anim-fade fixed inset-0 z-50 overflow-hidden bg-bg/70 backdrop-blur-[2px]" onClick={onClose}>
      <div className="safe-top px-3">
        <div className="relative mx-auto max-w-md">
          <div className="anim-melt-card relative z-10 p-5 text-white shadow-2xl" style={{ background: goo }}>
            <p className="text-xs font-semibold uppercase tracking-wider opacity-80">Alerta de derretimiento 🫠</p>
            <p className="anim-wobble mt-0.5 text-xl font-semibold leading-snug">{n.event.title}</p>
            <p className="mt-1 text-sm opacity-90">
              Es de dificultad máxima y empieza {n.label}. Esta notificación ya no aguanta la presión.
            </p>
          </div>
          {DRIPS.map((d, i) => (
            <span
              key={i}
              className="drip"
              style={
                {
                  left: d.left,
                  background: goo,
                  "--drip-w": `${d.w}px`,
                  "--drip-len": d.len,
                  "--drip-dur": d.dur,
                  "--drip-delay": d.delay,
                } as React.CSSProperties
              }
            />
          ))}
        </div>
      </div>
      <div className="absolute inset-x-0 bottom-0 safe-bottom px-3">
        <div className="anim-puddle mx-auto max-w-md rounded-[50%] px-6 pb-7 pt-12 text-center" style={{ background: goo }}>
          <button className="rounded-xl bg-white px-6 py-2.5 font-semibold active:scale-95" style={{ color: goo }}>
            Ya voy
          </button>
        </div>
      </div>
    </div>
  );
}
