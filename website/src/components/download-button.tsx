"use client";

import { useEffect, useId, useRef, useState } from "react";

import type { Content } from "@/lib/content";
import { BUILDS, PRIMARY_BUILD, RELEASES_URL, VERSION, type OS } from "@/lib/site";

function detectOS(): OS | null {
  const ua = navigator.userAgent;
  if (/Macintosh|Mac OS/i.test(ua)) return "mac";
  if (/Windows/i.test(ua)) return "windows";
  if (/Linux/i.test(ua) && !/Android/i.test(ua)) return "linux";
  return null;
}

const OS_NAME: Record<OS, string> = { mac: "macOS", windows: "Windows", linux: "Linux" };

interface DownloadButtonProps {
  copy: Content["download"];
  /** Show the note about opening the unsigned macOS build. */
  showMacNote?: boolean;
}

export function DownloadButton({ copy, showMacNote = false }: DownloadButtonProps) {
  const [os, setOs] = useState<OS | null>(null);
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const menuId = useId();

  useEffect(() => setOs(detectOS()), []);

  useEffect(() => {
    if (!open) return;
    const onPointer = (e: PointerEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("pointerdown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  // Before detection (and without JavaScript) the button leads to the releases page.
  const primary = os ? PRIMARY_BUILD[os] : null;

  return (
    <div className="download" ref={rootRef}>
      <div className="download-row">
        <div className="split">
          <a href={primary?.url ?? RELEASES_URL} className="split-main">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M12 3v12M7 10l5 5 5-5M4 19h16" />
            </svg>
            {os ? copy.cta.replace("{os}", OS_NAME[os]) : copy.generic}
          </a>
          <button
            type="button"
            className="split-more"
            aria-label={copy.otherPlatforms}
            aria-expanded={open}
            aria-controls={menuId}
            onClick={() => setOpen((v) => !v)}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d={open ? "M6 15l6-6 6 6" : "M6 9l6 6 6-6"} />
            </svg>
          </button>
        </div>
        <p className="download-meta">
          v{VERSION} · {copy.meta}
        </p>
      </div>

      {open && (
        <ul className="platforms" id={menuId}>
          {BUILDS.map((build) => (
            <li key={build.url}>
              <a href={build.url} onClick={() => setOpen(false)}>
                <span>{build.label}</span>
                <span className="platforms-detail">{build.detail}</span>
              </a>
            </li>
          ))}
          <li>
            <a href={RELEASES_URL} className="platforms-all">
              {copy.allReleases} →
            </a>
          </li>
        </ul>
      )}

      {showMacNote && os === "mac" && (
        <p className="mac-note">
          {copy.macNote.lead} <code>{copy.macNote.command}</code> {copy.macNote.or}{" "}
          <em>{copy.macNote.settings}</em>.
        </p>
      )}
    </div>
  );
}
