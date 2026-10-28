"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { docKey, mergeDocs, type SyncDoc } from "./sync";

export type SyncStatus = "idle" | "syncing" | "synced" | "offline" | "error";

type Store = {
  doc: SyncDoc;
  applyDoc: (d: SyncDoc) => void;
};

/**
 * Backs the calendar up to the signed-in user's account and pulls in changes
 * made on other devices. Offline-first: the UI always reads local data, and
 * syncing resumes when the connection returns.
 */
export function useCloudSync(store: Store, enabled: boolean, getToken: () => Promise<string | null>) {
  const [status, setStatus] = useState<SyncStatus>("idle");
  const [lastSynced, setLastSynced] = useState<number | null>(null);
  const [online, setOnline] = useState(() => navigator.onLine);
  const latest = useRef({ store, enabled, getToken });
  const inFlight = useRef(false);
  const again = useRef(false);

  useEffect(() => {
    latest.current = { store, enabled, getToken };
  });

  const sync = useCallback(async () => {
    if (!latest.current.enabled) return;
    if (inFlight.current) {
      // A sync is running; run once more when it finishes so no change is missed.
      again.current = true;
      return;
    }
    inFlight.current = true;
    try {
      do {
        again.current = false;
        if (!navigator.onLine) {
          setStatus("offline");
          break;
        }
        setStatus("syncing");
        try {
          const token = await latest.current.getToken();
          const res = await fetch("/api/data/sync", {
            method: "POST",
            headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
            body: JSON.stringify({ doc: latest.current.store.doc }),
          });
          if (!res.ok) throw new Error(`sync failed: ${res.status}`);
          const { doc } = (await res.json()) as { doc: SyncDoc };
          // Merge again with whatever changed locally while the request was out.
          const local = latest.current.store.doc;
          const merged = mergeDocs(doc, local);
          if (docKey(merged) !== docKey(local)) latest.current.store.applyDoc(merged);
          setStatus("synced");
          setLastSynced(Date.now());
        } catch {
          setStatus(navigator.onLine ? "error" : "offline");
          break;
        }
      } while (again.current);
    } finally {
      inFlight.current = false;
    }
  }, []);

  // Sync shortly after any change, on sign-in, when coming back online or to the foreground.
  const key = docKey(store.doc);
  useEffect(() => {
    if (!enabled) return;
    const id = setTimeout(() => void sync(), 1200);
    return () => clearTimeout(id);
  }, [key, enabled, sync]);

  useEffect(() => {
    const goOnline = () => {
      setOnline(true);
      void sync();
    };
    const goOffline = () => {
      setOnline(false);
      setStatus("offline");
    };
    const onVisible = () => document.visibilityState === "visible" && void sync();
    window.addEventListener("online", goOnline);
    window.addEventListener("offline", goOffline);
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      window.removeEventListener("online", goOnline);
      window.removeEventListener("offline", goOffline);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [sync]);

  return { status, lastSynced, online, syncNow: sync };
}
