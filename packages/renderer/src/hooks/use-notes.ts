import { useState, useEffect, useCallback, useRef } from "react";

interface NoteData {
  id: string;
  title: string;
  content: string;
}

const AUTOSAVE_MS = 1000;

export function useNotes(): {
  notes: NoteData[];
  activeNote: NoteData | null;
  activeId: string;
  setActiveId: (id: string) => void;
  updateContent: (content: string) => void;
  createNote: () => void;
  closeNote: (id: string) => void;
  renameNote: (id: string, title: string) => void;
} {
  const [notes, setNotes] = useState<NoteData[]>([]);
  const [activeId, setActiveId] = useState("");
  // One pending save per note: switching notes must not cancel the previous note's save.
  const pendingSavesRef = useRef(
    new Map<string, { timer: ReturnType<typeof setTimeout>; note: NoteData }>(),
  );

  const cancelPendingSave = useCallback((id: string) => {
    const pending = pendingSavesRef.current.get(id);
    if (pending) clearTimeout(pending.timer);
    pendingSavesRef.current.delete(id);
  }, []);

  // Write unsaved edits when the window closes or reloads.
  useEffect(() => {
    const pendingSaves = pendingSavesRef.current;
    const flush = () => {
      for (const { timer, note } of pendingSaves.values()) {
        clearTimeout(timer);
        window.numi.saveNote(note);
      }
      pendingSaves.clear();
    };
    window.addEventListener("beforeunload", flush);
    return () => {
      window.removeEventListener("beforeunload", flush);
      flush();
    };
  }, []);

  useEffect(() => {
    window.numi.getNotes().then((loaded) => {
      setNotes(loaded);
      if (loaded.length > 0 && loaded[0]) {
        setActiveId(loaded[0].id);
      }
    });
  }, []);

  const activeNote = notes.find((n) => n.id === activeId) ?? null;

  const scheduleSave = useCallback(
    (note: NoteData) => {
      cancelPendingSave(note.id);
      const timer = setTimeout(() => {
        pendingSavesRef.current.delete(note.id);
        window.numi.saveNote(note);
      }, AUTOSAVE_MS);
      pendingSavesRef.current.set(note.id, { timer, note });
    },
    [cancelPendingSave],
  );

  const updateContent = useCallback(
    (content: string) => {
      setNotes((prev) =>
        prev.map((n) => {
          if (n.id === activeId) {
            const updated = { ...n, content };
            scheduleSave(updated);
            return updated;
          }
          return n;
        }),
      );
    },
    [activeId, scheduleSave],
  );

  const createNote = useCallback(() => {
    window.numi.createNote().then((note) => {
      setNotes((prev) => [...prev, note]);
      setActiveId(note.id);
    });
  }, []);

  const closeNote = useCallback(
    (id: string) => {
      // A save still pending would recreate the file after the delete.
      cancelPendingSave(id);
      window.numi.deleteNote(id);
      setNotes((prev) => {
        const remaining = prev.filter((n) => n.id !== id);
        if (activeId === id && remaining.length > 0 && remaining[0]) {
          setActiveId(remaining[0].id);
        }
        return remaining;
      });
    },
    [activeId, cancelPendingSave],
  );

  // Latest notes for callbacks that must save outside a state updater (StrictMode runs
  // updaters twice, which would save twice).
  const notesRef = useRef(notes);
  notesRef.current = notes;

  const renameNote = useCallback(
    (id: string, title: string) => {
      // A pending save holds the newest content; it is dropped so it can't overwrite the rename.
      const latest =
        pendingSavesRef.current.get(id)?.note ?? notesRef.current.find((n) => n.id === id);
      if (!latest) return;
      cancelPendingSave(id);
      window.numi.saveNote({ ...latest, title });
      setNotes((prev) => prev.map((n) => (n.id === id ? { ...n, title } : n)));
    },
    [cancelPendingSave],
  );

  return {
    notes,
    activeNote,
    activeId,
    setActiveId,
    updateContent,
    createNote,
    closeNote,
    renameNote,
  };
}
