import { registerDurationUnits } from "../dates/index.js";

import { registerCssUnits } from "./css.js";
import type { UnitDefinition } from "./registry.js";
import { UnitRegistry } from "./registry.js";

const LENGTH: UnitDefinition[] = [
  { id: "meter", phrases: "meter, meters, m", baseUnitId: "meter", format: "m", ratio: 1 },
  { id: "millimeter", phrases: "millimeter, millimeters, mm", baseUnitId: "meter", format: "mm", ratio: 0.001 },
  { id: "centimeter", phrases: "centimeter, centimeters, cm", baseUnitId: "meter", format: "cm", ratio: 0.01 },
  { id: "kilometer", phrases: "kilometer, kilometers, km", baseUnitId: "meter", format: "km", ratio: 1000 },
  { id: "inch", phrases: "inch, inches, in", baseUnitId: "meter", format: "in", ratio: 0.0254 },
  { id: "foot", phrases: "foot, feet, ft", baseUnitId: "meter", format: "ft", ratio: 0.3048 },
  { id: "yard", phrases: "yard, yards, yd", baseUnitId: "meter", format: "yd", ratio: 0.9144 },
  { id: "mile", phrases: "mile, miles, mi", baseUnitId: "meter", format: "mi", ratio: 1609.344 },
  { id: "nautical_mile", phrases: "nautical mile, nautical miles, nmi", baseUnitId: "meter", format: "nmi", ratio: 1852 },
];

const WEIGHT: UnitDefinition[] = [
  { id: "kilogram", phrases: "kilogram, kilograms, kg", baseUnitId: "kilogram", format: "kg", ratio: 1 },
  { id: "milligram", phrases: "milligram, milligrams, mg", baseUnitId: "kilogram", format: "mg", ratio: 0.000001 },
  { id: "gram", phrases: "gram, grams, g", baseUnitId: "kilogram", format: "g", ratio: 0.001 },
  { id: "ton", phrases: "ton, tons, tonne, tonnes, t", baseUnitId: "kilogram", format: "t", ratio: 1000 },
  { id: "ounce", phrases: "ounce, ounces, oz", baseUnitId: "kilogram", format: "oz", ratio: 0.0283495 },
  { id: "pound", phrases: "pound, pounds, lb, lbs", baseUnitId: "kilogram", format: "lb", ratio: 0.453592 },
  { id: "stone", phrases: "stone, stones, st", baseUnitId: "kilogram", format: "st", ratio: 6.35029 },
];

const VOLUME: UnitDefinition[] = [
  { id: "liter", phrases: "liter, liters, litre, litres, l, L", baseUnitId: "liter", format: "L", ratio: 1 },
  { id: "milliliter", phrases: "milliliter, milliliters, ml, mL", baseUnitId: "liter", format: "mL", ratio: 0.001 },
  { id: "gallon", phrases: "gallon, gallons, gal", baseUnitId: "liter", format: "gal", ratio: 3.78541 },
  { id: "quart", phrases: "quart, quarts, qt", baseUnitId: "liter", format: "qt", ratio: 0.946353 },
  { id: "pint", phrases: "pint, pints, pt", baseUnitId: "liter", format: "pt", ratio: 0.473176 },
  { id: "cup", phrases: "cup, cups", baseUnitId: "liter", format: "cup", ratio: 0.236588 },
  { id: "fluid_ounce", phrases: "fluid ounce, fluid ounces, fl oz", baseUnitId: "liter", format: "fl oz", ratio: 0.0295735 },
  { id: "tablespoon", phrases: "tablespoon, tablespoons, tbsp", baseUnitId: "liter", format: "tbsp", ratio: 0.0147868 },
  { id: "teaspoon", phrases: "teaspoon, teaspoons, tsp", baseUnitId: "liter", format: "tsp", ratio: 0.00492892 },
];

