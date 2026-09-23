export type LayerKind = "image" | "text" | "shape";

export interface LayerInfo {
  id: string;
  name: string;
  kind: LayerKind;
  visible: boolean;
  selected: boolean;
}

export type TextPreset = "bold-outline" | "drop-shadow" | "plain";

export interface TextProps {
  fill: string;
  fontFamily: string;
  fontSize: number;
}

export interface StrokeProps {
  color: string;
  width: number;
}

export interface ShadowProps {
  color: string;
  blur: number;
  offsetX: number;
  offsetY: number;
}

export interface ShapeProps {
  fill: string;
  opacity: number;
}
