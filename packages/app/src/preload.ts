import { contextBridge, ipcRenderer } from "electron";
import type { LineResult } from "@engine/index";

export const numiApi = {
  evaluate: (document: string): Promise<LineResult[]> => {
    return ipcRenderer.invoke("numi:evaluate", document);
  },
};

contextBridge.exposeInMainWorld("numi", numiApi);
