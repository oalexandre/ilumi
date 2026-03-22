"use client";

import { useEffect, useState, useRef } from "react";

type OS = "mac" | "windows" | "linux" | "unknown";

const BASE = "https://github.com/oalexandre/ilumi/releases/download/v0.1.1";
const RELEASES = "https://github.com/oalexandre/ilumi/releases";

const platforms: { os: OS; label: string; file: string; detail: string }[] = [
  { os: "mac", label: "macOS", file: "Ilumi-0.1.1-arm64.dmg", detail: "Apple Silicon (.dmg)" },
  { os: "mac", label: "macOS Intel", file: "Ilumi-0.1.1-x64.dmg", detail: "Intel (.dmg)" },
  { os: "windows", label: "Windows", file: "Ilumi-Setup-0.1.1-x64.exe", detail: "64-bit (.exe)" },
  { os: "windows", label: "Windows ARM", file: "Ilumi-Setup-0.1.1-arm64.exe", detail: "ARM (.exe)" },
  { os: "linux", label: "Linux", file: "Ilumi_0.1.1_amd64.deb", detail: "x64 (.deb)" },
  { os: "linux", label: "Linux ARM", file: "Ilumi_0.1.1_arm64.deb", detail: "ARM64 (.deb)" },
  { os: "linux", label: "Linux AppImage", file: "Ilumi-0.1.1-x86_64.AppImage", detail: "x64 (.AppImage)" },
  { os: "linux", label: "Linux AppImage ARM", file: "Ilumi-0.1.1-arm64.AppImage", detail: "ARM64 (.AppImage)" },
];

const primaryByOS: Record<OS, string> = {
  mac: "Ilumi-0.1.1-arm64.dmg",
  windows: "Ilumi-Setup-0.1.1-x64.exe",
  linux: "Ilumi_0.1.1_amd64.deb",
  unknown: "",
};

const osLabels: Record<OS, string> = {
  mac: "macOS",
  windows: "Windows",
  linux: "Linux",
  unknown: "",
};

function detectOS(): OS {
  const ua = navigator.userAgent;
  if (/Macintosh|Mac OS/i.test(ua)) return "mac";
  if (/Windows/i.test(ua)) return "windows";
  if (/Linux/i.test(ua)) return "linux";
  return "unknown";
}

export function DownloadButton() {
  const [mounted, setMounted] = useState(false);
  const [os, setOs] = useState<OS>("unknown");
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setOs(detectOS());
    setMounted(true);
  }, []);

  // Close dropdown on outside click
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  const primaryFile = primaryByOS[os];
  const primaryUrl = primaryFile ? `${BASE}/${primaryFile}` : RELEASES;
  const label = mounted && os !== "unknown" ? `Download for ${osLabels[os]}` : "Download";

  return (
    <div className="hero-buttons">
      <div className="dl-group" ref={dropdownRef}>
        <a href={primaryUrl} className="dl-btn">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="7 10 12 15 17 10" />
            <line x1="12" y1="15" x2="12" y2="3" />
          </svg>
          {label}
        </a>
        <button
          className="dl-dropdown-toggle"
          onClick={() => setOpen(!open)}
          aria-label="Other platforms"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points={open ? "18 15 12 9 6 15" : "6 9 12 15 18 9"} />
          </svg>
        </button>

        {open && (
          <div className="dl-dropdown">
            {platforms.map((p) => (
              <a
                key={p.file}
                href={`${BASE}/${p.file}`}
                className="dl-dropdown-item"
                onClick={() => setOpen(false)}
              >
                <span className="dl-dropdown-label">{p.label}</span>
                <span className="dl-dropdown-detail">{p.detail}</span>
              </a>
            ))}
            <a href={RELEASES} className="dl-dropdown-item dl-dropdown-all" target="_blank" rel="noopener noreferrer" onClick={() => setOpen(false)}>
              View all releases →
            </a>
          </div>
        )}
      </div>

      <a href="https://donate.stripe.com/4gMdRb2RKb4vaNxdZ5aZi00" target="_blank" rel="noopener noreferrer" className="donate-btn">
        <span style={{ color: "var(--accent)" }}>♥</span>
        Donate
      </a>

      <div className="dl-meta">
        v0.1.1 · <a href={RELEASES}>All platforms</a>
      </div>

      {mounted && os === "mac" && (
        <p className="dl-note">
          <strong>macOS:</strong> If you see &quot;cannot be opened&quot;, run{" "}
          <code>xattr -cr /path/to/Ilumi.app</code> or go to{" "}
          <em>System Settings → Privacy &amp; Security → Open Anyway</em>.
        </p>
      )}
    </div>
  );
}
