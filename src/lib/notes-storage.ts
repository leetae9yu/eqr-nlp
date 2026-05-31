export type StorageLike = Pick<Storage, "getItem" | "setItem" | "removeItem">;

const prefix = "eqr-nlp:analyst-note:";

export function noteKey(eventId: string) {
  return `${prefix}${eventId}`;
}

export function readAnalystNote(storage: StorageLike | undefined, eventId: string) {
  if (!storage) return "";
  return storage.getItem(noteKey(eventId)) ?? "";
}

export function writeAnalystNote(storage: StorageLike | undefined, eventId: string, note: string) {
  if (!storage) return;
  if (note.trim().length === 0) {
    storage.removeItem(noteKey(eventId));
    return;
  }
  storage.setItem(noteKey(eventId), note);
}
