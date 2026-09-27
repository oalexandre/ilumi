import { readFileSync } from "node:fs";
import { join } from "node:path";

import type { SceneId } from "./content";
import type { Locale } from "./site";

export interface TranscriptLine {
  input: string;
  result: string;
}

/** Size of the recorded clips and posters (e2e/record-site-media.ts). */
export const CLIP_SIZE = { width: 1280, height: 534 };

/**
 * The lines typed in a clip and the results the app showed, written by the recorder
 * next to the media. Read at build time so the page text always matches the video.
 */
export function transcript(locale: Locale, id: SceneId | "light"): TranscriptLine[] {
  const file = join(process.cwd(), "public", "media", locale, `${id}.json`);
  const data = JSON.parse(readFileSync(file, "utf-8")) as { lines: TranscriptLine[] };
  return data.lines;
}

export function mediaPath(locale: Locale, id: SceneId | "light", ext: "webm" | "mp4" | "webp"): string {
  return `/media/${locale}/${id}.${ext}`;
}

/** Poster sources for `srcSet`: half size for phones, full size for everything else. */
export function posterSrcSet(locale: Locale, id: SceneId | "light"): string {
  return `/media/${locale}/${id}-640.webp 640w, ${mediaPath(locale, id, "webp")} 1280w`;
}

/** Clips fill the column: the whole width on narrow screens, about 58% beside the text. */
export const CLIP_SIZES = "(max-width: 960px) 100vw, 700px";
