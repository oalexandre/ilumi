---
name: Ilumi
description: A notepad calculator's site, dark violet-black, one gold accent, math shown as the app types it.
colors:
  night-violet: "#0b0a12"
  night-raised: "#13121e"
  night-code: "#0f0e19"
  app-window: "#1e1e2e"
  hairline: "#1f1d2e"
  hairline-strong: "#2c2a40"
  gold-rule: "rgba(240, 184, 0, 0.2)"
  lamp-gold: "#f0b800"
  lamp-gold-soft: "#ffe066"
  gold-wash: "rgba(240, 184, 0, 0.1)"
  paper-text: "#e9e7f3"
  lilac-secondary: "#a19eb8"
  lilac-muted: "#8784a0"
  result-green: "#a6e3a1"
  input-periwinkle: "#cdd6f4"
  syntax-number: "#7ec8e3"
  syntax-variable: "#ffcb6b"
  syntax-keyword: "#c792ea"
  syntax-function: "#82aaff"
  syntax-operator: "#89ddff"
typography:
  display:
    fontFamily: "Inter, system-ui, -apple-system, Segoe UI, sans-serif"
    fontSize: "clamp(2.6rem, 1.4rem + 3.6vw, 4.4rem)"
    fontWeight: 650
    lineHeight: 1.02
    letterSpacing: "-0.035em"
  headline:
    fontFamily: "Inter, system-ui, -apple-system, Segoe UI, sans-serif"
    fontSize: "clamp(1.8rem, 1.2rem + 1.8vw, 2.6rem)"
    fontWeight: 650
    lineHeight: 1.1
    letterSpacing: "-0.028em"
  title:
    fontFamily: "Inter, system-ui, -apple-system, Segoe UI, sans-serif"
    fontSize: "1.0625rem"
    fontWeight: 650
    letterSpacing: "-0.01em"
  body-lead:
    fontFamily: "Inter, system-ui, -apple-system, Segoe UI, sans-serif"
    fontSize: "1.125rem"
    fontWeight: 400
    lineHeight: 1.6
  body:
    fontFamily: "Inter, system-ui, -apple-system, Segoe UI, sans-serif"
    fontSize: "1rem"
    fontWeight: 400
    lineHeight: 1.6
  label:
    fontFamily: "Inter, system-ui, -apple-system, Segoe UI, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 400
  mono:
    fontFamily: "JetBrains Mono, ui-monospace, SF Mono, Menlo, monospace"
    fontSize: "0.875rem"
    fontWeight: 400
    fontFeature: "liga 0"
rounded:
  code: "5px"
  item: "8px"
  control: "12px"
  window: "14px"
  pill: "999px"
spacing:
  gutter: "clamp(20px, 4vw, 48px)"
  max: "1200px"
  band: "clamp(96px, 12vw, 160px)"
  scene-band: "clamp(80px, 11vw, 140px)"
components:
  button-download:
    backgroundColor: "{colors.lamp-gold}"
    textColor: "{colors.night-violet}"
    rounded: "{rounded.control}"
    padding: "0 20px"
    height: "48px"
  button-download-hover:
    backgroundColor: "{colors.lamp-gold-soft}"
    textColor: "{colors.night-violet}"
  platform-menu:
    backgroundColor: "{colors.night-raised}"
    textColor: "{colors.paper-text}"
    rounded: "{rounded.control}"
    padding: "6px"
    width: "min(340px, calc(100vw - 2 * var(--gutter)))"
  platform-menu-item-hover:
    backgroundColor: "{colors.gold-wash}"
    rounded: "{rounded.item}"
    padding: "9px 12px"
  app-window:
    backgroundColor: "{colors.app-window}"
    rounded: "{rounded.window}"
  transcript:
    backgroundColor: "{colors.night-code}"
    textColor: "{colors.input-periwinkle}"
    typography: "{typography.mono}"
    rounded: "{rounded.control}"
    padding: "6px 18px"
  pill-toggle:
    backgroundColor: "{colors.night-violet}"
    textColor: "{colors.lilac-muted}"
    rounded: "{rounded.pill}"
    padding: "5px 10px"
  pill-toggle-hover:
    textColor: "{colors.paper-text}"
  kbd-key:
    backgroundColor: "{colors.night-raised}"
    textColor: "{colors.lilac-secondary}"
    rounded: "7px"
    padding: "3px 9px"
  nav-link:
    textColor: "{colors.lilac-secondary}"
  nav-link-hover:
    textColor: "{colors.paper-text}"
---

# Design System: Ilumi

## Overview

**Creative North Star: "The Lit Note at Night"**

