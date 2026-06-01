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
        <p className="eyebrow">애널리스트 메모</p>
        <h2>브라우저 로컬 주석</h2>
      </div>
      <p className="muted">메모는 이 브라우저에만 저장되므로 외부 DB 계정 없이 MVP를 사용할 수 있습니다.</p>
      <textarea
        aria-label="애널리스트 메모"
        value={note}
        onChange={(event) => setNote(event.target.value)}
        placeholder="해석, 후속 질문, 모니터링 포인트를 적어두세요..."
      />
      <div className="notes-actions">
        <button type="button" onClick={saveNote}>메모 저장</button>
        {savedAt ? <span>{savedAt} 저장됨</span> : null}
        {storageError ? <span role="status">로컬 저장 실패: {storageError}</span> : null}
      </div>
    </section>
  );
}
