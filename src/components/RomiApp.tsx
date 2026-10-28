"use client";

import { useAuth, useUser } from "@clerk/nextjs";
import { CloudOff, Plus } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Drawer } from "@/components/Drawer";
import { EventSheet } from "@/components/EventSheet";
import { NotificationLayer } from "@/components/NotificationLayer";
import { SettingsSheet } from "@/components/SettingsSheet";
import { TagSheet } from "@/components/TagSheet";
import { TopBar } from "@/components/TopBar";
import { AgendaView } from "@/components/views/AgendaView";
import { MonthView } from "@/components/views/MonthView";
import { TimeGridView } from "@/components/views/TimeGridView";
import { dayKey, shiftCursor, visibleDays } from "@/lib/dates";
import { disablePush, enablePush, syncReminders } from "@/lib/push";
import { useRomiStore } from "@/lib/store";
import type { CalendarEvent } from "@/lib/types";
import { initialOf, type Profile } from "@/lib/theme";
import { useApplyProfile } from "@/lib/useApplyProfile";
import { useCloudSync } from "@/lib/useCloudSync";
import { AccountSection } from "@/components/AccountSection";
import { AuthScreen } from "@/components/AuthScreen";
import { useReminderEngine } from "@/lib/useReminderEngine";
import { Welcome } from "@/components/Welcome";

type Panel =
  | { kind: "event"; event: CalendarEvent | null; day?: string; time?: string }
  | { kind: "tags" }
  | { kind: "settings" }
  | null;

