import { useRef } from "react";
import type { Editor } from "../lib/useEditor";
import type { TextPreset } from "../lib/types";
import { useTheme } from "../lib/useTheme";

interface Props {
  editor: Editor;
}

export default function Toolbar({ editor }: Props) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { theme, toggleTheme } = useTheme();
  const selectedLayers = editor.layers.filter((l) => l.selected);
  const canRemoveBg = selectedLayers.length === 1 && selectedLayers[0].kind === "image";

  const handleFilePicked = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) editor.addImageFile(file);
    e.target.value = "";
  };

  return (
    <div className="toolbar">
      <h1 className="brand">Thumbnail Studio</h1>

      <div className="toolbar-group">
        <span className="toolbar-label">Add</span>
        <button onClick={() => fileInputRef.current?.click()}>Image…</button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          hidden
          onChange={handleFilePicked}
        />
        <TextPresetButtons onPick={editor.addText} />
        <button onClick={editor.addRectangle}>Rectangle</button>
      </div>

      <div className="toolbar-group">
        <span className="toolbar-label">Edit</span>
        <button title="Undo (Cmd/Ctrl+Z)" disabled={!editor.canUndo} onClick={editor.undo}>
          Undo
        </button>
        <button title="Redo (Cmd/Ctrl+Shift+Z)" disabled={!editor.canRedo} onClick={editor.redo}>
          Redo
        </button>
      </div>

      <div className="toolbar-group">
        <span className="toolbar-label">Selected ({selectedLayers.length})</span>
        <button disabled={!canRemoveBg || editor.busy} onClick={editor.removeBackgroundForSelected}>
          {editor.busy ? "Removing…" : "Remove background"}
        </button>
        <button disabled={selectedLayers.length === 0} onClick={editor.deleteSelected}>
          Delete
        </button>
      </div>

      <div className="toolbar-group toolbar-group-end">
        <button
          title={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
          onClick={toggleTheme}
        >
          {theme === "dark" ? "🌙" : "☀️"}
        </button>
        <button className="primary" onClick={editor.exportPNG}>
          Export PNG
        </button>
      </div>
    </div>
  );
}

function TextPresetButtons({ onPick }: { onPick: (preset: TextPreset) => void }) {
  return (
    <div className="text-presets">
      <button onClick={() => onPick("bold-outline")}>Text: Bold outline</button>
      <button onClick={() => onPick("drop-shadow")}>Text: Drop shadow</button>
      <button onClick={() => onPick("plain")}>Text: Plain</button>
    </div>
  );
}