const TEMPERATURE: UnitDefinition[] = [
  { id: "celsius", phrases: "celsius, °C, degC", baseUnitId: "celsius", format: "°C", ratio: 1 },
  {
    id: "fahrenheit",
    phrases: "fahrenheit, °F, degF",
    baseUnitId: "celsius",
    format: "°F",
    ratio: 1,
    toBase: (f: number) => (f - 32) * (5 / 9),
    fromBase: (c: number) => c * (9 / 5) + 32,
  },
  {
    id: "kelvin",
    phrases: "kelvin, K",
    baseUnitId: "celsius",
    format: "K",
    ratio: 1,
    toBase: (k: number) => k - 273.15,
    fromBase: (c: number) => c + 273.15,
  },
];

const AREA: UnitDefinition[] = [
  { id: "sqmeter", phrases: "square meter, square meters, m², m2, sqm", baseUnitId: "sqmeter", format: "m²", ratio: 1 },
  { id: "sqmillimeter", phrases: "square millimeter, square millimeters, mm², mm2", baseUnitId: "sqmeter", format: "mm²", ratio: 0.000001 },
  { id: "sqcentimeter", phrases: "square centimeter, square centimeters, cm², cm2", baseUnitId: "sqmeter", format: "cm²", ratio: 0.0001 },
  { id: "sqkilometer", phrases: "square kilometer, square kilometers, km², km2", baseUnitId: "sqmeter", format: "km²", ratio: 1000000 },
  { id: "sqinch", phrases: "square inch, square inches, in², in2, sqin", baseUnitId: "sqmeter", format: "in²", ratio: 0.00064516 },
  { id: "sqfoot", phrases: "square foot, square feet, ft², ft2, sqft", baseUnitId: "sqmeter", format: "ft²", ratio: 0.092903 },
  { id: "acre", phrases: "acre, acres", baseUnitId: "sqmeter", format: "acre", ratio: 4046.86 },
  { id: "hectare", phrases: "hectare, hectares, ha", baseUnitId: "sqmeter", format: "ha", ratio: 10000 },
];

const DATA: UnitDefinition[] = [
  { id: "bit", phrases: "bit, bits", baseUnitId: "bit", format: "bit", ratio: 1 },
  { id: "byte", phrases: "byte, bytes, B", baseUnitId: "bit", format: "B", ratio: 8 },
  { id: "kilobyte", phrases: "kilobyte, kilobytes, KB", baseUnitId: "bit", format: "KB", ratio: 8000 },
  { id: "megabyte", phrases: "megabyte, megabytes, MB", baseUnitId: "bit", format: "MB", ratio: 8000000 },
  { id: "gigabyte", phrases: "gigabyte, gigabytes, GB", baseUnitId: "bit", format: "GB", ratio: 8000000000 },
  { id: "terabyte", phrases: "terabyte, terabytes, TB", baseUnitId: "bit", format: "TB", ratio: 8000000000000 },
  { id: "petabyte", phrases: "petabyte, petabytes, PB", baseUnitId: "bit", format: "PB", ratio: 8000000000000000 },
  // Binary (IEC)
  { id: "kibibyte", phrases: "kibibyte, kibibytes, KiB", baseUnitId: "bit", format: "KiB", ratio: 8192 },
  { id: "mebibyte", phrases: "mebibyte, mebibytes, MiB", baseUnitId: "bit", format: "MiB", ratio: 8388608 },
  { id: "gibibyte", phrases: "gibibyte, gibibytes, GiB", baseUnitId: "bit", format: "GiB", ratio: 8589934592 },
  { id: "tebibyte", phrases: "tebibyte, tebibytes, TiB", baseUnitId: "bit", format: "TiB", ratio: 8796093022208 },
];

export function createDefaultRegistry(): UnitRegistry {
  const registry = new UnitRegistry();

  const allUnits = [...LENGTH, ...WEIGHT, ...VOLUME, ...TEMPERATURE, ...AREA, ...DATA];
  for (const unit of allUnits) {
    registry.addUnit(unit);
  }

  registerCssUnits(registry);
  registerDurationUnits(registry);

  return registry;
}