export default function RomiApp() {
  const store = useRomiStore();
  const { isLoaded, isSignedIn, userId, getToken, signOut } = useAuth();
  const { user } = useUser();
  // A different account signed in on this device: drop the previous one's local data first.
  if (isSignedIn && userId && store.owner !== userId) {
    if (store.owner) store.resetLocal();
    store.setOwner(userId);
  }
  const { tags, events, view } = store;
  const [cursor, setCursor] = useState(() => new Date());
  const [drawer, setDrawer] = useState(false);
  const [panel, setPanel] = useState<Panel>(null);
  const engine = useReminderEngine(events, tags, store.ready);
  const [now, setNow] = useState(() => Date.now());
  const touch = useRef<{ x: number; y: number } | null>(null);
  // Live preview while choosing name/color on the welcome screen.
  const [draftProfile, setDraftProfile] = useState<Profile | null>(null);
  useApplyProfile(draftProfile ?? store.profile);
  const cloud = useCloudSync(store, !!isSignedIn, getToken);
  // Before Clerk loads (or when offline), trust the last account that signed in here.
  const signedIn = isLoaded ? !!isSignedIn : !!store.owner;
  // On a new device, wait for the account's data before asking for name and color.
  const firstSyncDone = cloud.lastSynced !== null || cloud.status === "error" || cloud.status === "offline";

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 60_000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js", { scope: "/", updateViaCache: "none" }).catch(() => {});
      // Hand the files this page already loaded to the worker so the app opens offline.
      navigator.serviceWorker.ready.then((reg) => {
        const urls = performance
          .getEntriesByType("resource")
          .map((e) => e.name)
          .filter((u) => u.startsWith(location.origin) && !u.includes("/api/"));
        reg.active?.postMessage({ type: "romiorg:cache", urls: ["/", ...urls] });
      });
    }
  }, []);

  // Keep the server's copy of upcoming reminders in sync (debounced, and again when back online).
  useEffect(() => {
    const run = () => void syncReminders(events, tags).catch(() => {});
    const id = setTimeout(run, 1500);
    window.addEventListener("online", run);
    return () => {
      clearTimeout(id);
      window.removeEventListener("online", run);
    };
  }, [events, tags]);

  async function handleSignOut() {
    setPanel(null);
    await disablePush();
    store.resetLocal();
    store.setOwner(null);
    await signOut();
  }

  if (!signedIn) {
    if (!isLoaded && cloud.online) return <div className="h-dvh bg-bg" />;
    return <AuthScreen color={store.profile?.color} online={cloud.online} />;
  }

  const todayDate = new Date(now);
  const today = dayKey(todayDate);
  const tagById = new Map(tags.map((t) => [t.id, t]));
  const visible = events.filter((e) => !store.hidden.includes(e.tagId));

  const openDay = (d: Date) => {
    setCursor(d);
    store.setView("day");
  };
  const openEvent = (e: CalendarEvent) => setPanel({ kind: "event", event: e });

  // Swipe left/right to move through dates, like Google Calendar.
  const onTouchStart = (e: React.TouchEvent) => {
    touch.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
  };
  const onTouchEnd = (e: React.TouchEvent) => {
    if (!touch.current || view === "agenda") return;
    const dx = e.changedTouches[0].clientX - touch.current.x;
    const dy = e.changedTouches[0].clientY - touch.current.y;
    touch.current = null;
    if (Math.abs(dx) > 60 && Math.abs(dx) > Math.abs(dy) * 1.5) {
      setCursor((c) => shiftCursor(view, c, dx < 0 ? 1 : -1));
    }
  };

  return (
    <main className="mx-auto flex h-dvh w-full max-w-md flex-col overflow-hidden bg-surface">
      <TopBar
        initial={initialOf(store.profile?.name ?? "")}
        cursor={cursor}
        showMonthLink={view !== "month"}
        today={todayDate}
        events={visible}
        onMenu={() => setDrawer(true)}
        onPick={setCursor}
        onToday={() => setCursor(new Date())}
        onAvatar={() => setPanel({ kind: "settings" })}
        onMonthView={() => store.setView("month")}
      />

      {!cloud.online && (
        <div className="flex items-center justify-center gap-2 bg-ink px-3 py-1.5 text-xs font-medium text-white">
          <CloudOff size={14} /> Sin conexión · tus cambios se guardan cuando vuelva internet
        </div>
      )}

      <div key={view} className="relative min-h-0 flex-1 overflow-hidden" onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}>
        {view === "month" && (
          <MonthView
            cursor={cursor}
            today={today}
            events={visible}
            tagById={tagById}
            onSelectDay={setCursor}
            onOpenDay={openDay}
            onOpenEvent={openEvent}
            onCreate={(day) => setPanel({ kind: "event", event: null, day })}
          />
        )}
        {view === "agenda" && (
          <AgendaView
            now={now}
            events={visible}
            tagById={tagById}
            onOpenDay={openDay}
            onOpenEvent={openEvent}
            onCreate={() => setPanel({ kind: "event", event: null, day: today })}
          />
        )}
        {(view === "day" || view === "3day" || view === "week") && (
          <TimeGridView
            days={visibleDays(view, cursor)}
            now={now}
            events={visible}
            tagById={tagById}
            onOpenDay={openDay}
            onOpenEvent={openEvent}
            onCreateAt={(day, time) => setPanel({ kind: "event", event: null, day, time })}
          />
        )}
      </div>

      <button
        onClick={() => setPanel({ kind: "event", event: null })}
        aria-label="Crear evento"
        className="fixed bottom-[max(env(safe-area-inset-bottom),20px)] right-5 z-30 flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-100 text-brand-700 shadow-lg shadow-ink/15 active:bg-brand-200"
      >
        <Plus size={28} />
      </button>

      {drawer && (
        <Drawer
          profile={store.profile}
          view={view}
          tags={tags}
          hidden={store.hidden}
          onView={store.setView}
          onToggleTag={store.toggleTag}
          onManageTags={() => { setDrawer(false); setPanel({ kind: "tags" }); }}
          onSettings={() => { setDrawer(false); setPanel({ kind: "settings" }); }}
          onClose={() => setDrawer(false)}
        />
      )}
      {panel?.kind === "event" && (
        <EventSheet
          initial={panel.event}
          defaultDay={panel.day ?? dayKey(cursor)}
          defaultTime={panel.time}
          tags={tags}
          onSave={store.saveEvent}
          onDelete={store.deleteEvent}
          onClose={() => setPanel(null)}
          onManageTags={() => setPanel({ kind: "tags" })}
        />
      )}
      {panel?.kind === "tags" && (
        <TagSheet tags={tags} onSave={store.saveTag} onDelete={store.deleteTag} onClose={() => setPanel(null)} />
      )}
      {panel?.kind === "settings" && (
        <SettingsSheet
          sync={
            <AccountSection
              email={user?.primaryEmailAddress?.emailAddress ?? null}
              status={cloud.status}
              lastSynced={cloud.lastSynced}
              onSyncNow={() => void cloud.syncNow()}
              onSignOut={() => void handleSignOut()}
            />
          }
          profile={store.profile}
          onProfile={store.setProfile}
          tags={tags}
          onPreview={engine.preview}
          onEnablePush={() => enablePush(events, tags)}
          onClose={() => setPanel(null)}
        />
      )}

      {!store.profile && firstSyncDone && (
        <Welcome
          initialName={user?.firstName ?? ""}
          onPreview={setDraftProfile}
          onDone={(p) => { store.setProfile(p); setDraftProfile(null); }}
        />
      )}

      <NotificationLayer key={engine.current?.key} notif={engine.current} onClose={engine.dismiss} />
    </main>
  );
}
