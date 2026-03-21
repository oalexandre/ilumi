import type { PluginManifest } from "../types.js";

const toHex = (n: number) => "0x" + Math.trunc(n).toString(16).toUpperCase();
const toBin = (n: number) => "0b" + (Math.trunc(n) >>> 0).toString(2);
const toOct = (n: number) => "0o" + Math.trunc(n).toString(8);
const toDec = (n: number) => String(Math.trunc(n));

export const baseConversionPlugin: PluginManifest = {
  id: "core.base-conversion",
  name: "Base Conversion",
  description: "Number base conversions (hex, binary, octal, decimal)",
  tests: [
    { description: "255 in hex = 0xFF", input: "255 in hex", formatted: "0xFF" },
    { description: "255 in hexadecimal", input: "255 in hexadecimal", formatted: "0xFF" },
    { description: "10 in binary = 0b1010", input: "10 in binary", formatted: "0b1010" },
    { description: "10 in bin = 0b1010", input: "10 in bin", formatted: "0b1010" },
    { description: "8 in octal = 0o10", input: "8 in octal", formatted: "0o10" },
    { description: "8 in oct = 0o10", input: "8 in oct", formatted: "0o10" },
    { description: "0xFF in decimal = 255", input: "0xFF in decimal", formatted: "255" },
    { description: "0xFF in dec = 255", input: "0xFF in dec", formatted: "255" },
  ],
  baseConversions: {
    hex: { formatter: toHex, detail: "hexadecimal", aliases: ["hexadecimal"], category: "numeric" },
    binary: { formatter: toBin, detail: "binary", aliases: ["bin"], category: "numeric" },
    octal: { formatter: toOct, detail: "octal", aliases: ["oct"], category: "numeric" },
    decimal: { formatter: toDec, detail: "decimal", aliases: ["dec"], category: "numeric" },
  },
  help: [{
    title: "Number Formats",
    examples: [
      { input: "0xFF", output: "255", desc: "hexadecimal" },
      { input: "0b1010", output: "10", desc: "binary" },
      { input: "1.5e3", output: "1,500", desc: "scientific" },
      { input: "255 in hex", output: "0xFF" },
      { input: "10 in binary", output: "0b1010" },
    ],
  }],
};
