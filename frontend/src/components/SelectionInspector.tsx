import type { Editor } from "../lib/useEditor";
import { TEXT_FONT_OPTIONS } from "../lib/constants";

interface Props {
  editor: Editor;
}

export default function SelectionInspector({ editor }: Props) {
  if (!editor.textProps && !editor.strokeProps) return null;

  return (
    <div className="text-inspector">
      {editor.textProps && <TextFields editor={editor} />}
      {editor.strokeProps && <StrokeFields editor={editor} />}
    </div>
  );
}

function TextFields({ editor }: Props) {
  const { fill, fontFamily, fontSize } = editor.textProps!;
  return (
    <>
      <label className="text-inspector-field">
        <span>Color</span>
        <input
          type="color"
          value={fill.startsWith("#") ? fill : "#ffffff"}
          onChange={(e) => editor.setTextFill(e.target.value)}
        />
      </label>

      <label className="text-inspector-field">
        <span>Font</span>
        <select value={fontFamily} onChange={(e) => editor.setTextFontFamily(e.target.value)}>
          {TEXT_FONT_OPTIONS.map((f) => (
            <option key={f.value} value={f.value}>
              {f.label}
            </option>
          ))}
        </select>
      </label>

      <label className="text-inspector-field">
        <span>Size</span>
        <input
          type="number"
          min={8}
          max={300}
          value={Math.round(fontSize)}
          onChange={(e) => {
            const n = Number(e.target.value);
            if (Number.isFinite(n) && n > 0) editor.setTextFontSize(n);
          }}
        />
      </label>
    </>
  );
}

function StrokeFields({ editor }: Props) {
  const { color, width } = editor.strokeProps!;
  return (
    <>
      <span className="text-inspector-divider" />

      <label className="text-inspector-field">
        <span>Stroke</span>
        <input type="color" value={color} onChange={(e) => editor.setStrokeColor(e.target.value)} />
      </label>

      <label className="text-inspector-field">
        <span>Width</span>
        <input
          type="number"
          min={0}
          max={60}
          value={Math.round(width)}
          onChange={(e) => {
            const n = Number(e.target.value);
            if (Number.isFinite(n) && n >= 0) editor.setStrokeWidth(n);
          }}
        />
      </label>
    </>
  );
}
