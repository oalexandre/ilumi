/**
 * Renders the social preview images (public/og-<locale>.png, 1200×630) from the real
 * app poster and the page's headline.
 *
 * Usage (from the repo root, after recording the media):
 *   npx tsx website/scripts/og.ts
 */

import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { chromium } from "playwright";

import { content } from "../src/lib/content";

const WEB = resolve(dirname(fileURLToPath(import.meta.url)), "..");

function dataUri(path: string, type: string): string {
  return `data:${type};base64,${readFileSync(path).toString("base64")}`;
}

function html(locale: "en" | "pt"): string {
  const poster = dataUri(resolve(WEB, `public/media/${locale}/groceries.webp`), "image/webp");
  const logo = dataUri(resolve(WEB, "public/logo.svg"), "image/svg+xml");
  const title = content[locale].hero.title;
  return `<!doctype html><html><head>
<link rel="preconnect" href="https://fonts.gstatic.com">
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@500;650&family=JetBrains+Mono:wght@700&display=block" rel="stylesheet">
<style>
  * { margin: 0; box-sizing: border-box; }
  body { width: 1200px; height: 630px; overflow: hidden; background: #0b0a12; color: #e9e7f3;
         font-family: Inter, sans-serif; position: relative; }
  .glow { position: absolute; inset: 0;
          background: radial-gradient(ellipse 60% 70% at 78% 60%, rgba(240,184,0,.13), transparent 70%); }
  .brand { position: absolute; left: 72px; top: 64px; display: flex; align-items: center; gap: 14px; }
  .brand img { width: 44px; height: 44px; }
  .word { font: 700 34px 'JetBrains Mono', monospace; color: #a19eb8; letter-spacing: -0.02em; }
  .word b { color: #f0b800; }
  h1 { position: absolute; left: 72px; top: 170px; width: 430px; font-weight: 650; font-size: 56px;
       line-height: 1.04; letter-spacing: -0.035em; }
  .meta { position: absolute; left: 72px; bottom: 64px; font-size: 22px; color: #a19eb8; font-weight: 500; }
  .window { position: absolute; left: 540px; top: 176px; width: 600px; border-radius: 16px; overflow: hidden;
            box-shadow: 0 0 0 1px rgba(255,255,255,.08), 0 30px 60px -20px rgba(0,0,0,.8); }
  .window img { display: block; width: 100%; }
</style></head><body>
  <div class="glow"></div>
  <div class="brand"><img src="${logo}" alt=""><span class="word"><b>il</b>umi</span></div>
  <h1>${title}</h1>
  <p class="meta">macOS · Windows · Linux</p>
  <div class="window"><img src="${poster}" alt=""></div>
</body></html>`;
}

async function main(): Promise<void> {
  // The installed Chrome avoids downloading a Playwright-pinned browser just for two images.
  const browser = await chromium.launch({ channel: "chrome" });
  const page = await browser.newPage({ viewport: { width: 1200, height: 630 }, deviceScaleFactor: 1 });
  for (const locale of ["en", "pt"] as const) {
    await page.setContent(html(locale), { waitUntil: "networkidle" });
    await page.evaluate(() => document.fonts.ready);
    await page.screenshot({ path: resolve(WEB, `public/og-${locale}.png`) });
    console.log(`wrote public/og-${locale}.png`);
  }
  await browser.close();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
