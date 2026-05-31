"use client";

import { useState } from "react";
import { readAnalystNote, writeAnalystNote } from "@/lib/notes-storage";

export function AnalystNotes({ eventId }: { eventId: string }) {
  const [note, setNote] = useState(() =>
    typeof window === "undefined" ? "" : readAnalystNote(window.localStorage, eventId),
  );
  const [savedAt, setSavedAt] = useState<string | null>(null);

  function saveNote() {
    writeAnalystNote(window.localStorage, eventId, note);
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
      </div>
    </section>
  );
}
