// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { StrictMode, createElement, type ReactNode } from "react";
import { act, renderHook } from "@testing-library/react";

import { useNotes } from "./use-notes";

interface NoteData {
  id: string;
  title: string;
  content: string;
}

const AUTOSAVE_MS = 1000;

function makeNumi(initial: NoteData[]) {
  let created = 0;
  const api = {
    getNotes: vi.fn(() => Promise.resolve(initial.map((n) => ({ ...n })))),
    saveNote: vi.fn((_note: NoteData) => Promise.resolve()),
    deleteNote: vi.fn((_id: string) => Promise.resolve()),
    createNote: vi.fn(() => {
      created++;
      return Promise.resolve({ id: `new-${created}`, title: `New ${created}`, content: "" });
    }),
  };
  (window as unknown as { numi: typeof api }).numi = api;
  return api;
}

const A: NoteData = { id: "a", title: "Note A", content: "1 + 1" };
const B: NoteData = { id: "b", title: "Note B", content: "2 * 3" };
const C: NoteData = { id: "c", title: "Note C", content: "" };

/** Render the hook and let the initial getNotes() promise resolve. */
async function renderLoaded(options?: { wrapper?: (props: { children: ReactNode }) => ReactNode }) {
  const view = renderHook(() => useNotes(), options);
  await act(async () => {
    await Promise.resolve();
  });
  return view;
}

