/**
 * Demo recording script — generates a GIF showcasing Ilumi features.
 *
 * Usage:
 *   pnpm build && npx tsx e2e/demo.ts
 *
 * Output:
 *   demo.gif in project root
 */

import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { execSync } from "node:child_process";
import { mkdirSync, rmSync, readdirSync, statSync } from "node:fs";

import { _electron as electron } from "playwright";
import type { Page, Locator } from "playwright";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..");
const FRAMES_DIR = resolve(ROOT, ".demo-frames");

/**
 * A line can be:
 *   - string: typed normally (autocomplete dismissed before Enter)
 *   - { text, autocomplete }: type `text`, pause to show autocomplete, then accept with Tab
 */
type SceneLine = string | { text: string; autocomplete: true };

interface Scene {
  lines: SceneLine[];
  pauseAfter?: number;
}

// --- Demo scenes ---
const scenes: Scene[] = [
  {
    lines: ["1024 / 8", "sqrt(144)", "2 ^ 16"],
  },
  {
    lines: [
      "// Final price",
      "metal = 10",
      "wood = 100",
      "work = 200",
      "price = metal + wood + work",
      "tax = 10%",
      "final_price = price + tax",
    ],
    pauseAfter: 2000,
  },
  {
    lines: [
      "5.5 km to miles",
      "72 kg to pounds",
      { text: "100 celsius to fah", autocomplete: true },
    ],
  },
  {
    lines: [
      "distance = 42 km",
      { text: "distance in mil", autocomplete: true },
      { text: "distance in met", autocomplete: true },
    ],
  },
  {
    lines: ["now + 1 month", "today + 2 weeks", "today - 1 year"],
  },
  {
    lines: ["255 in hex", "0xFF + 1", "42 in binary"],
    pauseAfter: 1800,
  },
];

// --- Frame capture ---
let frameIndex = 0;
const FPS = 12;
const FRAME_INTERVAL = 1000 / FPS;

async function captureFrame(page: Page) {
  const padded = String(frameIndex).padStart(6, "0");
  await page.screenshot({
    path: resolve(FRAMES_DIR, `frame-${padded}.png`),
  });
  frameIndex++;
}

async function captureFrames(page: Page, durationMs: number) {
  const count = Math.max(1, Math.round(durationMs / FRAME_INTERVAL));
  for (let i = 0; i < count; i++) {
    await captureFrame(page);
  }
}

/** Type text char by char, capturing a frame per character */
async function typeLine(page: Page, editor: Locator, text: string) {
  for (const char of text) {
    await editor.pressSequentially(char, { delay: 0 });
    await page.waitForTimeout(20);
    await captureFrame(page);
  }
}

async function main() {
  rmSync(FRAMES_DIR, { recursive: true, force: true });
  mkdirSync(FRAMES_DIR, { recursive: true });

  const app = await electron.launch({
    args: [resolve(__dirname, "../out/main/main.js")],
  });

  const page = await app.firstWindow();
  await page.setViewportSize({ width: 800, height: 500 });
  await page.waitForSelector(".cm-editor", { timeout: 10000 });
  await page.waitForTimeout(1000);

  const editor = page.locator(".cm-content");
  await editor.focus();
  await page.waitForTimeout(300);

  // Clear existing content
  await page.keyboard.press("Meta+a");
  await page.keyboard.press("Backspace");
  await page.waitForTimeout(300);

  // Initial empty frames
  await captureFrames(page, 600);

  // --- Record each scene ---
  for (let s = 0; s < scenes.length; s++) {
    const scene = scenes[s];

    for (let i = 0; i < scene.lines.length; i++) {
      const line = scene.lines[i];

      if (typeof line === "string") {
        // Normal line: type it fully
        await typeLine(page, editor, line);
        await page.waitForTimeout(150);
        await captureFrames(page, 350);
      } else {
        // Autocomplete line: type partial, show autocomplete, then accept
        await typeLine(page, editor, line.text);
        // Pause to show autocomplete popup
        await page.waitForTimeout(200);
        await captureFrames(page, 600);
        // Accept autocomplete with Enter (CodeMirror default accept key)
        await page.keyboard.press("Enter");
        await page.waitForTimeout(200);
        await captureFrames(page, 400);
      }

      // New line (except after last line)
      if (i < scene.lines.length - 1) {
        // Dismiss autocomplete before pressing Enter
        await page.keyboard.press("Escape");
        await page.waitForTimeout(50);
        await page.keyboard.press("Enter");
        await page.waitForTimeout(50);
        await captureFrame(page);
      }
    }

    // Pause to read all results
    await captureFrames(page, scene.pauseAfter ?? 1400);

    // Clear for next scene (except last)
    if (s < scenes.length - 1) {
      // Dismiss any autocomplete/popup
      await page.keyboard.press("Escape");
      await page.waitForTimeout(50);
      await page.keyboard.press("Escape");
      await page.waitForTimeout(50);
      // Select all and delete
      await page.keyboard.press("Meta+a");
      await page.waitForTimeout(50);
      await page.keyboard.press("Backspace");
      await page.waitForTimeout(200);
      // Verify editor is empty, retry if needed
      const text = await editor.textContent();
      if (text && text.trim().length > 0) {
        await page.keyboard.press("Meta+a");
        await page.waitForTimeout(50);
        await page.keyboard.press("Backspace");
        await page.waitForTimeout(200);
      }
      await captureFrames(page, 500);
    }
  }

  // Final pause
  await captureFrames(page, 1500);

  await app.close();

  const totalFrames = readdirSync(FRAMES_DIR).filter((f) => f.endsWith(".png")).length;
  console.log(`Captured ${totalFrames} frames`);

  const gifPath = resolve(ROOT, "demo.gif");
  console.log("Converting to GIF...");

  execSync(
    `ffmpeg -y -framerate ${FPS} -i "${FRAMES_DIR}/frame-%06d.png" ` +
      `-vf "scale=800:-1:flags=lanczos,split[s0][s1];[s0]palettegen=max_colors=256:stats_mode=diff[p];[s1][p]paletteuse=dither=sierra2_4a" ` +
      `"${gifPath}"`,
    { stdio: "inherit" },
  );

  rmSync(FRAMES_DIR, { recursive: true, force: true });

  const size = (statSync(gifPath).size / 1024 / 1024).toFixed(1);
  console.log(`\nDemo GIF created: ${gifPath} (${size} MB)`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
