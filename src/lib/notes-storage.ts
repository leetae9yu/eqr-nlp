export type StorageLike = Pick<Storage, "getItem" | "setItem" | "removeItem">;

const prefix = "eqr-nlp:analyst-note:";

export type NoteStorageResult<T> =
  | { ok: true; value: T }
  | { ok: false; value: T; error: string };


export function getBrowserStorage(globalObject: Pick<Window, "localStorage"> | undefined): NoteStorageResult<StorageLike | undefined> {
  if (!globalObject) return { ok: false, value: undefined, error: "Local note storage is unavailable" };
  try {
    return { ok: true, value: globalObject.localStorage };
  } catch (error) {
    return { ok: false, value: undefined, error: storageError(error) };
  }
}

export function noteKey(eventId: string) {
  return `${prefix}${eventId}`;
}

function storageError(error: unknown) {
  return error instanceof Error ? error.message : "Local note storage is unavailable";
}

export function readAnalystNote(storage: StorageLike | undefined, eventId: string): NoteStorageResult<string> {
  if (!storage) return { ok: false, value: "", error: "Local note storage is unavailable" };
  try {
    return { ok: true, value: storage.getItem(noteKey(eventId)) ?? "" };
  } catch (error) {
    return { ok: false, value: "", error: storageError(error) };
  }
}

export function writeAnalystNote(storage: StorageLike | undefined, eventId: string, note: string): NoteStorageResult<null> {
  if (!storage) return { ok: false, value: null, error: "Local note storage is unavailable" };
  try {
    if (note.trim().length === 0) {
      storage.removeItem(noteKey(eventId));
      return { ok: true, value: null };
    }
    storage.setItem(noteKey(eventId), note);
    return { ok: true, value: null };
  } catch (error) {
    return { ok: false, value: null, error: storageError(error) };
  }
}
