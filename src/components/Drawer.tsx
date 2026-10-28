"use client";

import { CalendarDays, CalendarRange, Check, Columns3, Rows3, Settings2, Square, Tags, type LucideIcon } from "lucide-react";
import { VIEW_LABELS, type ViewMode } from "@/lib/dates";
import type { Profile } from "@/lib/theme";
import type { Tag } from "@/lib/types";
import { Wordmark } from "./ProfileEditor";

const VIEW_ICONS: Record<ViewMode, LucideIcon> = {
  agenda: Rows3,
  day: Square,
  "3day": Columns3,
  week: CalendarRange,
  month: CalendarDays,
};

type Props = {
  profile: Profile | null;
  view: ViewMode;
  tags: Tag[];
  hidden: string[];
  onView: (v: ViewMode) => void;
  onToggleTag: (id: string) => void;
  onManageTags: () => void;
  onSettings: () => void;
  onClose: () => void;
};

const item = "flex w-full items-center gap-4 rounded-full px-4 py-3 text-left text-[15px] font-medium transition";

export function Drawer({ profile, view, tags, hidden, onView, onToggleTag, onManageTags, onSettings, onClose }: Props) {
  return (
    <div className="anim-fade fixed inset-0 z-40 bg-ink/30" onClick={onClose}>
      <nav
        className="anim-drawer safe-top safe-bottom flex h-full w-[82%] max-w-xs flex-col overflow-y-auto rounded-r-2xl bg-surface px-3"
        onClick={(e) => e.stopPropagation()}
      >
        <p className="px-4 pb-3 pt-3">
          <Wordmark profile={profile} className="text-[22px]" />
        </p>
        <ul className="border-b border-line pb-2">
          {(Object.keys(VIEW_LABELS) as ViewMode[]).map((v) => {
            const Icon = VIEW_ICONS[v];
            const active = v === view;
            return (
              <li key={v}>
                <button
                  onClick={() => { onView(v); onClose(); }}
                  className={`${item} ${active ? "bg-brand-100 text-brand-700" : "text-ink active:bg-bg"}`}
                >
                  <Icon size={20} /> {VIEW_LABELS[v]}
                </button>
              </li>
            );
          })}
        </ul>

        <p className="px-4 pb-1 pt-4 text-xs font-medium uppercase tracking-wider text-muted">Etiquetas</p>
        <ul className="border-b border-line pb-2">
          {tags.map((t) => {
            const shown = !hidden.includes(t.id);
            return (
              <li key={t.id}>
                <button onClick={() => onToggleTag(t.id)} className={`${item} text-ink active:bg-bg`}>
                  <span
                    className="flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-[4px] border-2"
                    style={{ borderColor: t.color, background: shown ? t.color : "transparent" }}
                  >
                    {shown && <Check size={12} strokeWidth={3} className="text-white" />}
                  </span>
                  <span className="truncate font-normal">{t.name}</span>
                </button>
              </li>
            );
          })}
        </ul>

        <ul className="pt-2">
          <li>
            <button onClick={onManageTags} className={`${item} text-ink active:bg-bg`}>
              <Tags size={20} /> Administrar etiquetas
            </button>
          </li>
          <li>
            <button onClick={onSettings} className={`${item} text-ink active:bg-bg`}>
              <Settings2 size={20} /> Ajustes
            </button>
          </li>
        </ul>
      </nav>
    </div>
  );
}
