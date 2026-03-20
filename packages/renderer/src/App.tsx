import { useState, useCallback } from "react";

import { EditorPane } from "./components/editor-pane";
import { ResultsPane } from "./components/results-pane";
import { useEngine } from "./hooks/use-engine";

export function App(): React.JSX.Element {
  const { results, evaluate } = useEngine();
  const [scrollTop, setScrollTop] = useState(0);

  const handleChange = useCallback(
    (text: string) => {
      evaluate(text);
    },
    [evaluate],
  );

  const handleScroll = useCallback((top: number) => {
    setScrollTop(top);
  }, []);

  return (
    <div className="flex h-screen w-screen overflow-hidden">
      <EditorPane onChange={handleChange} onScroll={handleScroll} />
      <ResultsPane results={results} scrollTop={scrollTop} />
    </div>
  );
}
