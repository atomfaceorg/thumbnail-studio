import { useCallback, useEffect, useRef, useState } from "react";
import { ActiveSelection, Canvas, FabricImage, IText, Shadow, type FabricObject } from "fabric";
import { CANVAS_WIDTH, CANVAS_HEIGHT, HISTORY_LIMIT, STORAGE_KEY, TEXT_FONT_OPTIONS } from "./constants";
import type { LayerInfo, StrokeProps, TextPreset, TextProps } from "./types";
import { removeBackground, urlToBlob } from "./backgroundRemoval";

// Fabric objects don't carry id/name by default; we stamp both on every
// object we create and ask fabric to serialize them via toJSON/toObject's
// propertiesToInclude list so they survive save/load.
type EditableObject = FabricObject & { id: string; name: string };
const PERSISTED_EXTRA_PROPS = ["id", "name"];

function makeId() {
  return crypto.randomUUID();
}

function asEditable(obj: FabricObject): EditableObject {
  return obj as EditableObject;
}

function isEditingText(obj: FabricObject | undefined | null): boolean {
  return !!(obj as unknown as { isEditing?: boolean } | null)?.isEditing;
}

function applyTextPreset(text: IText, preset: TextPreset) {
  text.set({ fontFamily: "Arial Black, Arial, sans-serif", fontWeight: "900" });
  if (preset === "bold-outline") {
    text.set({
      fill: "#ffffff",
      stroke: "#000000",
      strokeWidth: 8,
      paintFirst: "stroke",
      shadow: undefined,
    });
  } else if (preset === "drop-shadow") {
    text.set({
      fill: "#ffffff",
      stroke: undefined,
      shadow: new Shadow({ color: "rgba(0,0,0,0.85)", blur: 12, offsetX: 4, offsetY: 4 }),
    });
  } else {
    text.set({ fill: "#111111", stroke: undefined, shadow: undefined });
  }
}

function ensureIdsAndNames(canvas: Canvas) {
  for (const o of canvas.getObjects()) {
    const eo = asEditable(o);
    if (!eo.id) eo.id = makeId();
    if (!eo.name) eo.name = eo.type === "i-text" ? "Text" : "Layer";
  }
}

