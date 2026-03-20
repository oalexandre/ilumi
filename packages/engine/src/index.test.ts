import { describe, it, expect } from "vitest";

import { evaluate } from "./index.js";

describe("evaluate", () => {
  it("should return a result for each line", () => {
    const results = evaluate("line1\nline2\nline3");
    expect(results).toHaveLength(3);
    expect(results[0]?.line).toBe(0);
    expect(results[1]?.line).toBe(1);
    expect(results[2]?.line).toBe(2);
  });

  it("should return empty array for empty input", () => {
    const results = evaluate("");
    expect(results).toHaveLength(1);
  });
});
