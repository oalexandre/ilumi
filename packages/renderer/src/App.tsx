import { useState, useCallback, useEffect } from "react";

import { EditorPane } from "./components/editor-pane";
import { ResultsPane } from "./components/results-pane";
import { SettingsPanel } from "./components/settings-panel";
import { TabBar } from "./components/tab-bar";
import { useEngine } from "./hooks/use-engine";
import { useNotes } from "./hooks/use-notes";
import { useTheme } from "./hooks/use-theme";

export function App(): React.JSX.Element {
  const { toggle } = useTheme();
  const { results, evaluate } = useEngine();
  const { notes, activeNote, activeId, setActiveId, updateContent, createNote, closeNote, renameNote } =
    useNotes();
  const [scrollTop, setScrollTop] = useState(0);
  const [showSettings, setShowSettings] = useState(false);

  const handleChange = useCallback(
    (text: string) => {
      updateContent(text);
      evaluate(text);
    },
    [updateContent, evaluate],
  );

  const handleScroll = useCallback((top: number) => {
    setScrollTop(top);
  }, []);

  // Menu keyboard shortcut handlers
  useEffect(() => {
    window.numi.onNewNote(() => createNote());
    window.numi.onCloseNote(() => {
      if (notes.length > 1) closeNote(activeId);
    });
    window.numi.onToggleTheme(() => toggle());
    window.numi.onCopyAllResults(() => {
      const text = results
        .filter((r) => r.formatted)
        .map((r) => r.formatted)
        .join("\n");
      if (text) navigator.clipboard.writeText(text);
    });
  }, [createNote, closeNote, activeId, notes.length, toggle, results]);

  // Cmd/Ctrl+, for settings
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === ",") {
        e.preventDefault();
        setShowSettings((v) => !v);
      }
      if (e.key === "Escape" && showSettings) {
        setShowSettings(false);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [showSettings]);

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden">
      <div className="flex flex-1 overflow-hidden">
        <EditorPane
          key={activeId}
          initialContent={activeNote?.content ?? ""}
          onChange={handleChange}
          onScroll={handleScroll}
        />
        <ResultsPane results={results} scrollTop={scrollTop} />
      </div>
      <TabBar
        notes={notes}
        activeId={activeId}
        onSelect={setActiveId}
        onCreate={createNote}
        onClose={closeNote}
        onRename={renameNote}
      />
      <SettingsPanel visible={showSettings} onClose={() => setShowSettings(false)} />
    </div>
  );
}
