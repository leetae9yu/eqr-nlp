import { describe, expect, it } from "vitest";
import { noteKey, readAnalystNote, writeAnalystNote, type StorageLike } from "./notes-storage";

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
    expect(readAnalystNote(storage, "chip-export-controls")).toBe("Watch FX channel");
  });

  it("removes empty notes", () => {
    const storage = memoryStorage();

    writeAnalystNote(storage, "event", "temporary");
    writeAnalystNote(storage, "event", "   ");

    expect(readAnalystNote(storage, "event")).toBe("");
  });
});
