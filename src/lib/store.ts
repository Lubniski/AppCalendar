"use client";

import { useCallback, useEffect, useState } from "react";
import type { ViewMode } from "./dates";
import type { SyncDoc } from "./sync";
import type { Profile } from "./theme";
import type { CalendarEvent, Tag } from "./types";

const KEYS = {
  tags: "romiorg.tags",
  events: "romiorg.events",
  deleted: "romiorg.deleted",
  fired: "romiorg.fired",
  hidden: "romiorg.hiddenTags",
  view: "romiorg.view",
  profile: "romiorg.profile",
  owner: "romiorg.owner",
};

export const DEFAULT_TAGS: Tag[] = [
  { id: "facu", name: "Facultad", color: "#cf5682", priority: 3, difficulty: 4 },
  { id: "trabajo", name: "Trabajo", color: "#8e6a9e", priority: 3, difficulty: 2 },
  { id: "salud", name: "Salud", color: "#c97b63", priority: 4, difficulty: 1 },
  { id: "plan", name: "Personal", color: "#e79cb4", priority: 1, difficulty: 1 },
];

function read<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function write(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {}
}

export function uid() {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
}

const upsert = <T extends { id: string }>(list: T[], item: T) =>
  list.some((p) => p.id === item.id) ? list.map((p) => (p.id === item.id ? item : p)) : [...list, item];

export function useRomiStore() {
  // The app renders client-only, so localStorage is available on first render.
  const [tags, setTags] = useState<Tag[]>(() => read(KEYS.tags, DEFAULT_TAGS));
  const [events, setEvents] = useState<CalendarEvent[]>(() => read(KEYS.events, []));
  const [deleted, setDeleted] = useState<Record<string, number>>(() => read(KEYS.deleted, {}));
  const [hidden, setHidden] = useState<string[]>(() => read(KEYS.hidden, []));
  const [view, setView] = useState<ViewMode>(() => read(KEYS.view, "month"));
  const [profile, setProfileState] = useState<Profile | null>(() => read<Profile | null>(KEYS.profile, null));
  // The account whose data is on this device (null until the first sign-in).
  const [owner, setOwner] = useState<string | null>(() => read<string | null>(KEYS.owner, null));
  const ready = true;

  useEffect(() => write(KEYS.tags, tags), [tags]);
  useEffect(() => write(KEYS.events, events), [events]);
  useEffect(() => write(KEYS.deleted, deleted), [deleted]);
  useEffect(() => write(KEYS.hidden, hidden), [hidden]);
  useEffect(() => write(KEYS.view, view), [view]);
  useEffect(() => write(KEYS.owner, owner), [owner]);
  useEffect(() => {
    if (profile) write(KEYS.profile, profile);
  }, [profile]);

  const toggleTag = useCallback((id: string) => {
    setHidden((prev) => (prev.includes(id) ? prev.filter((h) => h !== id) : [...prev, id]));
  }, []);

  const saveEvent = useCallback((e: CalendarEvent) => {
    setEvents((prev) => upsert(prev, { ...e, updatedAt: Date.now() }));
  }, []);

  const deleteEvent = useCallback((id: string) => {
    setEvents((prev) => prev.filter((p) => p.id !== id));
    setDeleted((prev) => ({ ...prev, [`e:${id}`]: Date.now() }));
  }, []);

  const saveTag = useCallback((t: Tag) => {
    setTags((prev) => upsert(prev, { ...t, updatedAt: Date.now() }));
  }, []);

  const deleteTag = useCallback((id: string) => {
    setTags((prev) => prev.filter((p) => p.id !== id));
    setDeleted((prev) => ({ ...prev, [`t:${id}`]: Date.now() }));
  }, []);

  const setProfile = useCallback((p: Profile) => setProfileState({ ...p, updatedAt: Date.now() }), []);

  const doc: SyncDoc = { events, tags, deleted, profile };

  /** Replace local data with a merged copy coming from the server. */
  const applyDoc = useCallback((d: SyncDoc) => {
    setEvents(d.events);
    setTags(d.tags);
    setDeleted(d.deleted);
    if (d.profile) setProfileState(d.profile);
  }, []);

  /** Forget this device's calendar (signing out, or another account signing in). */
  const resetLocal = useCallback(() => {
    setEvents([]);
    setTags(DEFAULT_TAGS);
    setDeleted({});
    setHidden([]);
    setProfileState(null);
    try {
      localStorage.removeItem(KEYS.profile);
      localStorage.removeItem(KEYS.fired);
    } catch {}
  }, []);

  return {
    tags, events, hidden, view, profile, owner, doc, ready,
    setProfile, setView, setOwner, applyDoc, resetLocal, toggleTag, saveEvent, deleteEvent, saveTag, deleteTag,
  };
}

export function loadFired(): Set<string> {
  return new Set(read<string[]>(KEYS.fired, []));
}

export function saveFired(fired: Set<string>) {
  // keep it bounded
  write(KEYS.fired, [...fired].slice(-500));
}
