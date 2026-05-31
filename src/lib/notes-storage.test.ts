import { describe, expect, it } from "vitest";
import { getBrowserStorage, noteKey, readAnalystNote, writeAnalystNote, type StorageLike } from "./notes-storage";

function memoryStorage(): StorageLike & { map: Map<string, string> } {
  const map = new Map<string, string>();
  return {
    map,
    getItem: (key) => map.get(key) ?? null,
    setItem: (key, value) => { map.set(key, value); },
    removeItem: (key) => { map.delete(key); },
  };
}

describe("analyst notes storage", () => {
  it("stores notes per event without external services", () => {
    const storage = memoryStorage();

    writeAnalystNote(storage, "chip-export-controls", "Watch FX channel");

    expect(storage.map.get(noteKey("chip-export-controls"))).toBe("Watch FX channel");
    expect(readAnalystNote(storage, "chip-export-controls")).toEqual({ ok: true, value: "Watch FX channel" });
  });

  it("removes empty notes", () => {
    const storage = memoryStorage();

    writeAnalystNote(storage, "event", "temporary");
    writeAnalystNote(storage, "event", "   ");

    expect(readAnalystNote(storage, "event")).toEqual({ ok: true, value: "" });
  });
});


  it("returns non-fatal errors when browser storage throws", () => {
    const throwingStorage: StorageLike = {
      getItem: () => { throw new Error("blocked"); },
      setItem: () => { throw new Error("quota"); },
      removeItem: () => { throw new Error("blocked"); },
    };

    expect(readAnalystNote(throwingStorage, "event")).toEqual({ ok: false, value: "", error: "blocked" });
    expect(writeAnalystNote(throwingStorage, "event", "note")).toEqual({ ok: false, value: null, error: "quota" });
  });


  it("handles throwing localStorage getters before storage method calls", () => {
    const blockedWindow = Object.defineProperty({}, "localStorage", {
      get: () => { throw new Error("security blocked"); },
    }) as Pick<Window, "localStorage">;

    expect(getBrowserStorage(blockedWindow)).toEqual({
      ok: false,
      value: undefined,
      error: "security blocked",
    });
  });
