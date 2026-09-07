import { describe, it, expect } from "vitest";

import { Document, evaluate } from "./index.js";

describe("evaluate", () => {
  it("should return a result for each line", () => {
    const results = evaluate("1\n2\n3");
    expect(results).toHaveLength(3);
    expect(results[0]?.value).toBe(1);
    expect(results[1]?.value).toBe(2);
    expect(results[2]?.value).toBe(3);
  });

  it("should handle empty input", () => {
    const results = evaluate("");
    expect(results).toHaveLength(1);
    expect(results[0]?.value).toBeNull();
  });

  it("should share variables across lines", () => {
    const results = evaluate("x = 10\ny = 20\nx + y");
    expect(results[0]?.value).toBe(10);
    expect(results[1]?.value).toBe(20);
    expect(results[2]?.value).toBe(30);
  });

  it("should handle errors gracefully", () => {
    const results = evaluate("10 / 0");
    expect(results[0]?.error).toBe("Division by zero");
    expect(results[0]?.value).toBeNull();
  });
});

describe("Document", () => {
  it("should evaluate multi-line documents", () => {
    const doc = new Document();
    const results = doc.update("price = 100\ntax = 8\nprice + tax");
    expect(results[2]?.value).toBe(108);
  });

  it("should re-evaluate dependent lines when variable changes", () => {
    const doc = new Document();

    const r1 = doc.update("price = 100\nprice * 2");
    expect(r1[1]?.value).toBe(200);

    const r2 = doc.update("price = 50\nprice * 2");
    expect(r2[1]?.value).toBe(100);
  });

  it("should handle variable chains", () => {
    const doc = new Document();
    const results = doc.update("a = 10\nb = a * 2\nc = b + a");
    expect(results[0]?.value).toBe(10);
    expect(results[1]?.value).toBe(20);
    expect(results[2]?.value).toBe(30);
  });

  it("should handle variable reassignment", () => {
    const doc = new Document();
    const results = doc.update("x = 1\nx = x + 1\nx");
    expect(results[0]?.value).toBe(1);
    expect(results[1]?.value).toBe(2);
    expect(results[2]?.value).toBe(2);
  });

  it("should handle comments and empty lines", () => {
    const doc = new Document();
    const results = doc.update("// header\nx = 5\n\nx + 1");
    expect(results[0]?.value).toBeNull();
    expect(results[1]?.value).toBe(5);
    expect(results[2]?.value).toBeNull();
    expect(results[3]?.value).toBe(6);
  });

  it("should support variable names with underscores and numbers", () => {
    const doc = new Document();
    const results = doc.update("my_var_1 = 42\nresult_2 = my_var_1 + 8");
    expect(results[0]?.value).toBe(42);
    expect(results[1]?.value).toBe(50);
  });

  it("should report error for undefined variables", () => {
    const doc = new Document();
    const results = doc.update("x + 1");
    expect(results[0]?.error).toContain("Undefined variable");
  });

  it("should handle syntax errors", () => {
    const doc = new Document();
    const results = doc.update("1 +");
    expect(results[0]?.error).toBe("Syntax error");
  });

  it("should tag parse failures as syntax errors and runtime failures as eval errors", () => {
    expect(evaluate("a=")[0]?.errorKind).toBe("syntax");
    expect(evaluate("1/0")[0]?.errorKind).toBe("eval");
    expect(evaluate("foo + 1")[0]?.errorKind).toBe("eval");
    expect(evaluate("1 + 1")[0]?.errorKind).toBeUndefined();
  });

  it("applies format options set on the document", () => {
    const doc = new Document();
    doc.setFormatOptions({ locale: "pt-BR", maxDecimals: 2 });
    expect(doc.update("1234.5678")[0]?.formatted).toBe("1.234,57");
    doc.setFormatOptions({});
    expect(doc.update("1234.5678")[0]?.formatted).toBe("1,234.5678");
  });
});
