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
import { darkThemeExtension } from "../editor/numi-theme";

interface EditorPaneProps {
  initialContent?: string;
  onChange: (text: string) => void;
  onScroll: (scrollTop: number) => void;
  /** Called with the 0-based line the user is typing on, or null when they leave it (cursor move, blur). */
  onEditingLine: (line: number | null) => void;
  /** Called on Enter. Resolves true to block the newline (the line has an error to reveal). */
  onEnter: (line: number, text: string) => Promise<boolean>;
}

/** 0-based index of the line holding the main cursor, matching LineResult.line. */
function cursorLine(state: EditorState): number {
  return state.doc.lineAt(state.selection.main.head).number - 1;
}

export function EditorPane({
  initialContent = "",
  onChange,
  onScroll,
  onEditingLine,
  onEnter,
}: EditorPaneProps): React.JSX.Element {
  const containerRef = useRef<HTMLDivElement>(null);
  const viewRef = useRef<EditorView | null>(null);

  // Store callbacks in refs so the editor effect doesn't re-run
  const onChangeRef = useRef(onChange);
  const onScrollRef = useRef(onScroll);
  const onEditingLineRef = useRef(onEditingLine);
  const onEnterRef = useRef(onEnter);
  onChangeRef.current = onChange;
  onScrollRef.current = onScroll;
  onEditingLineRef.current = onEditingLine;
  onEnterRef.current = onEnter;

  useEffect(() => {
    if (!containerRef.current) return;

    const state = EditorState.create({
      doc: initialContent,
      extensions: [
        numiLanguage,
        ...darkThemeExtension,
        numiAutocompletion,
        lineNumbers(),
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
