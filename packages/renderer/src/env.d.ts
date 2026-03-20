import type { LineResult } from "@engine/index";

interface NumiApi {
  evaluate: (document: string) => Promise<LineResult[]>;
}

declare global {
  interface Window {
    numi: NumiApi;
  }
}
