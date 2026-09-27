/**
 * Records the website's demo clips and stills from the real app.
 *
 * Usage:
 *   pnpm build && npx tsx e2e/record-site-media.ts [scene-id ...]
 *
 * For every scene and locale it writes to website/public/media/<locale>/:
 *   <scene>.webm, <scene>.mp4  looping clip of the note being typed
 *   <scene>.webp                final state, used as the video poster and as a still
 *   <scene>-640.webp            the same at half width, for phones
 *   <scene>.json                each line and the result the app showed, for the page text
 * Each scene runs in a fresh app with its own temporary data directory, a note titled
 * after the scene, and the locale's number format, so the tab bar and results match
 * what a user of that locale would see. A scene fails loudly if any line shows an error.
 */

import { execSync } from "node:child_process";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { _electron as electron } from "playwright";
import type { Page } from "playwright";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const OUT = resolve(ROOT, "website/public/media");
const FPS = 15;
// A small window with the app zoomed in, so the note fills the frame and stays legible
// when the clip is shown a few hundred pixels wide.
const VIEWPORT = { width: 720, height: 300 };
const ZOOM = 1.3;
const OUTPUT_WIDTH = 1280;

type Locale = "en" | "pt";

interface Scene {
  id: string;
  /** Overrides ZOOM for notes with long results that would otherwise be cut off. */
  zoom?: number;
  /** Overrides VIEWPORT; keep the same 2.4:1 aspect so every clip shares one size. */
  viewport?: { width: number; height: number };
  title: Record<Locale, string>;
  lines: Record<Locale, string[]>;
  theme?: "dark" | "light";
}

const SCENES: Scene[] = [
  {
    id: "groceries",
    title: { en: "Groceries", pt: "Mercado" },
    lines: {
      en: [
        "// Weekly groceries",
        "coffee = 18.90",
        "bread = 7.50",
        "cheese = 32.40",
        "milk = 5.20 * 2",
        "sum",
      ],
      pt: [
        "// Compras da semana",
        "cafe = 18.90",
        "pao = 7.50",
        "queijo = 32.40",
        "leite = 5.20 * 2",
        "sum",
      ],
    },
  },
  {
    id: "trip",
    title: { en: "Lisbon trip", pt: "Viagem a Lisboa" },
    lines: {
      en: [
        "flights = 2 * 480 EUR",
        "hotel = 6 * 95 EUR",
        "food = 6 * 40 EUR",
        "trip = flights + hotel + food",
        "trip in USD",
        "trip / 2",
      ],
      pt: [
        "voos = 2 * 480 EUR",
        "hotel = 6 * 95 EUR",
        "comida = 6 * 40 EUR",
        "viagem = voos + hotel + comida",
        "viagem in BRL",
        "viagem / 2",
      ],
    },
  },
  {
    id: "invoice",
    title: { en: "Invoice", pt: "Orçamento" },
    lines: {
      en: [
        "hours = 38",
        "rate = 85",
        "subtotal = hours * rate",
        "discount = 5%",
        "subtotal - discount",
        "tax = 15% of subtotal",
      ],
      pt: [
        "horas = 38",
        "valor = 85",
        "subtotal = horas * valor",
        "desconto = 5%",
        "subtotal - desconto",
        "imposto = 15% of subtotal",
      ],
    },
  },
  {
    id: "dev",
    title: { en: "Front-end", pt: "Front-end" },
    lines: {
      en: [
        "24 px in rem",
        "1.5 rem in px",
        "0xF0 OR 0x0F",
        "255 in hex",
        "0b1010 << 2",
        "1.5 GB in MB",
      ],
      pt: [
        "24 px in rem",
        "1.5 rem in px",
        "0xF0 OR 0x0F",
        "255 in hex",
        "0b1010 << 2",
        "1.5 GB in MB",
      ],
    },
  },
  {
    id: "dates",
    // Time-zone results are long: a wider window keeps them whole at a legible zoom.
    viewport: { width: 1000, height: 417 },
    zoom: 1.25,
    title: { en: "Release", pt: "Lançamento" },
    lines: {
      en: [
        "deadline = today + 3 weeks",
        "deadline - today in hours",
        "now in Tokyo",
        "now in New_York",
      ],
      pt: ["prazo = today + 3 weeks", "prazo - today in hours", "now in Tokyo", "now in Sao_Paulo"],
    },
  },
  {
    id: "light",
    theme: "light",
    title: { en: "Groceries", pt: "Mercado" },
    lines: {
      en: [
        "// Weekly groceries",
        "coffee = 18.90",
        "bread = 7.50",
        "cheese = 32.40",
        "milk = 5.20 * 2",
        "sum",
      ],
      pt: [
        "// Compras da semana",
        "cafe = 18.90",
        "pao = 7.50",
        "queijo = 32.40",
        "leite = 5.20 * 2",
        "sum",
      ],
    },
  },
];

function prepareUserData(scene: Scene, locale: Locale): string {
  const dir = mkdtempSync(join(tmpdir(), "ilumi-media-"));
  mkdirSync(join(dir, "notes"));
  writeFileSync(
    join(dir, "notes", "scene.json"),
    JSON.stringify({ id: "scene", title: scene.title[locale], content: "" }),
  );
  writeFileSync(
    join(dir, "settings.json"),
    JSON.stringify({
      theme: scene.theme ?? "dark",
      maxDecimals: 2,
      numberFormat: locale === "pt" ? "pt-BR" : "en-US",
      lastSeenVersion: "999.0.0",
    }),
  );
  return dir;
}

