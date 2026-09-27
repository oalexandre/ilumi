import { useEffect, useRef } from "react";
import { EditorState, Prec } from "@codemirror/state";
import { EditorView, keymap, lineNumbers } from "@codemirror/view";
import {
  defaultKeymap,
  history,
  historyKeymap,
  insertNewlineAndIndent,
} from "@codemirror/commands";

import { numiAutocompletion, invalidateEntityCache } from "../editor/numi-autocomplete";
import { numiLanguage, updateLanguageSets } from "../editor/numi-language";
import { editorTheme, setEditorTheme } from "../editor/numi-theme";
import type { Theme } from "../hooks/use-theme";

interface EditorPaneProps {
  initialContent?: string;
  theme: Theme;
  onChange: (text: string) => void;
  onScroll: (scrollTop: number) => void;
  /** Called with the rendered height (px) of each document line whenever wrapping changes it. */
  onLineHeights: (heights: number[]) => void;
  /** Called with the 0-based line the user is typing on, or null when they leave it (cursor move, blur). */
  onEditingLine: (line: number | null) => void;
  /** Called on Enter. Resolves true to block the newline (the line has an error to reveal). */
  onEnter: (line: number, text: string) => Promise<boolean>;
}

/** Height of every document line, as laid out by CodeMirror (wrapped lines are taller). */
function lineHeights(view: EditorView): number[] {
  const { doc } = view.state;
  const heights = new Array<number>(doc.lines);
  for (let i = 1; i <= doc.lines; i++) {
    heights[i - 1] = view.lineBlockAt(doc.line(i).from).height;
  }
  return heights;
}

function sameHeights(a: number[], b: number[]): boolean {
  return a.length === b.length && a.every((h, i) => Math.abs(h - (b[i] ?? 0)) < 0.5);
}

/** 0-based index of the line holding the main cursor, matching LineResult.line. */
function cursorLine(state: EditorState): number {
  return state.doc.lineAt(state.selection.main.head).number - 1;
}

export function EditorPane({
  initialContent = "",
  theme,
  onChange,
  onScroll,
  onLineHeights,
  onEditingLine,
  onEnter,
}: EditorPaneProps): React.JSX.Element {
  const containerRef = useRef<HTMLDivElement>(null);
  const viewRef = useRef<EditorView | null>(null);

  // Store callbacks in refs so the editor effect doesn't re-run
  const onChangeRef = useRef(onChange);
  const onScrollRef = useRef(onScroll);
  const onLineHeightsRef = useRef(onLineHeights);
  const onEditingLineRef = useRef(onEditingLine);
  const onEnterRef = useRef(onEnter);
  onChangeRef.current = onChange;
  onScrollRef.current = onScroll;
  onLineHeightsRef.current = onLineHeights;
  onEditingLineRef.current = onEditingLine;
  onEnterRef.current = onEnter;
  const themeRef = useRef(theme);
  themeRef.current = theme;

  // Swap the CodeMirror theme in place; the editor itself only mounts once per note.
  useEffect(() => {
    if (viewRef.current) setEditorTheme(viewRef.current, theme);
  }, [theme]);

  useEffect(() => {
    if (!containerRef.current) return;

    let lastHeights: number[] = [];
    const reportHeights = (view: EditorView) => {
      const heights = lineHeights(view);
      if (sameHeights(heights, lastHeights)) return;
      lastHeights = heights;
      onLineHeightsRef.current(heights);
    };

    const state = EditorState.create({
      doc: initialContent,
      extensions: [
        numiLanguage,
        editorTheme(themeRef.current),
        numiAutocompletion,
        lineNumbers(),
        EditorView.lineWrapping,
        history(),
        Prec.high(
          keymap.of([
            {
              key: "Enter",
              run: (view) => {
                const { state } = view;
                // Let the default behaviour handle selections and multiple cursors.
                if (state.selection.ranges.length > 1 || !state.selection.main.empty) {
                  return false;
                }
                const doc = state.doc;
                const line = cursorLine(state);
                onEnterRef
                  .current(line, doc.toString())
                  .then((block) => {
                    // Only insert the newline if nothing changed while we waited.
                    if (!block && view.state.doc.eq(doc)) {
                      insertNewlineAndIndent(view);
                    }
                  })
                  .catch(() => {
                    if (view.state.doc.eq(doc)) insertNewlineAndIndent(view);
                  });
                return true;
              },
            },
          ]),
        ),
        keymap.of([...defaultKeymap, ...historyKeymap]),
        EditorView.updateListener.of((update) => {
          // Heights settle after CodeMirror measures the DOM (heightChanged), and change with
          // the window width (geometryChanged) since that moves the wrap points.
          if (update.docChanged || update.heightChanged || update.geometryChanged) {
            reportHeights(update.view);
          }
          if (update.docChanged) {
            onChangeRef.current(update.state.doc.toString());
            onEditingLineRef.current(cursorLine(update.state));
          } else if (update.selectionSet) {
            if (cursorLine(update.startState) !== cursorLine(update.state)) {
              onEditingLineRef.current(null);
            }
          }
          if (update.focusChanged && !update.view.hasFocus) {
            onEditingLineRef.current(null);
          }
        }),
        EditorView.theme({
          "&": { height: "100%" },
          ".cm-scroller": { overflow: "auto" },
        }),
      ],
    });

    const view = new EditorView({
      state,
      parent: containerRef.current,
    });

    viewRef.current = view;
    reportHeights(view);

    if (initialContent) {
      onChangeRef.current(initialContent);
    }

    const scroller = view.scrollDOM;
    const scrollHandler = () => onScrollRef.current(scroller.scrollTop);
    scroller.addEventListener("scroll", scrollHandler, { passive: true });

    // Load initial entity data for dynamic highlighting
    window.numi
      .getEntityNames()
      .then((entities) => {
        updateLanguageSets(view, entities);
      })
      .catch(() => {});

    // Listen for entity changes (plugin reload, etc.)
    const cleanupEntities = window.numi.onEntitiesChanged(() => {
      invalidateEntityCache();
      window.numi
        .getEntityNames()
        .then((entities) => {
          if (viewRef.current) {
            updateLanguageSets(viewRef.current, entities);
          }
        })
        .catch(() => {});
    });

    return () => {
      cleanupEntities();
      scroller.removeEventListener("scroll", scrollHandler);
      view.destroy();
    };
    // Only run on mount (or when initialContent changes via key prop)
  }, [initialContent]);

  return (
    <div
      ref={containerRef}
      className="flex-[0_0_60%] overflow-hidden"
      style={{ background: "var(--bg-editor)" }}
    />
  );
}
