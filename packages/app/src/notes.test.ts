import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  readdirSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

const state = vi.hoisted(() => ({ userData: "" }));

vi.mock("electron", () => ({
  app: { getPath: () => state.userData, getVersion: () => "1.0.0", isPackaged: false },
}));

import { deleteNote, generateId, loadAllNotes, saveNote } from "./notes.js";
import type { NoteData } from "./notes.js";
import { WELCOME_NOTE_CONTENT, WELCOME_NOTE_TITLE } from "./welcome-note.js";

let tmpDir: string;

const notesDir = () => join(state.userData, "notes");
const noteFiles = () => readdirSync(notesDir()).sort();
const byId = (a: NoteData, b: NoteData) => a.id.localeCompare(b.id);

beforeEach(() => {
  tmpDir = mkdtempSync(join(tmpdir(), "ilumi-notes-"));
  state.userData = tmpDir;
});

afterEach(() => {
  rmSync(tmpDir, { recursive: true, force: true });
});

describe("loadAllNotes", () => {
  it("creates and persists the welcome note on first launch", () => {
    const notes = loadAllNotes();

    expect(notes).toHaveLength(1);
    const [welcome] = notes;
    expect(welcome?.title).toBe("Welcome");
    expect(welcome?.title).toBe(WELCOME_NOTE_TITLE);
    expect(welcome?.content).toBe(WELCOME_NOTE_CONTENT);
    expect(welcome?.id).toMatch(/^[0-9a-z]+$/);

    expect(noteFiles()).toEqual([`${welcome?.id}.json`]);
    const saved = JSON.parse(
      readFileSync(join(notesDir(), `${welcome?.id}.json`), "utf-8"),
    ) as unknown;
    expect(saved).toEqual(welcome);
  });

  it("creates the notes directory under a missing userData directory", () => {
    state.userData = join(tmpDir, "does", "not", "exist");
    expect(loadAllNotes()).toHaveLength(1);
    expect(existsSync(notesDir())).toBe(true);
  });

  it("does not create a second welcome note on the next launch", () => {
    const [first] = loadAllNotes();
    expect(loadAllNotes()).toEqual([first]);
    expect(noteFiles()).toHaveLength(1);
  });

  it("creates the welcome note when the directory only holds non-JSON files", () => {
    mkdirSync(notesDir());
    writeFileSync(join(notesDir(), ".DS_Store"), "");
    const notes = loadAllNotes();
    expect(notes.map((n) => n.title)).toEqual(["Welcome"]);
  });

  it("loads the saved notes", () => {
    const a = { id: "a", title: "Groceries", content: "1 + 1" };
    const b = { id: "b", title: "Budget", content: "rent = 1200" };
    saveNote(a);
    saveNote(b);
    expect(loadAllNotes().sort(byId)).toEqual([a, b]);
  });

  it("skips a corrupt note file and keeps the others", () => {
    const good = { id: "good", title: "Ok", content: "2 * 3" };
    saveNote(good);
    writeFileSync(join(notesDir(), "broken.json"), "{ not json");
    expect(loadAllNotes()).toEqual([good]);
    // The corrupt file is left alone, not deleted.
    expect(noteFiles()).toEqual(["broken.json", "good.json"]);
  });

  it("returns no notes (and no welcome note) when every file is corrupt", () => {
    mkdirSync(notesDir());
    writeFileSync(join(notesDir(), "broken.json"), "");
    expect(loadAllNotes()).toEqual([]);
  });
});

describe("saveNote", () => {
  it("writes the note as pretty-printed JSON named after its id", () => {
    const note = { id: "abc123", title: "T", content: "5 km in miles" };
    saveNote(note);
    expect(readFileSync(join(notesDir(), "abc123.json"), "utf-8")).toBe(
      JSON.stringify(note, null, 2),
    );
  });

  it("overwrites the previous version of the same note", () => {
    saveNote({ id: "x", title: "Old", content: "1" });
    saveNote({ id: "x", title: "New", content: "2" });
    expect(noteFiles()).toEqual(["x.json"]);
    expect(loadAllNotes()).toEqual([{ id: "x", title: "New", content: "2" }]);
  });
});

describe("deleteNote", () => {
  it("removes the note file", () => {
    saveNote({ id: "keep", title: "K", content: "" });
    saveNote({ id: "gone", title: "G", content: "" });
    deleteNote("gone");
    expect(noteFiles()).toEqual(["keep.json"]);
  });

  it("is a no-op for a missing note", () => {
    saveNote({ id: "keep", title: "K", content: "" });
    expect(() => deleteNote("missing")).not.toThrow();
    expect(noteFiles()).toEqual(["keep.json"]);
  });

  it("is a no-op when the notes directory does not exist", () => {
    expect(() => deleteNote("missing")).not.toThrow();
    expect(existsSync(notesDir())).toBe(false);
  });
});

describe("generateId", () => {
  it("returns lowercase base-36 ids", () => {
    expect(generateId()).toMatch(/^[0-9a-z]{8,}$/);
  });

  it("returns unique ids even within the same millisecond", () => {
    vi.spyOn(Date, "now").mockReturnValue(1_700_000_000_000);
    const ids = new Set(Array.from({ length: 200 }, () => generateId()));
    expect(ids.size).toBe(200);
  });
});