The site is a dark room with one lamp. The ground is a near-black with a violet cast, text is a soft lavender-white, and a single gold is the only warm thing on the page. Real recordings of the app sit in framed windows; everything around them is quiet Inter prose set left in a 12-column grid, alternating sides scene by scene, divided by faint gold hairlines.

What the visitor types is always mono and always reads like the app: inputs in periwinkle with the app's syntax colours, results right-aligned in green, and the line the note builds toward (its "moment") in gold. Prose never borrows the mono face except the wordmark and the language pill; typed math never appears in Inter.

Density is generous: long bands (80 to 160px), short measures (38 to 46ch for leads), and no cards, tiles or icon grids. Depth comes from the app windows alone, and exactly one of them, the hero note, is lit from below in gold.

**Key Characteristics:**
- One accent, gold, rare by construction: CTA, wordmark "il", moment results, FAQ marks, focus ring, section rules.
- Real app recordings in rounded windows are the only imagery.
- Math is mono and mirrors the app's syntax theme; prose is Inter.
- Split 5/7 grid rows that alternate sides; one column under 960px.
- Hairline dividers instead of containers.

## Colors

A cool violet-black night with one warm lamp and the app's own syntax palette for typed text.

### Primary
- **Lamp Gold** (`lamp-gold`): the download button fill, the "il" of the wordmark, the moment result in a transcript and hero caption, the FAQ plus/minus bars, the focus outline, link underlines (at 50% alpha) and text selection (at 32%). Hover on the gold button lightens to **Soft Lamp** (`lamp-gold-soft`).
- **Gold Rule** (`gold-rule`): the 1px border-top between scenes, toolkit, FAQ and footer. The only structural use of the accent.
- **Gold Wash** (`gold-wash`): hover and focus fill of platform-menu rows.

### Secondary
- **Result Green** (`result-green`): computed results in transcripts, and nothing else. Green means "the app answered".

### Neutral
- **Night Violet** (`night-violet`): page ground; also the text colour on gold.
- **Night Raised** (`night-raised`): popovers, `kbd` keys, inline code chips.
- **Night Code** (`night-code`): transcript panels, a half-step off the ground.
- **App Window** (`app-window`): the frame behind recordings, matching the app's own background.
- **Hairline** (`hairline`) and **Hairline Strong** (`hairline-strong`): row dividers inside lists and transcripts; strong for control borders (pills, keys, menu).
- **Paper Text** (`paper-text`): headings and primary text.
- **Lilac Secondary** (`lilac-secondary`): leads, body copy under headings, nav links.
- **Lilac Muted** (`lilac-muted`): captions, meta lines, footer, comments in transcripts.
- **Input Periwinkle** (`input-periwinkle`): default colour of typed input in transcripts.

### Syntax
`syntax-number`, `syntax-variable`, `syntax-keyword`, `syntax-function`, `syntax-operator` mirror the app's dark editor theme so a transcript reads as the same note as the clip beside it. They live only inside transcripts.

### Named Rules
**The One Lamp Rule.** Gold is the only accent. It marks the action, the moment, and the seams; it never fills a surface larger than the download button.

**The Green Means Answered Rule.** Result green is reserved for computed results. Never use it for success states, badges or decoration.

## Typography

**Display Font:** Inter (self-hosted via next/font, with system-ui fallback)
**Body Font:** Inter
**Label/Mono Font:** JetBrains Mono (ligatures off), not preloaded

**Character:** A tight, heavy Inter (650) for headings with negative tracking against relaxed 1.6 body; mono is the voice of the app, not of the site.

### Hierarchy
- **Display** (650, clamp 2.6 to 4.4rem, 1.02, -0.035em): the hero promise only. The closing call uses a smaller display (clamp 2.2 to 3.6rem, -0.034em).
- **Headline** (650, clamp 1.8 to 2.6rem, 1.1, -0.028em): scene, toolkit and FAQ headings.
- **Title** (650, 1.0625rem, -0.01em): toolkit item headings; FAQ questions use the same size at 600.
- **Body lead** (400, 1.125rem hero / 1.0625rem scenes, 1.6): max 38 to 46ch, Lilac Secondary.
- **Body** (400, 1rem, 1.6): FAQ answers at max 68ch.
- **Label** (0.8125 to 0.9375rem): nav, captions, meta, toggle; muted.
- **Mono** (0.875rem, 0.8125rem compact and on phones): transcripts, `kbd`, inline code, wordmark (1.25rem, 700, -0.02em), language pill.

Headings use `text-wrap: balance`; paragraphs `text-wrap: pretty`; results use tabular numerals.

### Named Rules
**The Typed Is Mono Rule.** Anything a user would type into Ilumi is JetBrains Mono with ligatures off; prose is Inter. Brand exceptions: the wordmark and the language pill.

## Layout