async function record(scene: Scene, locale: Locale): Promise<void> {
  const userData = prepareUserData(scene, locale);
  const frames = mkdtempSync(join(tmpdir(), "ilumi-frames-"));
  let index = 0;
  let transcript: Array<{ input: string; result: string }> = [];

  const app = await electron.launch({
    args: [resolve(ROOT, "out/main/main.js")],
    env: { ...process.env, ILUMI_USER_DATA: userData },
  });
  try {
    const page = await app.firstWindow();
    await page.setViewportSize(scene.viewport ?? VIEWPORT);
    await page.waitForSelector(".cm-editor");
    await app.evaluate(({ BrowserWindow }, zoom) => {
      BrowserWindow.getAllWindows()[0]?.webContents.setZoomFactor(zoom);
    }, scene.zoom ?? ZOOM);
    // Let live exchange rates arrive so currency lines carry no offline badge.
    await page.waitForTimeout(3000);

    const editor = page.locator(".cm-content");
    await editor.focus();

    const frame = async (repeat = 1) => {
      const path = join(frames, `f-${String(index).padStart(6, "0")}.png`);
      await page.screenshot({ path });
      index++;
      // Holding a frame costs a copy, not another capture.
      for (let i = 1; i < repeat; i++) {
        execSync(`cp "${path}" "${join(frames, `f-${String(index).padStart(6, "0")}.png`)}"`);
        index++;
      }
    };
    const hold = (ms: number) => frame(Math.max(1, Math.round((ms / 1000) * FPS)));

    await hold(500);
    const lines = scene.lines[locale];
    for (let i = 0; i < lines.length; i++) {
      for (const char of lines[i]!) {
        await page.keyboard.type(char);
        await page.waitForTimeout(15);
        await frame();
      }
      await page.keyboard.press("Escape"); // close any autocomplete before Enter
      await page.waitForTimeout(120); // past the evaluation debounce
      await hold(450);
      if (i < lines.length - 1) {
        await page.keyboard.press("Enter");
        await page.waitForTimeout(60);
        await frame();
      }
    }
    // Park the cursor out of sight of the last line's highlight, then hold the result.
    await page.locator(".cm-content").evaluate((el) => (el as HTMLElement).blur());
    await page.waitForTimeout(200);
    await hold(2600);

    await assertNoErrors(page, `${scene.id}/${locale}`);
    // The site shows these lines as text next to the clip; they must match it exactly.
    const results = await page.evaluate(() =>
      Array.from(document.querySelectorAll("[data-testid='result-value']")).map(
        (el) => el.textContent ?? "",
      ),
    );
    const rows = await page.evaluate(() =>
      Array.from(document.querySelectorAll(".cm-line")).map((el) => el.textContent ?? ""),
    );
    transcript = rows.map((input, i) => ({ input, result: results[i] ?? "" }));
  } finally {
    await app.close();
    rmSync(userData, { recursive: true, force: true });
  }

  encode(frames, scene.id, locale, index - 1);
  writeFileSync(
    join(OUT, locale, `${scene.id}.json`),
    `${JSON.stringify({ title: scene.title[locale], lines: transcript }, null, 2)}\n`,
  );
  rmSync(frames, { recursive: true, force: true });
}

async function assertNoErrors(page: Page, label: string): Promise<void> {
  const errors = await page.getByTestId("result-error").allTextContents();
  const pending = await page.getByTestId("result-pending").count();
  const offline = await page.getByTestId("result-warning").count();
  if (errors.length || pending || offline) {
    throw new Error(
      `${label}: errors=${JSON.stringify(errors)} pending=${pending} offline=${offline}`,
    );
  }
}

function encode(frames: string, id: string, locale: Locale, lastFrame: number): void {
  const dir = join(OUT, locale);
  mkdirSync(dir, { recursive: true });
  const input = `-framerate ${FPS} -i "${frames}/f-%06d.png"`;
  const scale = `scale=${OUTPUT_WIDTH}:-2:flags=lanczos`;
  const run = (cmd: string) => execSync(cmd, { stdio: ["ignore", "ignore", "inherit"] });

  run(
    `ffmpeg -y -loglevel error ${input} -vf "${scale},format=yuv420p" ` +
      `-c:v libvpx-vp9 -crf 36 -b:v 0 -row-mt 1 -deadline good -an "${dir}/${id}.webm"`,
  );
  run(
    `ffmpeg -y -loglevel error ${input} -vf "${scale},format=yuv420p" ` +
      `-c:v libx264 -crf 27 -preset slow -profile:v high -movflags +faststart -an "${dir}/${id}.mp4"`,
  );
  const last = `${frames}/f-${String(lastFrame).padStart(6, "0")}.png`;
  run(`ffmpeg -y -loglevel error -i "${last}" -vf "${scale}" "${frames}/poster.png"`);
  run(`cwebp -quiet -q 80 "${frames}/poster.png" -o "${dir}/${id}.webp"`);
  // Phones show the clip about 360 px wide; a half-size poster saves most of the bytes.
  run(`cwebp -quiet -q 80 -resize 640 0 "${frames}/poster.png" -o "${dir}/${id}-640.webp"`);
}

async function main(): Promise<void> {
  const only = process.argv.slice(2);
  const scenes = only.length ? SCENES.filter((s) => only.includes(s.id)) : SCENES;
  for (const scene of scenes) {
    for (const locale of ["en", "pt"] as const) {
      await record(scene, locale);
      console.log(`recorded ${locale}/${scene.id}`);
    }
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
