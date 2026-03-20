import { useState, useCallback } from "react";

interface SettingsPanelProps {
  visible: boolean;
  onClose: () => void;
}

type ThemeOption = "auto" | "dark" | "light";

export function SettingsPanel({ visible, onClose }: SettingsPanelProps): React.JSX.Element | null {
  const [theme, setTheme] = useState<ThemeOption>("auto");

  const handleThemeChange = useCallback((value: ThemeOption) => {
    setTheme(value);
    window.numi.setTheme(value);
  }, []);

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
          width: "420px",
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
          <SettingRow label="Theme">
            <select
              value={theme}
              onChange={(e) => handleThemeChange(e.target.value as ThemeOption)}
              style={{
                background: "var(--bg-results)",
                color: "var(--text-primary)",
                border: "1px solid var(--border)",
                borderRadius: "4px",
                padding: "4px 8px",
                fontSize: "13px",
              }}
            >
              <option value="auto">System (auto)</option>
              <option value="dark">Dark</option>
              <option value="light">Light</option>
            </select>
          </SettingRow>

          <SettingRow label="Version">
            <span style={{ color: "var(--text-muted)" }}>0.1.0</span>
          </SettingRow>
        </div>
      </div>
    </div>
  );
}

function SettingRow({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}): React.JSX.Element {
  return (
    <div
      className="flex items-center justify-between"
      style={{
        padding: "10px 0",
        borderBottom: "1px solid var(--border)",
      }}
    >
      <span style={{ color: "var(--text-primary)" }}>{label}</span>
      {children}
    </div>
  );
}
