import type { Profile } from "./theme";
import type { CalendarEvent, Tag } from "./types";

/**
 * Everything that is backed up to the server for the signed-in user. Each event/tag
 * carries `updatedAt`; deletions are kept as tombstones (`e:<id>` / `t:<id>`)
 * so that merging two copies never resurrects deleted items.
 */
export type SyncDoc = {
  events: CalendarEvent[];
  tags: Tag[];
  deleted: Record<string, number>;
  profile: Profile | null;
};

export const EMPTY_DOC: SyncDoc = { events: [], tags: [], deleted: {}, profile: null };

function mergeItems<T extends { id: string; updatedAt?: number }>(a: T[], b: T[], deleted: Record<string, number>, prefix: string) {
  const byId = new Map<string, T>();
  for (const item of [...a, ...b]) {
    const prev = byId.get(item.id);
    if (!prev || (item.updatedAt ?? 0) >= (prev.updatedAt ?? 0)) byId.set(item.id, item);
  }
  return [...byId.values()].filter((item) => {
    const gone = deleted[`${prefix}:${item.id}`];
    return gone === undefined || (item.updatedAt ?? 0) > gone;
  });
}

/** Last-write-wins per item; order of arguments doesn't matter. */
export function mergeDocs(a: SyncDoc, b: SyncDoc): SyncDoc {
  const deleted = { ...a.deleted };
  for (const [k, t] of Object.entries(b.deleted)) deleted[k] = Math.max(deleted[k] ?? 0, t);
  const profile =
    !a.profile ? b.profile : !b.profile ? a.profile : (b.profile.updatedAt ?? 0) > (a.profile.updatedAt ?? 0) ? b.profile : a.profile;
  return {
    events: mergeItems(a.events, b.events, deleted, "e").sort((x, y) => x.id.localeCompare(y.id)),
    tags: mergeItems(a.tags, b.tags, deleted, "t"),
    deleted,
    profile,
  };
}

export function isEmptyDoc(doc: SyncDoc) {
  return !doc.profile && doc.events.length === 0 && Object.keys(doc.deleted).length === 0;
}

/** Stable comparison key (tags keep their user-defined order). */
export function docKey(doc: SyncDoc) {
  return JSON.stringify([
    [...doc.events].sort((x, y) => x.id.localeCompare(y.id)),
    doc.tags,
    Object.entries(doc.deleted).sort(),
    doc.profile,
  ]);
}
