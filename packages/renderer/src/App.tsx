import { useState, useCallback, useEffect, useRef } from "react";
import { toPng } from "html-to-image";

import logoSvg from "../../../assets/logo.svg";

import { EditorPane } from "./components/editor-pane";
import { HelpPanel } from "./components/help-panel";
import { ResultsPane } from "./components/results-pane";
import { SettingsPanel } from "./components/settings-panel";
import { TabBar } from "./components/tab-bar";
import { useEngine } from "./hooks/use-engine";
import { useNotes } from "./hooks/use-notes";
import { useTheme } from "./hooks/use-theme";

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

export function App(): React.JSX.Element {
  const { toggle } = useTheme();
  const { results, evaluate } = useEngine();
  const {
    notes,
    activeNote,
    activeId,
    setActiveId,
    updateContent,
    createNote,
    closeNote,
    renameNote,
  } = useNotes();
  const [scrollTop, setScrollTop] = useState(0);
  const [showSettings, setShowSettings] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);

  // Capture initial content only when switching notes — not on every keystroke
  const initialContentRef = useRef(activeNote?.content ?? "");
  const prevActiveIdRef = useRef(activeId);
  if (prevActiveIdRef.current !== activeId) {
    initialContentRef.current = activeNote?.content ?? "";
    prevActiveIdRef.current = activeId;
  }

  const handleChange = useCallback(
    (text: string) => {
      updateContent(text);
      evaluate(text);
    },
    [updateContent, evaluate],
  );

  const handleScroll = useCallback((top: number) => {
    setScrollTop(top);
  }, []);

  const handleShare = useCallback(async () => {
    const node = contentRef.current;
    if (!node) return;

    const pr = 2; // pixel ratio
    const dataUrl = await toPng(node, { pixelRatio: pr });

    // Load captured image and logo in parallel
    const [img, logo] = await Promise.all([loadImage(dataUrl), loadImage(logoSvg)]);

    // --- Card dimensions ---
    const pad = 32 * pr; // outer padding around content
    const contentRadius = 12 * pr;
    const cardRadius = 16 * pr;
    const accentH = 1.5 * pr; // gold accent line height
    const brandH = 44 * pr; // branding strip height
    const shadowSpread = 24 * pr;

    const cardW = img.width + pad * 2;
    const cardH = img.height + pad + accentH + brandH + pad;
    const totalW = cardW + shadowSpread * 2;
    const totalH = cardH + shadowSpread * 2;

    const canvas = document.createElement("canvas");
    canvas.width = totalW;
    canvas.height = totalH;
    const ctx = canvas.getContext("2d")!;

    // --- Outer shadow (baked in so it floats on any bg) ---
    ctx.shadowColor = "rgba(0, 0, 0, 0.45)";
    ctx.shadowBlur = shadowSpread;
    ctx.shadowOffsetY = 8 * pr;

    // --- Card background ---
    const cx = shadowSpread;
    const cy = shadowSpread;
    ctx.beginPath();
    ctx.roundRect(cx, cy, cardW, cardH, cardRadius);
    ctx.fillStyle = "#0f0e17";
    ctx.fill();

    // Reset shadow for remaining draws
    ctx.shadowColor = "transparent";
    ctx.shadowBlur = 0;
    ctx.shadowOffsetY = 0;

    // --- Subtle border (gold-tinted) ---
    ctx.beginPath();
    ctx.roundRect(cx, cy, cardW, cardH, cardRadius);
    ctx.strokeStyle = "rgba(240, 184, 0, 0.12)";
    ctx.lineWidth = 1 * pr;
    ctx.stroke();

    // --- Content image (clipped with rounded corners) ---
    const imgX = cx + pad;
    const imgY = cy + pad;
    ctx.save();
    ctx.beginPath();
    ctx.roundRect(imgX, imgY, img.width, img.height, contentRadius);
    ctx.clip();
    ctx.drawImage(img, imgX, imgY);
    ctx.restore();

    // Subtle inset border on content
    ctx.beginPath();
    ctx.roundRect(imgX, imgY, img.width, img.height, contentRadius);
    ctx.strokeStyle = "rgba(255, 255, 255, 0.06)";
    ctx.lineWidth = 1 * pr;
    ctx.stroke();

    // --- Gold accent line ---
    const lineY = imgY + img.height + Math.round(pad * 0.35);
    const lineX = imgX;
    const lineW = img.width;
    const gradient = ctx.createLinearGradient(lineX, 0, lineX + lineW, 0);
    gradient.addColorStop(0, "rgba(255, 224, 102, 0)");
    gradient.addColorStop(0.15, "rgba(240, 184, 0, 0.6)");
    gradient.addColorStop(0.85, "rgba(240, 184, 0, 0.6)");
    gradient.addColorStop(1, "rgba(255, 224, 102, 0)");
    ctx.fillStyle = gradient;
    ctx.fillRect(lineX, lineY, lineW, accentH);

    // --- Branding: logo + "ilumi" right-aligned ---
    const brandLogoSize = 18 * pr;
    const brandGap = 7 * pr;
    const brandFontSize = 13 * pr;

    ctx.font = `500 ${brandFontSize}px "SF Pro Display", "Segoe UI", system-ui, sans-serif`;
    const brandText = "ilumi";
    const brandTextW = ctx.measureText(brandText).width;

    const brandTotalW = brandLogoSize + brandGap + brandTextW;
    const brandX = cx + cardW - pad - brandTotalW;
    const brandCenterY = lineY + accentH + (cy + cardH - (lineY + accentH)) / 2;

    // Logo
    ctx.drawImage(logo, brandX, brandCenterY - brandLogoSize / 2, brandLogoSize, brandLogoSize);

    // "ilumi" text in gold gradient
    const textGrad = ctx.createLinearGradient(
      brandX + brandLogoSize + brandGap,
      brandCenterY - brandFontSize / 2,
      brandX + brandLogoSize + brandGap,
      brandCenterY + brandFontSize / 2,
    );
    textGrad.addColorStop(0, "#ffe066");
    textGrad.addColorStop(0.5, "#f0b800");
    textGrad.addColorStop(1, "#cc8800");
    ctx.fillStyle = textGrad;
    ctx.textBaseline = "middle";
    ctx.fillText(brandText, brandX + brandLogoSize + brandGap, brandCenterY);

    const blob = await new Promise<Blob | null>((r) => canvas.toBlob(r, "image/png"));
    if (!blob) return;
    await navigator.clipboard.write([new ClipboardItem({ "image/png": blob })]);
  }, []);

  // Menu keyboard shortcut handlers
  useEffect(() => {
    const cleanups = [
      window.numi.onNewNote(() => createNote()),
      window.numi.onCloseNote(() => {
        if (notes.length > 1) closeNote(activeId);
      }),
      window.numi.onToggleTheme(() => toggle()),
      window.numi.onCopyAllResults(() => {
        const text = results
          .filter((r) => r.formatted)
          .map((r) => r.formatted)
          .join("\n");
        if (text) navigator.clipboard.writeText(text);
      }),
    ];
    return () => cleanups.forEach((fn) => fn());
  }, [createNote, closeNote, activeId, notes.length, toggle, results]);

  // Cmd/Ctrl+, for settings
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === ",") {
        e.preventDefault();
        setShowSettings((v) => !v);
      }
      if (e.key === "Escape") {
        if (showSettings) setShowSettings(false);
        if (showHelp) setShowHelp(false);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [showSettings, showHelp]);

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden">
      <div className="titlebar-drag-region" />
      <div ref={contentRef} className="flex flex-1 overflow-hidden app-content">
        <EditorPane
          key={activeId}
          initialContent={initialContentRef.current}
          onChange={handleChange}
          onScroll={handleScroll}
        />
        <ResultsPane results={results} scrollTop={scrollTop} />
      </div>
      <TabBar
        notes={notes}
        activeId={activeId}
        onSelect={setActiveId}
        onCreate={createNote}
        onClose={closeNote}
        onRename={renameNote}
        onShare={handleShare}
        onHelp={() => setShowHelp(true)}
      />
      <SettingsPanel visible={showSettings} onClose={() => setShowSettings(false)} />
      <HelpPanel visible={showHelp} onClose={() => setShowHelp(false)} />
    </div>
  );
}
