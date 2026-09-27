import { describe, it, expect, beforeEach } from "vitest";

import { createEntityRegistry } from "../index.js";
import type { UnitDefinition } from "../units/registry.js";

import { EntityRegistry } from "./entity-registry.js";

function unit(id: string, phrases: string, baseUnitId: string, ratio = 1): UnitDefinition {
  return { id, phrases, baseUnitId, format: id, ratio };
}

function lengthAndMassRegistry(): EntityRegistry {
  const reg = new EntityRegistry();
  reg.addUnit(unit("meter", "meter, meters, m", "meter"));
  reg.addUnit(unit("kilometer", "kilometer, kilometers, km", "meter", 1000));
  reg.addUnit(unit("square meter", "square meter, square meters, m2", "square meter"));
  reg.addUnit(unit("gram", "gram, grams, g", "gram"));
  reg.registerDateLiteral("today", () => new Date(0), "current date");
  return reg;
}

describe("EntityRegistry.resolveSourceWord", () => {
  let reg: EntityRegistry;

  beforeEach(() => {
    reg = lengthAndMassRegistry();
  });

  it("prefers the longest recognised multi-word unit phrase", () => {
    expect(reg.resolveSourceWord(["5", "square", "meter"])).toBe("square meter");
  });

  it("falls back to a shorter suffix when the long phrase is unknown", () => {
    expect(reg.resolveSourceWord(["big", "meter"])).toBe("meter");
  });

  it("recognises date literals and keeps the original casing", () => {
    expect(reg.resolveSourceWord(["Today"])).toBe("Today");
    expect(reg.resolveSourceWord(["Square", "Meter"])).toBe("Square Meter");
  });

  it("returns the last token when nothing is recognised", () => {
    expect(reg.resolveSourceWord(["foo", "bar"])).toBe("bar");
  });

  it("returns an empty string for no tokens", () => {
    expect(reg.resolveSourceWord([])).toBe("");
  });
});

describe("EntityRegistry.getConversionCompletions", () => {
  it("offers only compatible units (primary phrase) for a unit source", () => {
    const reg = lengthAndMassRegistry();
    reg.registerBaseConversion("hex", String, "hexadecimal", "numeric");

    expect(reg.getConversionCompletions("km")).toEqual([{ name: "meter", type: "unit" }]);
    expect(reg.getConversionCompletions("Meters")).toEqual([{ name: "kilometer", type: "unit" }]);
    expect(reg.getConversionCompletions("g")).toEqual([]);
  });

  it("offers only date-category conversions for a date literal", () => {
    const reg = lengthAndMassRegistry();
    reg.registerBaseConversion("UTC", String, "timezone: UTC", "date");
    reg.registerBaseConversion("utc", String, "timezone: UTC", "date");
    reg.registerBaseConversion("hex", String, "hexadecimal", "numeric");
    reg.registerBaseConversion("fancy", String, "no category");

    expect(reg.getConversionCompletions("today")).toEqual([
      { name: "UTC", type: "baseConversion", detail: "timezone: UTC" },
    ]);
  });

  it("offers numeric and uncategorised conversions plus multi-letter units for a plain number", () => {
    const reg = lengthAndMassRegistry();
    reg.registerBaseConversion("UTC", String, "timezone: UTC", "date");
    reg.registerBaseConversion("hex", String, "hexadecimal", "numeric");
    reg.registerBaseConversion("fancy", String);

    const result = reg.getConversionCompletions("42");

    expect(result.slice(0, 2)).toEqual([
      { name: "hex", type: "baseConversion", detail: "hexadecimal" },
      { name: "fancy", type: "baseConversion", detail: undefined },
    ]);
    const unitNames = result.filter((r) => r.type === "unit").map((r) => r.name);
    expect(unitNames).toContain("kilometers");
    expect(unitNames).toContain("square meter");
    expect(unitNames).toContain("m2");
    // Single-letter phrases are too noisy to suggest.
    expect(unitNames).not.toContain("m");
    expect(unitNames).not.toContain("g");
    expect(result.some((r) => r.name === "UTC")).toBe(false);
  });

  it("dedupes case variants, preferring the non-lowercase spelling", () => {
    const reg = new EntityRegistry();
    reg.registerBaseConversion("New_York", String, "tz", "date");
    reg.registerBaseConversion("new_york", String, "tz", "date");
    reg.registerDateLiteral("now", () => new Date(0));

    expect(reg.getConversionCompletions("now").map((r) => r.name)).toEqual(["New_York"]);
  });

  // Registration order must not matter: a skipped lowercase "utc" used to hide "UTC" too.
  it("keeps a conversion whose lowercase variant was registered first", () => {
    const reg = new EntityRegistry();
    reg.registerBaseConversion("utc", String, "tz", "date");
    reg.registerBaseConversion("UTC", String, "tz", "date");
    reg.registerDateLiteral("now", () => new Date(0));

    expect(reg.getConversionCompletions("now").map((r) => r.name)).toEqual(["UTC"]);
  });

  it("caps the unit suggestions at 50 entries in total", () => {
    const reg = new EntityRegistry();
    for (let i = 0; i < 80; i++) reg.addUnit(unit(`unit${i}`, `unit${i}`, "unit0"));
    reg.registerBaseConversion("hex", String, "hexadecimal", "numeric");

    const result = reg.getConversionCompletions("5");
    expect(result).toHaveLength(50);
    expect(result[0]).toEqual({ name: "hex", type: "baseConversion", detail: "hexadecimal" });
    expect(result.filter((r) => r.type === "unit")).toHaveLength(49);
  });

  it("works against the real core plugins", () => {
    const reg = createEntityRegistry();

    const forToday = reg.getConversionCompletions("today");
    expect(forToday.every((r) => r.type === "baseConversion")).toBe(true);
    expect(forToday.map((r) => r.name)).toEqual(
      expect.arrayContaining(["UTC", "Tokyo", "Sao_Paulo"]),
    );
    expect(forToday.map((r) => r.name)).not.toContain("utc");
    expect(forToday.map((r) => r.name)).not.toContain("hex");

    const forNumber = reg.getConversionCompletions("255");
    expect(forNumber.map((r) => r.name)).toEqual(
      expect.arrayContaining(["hex", "binary", "octal"]),
    );
    expect(forNumber.map((r) => r.name)).not.toContain("UTC");
    expect(forNumber.length).toBeLessThanOrEqual(50);

    const forKm = reg.getConversionCompletions("km").map((r) => r.name);
    expect(forKm).toEqual(expect.arrayContaining(["meter", "mile"]));
    expect(forKm).not.toContain("kilogram");
  });
});

