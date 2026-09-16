import { useState, useEffect } from "react";

function IlumiLogo(): React.JSX.Element {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="64" height="64">
      <defs>
        <linearGradient id="hlp-bg" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#1e1b2e" />
          <stop offset="100%" stopColor="#121020" />
        </linearGradient>
        <radialGradient id="hlp-glow" cx="50%" cy="38%" r="28%">
          <stop offset="0%" stopColor="#ffc800" stopOpacity="0.16" />
          <stop offset="100%" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="hlp-gold" x1="0.5" y1="0" x2="0.5" y2="1">
          <stop offset="0%" stopColor="#ffe066" />
          <stop offset="50%" stopColor="#f0b800" />
          <stop offset="100%" stopColor="#cc8800" />
        </linearGradient>
      </defs>
      <rect x="16" y="16" width="480" height="480" rx="96" fill="url(#hlp-bg)" />
      <circle cx="256" cy="165" r="130" fill="url(#hlp-glow)" />
      <rect x="249" y="68" width="14" height="118" rx="7" fill="url(#hlp-gold)" />
      <rect x="198" y="120" width="116" height="14" rx="7" fill="url(#hlp-gold)" />
      <rect x="198" y="208" width="116" height="14" rx="7" fill="url(#hlp-gold)" />
      <rect x="230" y="272" width="52" height="138" rx="14" fill="url(#hlp-gold)" />
    </svg>
  );
}

interface HelpEntry {
  title: string;
  description?: string;
  examples: Array<{ input: string; output: string; desc?: string }>;
}

interface HelpPanelProps {
  visible: boolean;
  onClose: () => void;
  /** Opens the release notes of the running version; hidden when undefined. */
  onWhatsNew?: () => void;
}

export function HelpPanel({
  visible,
  onClose,
  onWhatsNew,
}: HelpPanelProps): React.JSX.Element | null {
  const [coreSections, setCoreSections] = useState<HelpEntry[]>([]);
  const [communitySections, setCommunitySections] = useState<HelpEntry[]>([]);

  useEffect(() => {
    if (visible) {
      window.numi
        .getHelpSections()
        .then((sections) => {
          setCoreSections(sections.core);
          setCommunitySections(sections.community);
        })
        .catch(() => {});
    }
  }, [visible]);

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
          width: "560px",
          maxHeight: "85vh",
          overflow: "auto",
          padding: "24px",
          fontFamily: "system-ui, sans-serif",
          fontSize: "13px",
          color: "var(--text-primary)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex flex-col items-center" style={{ marginBottom: "20px" }}>
          <button
            onClick={onClose}
            style={{
              background: "transparent",
              border: "none",
              color: "var(--text-muted)",
              fontSize: "18px",
              cursor: "pointer",
              padding: "4px 8px",
              alignSelf: "flex-end",
            }}
          >
            ×
          </button>
          <IlumiLogo />
          <h2 style={{ fontSize: "16px", fontWeight: 600, marginTop: "10px" }}>Quick Reference</h2>
          <span style={{ fontSize: "11px", color: "var(--text-muted)", marginTop: "2px" }}>
            ilumi.oalexandre.com.br
          </span>
          {onWhatsNew && (
            <button
              onClick={onWhatsNew}
              style={{
                background: "transparent",
                border: "none",
                color: "var(--accent)",
                fontSize: "12px",
                cursor: "pointer",
                marginTop: "6px",
                padding: 0,
              }}
            >
              What's new in this version
            </button>
          )}
        </div>

        {/* Static: language features */}
        <Section title="Basic Arithmetic">
          <Example input="2 + 3" output="5" />
          <Example input="10 - 4" output="6" />
          <Example input="6 * 7" output="42" />
          <Example input="100 / 4" output="25" />
          <Example input="2 ^ 10" output="1,024" />
          <Example input="10 mod 3" output="1" />
        </Section>

        <Section title="Variables">
          <Desc>Assign values to names and reuse them across lines.</Desc>
          <Example input="price = 100" output="100" />
          <Example input="tax = 8.5" output="8.5" />
          <Example input="price + tax" output="108.5" />
        </Section>

        <Section title="Percentages">
          <Example input="100 + 5%" output="105" desc="add 5%" />
          <Example input="200 - 10%" output="180" desc="subtract 10%" />
          <Example input="5% of 200" output="10" />
          <Example input="10% off 50" output="45" desc="discount" />
          <Example input="10% on 50" output="55" desc="markup" />
        </Section>

        <Section title="Bitwise Operations">
          <Example input="0xFF AND 0x0F" output="15" />
          <Example input="0xF0 OR 0x0F" output="255" />
          <Example input="0xFF XOR 0x0F" output="240" />
          <Example input="NOT 0" output="4,294,967,295" />
          <Example input="1 << 4" output="16" />
        </Section>

        <Section title="Comments">
          <Desc>Lines starting with // or # are ignored.</Desc>
          <Example input="// shopping list" output="" />
          <Example input="# notes here" output="" />
        </Section>

        {/* Dynamic: core plugin help */}
        {coreSections.map((section, i) => (
          <Section key={`core-${i}`} title={section.title}>
            {section.description && <Desc>{section.description}</Desc>}
            {section.examples.map((ex, j) => (
              <Example key={j} input={ex.input} output={ex.output} desc={ex.desc} />
            ))}
          </Section>
        ))}

        {/* Dynamic: community plugin help */}
        {communitySections.length > 0 && (
          <div style={{ marginTop: "8px", marginBottom: "12px" }}>
            <span
              style={{
                fontSize: "11px",
                fontWeight: 600,
                color: "var(--text-muted)",
                textTransform: "uppercase",
                letterSpacing: "0.5px",
              }}
            >
              Community Plugins
            </span>
          </div>
        )}
        {communitySections.map((section, i) => (
          <Section key={`comm-${i}`} title={section.title}>
            {section.description && <Desc>{section.description}</Desc>}
            {section.examples.map((ex, j) => (
              <Example key={j} input={ex.input} output={ex.output} desc={ex.desc} />
            ))}
          </Section>
        ))}

        {/* Static: keyboard shortcuts (always last) */}
        <Section title="Keyboard Shortcuts" last>
          <Shortcut keys="Cmd/Ctrl + N" action="New note" />
          <Shortcut keys="Cmd/Ctrl + W" action="Close note" />
          <Shortcut keys="Cmd/Ctrl + ," action="Settings" />
          <Shortcut keys="Cmd/Ctrl + Shift + T" action="Toggle theme" />
          <Shortcut keys="Cmd/Ctrl + Shift + C" action="Copy current result" />
          <Shortcut keys="Cmd/Ctrl + Shift + A" action="Copy all results" />
        </Section>
      </div>
    </div>
  );
}

