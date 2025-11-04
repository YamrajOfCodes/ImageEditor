import { useCallback, useEffect, useRef, useState } from "react";

export type ToolType = "none" | "draw" | "text" | "crop";

export interface UseCanvasToolsParams {
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
  overlayRef: React.RefObject<HTMLCanvasElement | null>;
  imageEl: HTMLImageElement | null;
  angle: number;
  canvasSize: { w: number; h: number };
  setCanvasSize: (s: { w: number; h: number }) => void;
  pushSnapshot: (canvas?: HTMLCanvasElement | null) => void;
}

export interface UseCanvasToolsReturn {
  active: ToolType;
  setActiveTool: (t: ToolType) => void;
  brushSize: number;
  setBrushSize: (n: number) => void;
  brushColor: string;
  setBrushColor: (c: string) => void;
  coords: { x: number; y: number };
  redrawImage: (img: HTMLImageElement | null, angle: number) => void;
  rotateCanvas90: () => void;
}

type Rect = { x: number; y: number; w: number; h: number };

export default function useCanvasTools(params: UseCanvasToolsParams): UseCanvasToolsReturn {
  const { canvasRef, overlayRef, imageEl, angle, canvasSize, setCanvasSize, pushSnapshot } = params;
  const [active, setActive] = useState<ToolType>("none");
  const [brushSize, setBrushSize] = useState(6);
  const [brushColor, setBrushColor] = useState("#ff0000");
  const [coords, setCoords] = useState({ x: 0, y: 0 });

  const drawingRef = useRef(false);
  const lastPoint = useRef<{ x: number; y: number } | null>(null);

  // Crop state with handles
  const cropRef = useRef<{ rect: Rect | null; dragging: boolean; handle: string | null; offset: { x: number; y: number } | null }>({
    rect: null,
    dragging: false,
    handle: null,
    offset: null,
  });

  const getOverlayCtx = () => overlayRef.current?.getContext("2d") || null;
  const getMainCtx = () => canvasRef.current?.getContext("2d") || null;

  const redrawImage = useCallback((img: HTMLImageElement | null, a: number) => {
    const c = canvasRef.current;
    if (!c) return;
    const ctx = c.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, c.width, c.height);
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, c.width, c.height);
    if (!img) return;

    const iw = img.width;
    const ih = img.height;
    const scale = Math.min(c.width / iw, c.height / ih);
    const dw = iw * scale;
    const dh = ih * scale;

    ctx.save();
    ctx.translate(c.width / 2, c.height / 2);
    ctx.rotate((a * Math.PI) / 180);
    ctx.drawImage(img, -dw / 2, -dh / 2, dw, dh);
    ctx.restore();
  }, []);

  const rotateCanvas90 = useCallback(() => {
    const c = canvasRef.current;
    if (!c) return;
    const temp = document.createElement("canvas");
    temp.width = c.height;
    temp.height = c.width;
    const tctx = temp.getContext("2d");
    const ctx = c.getContext("2d");
    if (!tctx || !ctx) return;
    tctx.save();
    tctx.translate(temp.width / 2, temp.height / 2);
    tctx.rotate((90 * Math.PI) / 180);
    tctx.drawImage(c, -c.width / 2, -c.height / 2);
    tctx.restore();
    c.width = temp.width;
    c.height = temp.height;
    setCanvasSize({ w: temp.width, h: temp.height });
    ctx.clearRect(0, 0, c.width, c.height);
    ctx.drawImage(temp, 0, 0);
  }, [setCanvasSize]);

  const drawOverlay = useCallback(() => {
    const overlay = overlayRef.current;
    const ctx = getOverlayCtx();
    if (!overlay || !ctx) return;
    ctx.clearRect(0, 0, overlay.width, overlay.height);

    // draw current crop rect if present
    const crop = cropRef.current.rect;
    if (crop) {
      ctx.save();
      ctx.fillStyle = "rgba(0,0,0,0.45)";
      ctx.fillRect(0, 0, overlay.width, overlay.height);
      ctx.clearRect(crop.x, crop.y, crop.w, crop.h);

      // border
      ctx.strokeStyle = "#1dd1a1";
      ctx.lineWidth = 2;
      ctx.strokeRect(crop.x + 0.5, crop.y + 0.5, crop.w, crop.h);

      const handles = getHandlePoints(crop);
      ctx.fillStyle = "#fff";
      ctx.strokeStyle = "#333";
      handles.forEach((pt) => {
        ctx.fillRect(pt.x - 6, pt.y - 6, 12, 12);
        ctx.strokeRect(pt.x - 6 + 0.5, pt.y - 6 + 0.5, 12, 12);
      });
      ctx.restore();
    }
  }, []);


  function getHandlePoints(r: Rect) {
    const cx = r.x + r.w / 2;
    const cy = r.y + r.h / 2;
    return [
      { x: r.x, y: r.y, name: "nw" },
      { x: cx, y: r.y, name: "n" },
      { x: r.x + r.w, y: r.y, name: "ne" },
      { x: r.x + r.w, y: cy, name: "e" },
      { x: r.x + r.w, y: r.y + r.h, name: "se" },
      { x: cx, y: r.y + r.h, name: "s" },
      { x: r.x, y: r.y + r.h, name: "sw" },
      { x: r.x, y: cy, name: "w" },
    ];
  }

  function detectHandle(px: number, py: number): string | null {
    const r = cropRef.current.rect;
    if (!r) return null;
    const handles = getHandlePoints(r);
    for (const h of handles) {
      if (px >= h.x - 8 && px <= h.x + 8 && py >= h.y - 8 && py <= h.y + 8) return h.name;
    }
 
    if (px >= r.x && px <= r.x + r.w && py >= r.y && py <= r.y + r.h) return "move";
    return null;
  }

 
  const applyCrop = useCallback(() => {
    const r = cropRef.current.rect;
    const main = canvasRef.current;
    if (!r || !main) return;
    const temp = document.createElement("canvas");
    temp.width = Math.max(1, Math.round(r.w));
    temp.height = Math.max(1, Math.round(r.h));
    const tctx = temp.getContext("2d");
    const mctx = main.getContext("2d");
    if (!tctx || !mctx) return;

    tctx.drawImage(main, r.x, r.y, r.w, r.h, 0, 0, temp.width, temp.height);
    // resize main
    main.width = temp.width;
    main.height = temp.height;
    setCanvasSize({ w: temp.width, h: temp.height });
    mctx.clearRect(0, 0, main.width, main.height);
    mctx.drawImage(temp, 0, 0);
    cropRef.current.rect = null;
    drawOverlay();
    pushSnapshot(main);
  }, [setCanvasSize, drawOverlay, pushSnapshot]);

  // pointer/touch events for overlay
  useEffect(() => {
    const overlay = overlayRef.current;
    if (!overlay) return;
    const rect = () => overlay.getBoundingClientRect();

    let pointerIdToLastPos = new Map<number, { x: number; y: number }>();

    const toLocal = (clientX: number, clientY: number) => {
      const r = rect();
      return { x: Math.round(clientX - r.left), y: Math.round(clientY - r.top) };
    };

    function startDraw(p: { x: number; y: number }) {
      drawingRef.current = true;
      lastPoint.current = p;
      const ctx = getOverlayCtx();
      if (!ctx) return;
      ctx.beginPath();
      ctx.moveTo(p.x, p.y);
      ctx.lineWidth = brushSize;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.strokeStyle = brushColor;
    }

    function continueDraw(p: { x: number; y: number }) {
      const ctx = getOverlayCtx();
      if (!ctx || !drawingRef.current) return;
      ctx.lineTo(p.x, p.y);
      ctx.stroke();
      lastPoint.current = p;
    }

    function endDraw() {
      if (!drawingRef.current) return;
      drawingRef.current = false;
      lastPoint.current = null;
      // merge onto main
      const main = canvasRef.current;
      const octx = getOverlayCtx();
      const mctx = getMainCtx();
      if (main && octx && mctx) {
        mctx.drawImage(overlay, 0, 0);
        octx.clearRect(0, 0, overlay.width, overlay.height);
        pushSnapshot(main);
      }
    }

    // pointer handlers (handle mouse + touch via pointer events)
    const onPointerDown = (ev: PointerEvent) => {
      overlay.setPointerCapture?.(ev.pointerId);
      const p = toLocal(ev.clientX, ev.clientY);
      setCoords(p);

      if (active === "draw") {
        startDraw(p);
      } else if (active === "crop") {
        // if no rect, start a new rect
        if (!cropRef.current.rect) {
          cropRef.current.rect = { x: p.x, y: p.y, w: 0, h: 0 };
          cropRef.current.dragging = true;
          cropRef.current.handle = "se";
          cropRef.current.offset = { x: 0, y: 0 };
        } else {
          const h = detectHandle(p.x, p.y);
          if (h) {
            cropRef.current.dragging = true;
            cropRef.current.handle = h;
            if (h === "move") {
              cropRef.current.offset = { x: p.x - cropRef.current.rect.x, y: p.y - cropRef.current.rect.y };
            } else {
              cropRef.current.offset = { x: p.x, y: p.y };
            }
          } else {
            // click outside: start a new rect
            cropRef.current.rect = { x: p.x, y: p.y, w: 0, h: 0 };
            cropRef.current.dragging = true;
            cropRef.current.handle = "se";
            cropRef.current.offset = { x: 0, y: 0 };
          }
        }
        drawOverlay();
      } else if (active === "text") {
        // delegate text handling to consumer by exposing coords; consumer shows input and commits text
      }
      pointerIdToLastPos.set(ev.pointerId, p);
    };

    const onPointerMove = (ev: PointerEvent) => {
      const p = toLocal(ev.clientX, ev.clientY);
      setCoords(p);
      if (active === "draw") {
        if (drawingRef.current) continueDraw(p);
      } else if (active === "crop") {
        const rectObj = cropRef.current.rect;
        if (!rectObj) return;
        if (!cropRef.current.dragging) {
          // update hover cursor maybe
          // no-op
        } else {
          const handle = cropRef.current.handle;
          if (!handle) return;
          // resize logic
          if (handle === "move") {
            const off = cropRef.current.offset;
            if (!off) return;
            rectObj.x = p.x - off.x;
            rectObj.y = p.y - off.y;
          } else {
            // corner/edge dragging
            const start = cropRef.current.offset;
            if (!start) return;
            // use basic mapping for each handle
            switch (handle) {
              case "nw": {
                const nx = p.x;
                const ny = p.y;
                const ex = rectObj.x + rectObj.w;
                const ey = rectObj.y + rectObj.h;
                rectObj.x = Math.min(nx, ex);
                rectObj.y = Math.min(ny, ey);
                rectObj.w = Math.abs(ex - nx);
                rectObj.h = Math.abs(ey - ny);
                break;
              }
              case "n": {
                const ny = p.y;
                rectObj.h = Math.max(2, rectObj.y + rectObj.h - ny);
                rectObj.y = ny;
                break;
              }
              case "ne": {
                const ny = p.y;
                const sx = rectObj.x;
                rectObj.w = Math.max(2, p.x - sx);
                rectObj.y = Math.min(rectObj.y, ny);
                rectObj.h = Math.abs((rectObj.y + rectObj.h) - ny);
                break;
              }
              case "e": {
                rectObj.w = Math.max(2, p.x - rectObj.x);
                break;
              }
              case "se": {
                rectObj.w = Math.max(2, p.x - rectObj.x);
                rectObj.h = Math.max(2, p.y - rectObj.y);
                break;
              }
              case "s": {
                rectObj.h = Math.max(2, p.y - rectObj.y);
                break;
              }
              case "sw": {
                const nx = p.x;
                rectObj.w = Math.abs(rectObj.x + rectObj.w - nx);
                rectObj.x = Math.min(nx, rectObj.x + rectObj.w);
                rectObj.h = Math.max(2, p.y - rectObj.y);
                break;
              }
              case "w": {
                const nx = p.x;
                const ex = rectObj.x + rectObj.w;
                rectObj.x = Math.min(nx, ex);
                rectObj.w = Math.abs(ex - nx);
                break;
              }
            }
          }
          drawOverlay();
        }
      }
      pointerIdToLastPos.set(ev.pointerId, p);
    };

    const onPointerUp = (ev: PointerEvent) => {
      overlay.releasePointerCapture?.(ev.pointerId);
      const last = pointerIdToLastPos.get(ev.pointerId);
      if (active === "draw") {
        endDraw();
      } else if (active === "crop") {
        if (cropRef.current.dragging) {
          cropRef.current.dragging = false;
          cropRef.current.handle = null;
          cropRef.current.offset = null;
          const r = cropRef.current.rect;
          if (r && (r.w < 6 || r.h < 6)) {
            cropRef.current.rect = null;
            drawOverlay();
          } else {
            drawOverlay();
            applyCrop();
          }
        }
      }
      pointerIdToLastPos.delete(ev.pointerId);
    };

    overlay.addEventListener("pointerdown", onPointerDown);
    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerup", onPointerUp);

    return () => {
      overlay.removeEventListener("pointerdown", onPointerDown);
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", onPointerUp);
    };
  }, [active, brushColor, brushSize, applyCrop]);

  // tapping into text commit: consumer can listen to tools.coords & active === 'text' and show an input overlay
  // but to keep single-hook simplicity, we expose coords and expect CanvasEditor to handle text UI.

  // expose small API
  return {
    active,
    setActiveTool: setActive,
    brushSize,
    setBrushSize,
    brushColor,
    setBrushColor,
    coords,
    redrawImage,
    rotateCanvas90,
  } as UseCanvasToolsReturn;
}
