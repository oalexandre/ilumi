import { useState, useCallback, useEffect } from "react";

import { ShortcutRecorder } from "./shortcut-recorder";

interface SettingsPanelProps {
  visible: boolean;
  onClose: () => void;
}

const DECIMAL_OPTIONS: Array<{ value: number | "auto"; label: string }> = [
  { value: "auto", label: "Auto" },
  ...Array.from({ length: 11 }, (_, i) => ({ value: i, label: String(i) })),
];

const NUMBER_FORMAT_OPTIONS: Array<{ value: NumberFormat; label: string }> = [
  { value: "en-US", label: "1,234.56" },
  { value: "pt-BR", label: "1.234,56" },
  { value: "fr-FR", label: "1 234,56" },
];

const selectStyle: React.CSSProperties = {
  background: "var(--bg-results)",
  color: "var(--text-primary)",
  border: "1px solid var(--border)",
  borderRadius: "4px",
  padding: "4px 8px",
  fontSize: "13px",
};

export function SettingsPanel({ visible, onClose }: SettingsPanelProps): React.JSX.Element | null {
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [version, setVersion] = useState("");
  const [shortcutError, setShortcutError] = useState<string | null>(null);

  useEffect(() => {
    if (!visible) return;
    window.numi
      .getSettings()
      .then(setSettings)
      .catch(() => {});
    window.numi
      .getVersion()
      .then(setVersion)
      .catch(() => {});
  }, [visible]);

  const update = useCallback(
    async <K extends keyof AppSettings>(key: K, value: AppSettings[K]): Promise<boolean> => {
      setSettings((prev) => (prev ? { ...prev, [key]: value } : prev));
      const ok = await window.numi.setSetting(key, value);
      // Re-read so a rejected value (e.g. an unavailable shortcut) rolls back in the UI too.
      window.numi
        .getSettings()
        .then(setSettings)
        .catch(() => {});
      return ok;
    },
    [],
  );

  const handleShortcutChange = useCallback(
    async (accelerator: string) => {
      setShortcutError(null);
      const ok = await update("globalShortcut", accelerator);
      if (!ok) setShortcutError("This shortcut is not available. The previous one was kept.");
    },
    [update],
  );

  if (!visible) return null;

  return (
    <div
      className="fixed inset-0 flex items-center justify-center"
      style={{ zIndex: 100, background: "rgba(0,0,0,0.5)" }}
      onClick={onClose}
    >
      <div
        className="rounded-lg"
        style={{
          background: "var(--bg-primary)",
          border: "1px solid var(--border)",
          width: "460px",
          maxHeight: "80vh",
          overflow: "auto",
          padding: "24px",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between" style={{ marginBottom: "20px" }}>
          <h2
            style={{
              fontSize: "16px",
              fontWeight: 600,
              fontFamily: "system-ui, sans-serif",
              color: "var(--text-primary)",
            }}
          >
            Settings
          </h2>
          <button
            onClick={onClose}
            style={{
              background: "transparent",
              border: "none",
              color: "var(--text-muted)",
              fontSize: "18px",
              cursor: "pointer",
              padding: "4px 8px",
            }}
          >
            ×
          </button>
        </div>

        <div style={{ fontFamily: "system-ui, sans-serif", fontSize: "13px" }}>
          <SectionTitle>Appearance</SectionTitle>
          <SettingRow label="Theme">
            <select
              value={settings?.theme ?? "auto"}
              onChange={(e) => update("theme", e.target.value as AppSettings["theme"])}
              style={selectStyle}
            >
              <option value="auto">System (auto)</option>
              <option value="dark">Dark</option>
              <option value="light">Light</option>
            </select>
          </SettingRow>

          <SectionTitle>Window</SectionTitle>
          <SettingRow
            label="Global shortcut"
            hint={shortcutError ?? "Shows or hides Ilumi from any app"}
            hintIsError={shortcutError !== null}
          >
            <ShortcutRecorder
              value={settings?.globalShortcut ?? ""}
              onChange={handleShortcutChange}
            />
          </SettingRow>
          <SettingRow label="Always on top" hint="Keep the window above other apps">
            <Toggle
              checked={settings?.alwaysOnTop ?? false}
              onChange={(v) => update("alwaysOnTop", v)}
            />
          </SettingRow>

          <SectionTitle>Numbers</SectionTitle>
          <SettingRow label="Number format">
            <select
              value={settings?.numberFormat ?? "en-US"}
              onChange={(e) => update("numberFormat", e.target.value as NumberFormat)}
              style={selectStyle}
            >
              {NUMBER_FORMAT_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </SettingRow>
          <SettingRow label="Decimal places" hint="Maximum shown; trailing zeros are dropped">
            <select
              value={String(settings?.maxDecimals ?? "auto")}
              onChange={(e) =>
                update("maxDecimals", e.target.value === "auto" ? "auto" : Number(e.target.value))
              }
              style={selectStyle}
            >
              {DECIMAL_OPTIONS.map((o) => (
                <option key={String(o.value)} value={String(o.value)}>
                  {o.label}
                </option>
              ))}
            </select>
          </SettingRow>
          <SettingRow label="Thousands separator">
            <Toggle
              checked={settings?.useGrouping ?? true}
              onChange={(v) => update("useGrouping", v)}
            />
          </SettingRow>

          <SectionTitle>About</SectionTitle>
          <SettingRow label="Version">
            <span style={{ color: "var(--text-muted)" }}>{version || "…"}</span>
          </SettingRow>
        </div>
      </div>
    </div>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }): React.JSX.Element {
  return (
    <div
      style={{
        marginTop: "14px",
        marginBottom: "2px",
        fontSize: "11px",
        fontWeight: 600,
        letterSpacing: "0.06em",
        textTransform: "uppercase",
        color: "var(--text-muted)",
      }}
    >
      {children}
    </div>
  );
}

function SettingRow({
  label,
  hint,
  hintIsError = false,
  children,
}: {
  label: string;
  hint?: string;
  hintIsError?: boolean;
  children: React.ReactNode;
}): React.JSX.Element {
  return (
    <div
      className="flex items-center justify-between"
      style={{
        padding: "10px 0",
        borderBottom: "1px solid var(--border)",
        gap: "16px",
      }}
    >
      <div style={{ minWidth: 0 }}>
        <div style={{ color: "var(--text-primary)" }}>{label}</div>
        {hint && (
          <div
            style={{
              marginTop: "2px",
              fontSize: "11px",
              color: hintIsError ? "var(--text-error)" : "var(--text-muted)",
            }}
          >
            {hint}
          </div>
        )}
      </div>
      {children}
    </div>
  );
}

function Toggle({
  checked,
  onChange,
}: {
  checked: boolean;
  onChange: (value: boolean) => void;
}): React.JSX.Element {
  return (
    <button
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      style={{
        width: "36px",
        height: "20px",
        borderRadius: "10px",
        border: "1px solid var(--border)",
        background: checked ? "var(--accent)" : "var(--bg-results)",
        position: "relative",
        cursor: "pointer",
        flexShrink: 0,
        transition: "background 0.15s",
      }}
    >
      <span
        style={{
          position: "absolute",
          top: "2px",
          left: checked ? "17px" : "2px",
          width: "14px",
          height: "14px",
          borderRadius: "50%",
          background: checked ? "#fff" : "var(--text-muted)",
          transition: "left 0.15s",
        }}
      />
    </button>
  );
}
