import { describe, it, expect } from "vitest";
import { CompletionContext } from "@codemirror/autocomplete";
import { EditorState } from "@codemirror/state";

import { documentVariables } from "./numi-autocomplete";

/** Variables visible with the cursor at `|` in `text`. */
function variablesAt(text: string): string[] {
  const pos = text.indexOf("|");
  const doc = text.slice(0, pos) + text.slice(pos + 1);
  const state = EditorState.create({ doc, selection: { anchor: pos } });
  return documentVariables(new CompletionContext(state, pos, false)).map((e) => e.label);
}

describe("documentVariables", () => {
  it("returns no variables on the first line", () => {
    expect(variablesAt("x = 1|")).toEqual([]);
  });

  it("collects assignments from the lines above in definition order", () => {
    expect(variablesAt("price = 10\ntax = 0.2\ntotal = price * tax\n|")).toEqual([
      "price",
      "tax",
      "total",
    ]);
  });

  it("ignores assignments on and below the cursor line", () => {
    expect(variablesAt("a = 1\nb = |2\nc = 3")).toEqual(["a"]);
  });

  it("lists a reassigned variable once, at its first definition", () => {
    expect(variablesAt("a = 1\nb = 2\na = 3\n|")).toEqual(["a", "b"]);
  });

  it("ignores equality comparisons", () => {
    expect(variablesAt("a == 1\nb==2\nc = 3\n|")).toEqual(["c"]);
  });

  it("accepts leading whitespace, underscores and digits after the first char", () => {
    expect(variablesAt("  _tmp = 1\nrate2=5\n|")).toEqual(["_tmp", "rate2"]);
  });

  it("ignores lines that are not simple assignments", () => {
    expect(variablesAt("1 + 1\n2x = 4\nfoo bar = 3\n// c = 1\n|")).toEqual([]);
  });

  it("describes each entry as a variable", () => {
    const state = EditorState.create({ doc: "rate = 3\n", selection: { anchor: 9 } });
    expect(documentVariables(new CompletionContext(state, 9, false))).toEqual([
      { label: "rate", detail: "variable", type: "variable" },
    ]);
  });
});
