import { useRef } from "react";
import type { Editor } from "../lib/useEditor";
import { TEXT_FONT_OPTIONS } from "../lib/constants";

interface Props {
  editor: Editor;
}

export default function SelectionInspector({ editor }: Props) {
  if (!editor.textProps && !editor.shapeProps && !editor.strokeProps) return null;

  return (
    <div className="text-inspector">
      {editor.textProps && <TextFields editor={editor} />}
      {editor.shadowProps && <ShadowFields editor={editor} />}
      {editor.shapeProps && <ShapeFields editor={editor} />}
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

function ShadowFields({ editor }: Props) {
  const { color, blur, offsetX, offsetY } = editor.shadowProps!;
  const enabled = blur > 0 || offsetX !== 0 || offsetY !== 0;

  // remembers the last nonzero shadow so unticking-then-reticking the
  // checkbox restores it, instead of forcing the user to redial it in
  const lastRef = useRef({ color: "#000000", blur: 12, offsetX: 6, offsetY: 6 });
  if (enabled) lastRef.current = { color, blur, offsetX, offsetY };

  return (
    <>
      <span className="text-inspector-divider" />

      <label className="text-inspector-field">
        <input
          type="checkbox"
          checked={enabled}
          onChange={(e) => (e.target.checked ? editor.setTextShadow(lastRef.current) : editor.clearTextShadow())}
        />
        <span>Shadow</span>
      </label>

      <label className="text-inspector-field">
        <input
          type="color"
          value={color.startsWith("#") ? color : "#000000"}
          disabled={!enabled}
          onChange={(e) => editor.setTextShadow({ color: e.target.value })}
        />
      </label>

      <label className="text-inspector-field">
        <span>Blur</span>
        <input
          type="number"
          min={0}
          max={60}
          value={Math.round(blur)}
          disabled={!enabled}
          onChange={(e) => {
            const n = Number(e.target.value);
            if (Number.isFinite(n) && n >= 0) editor.setTextShadow({ blur: n });
          }}
        />
      </label>

      <label className="text-inspector-field">
        <span>Offset X</span>
        <input
          type="number"
          min={-60}
          max={60}
          value={Math.round(offsetX)}
          disabled={!enabled}
          onChange={(e) => {
            const n = Number(e.target.value);
            if (Number.isFinite(n)) editor.setTextShadow({ offsetX: n });
          }}
        />
      </label>

      <label className="text-inspector-field">
        <span>Offset Y</span>
        <input
          type="number"
          min={-60}
          max={60}
          value={Math.round(offsetY)}
          disabled={!enabled}
          onChange={(e) => {
            const n = Number(e.target.value);
            if (Number.isFinite(n)) editor.setTextShadow({ offsetY: n });
          }}
        />
      </label>
    </>
  );
}

function ShapeFields({ editor }: Props) {
  const { fill, opacity } = editor.shapeProps!;
  return (
    <>
      <label className="text-inspector-field">
        <span>Fill</span>
        <input
          type="color"
          value={fill.startsWith("#") ? fill : "#111111"}
          onChange={(e) => editor.setShapeFill(e.target.value)}
        />
      </label>

      <label className="text-inspector-field">
        <span>Opacity</span>
        <input
          type="range"
          min={0}
          max={100}
          value={Math.round(opacity * 100)}
          onChange={(e) => editor.setShapeOpacity(Number(e.target.value) / 100)}
        />
        <span className="text-inspector-value">{Math.round(opacity * 100)}%</span>
      </label>
    </>
  );
}

function StrokeFields({ editor }: Props) {
  const { color, width } = editor.strokeProps!;
  const enabled = width > 0;

  // remembers the last nonzero width so unticking-then-reticking the
  // checkbox restores it, instead of forcing the user to retype it
  const lastWidthRef = useRef(4);
  if (width > 0) lastWidthRef.current = width;

  return (
    <>
      <span className="text-inspector-divider" />

      <label className="text-inspector-field">
        <input
          type="checkbox"
          checked={enabled}
          onChange={(e) => editor.setStrokeWidth(e.target.checked ? lastWidthRef.current : 0)}
        />
        <span>Stroke</span>
      </label>

      <label className="text-inspector-field">
        <input
          type="color"
          value={color}
          disabled={!enabled}
          onChange={(e) => editor.setStrokeColor(e.target.value)}
        />
      </label>

      <label className="text-inspector-field">
        <span>Width</span>
        <input
          type="number"
          min={0}
          max={60}
          value={Math.round(width)}
          disabled={!enabled}
          onChange={(e) => {
            const n = Number(e.target.value);
            if (Number.isFinite(n) && n >= 0) editor.setStrokeWidth(n);
          }}
        />
      </label>
    </>
  );
}
