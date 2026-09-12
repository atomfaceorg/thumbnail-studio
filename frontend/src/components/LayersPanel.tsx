import { useState } from "react";
import type { Editor } from "../lib/useEditor";

interface Props {
  editor: Editor;
}

const KIND_ICON: Record<string, string> = {
  image: "🖼",
  text: "🅣",
  shape: "▭",
};

export default function LayersPanel({ editor }: Props) {
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [dragOverId, setDragOverId] = useState<string | null>(null);

  const clearDragState = () => {
    setDraggedId(null);
    setDragOverId(null);
  };

  const handleDrop = (targetId: string) => {
    if (draggedId && draggedId !== targetId) {
      const idsTopFirst = editor.layers.map((l) => l.id);
      const fromIndex = idsTopFirst.indexOf(draggedId);
      if (fromIndex !== -1) {
        idsTopFirst.splice(fromIndex, 1);
        const toIndex = idsTopFirst.indexOf(targetId);
        idsTopFirst.splice(toIndex, 0, draggedId);
        editor.reorderLayers(idsTopFirst);
      }
    }
    clearDragState();
  };

  return (
    <div className="layers-panel">
      <h2>Layers</h2>
      {editor.layers.length === 0 && <p className="empty-hint">No layers yet — add an image or text.</p>}
      {editor.layers.length > 1 && (
        <p className="empty-hint">Drag to reorder. Shift/Cmd-click to select multiple.</p>
      )}
      <ul className="layers-list">
        {editor.layers.map((layer) => (
          <li
            key={layer.id}
            data-layer-id={layer.id}
            draggable
            className={`layer-row ${layer.selected ? "selected" : ""} ${
              draggedId === layer.id ? "dragging" : ""
            } ${dragOverId === layer.id && draggedId !== layer.id ? "drag-over" : ""}`}
            onClick={(e) => editor.selectLayer(layer.id, e.shiftKey || e.metaKey || e.ctrlKey)}
            onDragStart={(e) => {
              setDraggedId(layer.id);
              e.dataTransfer.effectAllowed = "move";
              e.dataTransfer.setData("text/plain", layer.id);
            }}
            onDragEnter={(e) => {
              e.preventDefault();
              if (draggedId && draggedId !== layer.id) setDragOverId(layer.id);
            }}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              handleDrop(layer.id);
            }}
            onDragEnd={clearDragState}
          >
            <span className="drag-handle" title="Drag to reorder">
              ⠿
            </span>
            <span className="layer-icon">{KIND_ICON[layer.kind]}</span>
            <span className="layer-name">{layer.name}</span>
            <button
              className="icon-button"
              title={layer.visible ? "Hide" : "Show"}
              onClick={(e) => {
                e.stopPropagation();
                editor.toggleVisibility(layer.id);
              }}
            >
              {layer.visible ? "👁" : "🚫"}
            </button>
            <button
              className="icon-button"
              title="Bring forward"
              onClick={(e) => {
                e.stopPropagation();
                editor.reorderLayer(layer.id, "up");
              }}
            >
              ↑
            </button>
            <button
              className="icon-button"
              title="Send backward"
              onClick={(e) => {
                e.stopPropagation();
                editor.reorderLayer(layer.id, "down");
              }}
            >
              ↓
            </button>
            <button
              className="icon-button"
              title="Delete"
              onClick={(e) => {
                e.stopPropagation();
                editor.deleteLayer(layer.id);
              }}
            >
              ✕
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