A centred container of 1200px plus a fluid gutter (clamp 20 to 48px) on each side. Every band is a 12-column grid: hero copy spans 5 columns and the hero window 7; scenes put copy and transcript in 5 columns and the clip in 7, alternating sides on every other scene (flipped copy starts at column 8). Toolkit is a sticky 5-column intro beside a 6-column list starting at column 7; FAQ is a 4-column heading beside an 8-column list. The closing call is the only centred block (max 760px).

Vertical rhythm is band-level: scenes at clamp(80px, 11vw, 140px), other bands at clamp(96px, 12vw, 160px). Below 960px every grid collapses to one column, ordered heading and copy, clip, then transcript. Below 560px nav links hide except the language pill and transcripts tighten.

## Elevation & Depth

Flat ground; depth belongs to the app windows and to the one popover. Windows carry a 1px white ring at 7% plus a long soft drop. The hero window alone adds a gold under-light. The download button has a soft gold glow beneath it. Motion is short and eased with `cubic-bezier(0.16, 1, 0.3, 1)`: the hero window rises in (1.1s, blur and scale), the menu drops in (0.22s), clips fade in over their posters (0.3s). All animation and transition is removed under reduced motion.

### Shadow Vocabulary
- **Window** (`box-shadow: 0 0 0 1px rgba(255,255,255,0.07), 0 24px 48px -16px rgba(0,0,0,0.7)`): every app window.
- **Lit window** (Window plus `0 48px 96px -48px rgba(240,184,0,0.22)`): the hero note only.
- **Gold glow** (`box-shadow: 0 10px 24px -12px rgba(240,184,0,0.55)`): the download button.
- **Popover** (`box-shadow: 0 18px 40px -12px rgba(0,0,0,0.8)`): the platform menu.

### Named Rules
**The One Lit Object Rule.** Exactly one window per page gets the gold under-light: the first note the visitor sees.

## Shapes

Softly rounded rectangles, graded by size: windows and clips 14px, controls and panels (download button, menu, transcripts) 12px, menu rows and the skip link 8px, keys 7px, inline code 5px, and full pills for the language switch and play/pause toggle. Keys get a 2px bottom border for a pressable edge. Borders are 1px hairlines; lists are separated by border-top rules, not boxes.

## Components

### Buttons
- **Shape:** 12px radius, 48px tall, split in two.
- **Download (primary):** Lamp Gold fill, Night Violet 600 1rem label with an inline stroke download arrow; a chevron half opens the platform menu, divided by a 1px dark line at 22%.
- **Hover / Focus:** fill lightens to Soft Lamp over 0.2s; focus is the global 2px gold outline, 3px offset.
- **Meta line:** version and "free, open source" in muted 0.875rem beside the button.

### Chips
- **Pill toggle** (play/pause under each window, bottom-right): Night Violet ground, Hairline Strong border, muted 500 0.8125rem; hover or focus lifts text to Paper and border to muted.
- **Language pill:** mono 0.8125rem, Hairline Strong border, full radius.

### Cards / Containers
No cards. The containers are the **app window** (App Window fill, 14px, Window shadow, caption hung below it in muted 0.875rem) and the **transcript**.

### Navigation
Mono wordmark plus logo at left; Inter 0.9375rem links in Lilac Secondary, Paper on hover; the language pill last.

### Transcript (signature)
A definition list styled as the app: Night Code panel, 1px Hairline border, 12px radius, mono 0.875rem. Each row puts the highlighted input left and the green result right, wrapping the result below, right-aligned, when it does not fit. The moment row's result turns gold and bold. A compact variant (0.8125rem, 4px 14px) sits inside toolkit items.

### Platform Menu
Night Raised popover, 12px radius, Hairline Strong border, 6px inset; rows with name left and muted detail right, Gold Wash on hover; "All releases" in gold.

### FAQ Disclosure
Native details, hairline top and bottom, 600 1.0625rem questions, a gold plus drawn from two 14px bars that rotates to minus on open.

## Do's and Don'ts

### Do:
- **Do** show typed math as a transcript or real clip, with results in Result Green and the moment in Lamp Gold.
- **Do** keep scenes on the 5/7 split and alternate sides.
- **Do** separate bands with the 1px Gold Rule and list items with Hairline.
- **Do** give every clip a real poster, a pause toggle and a readable text transcript beside it.
- **Do** keep the ground Night Violet and put depth only on app windows and popovers.

### Don't:
- **Don't** add a second accent colour or use gold as a large surface fill.
- **Don't** set prose in JetBrains Mono or typed math in Inter.
- **Don't** use result green outside computed results.
- **Don't** light more than one window with the gold under-light.
- **Don't** replace recordings with illustrations, icon tiles or mock UI.
