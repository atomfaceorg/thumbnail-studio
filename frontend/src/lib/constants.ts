export const CANVAS_WIDTH = 1280;
export const CANVAS_HEIGHT = 720;

// YouTube has no official "title-safe" spec like broadcast TV, but the player
// UI (duration badge, progress bar, channel logo on some layouts) tends to
// sit near the edges — this is just a rule-of-thumb inset guide, not a spec.
export const SAFE_ZONE_INSET_RATIO = 0.06;

export const BACKGROUND_REMOVAL_ENDPOINT = "http://localhost:8787/remove-background";

export const STORAGE_KEY = "thumbnail-studio:project:v1";

// curated web-safe fonts that read well at thumbnail sizes
export const TEXT_FONT_OPTIONS = [
  { label: "Arial Black", value: "Arial Black, Arial, sans-serif" },
  { label: "Impact", value: "Impact, Haettenschweiler, sans-serif" },
  { label: "Arial", value: "Arial, sans-serif" },
  { label: "Verdana", value: "Verdana, sans-serif" },
  { label: "Georgia", value: "Georgia, serif" },
  { label: "Times New Roman", value: "Times New Roman, serif" },
  { label: "Courier New", value: "Courier New, monospace" },
  { label: "Comic Sans MS", value: "Comic Sans MS, cursive" },
] as const;

export const HISTORY_LIMIT = 100;

export const DEFAULT_RECT_FILL = "#111111";