export function useEditor(
  canvasElRef: React.RefObject<HTMLCanvasElement>,
  containerRef: React.RefObject<HTMLDivElement>
) {
  const fabricRef = useRef<Canvas | null>(null);
  const [layers, setLayers] = useState<LayerInfo[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [textProps, setTextProps] = useState<TextProps | null>(null);
  const [strokeProps, setStrokeProps] = useState<StrokeProps | null>(null);
  const [displayScale, setDisplayScale] = useState(1);
  const [busy, setBusy] = useState(false);
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);

  const historyStackRef = useRef<string[]>([]);
  const historyIndexRef = useRef(-1);
  const isRestoringRef = useRef(false);
  const historyFlushScheduledRef = useRef(false);

  const refreshLayers = useCallback(() => {
    const canvas = fabricRef.current;
    if (!canvas) return;
    const activeObjects = canvas.getActiveObjects();
    const objs = canvas.getObjects().map((o) => asEditable(o));
    const infos: LayerInfo[] = objs
      .map((o) => ({
        id: o.id,
        name: o.name ?? "Layer",
        kind: (o.type === "i-text" || o.type === "text"
          ? "text"
          : o.type === "image"
          ? "image"
          : "shape") as LayerInfo["kind"],
        visible: o.visible !== false,
        selected: activeObjects.includes(o),
      }))
      .reverse(); // topmost first, matching visual stacking
    setLayers(infos);
    setSelectedIds(activeObjects.map((o) => asEditable(o).id));

    const activeText = activeObjects.filter((o) => o.type === "i-text") as IText[];
    if (activeText.length > 0) {
      const first = activeText[0];
      setTextProps({
        fill: (typeof first.fill === "string" ? first.fill : "#ffffff"),
        fontFamily: first.fontFamily || TEXT_FONT_OPTIONS[0].value,
        fontSize: first.fontSize ?? 90,
      });
    } else {
      setTextProps(null);
    }

    if (activeObjects.length > 0) {
      const first = activeObjects[0];
      const hasStroke = typeof first.stroke === "string" && first.stroke.length > 0;
      setStrokeProps({
        color: hasStroke ? (first.stroke as string) : "#000000",
        width: hasStroke ? first.strokeWidth ?? 1 : 0,
      });
    } else {
      setStrokeProps(null);
    }
  }, []);

  const persist = useCallback(() => {
    const canvas = fabricRef.current;
    if (!canvas) return;
    try {
      const json = canvas.toObject(PERSISTED_EXTRA_PROPS);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(json));
    } catch {
      // best-effort autosave; ignore quota/serialization errors in this scaffold
    }
  }, []);

  const pushHistory = useCallback(() => {
    const canvas = fabricRef.current;
    if (!canvas || isRestoringRef.current) return;
    const snapshot = JSON.stringify(canvas.toObject(PERSISTED_EXTRA_PROPS));
    const stack = historyStackRef.current;
    if (stack[historyIndexRef.current] === snapshot) return; // no-op change
    stack.splice(historyIndexRef.current + 1); // drop redo branch
    stack.push(snapshot);
    if (stack.length > HISTORY_LIMIT) stack.shift();
    historyIndexRef.current = stack.length - 1;
    setCanUndo(historyIndexRef.current > 0);
    setCanRedo(false);
  }, []);

  // coalesce bursts of synchronous mutations (e.g. remove+re-add during
  // background removal, or deleting several selected layers at once) into
  // a single history entry instead of one per intermediate step.
  const scheduleHistoryPush = useCallback(() => {
    if (isRestoringRef.current || historyFlushScheduledRef.current) return;
    historyFlushScheduledRef.current = true;
    queueMicrotask(() => {
      historyFlushScheduledRef.current = false;
      pushHistory();
    });
  }, [pushHistory]);

  const notifyChange = useCallback(() => {
    refreshLayers();
    persist();
    scheduleHistoryPush();
  }, [refreshLayers, persist, scheduleHistoryPush]);

  // init canvas once
  useEffect(() => {
    if (!canvasElRef.current) return;
    const canvas = new Canvas(canvasElRef.current, {
      width: CANVAS_WIDTH,
      height: CANVAS_HEIGHT,
      preserveObjectStacking: true,
    });
    // setting backgroundColor via the constructor options is unreliable in
    // fabric 6.9 (silently stays unset) — set it directly instead.
    canvas.backgroundColor = "#1e1e1e";
    // synchronous, not requestRenderAll: the very first paint must not
    // depend on a requestAnimationFrame callback actually firing, which
    // browsers can defer indefinitely if the tab starts out backgrounded.
    canvas.renderAll();
    fabricRef.current = canvas;

    canvas.on("object:added", notifyChange);
    canvas.on("object:removed", notifyChange);
    canvas.on("object:modified", notifyChange);
    canvas.on("selection:created", refreshLayers);
    canvas.on("selection:updated", refreshLayers);
    canvas.on("selection:cleared", refreshLayers);

    const seedHistory = () => {
      historyStackRef.current = [];
      historyIndexRef.current = -1;
      pushHistory();
    };

    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      canvas
        .loadFromJSON(JSON.parse(saved))
        .then(() => {
          ensureIdsAndNames(canvas);
          canvas.requestRenderAll();
          refreshLayers();
          seedHistory();
        })
        .catch(() => {
          /* corrupt/incompatible save — start fresh */
          seedHistory();
        });
    } else {
      seedHistory();
    }

    return () => {
      canvas.dispose();
      fabricRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // responsive scaling: keep 1280x720 design space, shrink display to fit container
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const fit = () => {
      const activeCanvas = fabricRef.current;
      if (!activeCanvas) return;
      const available = container.clientWidth;
      // container can legitimately measure 0 mid-layout (e.g. display
      // toggled, pane not yet visible) — skip rather than zoom to 0, which
      // permanently poisons fabric's viewport transform with NaN/null.
      if (available <= 0) return;
      const scale = Math.min(available / CANVAS_WIDTH, 1);
      activeCanvas.setDimensions({
        width: CANVAS_WIDTH * scale,
        height: CANVAS_HEIGHT * scale,
      });
      // set the transform directly (not setZoom) so scaling is always
      // computed fresh from `scale`, never derived from prior state.
      activeCanvas.setViewportTransform([scale, 0, 0, scale, 0, 0]);
      // setDimensions/setViewportTransform both schedule their repaint via
      // requestRenderAll internally; force it through synchronously too so
      // the resize is never left waiting on a deferred animation frame.
      activeCanvas.renderAll();
      setDisplayScale(scale);
    };

    fit();
    const observer = new ResizeObserver(fit);
    observer.observe(container);
    return () => observer.disconnect();
  }, [containerRef, canvasElRef, layers.length === 0]);

  const findById = useCallback((id: string): EditableObject | undefined => {
    const canvas = fabricRef.current;
    if (!canvas) return undefined;
    return canvas.getObjects().map(asEditable).find((o) => o.id === id);
  }, []);

  const selectLayer = useCallback(
    (id: string, additive = false) => {
      const canvas = fabricRef.current;
      const obj = findById(id);
      if (!canvas || !obj) return;

      if (!additive) {
        canvas.setActiveObject(obj);
        canvas.requestRenderAll();
        refreshLayers();
        return;
      }

      const current = canvas.getActiveObjects();
      const alreadySelected = current.includes(obj);
      const next = alreadySelected ? current.filter((o) => o !== obj) : [...current, obj];

      canvas.discardActiveObject();
      if (next.length === 1) {
        canvas.setActiveObject(next[0]);
      } else if (next.length > 1) {
        canvas.setActiveObject(new ActiveSelection(next, { canvas }));
      }
      canvas.requestRenderAll();
      refreshLayers();
    },
    [findById, refreshLayers]
  );

  const addText = useCallback((preset: TextPreset = "bold-outline") => {
    const canvas = fabricRef.current;
    if (!canvas) return;
    const text = new IText("Your text here", {
      left: CANVAS_WIDTH / 2,
      top: CANVAS_HEIGHT / 2,
      originX: "center",
      originY: "center",
      fontSize: 90,
    });
    applyTextPreset(text, preset);
    const eo = asEditable(text);
    eo.id = makeId();
    eo.name = "Text";
    canvas.add(text);
    canvas.setActiveObject(text);
    canvas.requestRenderAll();
  }, []);

  const addImageFile = useCallback(async (file: File) => {
    const canvas = fabricRef.current;
    if (!canvas) return;
    const url = URL.createObjectURL(file);
    const img = await FabricImage.fromURL(url, { crossOrigin: "anonymous" });
    const scale = Math.min(
      (CANVAS_WIDTH * 0.8) / (img.width ?? CANVAS_WIDTH),
      (CANVAS_HEIGHT * 0.8) / (img.height ?? CANVAS_HEIGHT),
      1
    );
    img.set({
      left: CANVAS_WIDTH / 2,
      top: CANVAS_HEIGHT / 2,
      originX: "center",
      originY: "center",
      scaleX: scale,
      scaleY: scale,
    });
    const eo = asEditable(img);
    eo.id = makeId();
    eo.name = file.name.replace(/\.[^/.]+$/, "") || "Image";
    canvas.add(img);
    canvas.setActiveObject(img);
    canvas.requestRenderAll();
  }, []);

  const removeBackgroundForSelected = useCallback(async () => {
    const canvas = fabricRef.current;
    if (!canvas) return;
    const active = canvas.getActiveObject();
    if (!active || active.type !== "image") return;
    const imageObj = active as FabricImage;
    const eo = asEditable(imageObj);

    setBusy(true);
    try {
      const srcUrl = imageObj.getSrc();
      const blob = await urlToBlob(srcUrl);
      const resultBlob = await removeBackground(blob);
      const resultUrl = URL.createObjectURL(resultBlob);
      const replacement = await FabricImage.fromURL(resultUrl, { crossOrigin: "anonymous" });

      replacement.set({
        left: imageObj.left,
        top: imageObj.top,
        originX: imageObj.originX,
        originY: imageObj.originY,
        scaleX: imageObj.scaleX,
        scaleY: imageObj.scaleY,
        angle: imageObj.angle,
      });
      const replacementEo = asEditable(replacement);
      replacementEo.id = eo.id;
      replacementEo.name = eo.name;

      const index = canvas.getObjects().indexOf(imageObj);
      canvas.remove(imageObj);
      canvas.insertAt(index, replacement);
      canvas.setActiveObject(replacement);
      canvas.requestRenderAll();
    } finally {
      setBusy(false);
    }
  }, []);

  const deleteLayer = useCallback(
    (id: string) => {
      const canvas = fabricRef.current;
      const obj = findById(id);
      if (!canvas || !obj) return;
      canvas.remove(obj);
      canvas.requestRenderAll();
    },
    [findById]
  );

  const deleteSelected = useCallback(() => {
    const canvas = fabricRef.current;
    if (!canvas) return;
    const active = canvas.getActiveObjects();
    if (active.length === 0) return;
    canvas.discardActiveObject();
    canvas.remove(...active);
    canvas.requestRenderAll();
  }, []);

  const toggleVisibility = useCallback(
    (id: string) => {
      const canvas = fabricRef.current;
      const obj = findById(id);
      if (!canvas || !obj) return;
      obj.visible = obj.visible === false ? true : false;
      canvas.requestRenderAll();
      notifyChange();
    },
    [findById, notifyChange]
  );

  const reorderLayer = useCallback(
    (id: string, direction: "up" | "down" | "top" | "bottom") => {
      const canvas = fabricRef.current;
      const obj = findById(id);
      if (!canvas || !obj) return;
      if (direction === "up") canvas.bringObjectForward(obj);
      if (direction === "down") canvas.sendObjectBackwards(obj);
      if (direction === "top") canvas.bringObjectToFront(obj);
      if (direction === "bottom") canvas.sendObjectToBack(obj);
      canvas.requestRenderAll();
      notifyChange();
    },
    [findById, notifyChange]
  );

  const renameLayer = useCallback(
    (id: string, name: string) => {
      const obj = findById(id);
      if (!obj) return;
      obj.name = name;
      notifyChange();
    },
    [findById, notifyChange]
  );

  // orderedIdsTopFirst matches the layers-panel display order (topmost
  // layer first); canvas z-order is the reverse (index 0 = furthest back).
  const reorderLayers = useCallback(
    (orderedIdsTopFirst: string[]) => {
      const canvas = fabricRef.current;
      if (!canvas) return;
      const bottomToTop = [...orderedIdsTopFirst].reverse();
      bottomToTop.forEach((id, index) => {
        const obj = findById(id);
        if (obj) canvas.moveObjectTo(obj, index);
      });
      canvas.requestRenderAll();
      notifyChange();
    },
    [findById, notifyChange]
  );

  const applyToSelectedText = useCallback(
    (patch: Partial<TextProps>) => {
      const canvas = fabricRef.current;
      if (!canvas) return;
      const targets = canvas.getActiveObjects().filter((o) => o.type === "i-text");
      if (targets.length === 0) return;
      for (const t of targets) t.set(patch);
      canvas.requestRenderAll();
      notifyChange();
    },
    [notifyChange]
  );

  const setTextFill = useCallback((fill: string) => applyToSelectedText({ fill }), [applyToSelectedText]);
  const setTextFontFamily = useCallback(
    (fontFamily: string) => applyToSelectedText({ fontFamily }),
    [applyToSelectedText]
  );
  const setTextFontSize = useCallback(
    (fontSize: number) => applyToSelectedText({ fontSize }),
    [applyToSelectedText]
  );

  // stroke applies to any selected layer (text or image), not just text
  const setStrokeColor = useCallback(
    (color: string) => {
      const canvas = fabricRef.current;
      if (!canvas) return;
      const targets = canvas.getActiveObjects();
      if (targets.length === 0) return;
      for (const t of targets) {
        t.set({ stroke: color });
        if (!t.strokeWidth) t.set({ strokeWidth: 4 }); // make the color change visible immediately
      }
      canvas.requestRenderAll();
      notifyChange();
    },
    [notifyChange]
  );

  const setStrokeWidth = useCallback(
    (width: number) => {
      const canvas = fabricRef.current;
      if (!canvas) return;
      const targets = canvas.getActiveObjects();
      if (targets.length === 0) return;
      for (const t of targets) {
        t.set({ strokeWidth: width });
        if (width > 0 && !t.stroke) t.set({ stroke: "#000000" }); // default a color in so width alone is visible
      }
      canvas.requestRenderAll();
      notifyChange();
    },
    [notifyChange]
  );

  const restoreSnapshot = useCallback(
    (snapshot: string) => {
      const canvas = fabricRef.current;
      if (!canvas) return;
      isRestoringRef.current = true;
      canvas
        .loadFromJSON(JSON.parse(snapshot))
        .then(() => {
          ensureIdsAndNames(canvas);
          canvas.requestRenderAll();
        })
        .finally(() => {
          isRestoringRef.current = false;
          refreshLayers();
          persist();
          setCanUndo(historyIndexRef.current > 0);
          setCanRedo(historyIndexRef.current < historyStackRef.current.length - 1);
        });
    },
    [refreshLayers, persist]
  );

  const undo = useCallback(() => {
    if (historyIndexRef.current <= 0) return;
    historyIndexRef.current -= 1;
    restoreSnapshot(historyStackRef.current[historyIndexRef.current]);
  }, [restoreSnapshot]);

  const redo = useCallback(() => {
    const stack = historyStackRef.current;
    if (historyIndexRef.current >= stack.length - 1) return;
    historyIndexRef.current += 1;
    restoreSnapshot(stack[historyIndexRef.current]);
  }, [restoreSnapshot]);

  // keyboard shortcuts: Cmd/Ctrl+Z to undo, Cmd/Ctrl+Shift+Z to redo
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement | null)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;
      if (isEditingText(fabricRef.current?.getActiveObject())) return;
      if (!(e.metaKey || e.ctrlKey) || e.key.toLowerCase() !== "z") return;
      e.preventDefault();
      if (e.shiftKey) redo();
      else undo();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [undo, redo]);

  const exportPNG = useCallback(() => {
    const canvas = fabricRef.current;
    if (!canvas) return;
    const priorScale = canvas.getZoom();
    canvas.discardActiveObject();
    canvas.setDimensions({ width: CANVAS_WIDTH, height: CANVAS_HEIGHT });
    canvas.setViewportTransform([1, 0, 0, 1, 0, 0]);
    canvas.requestRenderAll();

    const dataUrl = canvas.toDataURL({ format: "png", multiplier: 1 });

    canvas.setDimensions({ width: CANVAS_WIDTH * priorScale, height: CANVAS_HEIGHT * priorScale });
    canvas.setViewportTransform([priorScale, 0, 0, priorScale, 0, 0]);
    canvas.requestRenderAll();

    const link = document.createElement("a");
    link.href = dataUrl;
    link.download = "thumbnail.png";
    link.click();
  }, []);

  return {
    layers,
    selectedIds,
    selectedId: selectedIds[0] ?? null,
    textProps,
    strokeProps,
    displayScale,
    busy,
    canUndo,
    canRedo,
    addText,
    addImageFile,
    removeBackgroundForSelected,
    selectLayer,
    deleteLayer,
    deleteSelected,
    toggleVisibility,
    reorderLayer,
    reorderLayers,
    renameLayer,
    setTextFill,
    setTextFontFamily,
    setTextFontSize,
    setStrokeColor,
    setStrokeWidth,
    undo,
    redo,
    exportPNG,
  };
}

export type Editor = ReturnType<typeof useEditor>;
