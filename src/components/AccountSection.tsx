"use client";

import { Cloud, CloudOff, LogOut, RefreshCw } from "lucide-react";
import type { SyncStatus } from "@/lib/useCloudSync";
import { secondaryBtn } from "./Sheet";

function statusText(status: SyncStatus, lastSynced: number | null) {
  if (status === "offline") return "Sin conexión. Tus cambios se guardan cuando vuelva internet.";
  if (status === "syncing") return "Guardando…";
  if (status === "error") return "No se pudo guardar. Se reintenta solo.";
  if (lastSynced) return "Todo guardado en tu cuenta.";
  return "Esperando para guardar…";
}

type Props = {
  email: string | null;
  status: SyncStatus;
  lastSynced: number | null;
  onSyncNow: () => void;
  onSignOut: () => void;
};

export function AccountSection({ email, status, lastSynced, onSyncNow, onSignOut }: Props) {
  const ok = status === "synced" || (status === "idle" && lastSynced);
  return (
    <div className="mb-6 rounded-xl border border-line p-3.5">
      {email && (
        <p className="mb-3 text-sm">
          <span className="text-muted">Sesión iniciada como</span> <span className="font-medium">{email}</span>
        </p>
      )}
      <div className="mb-3 flex items-center gap-2.5 text-sm">
        {status === "offline" ? (
          <CloudOff size={18} className="shrink-0 text-muted" />
        ) : (
          <Cloud size={18} className={`shrink-0 ${ok ? "text-emerald-600" : "text-muted"}`} />
        )}
        <span className="flex-1 text-muted">{statusText(status, lastSynced)}</span>
        <button onClick={onSyncNow} aria-label="Sincronizar ahora" className="flex h-8 w-8 items-center justify-center rounded-lg text-muted active:bg-bg">
          <RefreshCw size={16} className={status === "syncing" ? "animate-spin" : ""} />
        </button>
      </div>
      <p className="mb-3 text-xs leading-relaxed text-muted">
        Tus eventos, etiquetas, nombre y color quedan guardados en tu cuenta. Iniciá sesión en otro dispositivo para ver el mismo calendario.
      </p>
      <button onClick={onSignOut} className={`${secondaryBtn} flex items-center justify-center gap-2`}>
        <LogOut size={16} /> Cerrar sesión
      </button>
    </div>
  );
}
