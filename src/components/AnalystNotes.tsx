"use client";

import { useEffect, useState } from "react";
import { getBrowserStorage, readAnalystNote, writeAnalystNote } from "@/lib/notes-storage";

export function AnalystNotes({ eventId }: { eventId: string }) {
  const [note, setNote] = useState("");
  const [savedAt, setSavedAt] = useState<string | null>(null);
  const [storageError, setStorageError] = useState<string | null>(null);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const storage = getBrowserStorage(window);
      if (!storage.ok) {
        setStorageError(storage.error);
        return;
      }
      const result = readAnalystNote(storage.value, eventId);
      setNote(result.value);
      setStorageError(result.ok ? null : result.error);
    }, 0);

    return () => window.clearTimeout(timer);
  }, [eventId]);

  function saveNote() {
    const storage = getBrowserStorage(window);
    if (!storage.ok) {
      setStorageError(storage.error);
      return;
    }
    const result = writeAnalystNote(storage.value, eventId, note);
    if (!result.ok) {
      setStorageError(result.error);
      return;
    }
    setStorageError(null);
    setSavedAt(new Date().toLocaleTimeString());
  }

  return (
    <section className="panel notes-panel">
      <div className="section-heading">
        <p className="eyebrow">Analyst notes</p>
        <h2>Local annotation</h2>
      </div>
      <p className="muted">Notes are stored in this browser only, keeping the MVP free of external database accounts.</p>
      <textarea
        aria-label="Analyst note"
        value={note}
        onChange={(event) => setNote(event.target.value)}
        placeholder="Add your interpretation, follow-up question, or watch item for this event..."
      />
      <div className="notes-actions">
        <button type="button" onClick={saveNote}>Save note</button>
        {savedAt ? <span>Saved at {savedAt}</span> : null}
        {storageError ? <span role="status">Unable to save locally: {storageError}</span> : null}
      </div>
    </section>
  );
}
