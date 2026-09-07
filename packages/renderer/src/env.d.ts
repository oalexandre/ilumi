import type { LineResult, HelpSection } from "@engine/index";

interface EntityInfo {
  name: string;
  type: "function" | "constant" | "unit" | "lineRef" | "dateLiteral" | "baseConversion";
  detail?: string;
}

interface NoteData {
  id: string;
  title: string;
  content: string;
}

interface IlumiApi {
  evaluate: (document: string) => Promise<LineResult[]>;
  getCompletions: (unitPhrase: string) => Promise<string[]>;
  getAllUnits: () => Promise<string[]>;
  getEntityNames: () => Promise<EntityInfo[]>;
  getHelpSections: () => Promise<{ core: HelpSection[]; community: HelpSection[] }>;
  getConversionCompletions: (sourceWord: string) => Promise<EntityInfo[]>;
  resolveSourceWord: (tokens: string[]) => Promise<string>;
  getTheme: () => Promise<"dark" | "light">;
  setTheme: (theme: "auto" | "dark" | "light") => Promise<"dark" | "light">;
  toggleTheme: () => Promise<"dark" | "light">;
  getSettings: () => Promise<AppSettings>;
  setSetting: <K extends keyof AppSettings>(key: K, value: AppSettings[K]) => Promise<boolean>;
  getVersion: () => Promise<string>;
  onSettingsChanged: (callback: (settings: AppSettings) => void) => () => void;
  onThemeChanged: (callback: (theme: "dark" | "light") => void) => () => void;
  onEntitiesChanged: (callback: () => void) => () => void;
  onNewNote: (callback: () => void) => () => void;
  onCloseNote: (callback: () => void) => () => void;
  onToggleTheme: (callback: () => void) => () => void;
  onCopyCurrentResult: (callback: () => void) => () => void;
  onCopyAllResults: (callback: () => void) => () => void;
  getNotes: () => Promise<NoteData[]>;
  saveNote: (note: NoteData) => Promise<void>;
  createNote: () => Promise<NoteData>;
  deleteNote: (id: string) => Promise<void>;
}

declare global {
  type NumberFormat = "en-US" | "pt-BR" | "fr-FR";

  interface AppSettings {
    theme: "auto" | "dark" | "light";
    globalShortcut: string;
    alwaysOnTop: boolean;
    numberFormat: NumberFormat;
    maxDecimals: number | "auto";
    useGrouping: boolean;
  }

  interface Window {
    numi: IlumiApi;
  }
}
