import { useEffect, useRef, useCallback } from "react";
import { EditorState } from "@codemirror/state";
import { EditorView, keymap, lineNumbers } from "@codemirror/view";
import { defaultKeymap, history, historyKeymap } from "@codemirror/commands";

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

  const handleUpdate = useCallback(
    (update: { docChanged: boolean; state: EditorState; view: EditorView }) => {
      if (update.docChanged) {
        onChange(update.state.doc.toString());
      }
      const scrollTop = update.view.scrollDOM.scrollTop;
      onScroll(scrollTop);
    },
    [onChange, onScroll],
  );

  useEffect(() => {
    if (!containerRef.current) return;

    const state = EditorState.create({
      doc: initialContent,
      extensions: [
        numiLanguage,
        ...darkThemeExtension,
        lineNumbers(),
        history(),
        keymap.of([...defaultKeymap, ...historyKeymap]),
        EditorView.updateListener.of(handleUpdate),
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
      onChange(initialContent);
    }

    const scroller = view.scrollDOM;
    const scrollHandler = () => onScroll(scroller.scrollTop);
    scroller.addEventListener("scroll", scrollHandler, { passive: true });

    return () => {
      scroller.removeEventListener("scroll", scrollHandler);
      view.destroy();
    };
  }, [handleUpdate, onScroll, initialContent, onChange]);

  return (
    <div
      ref={containerRef}
      className="flex-[0_0_60%] overflow-hidden"
      style={{ background: "var(--bg-editor)" }}
    />
  );
}