describe("EntityRegistry.getAllEntityInfo", () => {
  it("lists every registered entity with its type and detail", () => {
    const reg = new EntityRegistry();
    reg.registerFunction("sqrt", Math.sqrt, "square root");
    reg.registerFunction("noDetail", () => 0);
    reg.registerConstant("pi", Math.PI, "3.14159…");
    reg.registerLineRef("prev", () => 1, "previous line");
    reg.registerDateLiteral("today", () => new Date(0), "current date");
    reg.registerBaseConversion("hex", String, "hexadecimal", "numeric");
    reg.addUnit(unit("meter", "meter", "meter"));

    expect(reg.getAllEntityInfo()).toEqual([
      { name: "sqrt", type: "function", detail: "square root" },
      { name: "noDetail", type: "function", detail: undefined },
      { name: "pi", type: "constant", detail: "3.14159…" },
      { name: "prev", type: "lineRef", detail: "previous line" },
      { name: "today", type: "dateLiteral", detail: "current date" },
      { name: "hex", type: "baseConversion", detail: "hexadecimal" },
    ]);
  });

  it("is empty for a fresh registry", () => {
    expect(new EntityRegistry().getAllEntityInfo()).toEqual([]);
  });
});

describe("EntityRegistry lookups", () => {
  it("throws for unknown functions, date literals and line references", () => {
    const reg = new EntityRegistry();
    expect(() => reg.callFunction("nope", [])).toThrow('Unknown function "nope"');
    expect(() => reg.resolveDateLiteral("someday")).toThrow('Unknown date literal "someday"');
    expect(() => reg.resolveLineRef("above", [], 0)).toThrow('Unknown line reference "above"');
  });

  it("resolves date literals and base formatters case-insensitively", () => {
    const reg = new EntityRegistry();
    reg.registerDateLiteral("today", () => new Date(123));
    reg.registerBaseConversion("hex", (n) => n.toString(16));

    expect(reg.isDateLiteral("TODAY")).toBe(true);
    expect(reg.resolveDateLiteral("Today").getTime()).toBe(123);
    expect(reg.getBaseFormatter("HEX")?.(255)).toBe("ff");
    expect(reg.getKnownBaseKeywords()).toEqual(new Set(["hex"]));
    expect(reg.getKnownDateLiterals()).toEqual(new Set(["today"]));
  });

  it("keeps core and community help sections apart and returns copies", () => {
    const reg = new EntityRegistry();
    reg.registerHelpSections([{ title: "Core", examples: [] }], "core");
    reg.registerHelpSections([{ title: "Community", examples: [] }], "community");

    const sections = reg.getHelpSections();
    expect(sections.core.map((s) => s.title)).toEqual(["Core"]);
    expect(sections.community.map((s) => s.title)).toEqual(["Community"]);

    sections.core.push({ title: "Injected", examples: [] });
    expect(reg.getHelpSections().core).toHaveLength(1);
  });
});
