interface HelpPanelProps {
  visible: boolean;
  onClose: () => void;
}

export function HelpPanel({ visible, onClose }: HelpPanelProps): React.JSX.Element | null {
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
        <div className="flex items-center justify-between" style={{ marginBottom: "16px" }}>
          <h2 style={{ fontSize: "16px", fontWeight: 600 }}>Quick Reference</h2>
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
          <Example input="total = price * 2" output="200" />
        </Section>

        <Section title="Percentages">
          <Example input="5%" output="0.05" />
          <Example input="100 + 5%" output="105" desc="add 5% of 100" />
          <Example input="200 - 10%" output="180" desc="subtract 10%" />
          <Example input="5% of 200" output="10" />
          <Example input="10% off 50" output="45" desc="discount" />
          <Example input="10% on 50" output="55" desc="markup" />
        </Section>

        <Section title="Math Functions">
          <Desc>Use with parentheses or a space: sqrt(16) or sqrt 16</Desc>
          <Example input="sqrt(16)" output="4" />
          <Example input="abs(-5)" output="5" />
          <Example input="ceil(4.1)" output="5" />
          <Example input="floor(4.9)" output="4" />
          <Example input="round(4.5)" output="5" />
          <Example input="sin(0), cos(0), tan(0)" output="trig" />
          <Example input="log(100)" output="2" desc="log base 10" />
          <Example input="ln(e)" output="1" desc="natural log" />
          <Example input="min(3, 1, 2)" output="1" />
          <Example input="max(3, 1, 2)" output="3" />
        </Section>

        <Section title="Constants">
          <Example input="pi" output="3.14159..." />
          <Example input="e" output="2.71828..." />
          <Example input="tau" output="6.28318..." />
        </Section>

        <Section title="Unit Conversions">
          <Desc>Use in, to, or as to convert between units.</Desc>
          <Example input="5 km to miles" output="3.107 mi" />
          <Example input="100 celsius to fahrenheit" output="212 °F" />
          <Example input="1 kg to pounds" output="2.205 lb" />
          <Example input="1 gallon to liters" output="3.785 L" />
          <Example input="32 px to rem" output="2 rem" />
          <Example input="2 hours to minutes" output="120 min" />
        </Section>

        <Section title="Number Formats">
          <Example input="0xFF" output="255" desc="hexadecimal" />
          <Example input="0b1010" output="10" desc="binary" />
          <Example input="1.5e3" output="1,500" desc="scientific" />
          <Example input="255 in hex" output="0xFF" />
          <Example input="10 in binary" output="0b1010" />
        </Section>

        <Section title="Bitwise Operations">
          <Example input="0xFF AND 0x0F" output="15" />
          <Example input="0xF0 OR 0x0F" output="255" />
          <Example input="0xFF XOR 0x0F" output="240" />
          <Example input="NOT 0" output="4,294,967,295" />
          <Example input="1 << 4" output="16" />
        </Section>

        <Section title="Line References">
          <Desc>Reference results from lines above.</Desc>
          <Example input="sum" output="sum of all above" />
          <Example input="avg" output="average of above" />
          <Example input="prev" output="previous line result" />
          <Example input="count" output="lines with values" />
        </Section>

        <Section title="Comments">
          <Desc>Lines starting with // or # are ignored.</Desc>
          <Example input="// shopping list" output="" />
          <Example input="# notes here" output="" />
        </Section>

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
    <div style={{ marginBottom: last ? 0 : "16px", paddingBottom: last ? 0 : "12px", borderBottom: last ? "none" : "1px solid var(--border)" }}>
      <h3 style={{ fontSize: "13px", fontWeight: 600, marginBottom: "8px", color: "var(--accent)" }}>
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