function Section({
  title,
  children,
  last,
}: {
  title: string;
  children: React.ReactNode;
  last?: boolean;
}): React.JSX.Element {
  return (
    <div
      style={{
        marginBottom: last ? 0 : "16px",
        paddingBottom: last ? 0 : "12px",
        borderBottom: last ? "none" : "1px solid var(--border)",
      }}
    >
      <h3
        style={{ fontSize: "13px", fontWeight: 600, marginBottom: "8px", color: "var(--accent)" }}
      >
        {title}
      </h3>
      {children}
    </div>
  );
}

function Desc({ children }: { children: React.ReactNode }): React.JSX.Element {
  return (
    <p style={{ color: "var(--text-muted)", marginBottom: "6px", fontSize: "12px" }}>{children}</p>
  );
}

function Example({
  input,
  output,
  desc,
}: {
  input: string;
  output: string;
  desc?: string;
}): React.JSX.Element {
  return (
    <div className="flex items-center" style={{ padding: "2px 0", gap: "8px" }}>
      <code
        style={{
          fontFamily: "inherit",
          color: "var(--text-primary)",
          minWidth: "220px",
        }}
      >
        {input}
      </code>
      {output && (
        <span style={{ color: "var(--text-result)", fontFamily: "monospace" }}>{output}</span>
      )}
      {desc && (
        <span style={{ color: "var(--text-muted)", fontSize: "11px", marginLeft: "4px" }}>
          ({desc})
        </span>
      )}
    </div>
  );
}

function Shortcut({ keys, action }: { keys: string; action: string }): React.JSX.Element {
  return (
    <div className="flex items-center justify-between" style={{ padding: "2px 0" }}>
      <span>{action}</span>
      <kbd
        style={{
          background: "var(--bg-results)",
          border: "1px solid var(--border)",
          borderRadius: "3px",
          padding: "1px 6px",
          fontSize: "11px",
          fontFamily: "monospace",
        }}
      >
        {keys}
      </kbd>
    </div>
  );
}
