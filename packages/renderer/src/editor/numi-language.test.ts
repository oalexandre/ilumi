import { describe, it, expect } from "vitest";
import { ensureSyntaxTree } from "@codemirror/language";
import { EditorState } from "@codemirror/state";

import { numiLanguage } from "./numi-language";

/**
 * Tokens of `doc` as [text, token type] pairs, skipping untyped text. StreamLanguage merges
 * adjacent tokens of the same type, so "*(" comes back as one operator node.
 */
function tokens(doc: string): Array<[string, string]> {
  const state = EditorState.create({ doc, extensions: [numiLanguage] });
  const tree = ensureSyntaxTree(state, doc.length, 5000);
  if (!tree) throw new Error("syntax tree not ready");
  const out: Array<[string, string]> = [];
  tree.iterate({
    enter(node) {
      if (node.type.isTop) return;
      out.push([doc.slice(node.from, node.to), node.name]);
    },
  });
  return out;
}

describe("numi language tokenizer", () => {
  it("classifies numbers and operators", () => {
    expect(tokens("1.5 + 2 * (3) - 4 / 5 ^ 2")).toEqual([
      ["1.5", "number"],
      ["+", "operator"],
      ["2", "number"],
      ["*", "operator"],
      ["(", "operator"],
      ["3", "number"],
      [")", "operator"],
      ["-", "operator"],
      ["4", "number"],
      ["/", "operator"],
      ["5", "number"],
      ["^", "operator"],
      ["2", "number"],
    ]);
  });

  it("recognises hex, binary and scientific numbers", () => {
    expect(tokens("0xFF 0b101 1.2e-3")).toEqual([
      ["0xFF", "number"],
      ["0b101", "number"],
      ["1.2e-3", "number"],
    ]);
  });

  it("treats percent and shifts as operators", () => {
    expect(tokens("20% << 2")).toEqual([
      ["20", "number"],
      ["%", "operator"],
      ["<<", "operator"],
      ["2", "number"],
    ]);
  });

  it("distinguishes functions, constants, keywords and variables", () => {
    expect(tokens("sqrt pi in total foo")).toEqual([
      ["sqrt", "variableName.function"],
      ["pi", "atom"],
      ["in", "keyword"],
      ["total", "keyword"],
      ["foo", "variableName"],
    ]);
  });

  it("marks currency symbols as units", () => {
    expect(tokens("$5 €3")).toEqual([
      ["$", "unit"],
      ["5", "number"],
      ["€", "unit"],
      ["3", "number"],
    ]);
  });

  it("treats // and # as comments to the end of the line", () => {
    expect(tokens("1 // note + 2\n# heading\n3")).toEqual([
      ["1", "number"],
      ["// note + 2", "comment"],
      ["# heading", "comment"],
      ["3", "number"],
    ]);
  });

  it("assigns an operator to the equals sign of an assignment", () => {
    expect(tokens("x = 3")).toEqual([
      ["x", "variableName"],
      ["=", "operator"],
      ["3", "number"],
    ]);
  });
});
