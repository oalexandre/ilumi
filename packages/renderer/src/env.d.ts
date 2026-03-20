import type { LineResult } from "@engine/index";

interface NoteData {
  id: string;
  title: string;
  content: string;
}

interface NumiApi {
  evaluate: (document: string) => Promise<LineResult[]>;
  getTheme: () => Promise<"dark" | "light">;
  setTheme: (theme: "auto" | "dark" | "light") => Promise<"dark" | "light">;
  toggleTheme: () => Promise<"dark" | "light">;
  onThemeChanged: (callback: (theme: "dark" | "light") => void) => void;
  onNewNote: (callback: () => void) => void;
  onCloseNote: (callback: () => void) => void;
  onToggleTheme: (callback: () => void) => void;
  onCopyCurrentResult: (callback: () => void) => void;
  onCopyAllResults: (callback: () => void) => void;
  getNotes: () => Promise<NoteData[]>;
  saveNote: (note: NoteData) => Promise<void>;
  createNote: () => Promise<NoteData>;
  deleteNote: (id: string) => Promise<void>;
}

declare global {
  interface Window {
    numi: NumiApi;
  }
}
