import { describe, it, expect } from "vitest";

import { evaluate } from "../index.js";

function evalFormatted(input: string): string {
  const results = evaluate(input);
  return results[0]?.formatted ?? "";
}

describe("base conversion", () => {
  describe("decimal to hex", () => {
    it("should convert 255 to hex", () => {
      expect(evalFormatted("255 in hex")).toBe("0xFF");
    });

    it("should convert 0 to hex", () => {
      expect(evalFormatted("0 in hex")).toBe("0x0");
    });

    it("should convert 16 to hex", () => {
      expect(evalFormatted("16 in hex")).toBe("0x10");
    });
  });

  describe("decimal to binary", () => {
    it("should convert 10 to binary", () => {
      expect(evalFormatted("10 in binary")).toBe("0b1010");
    });

    it("should convert 255 to binary", () => {
      expect(evalFormatted("255 in bin")).toBe("0b11111111");
    });
  });

  describe("decimal to octal", () => {
    it("should convert 8 to octal", () => {
      expect(evalFormatted("8 in octal")).toBe("0o10");
    });

    it("should convert 255 to octal", () => {
      expect(evalFormatted("255 in oct")).toBe("0o377");
    });
  });

  describe("hex to decimal", () => {
    it("should convert 0xFF to decimal", () => {
      expect(evalFormatted("0xFF in decimal")).toBe("255");
    });

    it("should convert 0xFF to dec", () => {
      expect(evalFormatted("0xFF in dec")).toBe("255");
    });
  });

  describe("hex to binary", () => {
    it("should convert 0xFF to binary", () => {
      expect(evalFormatted("0xFF in binary")).toBe("0b11111111");
    });
  });

  describe("binary to decimal", () => {
    it("should convert 0b1010 to decimal", () => {
      expect(evalFormatted("0b1010 in decimal")).toBe("10");
    });
  });

  describe("expressions to base", () => {
    it("should convert expression result to hex", () => {
      expect(evalFormatted("200 + 55 in hex")).toBe("0xFF");
    });
  });
});
