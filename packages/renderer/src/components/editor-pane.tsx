import { useEffect, useRef } from "react";
import { EditorState } from "@codemirror/state";
import { EditorView, keymap, lineNumbers } from "@codemirror/view";
import { defaultKeymap, history, historyKeymap } from "@codemirror/commands";

import { numiAutocompletion } from "../editor/numi-autocomplete";
import { numiLanguage } from "../editor/numi-language";
import { darkThemeExtension } from "../editor/numi-theme";

interface EditorPaneProps {
  initialContent?: string;
  onChange: (text: string) => void;
  onScroll: (scrollTop: number) => void;
}

export function EditorPane({
  initialContent = "",
  onChange,
  onScroll,
}: EditorPaneProps): React.JSX.Element {
  const containerRef = useRef<HTMLDivElement>(null);
  const viewRef = useRef<EditorView | null>(null);

  // Store callbacks in refs so the editor effect doesn't re-run
  const onChangeRef = useRef(onChange);
  const onScrollRef = useRef(onScroll);
  onChangeRef.current = onChange;
  onScrollRef.current = onScroll;

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
        keymap.of([...defaultKeymap, ...historyKeymap]),
        EditorView.updateListener.of((update) => {
          if (update.docChanged) {
            onChangeRef.current(update.state.doc.toString());
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

    return () => {
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
