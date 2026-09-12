import { useState, type RefObject } from "react";
import { SAFE_ZONE_INSET_RATIO } from "../lib/constants";

interface Props {
  containerRef: RefObject<HTMLDivElement>;
  canvasElRef: RefObject<HTMLCanvasElement>;
}

export default function CanvasStage({ containerRef, canvasElRef }: Props) {
  const [showSafeZone, setShowSafeZone] = useState(true);

  return (
    <div className="stage">
      <div className="stage-toolbar">
        <label className="checkbox-label">
          <input
            type="checkbox"
            checked={showSafeZone}
            onChange={(e) => setShowSafeZone(e.target.checked)}
          />
          Safe-zone guide
        </label>
      </div>
      <div className="stage-container" ref={containerRef}>
        <canvas ref={canvasElRef} />
        {showSafeZone && (
          <div
            className="safe-zone-overlay"
            style={{
              inset: `${SAFE_ZONE_INSET_RATIO * 100}%`,
            }}
          />
        )}
      </div>
    </div>
  );
}
