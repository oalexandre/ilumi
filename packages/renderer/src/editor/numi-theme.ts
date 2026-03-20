import { EditorView } from "@codemirror/view";
import { HighlightStyle, syntaxHighlighting } from "@codemirror/language";
import { tags } from "@lezer/highlight";

// Dark theme highlighting (Catppuccin-inspired, from doc-5)
const darkHighlightStyle = HighlightStyle.define([
  { tag: tags.number, color: "#7EC8E3" },
  { tag: tags.variableName, color: "#FFCB6B" },
  { tag: tags.function(tags.variableName), color: "#82AAFF" },
  { tag: tags.keyword, color: "#C792EA" },
  { tag: tags.operator, color: "#89DDFF" },
  { tag: tags.comment, color: "#546E7A", fontStyle: "italic" },
  { tag: tags.atom, color: "#F78C6C" },
  { tag: tags.unit, color: "#C792EA" },
  { tag: tags.string, color: "#C3E88D" },
]);

// Light theme highlighting
const lightHighlightStyle = HighlightStyle.define([
  { tag: tags.number, color: "#0066CC" },
  { tag: tags.variableName, color: "#B45309" },
  { tag: tags.function(tags.variableName), color: "#2563EB" },
  { tag: tags.keyword, color: "#7C3AED" },
  { tag: tags.operator, color: "#6B7280" },
  { tag: tags.comment, color: "#9CA3AF", fontStyle: "italic" },
  { tag: tags.atom, color: "#DC2626" },
  { tag: tags.unit, color: "#7C3AED" },
  { tag: tags.string, color: "#059669" },
]);

export const darkThemeExtension = [
  syntaxHighlighting(darkHighlightStyle),
  EditorView.theme(
    {
      "&": { background: "transparent", color: "#CDD6F4" },
    },
    { dark: true },
  ),
];

export const lightThemeExtension = [
  syntaxHighlighting(lightHighlightStyle),
  EditorView.theme(
    {
      "&": { background: "transparent", color: "#1E293B" },
    },
    { dark: false },
  ),
];
