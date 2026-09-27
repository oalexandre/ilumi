import { describe, it, expect } from "vitest";

import {
  createCurrencyPlugin,
  createEntityRegistry,
  CurrencyFetcher,
  Document,
  registerPlugin,
} from "../../engine/src/index.js";

import { WELCOME_NOTE_CONTENT } from "./welcome-note.js";

describe("welcome note", () => {
  // It is the first screen a new user sees: every line must evaluate, and the examples
  // must show what they claim to.
  const registry = createEntityRegistry();
  registerPlugin(registry, createCurrencyPlugin(new CurrencyFetcher()));
  const results = new Document(registry).update(WELCOME_NOTE_CONTENT);
  const sourceLines = WELCOME_NOTE_CONTENT.split("\n");
  const resultOf = (line: string) => results[sourceLines.indexOf(line)];

  it("evaluates every line without errors", () => {
    const errors = results.filter((r) => r.error).map((r) => `${sourceLines[r.line]} → ${r.error}`);
    expect(errors).toEqual([]);
  });

  it("shows the documented results", () => {
    expect(resultOf("sum")?.value).toBeCloseTo(31.6, 10);
    expect(resultOf("budget = rent + food")?.value).toBe(1770);
    expect(resultOf("round(10 / 3, 2)")?.value).toBe(3.33);
    expect(resultOf("255 in hex")?.formatted).toBe("0xFF");
  });
});
