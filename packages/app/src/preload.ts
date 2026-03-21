import { contextBridge, ipcRenderer } from "electron";
import type { LineResult, EntityInfo, HelpSection } from "@engine/index";

export const ilumiApi = {
  evaluate: (document: string): Promise<LineResult[]> => {
    return ipcRenderer.invoke("numi:evaluate", document);
  },
  getCompletions: (unitPhrase: string): Promise<string[]> => {
    return ipcRenderer.invoke("numi:getCompletions", unitPhrase);
  },
  getAllUnits: (): Promise<string[]> => {
    return ipcRenderer.invoke("numi:getAllUnits");
  },
  getEntityNames: (): Promise<EntityInfo[]> => {
    return ipcRenderer.invoke("numi:getEntityNames");
  },
  getHelpSections: (): Promise<{ core: HelpSection[]; community: HelpSection[] }> => {
    return ipcRenderer.invoke("numi:getHelpSections");
  },
  getConversionCompletions: (sourceWord: string): Promise<EntityInfo[]> => {
    return ipcRenderer.invoke("numi:getConversionCompletions", sourceWord);
  },
  resolveSourceWord: (tokens: string[]): Promise<string> => {
    return ipcRenderer.invoke("numi:resolveSourceWord", tokens);
  },
  getTheme: (): Promise<"dark" | "light"> => {
    return ipcRenderer.invoke("numi:getTheme");
  },
  setTheme: (theme: "auto" | "dark" | "light"): Promise<"dark" | "light"> => {
    return ipcRenderer.invoke("numi:setTheme", theme);
  },
  toggleTheme: (): Promise<"dark" | "light"> => {
    return ipcRenderer.invoke("numi:toggleTheme");
  },
  getNotes: (): Promise<Array<{ id: string; title: string; content: string }>> => {
    return ipcRenderer.invoke("numi:getNotes");
  },
  saveNote: (note: { id: string; title: string; content: string }): Promise<void> => {
    return ipcRenderer.invoke("numi:saveNote", note);
  },
  createNote: (): Promise<{ id: string; title: string; content: string }> => {
    return ipcRenderer.invoke("numi:createNote");
  },
  deleteNote: (id: string): Promise<void> => {
    return ipcRenderer.invoke("numi:deleteNote", id);
  },
  onThemeChanged: (callback: (theme: "dark" | "light") => void): void => {
    ipcRenderer.on("numi:themeChanged", (_event, theme: "dark" | "light") => {
      callback(theme);
    });
  },
  onEntitiesChanged: (callback: () => void): void => {
    ipcRenderer.on("numi:entitiesChanged", callback);
  },
  onNewNote: (callback: () => void): void => {
    ipcRenderer.on("numi:newNote", callback);
  },
  onCloseNote: (callback: () => void): void => {
    ipcRenderer.on("numi:closeNote", callback);
  },
  onToggleTheme: (callback: () => void): void => {
    ipcRenderer.on("numi:toggleTheme", callback);
  },
  onCopyCurrentResult: (callback: () => void): void => {
    ipcRenderer.on("numi:copyCurrentResult", callback);
  },
  onCopyAllResults: (callback: () => void): void => {
    ipcRenderer.on("numi:copyAllResults", callback);
  },
};

contextBridge.exposeInMainWorld("numi", ilumiApi);
