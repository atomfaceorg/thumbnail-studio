import { useRef } from "react";
import Toolbar from "./components/Toolbar";
import LayersPanel from "./components/LayersPanel";
import CanvasStage from "./components/CanvasStage";
import TextInspector from "./components/TextInspector";
import { useEditor } from "./lib/useEditor";

export default function App() {
  const canvasElRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const editor = useEditor(canvasElRef, containerRef);

  return (
    <div className="app">
      <Toolbar editor={editor} />
      <TextInspector editor={editor} />
      <div className="workspace">
        <CanvasStage containerRef={containerRef} canvasElRef={canvasElRef} />
        <LayersPanel editor={editor} />
      </div>
    </div>
  );
}