describe("useNotes", () => {
  let numi: ReturnType<typeof makeNumi>;

  beforeEach(() => {
    vi.useFakeTimers();
    numi = makeNumi([A, B, C]);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe("initial load", () => {
    it("loads notes and activates the first one", async () => {
      const { result } = await renderLoaded();
      expect(numi.getNotes).toHaveBeenCalledTimes(1);
      expect(result.current.notes).toEqual([A, B, C]);
      expect(result.current.activeId).toBe("a");
      expect(result.current.activeNote).toEqual(A);
    });

    it("starts empty with no active note before the notes arrive", () => {
      numi.getNotes.mockReturnValue(new Promise<NoteData[]>(() => {}));
      const { result } = renderHook(() => useNotes());
      expect(result.current.notes).toEqual([]);
      expect(result.current.activeId).toBe("");
      expect(result.current.activeNote).toBeNull();
    });

    it("leaves activeId empty when there are no saved notes", async () => {
      numi = makeNumi([]);
      const { result } = await renderLoaded();
      expect(result.current.notes).toEqual([]);
      expect(result.current.activeId).toBe("");
      expect(result.current.activeNote).toBeNull();
    });
  });

  describe("setActiveId", () => {
    it("switches the active note", async () => {
      const { result } = await renderLoaded();
      act(() => result.current.setActiveId("b"));
      expect(result.current.activeId).toBe("b");
      expect(result.current.activeNote).toEqual(B);
    });
  });

  describe("updateContent autosave", () => {
    it("updates the active note's content immediately", async () => {
      const { result } = await renderLoaded();
      act(() => result.current.updateContent("5 + 5"));
      expect(result.current.activeNote?.content).toBe("5 + 5");
      expect(result.current.notes[1]).toEqual(B);
    });

    it("saves only after AUTOSAVE_MS", async () => {
      const { result } = await renderLoaded();
      act(() => result.current.updateContent("5 + 5"));
      act(() => vi.advanceTimersByTime(AUTOSAVE_MS - 1));
      expect(numi.saveNote).not.toHaveBeenCalled();
      act(() => vi.advanceTimersByTime(1));
      expect(numi.saveNote).toHaveBeenCalledTimes(1);
      expect(numi.saveNote).toHaveBeenCalledWith({ id: "a", title: "Note A", content: "5 + 5" });
    });

    it("coalesces several quick edits into one save of the latest content", async () => {
      const { result } = await renderLoaded();
      act(() => result.current.updateContent("5"));
      act(() => vi.advanceTimersByTime(400));
      act(() => result.current.updateContent("5 +"));
      act(() => vi.advanceTimersByTime(400));
      act(() => result.current.updateContent("5 + 6"));
      act(() => vi.advanceTimersByTime(AUTOSAVE_MS - 1));
      expect(numi.saveNote).not.toHaveBeenCalled();
      act(() => vi.advanceTimersByTime(1));
      expect(numi.saveNote).toHaveBeenCalledTimes(1);
      expect(numi.saveNote).toHaveBeenCalledWith({ id: "a", title: "Note A", content: "5 + 6" });
    });

    it("still saves note A's edit after switching to note B and editing it", async () => {
      const { result } = await renderLoaded();
      act(() => result.current.updateContent("edited A"));
      act(() => result.current.setActiveId("b"));
      act(() => result.current.updateContent("edited B"));
      act(() => vi.advanceTimersByTime(AUTOSAVE_MS));
      expect(numi.saveNote).toHaveBeenCalledTimes(2);
      expect(numi.saveNote).toHaveBeenCalledWith({ id: "a", title: "Note A", content: "edited A" });
      expect(numi.saveNote).toHaveBeenCalledWith({ id: "b", title: "Note B", content: "edited B" });
      expect(result.current.notes.map((n) => n.content)).toEqual(["edited A", "edited B", ""]);
    });

    it("does not save again once the pending save has fired", async () => {
      const { result } = await renderLoaded();
      act(() => result.current.updateContent("x"));
      act(() => vi.advanceTimersByTime(AUTOSAVE_MS * 5));
      expect(numi.saveNote).toHaveBeenCalledTimes(1);
    });
  });

  describe("closeNote", () => {
    it("deletes the note, cancels its pending save and activates a remaining note", async () => {
      const { result } = await renderLoaded();
      act(() => result.current.updateContent("unsaved"));
      act(() => result.current.closeNote("a"));
      expect(numi.deleteNote).toHaveBeenCalledWith("a");
      expect(result.current.notes.map((n) => n.id)).toEqual(["b", "c"]);
      expect(result.current.activeId).toBe("b");
      expect(result.current.activeNote).toEqual(B);
      act(() => vi.advanceTimersByTime(AUTOSAVE_MS * 2));
      expect(numi.saveNote).not.toHaveBeenCalled();
    });

    it("keeps the active note when closing a different one", async () => {
      const { result } = await renderLoaded();
      act(() => result.current.closeNote("c"));
      expect(result.current.notes.map((n) => n.id)).toEqual(["a", "b"]);
      expect(result.current.activeId).toBe("a");
    });

    it("only cancels the closed note's pending save", async () => {
      const { result } = await renderLoaded();
      act(() => result.current.updateContent("edited A"));
      act(() => result.current.setActiveId("b"));
      act(() => result.current.updateContent("edited B"));
      act(() => result.current.closeNote("b"));
      act(() => vi.advanceTimersByTime(AUTOSAVE_MS));
      expect(numi.saveNote).toHaveBeenCalledTimes(1);
      expect(numi.saveNote).toHaveBeenCalledWith({ id: "a", title: "Note A", content: "edited A" });
    });

    it("leaves activeId pointing at the closed id when the last note is closed", async () => {
      // Current behaviour: with no remaining note, activeId is not reset, so it names a
      // note that no longer exists and activeNote falls back to null. The UI never lets
      // the last tab close (tab-bar hides the button, App guards the menu command).
      numi = makeNumi([A]);
      const { result } = await renderLoaded();
      act(() => result.current.closeNote("a"));
      expect(numi.deleteNote).toHaveBeenCalledWith("a");
      expect(result.current.notes).toEqual([]);
      expect(result.current.activeId).toBe("a");
      expect(result.current.activeNote).toBeNull();
    });
  });

  describe("renameNote", () => {
    it("saves immediately with the new title and the latest content", async () => {
      const { result } = await renderLoaded();
      act(() => result.current.updateContent("latest"));
      act(() => result.current.renameNote("a", "Budget"));
      expect(numi.saveNote).toHaveBeenCalledTimes(1);
      expect(numi.saveNote).toHaveBeenCalledWith({ id: "a", title: "Budget", content: "latest" });
      expect(result.current.activeNote).toEqual({ id: "a", title: "Budget", content: "latest" });
    });

    it("cancels the renamed note's pending save", async () => {
      const { result } = await renderLoaded();
      act(() => result.current.updateContent("latest"));
      act(() => result.current.renameNote("a", "Budget"));
      act(() => vi.advanceTimersByTime(AUTOSAVE_MS * 2));
      expect(numi.saveNote).toHaveBeenCalledTimes(1);
    });

    it("renames a non-active note without touching the active one", async () => {
      const { result } = await renderLoaded();
      act(() => result.current.renameNote("c", "Scratch"));
      expect(numi.saveNote).toHaveBeenCalledWith({ id: "c", title: "Scratch", content: "" });
      expect(result.current.notes.map((n) => n.title)).toEqual(["Note A", "Note B", "Scratch"]);
      expect(result.current.activeId).toBe("a");
    });

    // React StrictMode (used in main.tsx) runs state updaters twice, so saving must happen
    // outside them.
    it("saves a rename exactly once under StrictMode", async () => {
      const wrapper = ({ children }: { children: ReactNode }) =>
        createElement(StrictMode, null, children);
      const { result } = await renderLoaded({ wrapper });
      numi.saveNote.mockClear();
      act(() => result.current.renameNote("a", "Budget"));
      expect(numi.saveNote).toHaveBeenCalledTimes(1);
    });
  });

  describe("flushing pending saves", () => {
    it("saves pending edits immediately on unmount", async () => {
      const { result, unmount } = await renderLoaded();
      act(() => result.current.updateContent("edited A"));
      act(() => result.current.setActiveId("b"));
      act(() => result.current.updateContent("edited B"));
      unmount();
      expect(numi.saveNote).toHaveBeenCalledTimes(2);
      expect(numi.saveNote).toHaveBeenCalledWith({ id: "a", title: "Note A", content: "edited A" });
      expect(numi.saveNote).toHaveBeenCalledWith({ id: "b", title: "Note B", content: "edited B" });
      // The timers were cleared, so nothing is saved a second time.
      vi.advanceTimersByTime(AUTOSAVE_MS * 2);
      expect(numi.saveNote).toHaveBeenCalledTimes(2);
    });

    it("saves pending edits on beforeunload", async () => {
      const { result } = await renderLoaded();
      act(() => result.current.updateContent("edited A"));
      window.dispatchEvent(new Event("beforeunload"));
      expect(numi.saveNote).toHaveBeenCalledTimes(1);
      expect(numi.saveNote).toHaveBeenCalledWith({ id: "a", title: "Note A", content: "edited A" });
      act(() => vi.advanceTimersByTime(AUTOSAVE_MS * 2));
      expect(numi.saveNote).toHaveBeenCalledTimes(1);
    });

    it("does nothing on unmount when there is nothing pending", async () => {
      const { unmount } = await renderLoaded();
      unmount();
      expect(numi.saveNote).not.toHaveBeenCalled();
    });

    it("stops listening for beforeunload after unmount", async () => {
      const { unmount } = await renderLoaded();
      unmount();
      window.dispatchEvent(new Event("beforeunload"));
      expect(numi.saveNote).not.toHaveBeenCalled();
    });
  });

  describe("createNote", () => {
    it("appends the created note and activates it", async () => {
      const { result } = await renderLoaded();
      await act(async () => {
        result.current.createNote();
        await Promise.resolve();
      });
      expect(numi.createNote).toHaveBeenCalledTimes(1);
      expect(result.current.notes.map((n) => n.id)).toEqual(["a", "b", "c", "new-1"]);
      expect(result.current.activeId).toBe("new-1");
      expect(result.current.activeNote).toEqual({ id: "new-1", title: "New 1", content: "" });
    });

    it("edits after creating go to the new note", async () => {
      const { result } = await renderLoaded();
      await act(async () => {
        result.current.createNote();
        await Promise.resolve();
      });
      act(() => result.current.updateContent("42"));
      act(() => vi.advanceTimersByTime(AUTOSAVE_MS));
      expect(numi.saveNote).toHaveBeenCalledWith({ id: "new-1", title: "New 1", content: "42" });
    });
  });
});
