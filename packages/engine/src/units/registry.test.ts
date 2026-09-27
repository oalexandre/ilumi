import { describe, it, expect, beforeEach } from "vitest";

import { UnitRegistry } from "./registry.js";

describe("UnitRegistry", () => {
  let registry: UnitRegistry;

  beforeEach(() => {
    registry = new UnitRegistry();
  });

  describe("addUnit", () => {
    it("should accept standard unit definitions", () => {
      registry.addUnit({
        id: "meter",
        phrases: "meter, meters, m",
        baseUnitId: "meter",
        format: "m",
        ratio: 1,
      });

      const unit = registry.findByPhrase("meter");
      expect(unit).toBeDefined();
      expect(unit?.id).toBe("meter");
    });

    it("should index all phrase aliases", () => {
      registry.addUnit({
        id: "kilometer",
        phrases: "kilometer, kilometers, km",
        baseUnitId: "meter",
        format: "km",
        ratio: 1000,
      });

      expect(registry.findByPhrase("kilometer")).toBeDefined();
      expect(registry.findByPhrase("kilometers")).toBeDefined();
      expect(registry.findByPhrase("km")).toBeDefined();
    });
  });

  describe("lookup", () => {
    it("should be case-insensitive", () => {
      registry.addUnit({
        id: "meter",
        phrases: "meter, meters, m",
        baseUnitId: "meter",
        format: "m",
        ratio: 1,
      });

      expect(registry.findByPhrase("Meter")).toBeDefined();
      expect(registry.findByPhrase("METERS")).toBeDefined();
      expect(registry.findByPhrase("M")).toBeDefined();
    });

    it("should return undefined for unknown phrases", () => {
      expect(registry.findByPhrase("unknown")).toBeUndefined();
    });

    it("should find by id", () => {
      registry.addUnit({
        id: "meter",
        phrases: "meter, meters, m",
        baseUnitId: "meter",
        format: "m",
        ratio: 1,
      });

      expect(registry.getById("meter")).toBeDefined();
    });
  });

  describe("convert", () => {
    beforeEach(() => {
      registry.addUnit({
        id: "meter",
        phrases: "meter, meters, m",
        baseUnitId: "meter",
        format: "m",
        ratio: 1,
      });
      registry.addUnit({
        id: "kilometer",
        phrases: "kilometer, kilometers, km",
        baseUnitId: "meter",
        format: "km",
        ratio: 1000,
      });
      registry.addUnit({
        id: "centimeter",
        phrases: "centimeter, centimeters, cm",
        baseUnitId: "meter",
        format: "cm",
        ratio: 0.01,
      });
    });

    it("should convert between units of same dimension", () => {
      expect(registry.convert(1, "kilometer", "meter")).toBeCloseTo(1000);
      expect(registry.convert(100, "centimeter", "meter")).toBeCloseTo(1);
      expect(registry.convert(1, "kilometer", "centimeter")).toBeCloseTo(100000);
    });

    it("should convert to same unit", () => {
      expect(registry.convert(5, "meter", "meter")).toBe(5);
    });

    it("should throw for incompatible units", () => {
      registry.addUnit({
        id: "kilogram",
        phrases: "kilogram, kg",
        baseUnitId: "kilogram",
        format: "kg",
        ratio: 1,
      });

      expect(() => registry.convert(1, "meter", "kilogram")).toThrow("incompatible units");
    });

    it("should throw for unknown units", () => {
      expect(() => registry.convert(1, "meter", "unknown")).toThrow('Unknown unit "unknown"');
    });
  });

  describe("non-linear conversion", () => {
    beforeEach(() => {
      registry.addUnit({
        id: "celsius",
        phrases: "celsius, °C, C",
        baseUnitId: "celsius",
        format: "°C",
        ratio: 1,
      });
      registry.addUnit({
        id: "fahrenheit",
        phrases: "fahrenheit, °F, F",
        baseUnitId: "celsius",
        format: "°F",
        ratio: 1,
        toBase: (f: number) => (f - 32) * (5 / 9),
        fromBase: (c: number) => c * (9 / 5) + 32,
      });
    });

    it("should convert temperature correctly", () => {
      expect(registry.convert(100, "celsius", "fahrenheit")).toBeCloseTo(212);
      expect(registry.convert(32, "fahrenheit", "celsius")).toBeCloseTo(0);
      expect(registry.convert(212, "fahrenheit", "celsius")).toBeCloseTo(100);
    });
  });

  describe("getCompatiblePhrases", () => {
    beforeEach(() => {
      registry.addUnit({
        id: "meter",
        phrases: "meter, meters, m",
        baseUnitId: "meter",
        format: "m",
        ratio: 1,
      });
      registry.addUnit({
        id: "kilometer",
        phrases: " kilometer , km",
        baseUnitId: "meter",
        format: "km",
        ratio: 1000,
      });
      // Defined relative to a non-base unit: still resolves to the meter dimension.
      registry.addUnit({
        id: "league",
        phrases: "league",
        baseUnitId: "kilometer",
        format: "lea",
        ratio: 4.8,
      });
      registry.addUnit({
        id: "gram",
        phrases: "gram, g",
        baseUnitId: "gram",
        format: "g",
        ratio: 1,
      });
      registry.addUnit({
        id: "orphan",
        phrases: "orphan",
        baseUnitId: "ghost",
        format: "o",
        ratio: 1,
      });
      registry.addUnit({
        id: "orphan2",
        phrases: "orphan two",
        baseUnitId: "ghost",
        format: "o2",
        ratio: 2,
      });
    });

    it("returns the primary phrase of every other unit in the same dimension", () => {
      expect(registry.getCompatiblePhrases("m")).toEqual(["kilometer", "league"]);
      expect(registry.getCompatiblePhrases("KM")).toEqual(["meter", "league"]);
      expect(registry.getCompatiblePhrases("league")).toEqual(["meter", "kilometer"]);
    });

    it("returns nothing for a dimension with a single unit or an unknown phrase", () => {
      expect(registry.getCompatiblePhrases("g")).toEqual([]);
      expect(registry.getCompatiblePhrases("furlong")).toEqual([]);
    });

    it("groups units whose base unit is not registered by the base id", () => {
      expect(registry.getCompatiblePhrases("orphan")).toEqual(["orphan two"]);
    });
  });

  describe("getAllUnits / getAllPhrases", () => {
    it("returns every definition in insertion order, replacing redefinitions by id", () => {
      const meter = {
        id: "meter",
        phrases: "meter, m",
        baseUnitId: "meter",
        format: "m",
        ratio: 1,
      };
      const gram = { id: "gram", phrases: "gram", baseUnitId: "gram", format: "g", ratio: 1 };
      const meter2 = { ...meter, format: "metre" };
      registry.addUnit(meter);
      registry.addUnit(gram);
      registry.addUnit(meter2);

      expect(registry.getAllUnits()).toEqual([meter2, gram]);
      expect(registry.getById("meter")?.format).toBe("metre");
      expect(registry.getById("nope")).toBeUndefined();
    });

    it("indexes trimmed lowercase phrases plus the lowercased id", () => {
      registry.addUnit({
        id: "KiloByte",
        phrases: " KB , , kilobyte",
        baseUnitId: "byte",
        format: "KB",
        ratio: 1000,
      });

      expect(registry.getAllPhrases()).toEqual(["kb", "kilobyte"]);
      expect(registry.hasPhrase("KB")).toBe(true);
      expect(registry.hasPhrase("")).toBe(false);
      expect(registry.findByPhrase("KILOBYTE")?.id).toBe("KiloByte");
    });

    it("is empty for a fresh registry", () => {
      expect(registry.getAllUnits()).toEqual([]);
      expect(registry.getAllPhrases()).toEqual([]);
    });
  });

  describe("convert errors", () => {
    beforeEach(() => {
      registry.addUnit({
        id: "meter",
        phrases: "meter",
        baseUnitId: "meter",
        format: "m",
        ratio: 1,
      });
      registry.addUnit({ id: "gram", phrases: "gram", baseUnitId: "gram", format: "g", ratio: 1 });
    });

    it("rejects unknown unit ids", () => {
      expect(() => registry.convert(1, "parsec", "meter")).toThrow('Unknown unit "parsec"');
      expect(() => registry.convert(1, "meter", "parsec")).toThrow('Unknown unit "parsec"');
    });

    it("rejects conversions across dimensions", () => {
      expect(() => registry.convert(1, "meter", "gram")).toThrow(
        'Cannot convert between "m" and "g" (incompatible units)',
      );
    });
  });
});
