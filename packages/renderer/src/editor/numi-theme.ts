import { EditorView } from "@codemirror/view";
import { HighlightStyle, syntaxHighlighting } from "@codemirror/language";
import { Compartment, type Extension } from "@codemirror/state";
import { tags } from "@lezer/highlight";

import type { Theme } from "../hooks/use-theme";

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

// Light theme highlighting (Catppuccin Latte, the light counterpart of the dark palette)
const lightHighlightStyle = HighlightStyle.define([
  { tag: tags.number, color: "#04A5E5" },
  { tag: tags.variableName, color: "#DF8E1D" },
  { tag: tags.function(tags.variableName), color: "#1E66F5" },
  { tag: tags.keyword, color: "#8839EF" },
  { tag: tags.operator, color: "#179299" },
  { tag: tags.comment, color: "#8C8FA1", fontStyle: "italic" },
  { tag: tags.atom, color: "#FE640B" },
  { tag: tags.unit, color: "#8839EF" },
  { tag: tags.string, color: "#40A02B" },
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
      "&": { background: "transparent", color: "#4C4F69" },
    },
    { dark: false },
  ),
];

const themeCompartment = new Compartment();

export function themeExtensionFor(theme: Theme): Extension {
  return theme === "light" ? lightThemeExtension : darkThemeExtension;
}

/** Reconfigurable slot holding the current theme; swap it with `setEditorTheme`. */
export function editorTheme(theme: Theme): Extension {
  return themeCompartment.of(themeExtensionFor(theme));
}

export function setEditorTheme(view: EditorView, theme: Theme): void {
  view.dispatch({ effects: themeCompartment.reconfigure(themeExtensionFor(theme)) });
}
