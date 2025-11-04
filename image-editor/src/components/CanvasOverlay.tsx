"use client";
import React, { useEffect } from "react";
import type { UseCanvasToolsReturn } from "../hooks/useCanvasTools";

export default function CanvasOverlay({ overlayRef, tools }: { overlayRef: React.RefObject<HTMLCanvasElement>; tools: UseCanvasToolsReturn }) {
  // overlay element; useCanvasTools attaches events and manages draw/crop handles
  useEffect(() => {
    const el = overlayRef.current;
    if (!el) return;
    // ensure cursor style matches tool
    if (tools.active === "draw") el.style.cursor = "crosshair";
    else if (tools.active === "text") el.style.cursor = "text";
    else if (tools.active === "crop") el.style.cursor = "crosshair";
    else el.style.cursor = "default";
  }, [tools.active]);

  // overlay is purely the interactive layer - actual drawing and handles are rendered by hook onto the overlay canvas
  return <canvas ref={overlayRef} className="absolute left-0 top-0 w-full h-full" style={{ pointerEvents: "auto" }} />;
}
