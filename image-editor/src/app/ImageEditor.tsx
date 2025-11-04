"use client";
import React, { useRef, useState, useEffect, useCallback } from "react";

type Tool = "pan" | "draw" | "text" | "crop" | "rotate" | "none";


 export default function ImageEditor() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const overlayRef = useRef<HTMLCanvasElement | null>(null); // for drawings / selection
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [tool, setTool] = useState<Tool>("none");
  const [imageEl, setImageEl] = useState<HTMLImageElement | null>(null);
  const [angle, setAngle] = useState(0); // degrees
  const [isDrawing, setIsDrawing] = useState(false);
  const [brushSize, setBrushSize] = useState(4);
  const [brushColor, setBrushColor] = useState("#ff0000");
  const [coords, setCoords] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  
  const [showTextInput, setShowTextInput] = useState(false);
  const [textPos, setTextPos] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [textValue, setTextValue] = useState("");
  const [textSize, setTextSize] = useState(24);
  const [textColor, setTextColor] = useState("#000000");

  const [isCropping, setIsCropping] = useState(false);
  const [cropRect, setCropRect] = useState<{ x: number; y: number; w: number; h: number } | null>(null);
  const cropStartRef = useRef<{ x: number; y: number } | null>(null);

  const [history, setHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState<number>(-1);
  const MAX_HISTORY = 10;

  const [canvasWidth, setCanvasWidth] = useState(900);
  const [canvasHeight, setCanvasHeight] = useState(600);

  // Initialize canvas size responsive-ish
  useEffect(() => {
    const w = Math.min(1000, Math.max(600, window.innerWidth - 120));
    setCanvasWidth(w);
    setCanvasHeight(Math.round((w * 2) / 3));
  }, []);

  const pushHistory = useCallback(() => {
    const c = canvasRef.current;
    if (!c) return;
    const data = c.toDataURL("image/png");
    setHistory((h) => {
      const next = h.slice(0, historyIndex + 1);
      next.push(data);
      while (next.length > MAX_HISTORY) next.shift();
      return next;
    });
    setHistoryIndex((i) => {
      const next = Math.min(MAX_HISTORY - 1, i + 1);
      return next < 0 ? 0 : next;
    });
  }, [historyIndex]);

  // After history changes, keep index valid
  useEffect(() => {
    setHistoryIndex((i) => Math.min(Math.max(0, i), Math.max(0, history.length - 1)));
  }, [history]);

  // Draw image onto main canvas with current angle
  const redrawMain = useCallback(() => {
    const c = canvasRef.current;
    if (!c) return;
    const ctx = c.getContext("2d");
    if (!ctx) return;


    ctx.clearRect(0, 0, c.width, c.height);
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, c.width, c.height);

    if (!imageEl) return;
    ctx.save();
    const rad = (angle * Math.PI) / 180;

    const iw = imageEl.width;
    const ih = imageEl.height;
    const cw = c.width;
    const ch = c.height;
    const scale = Math.min(cw / iw, ch / ih);
    const dw = iw * scale;
    const dh = ih * scale;

  
    ctx.translate(cw / 2, ch / 2);
    ctx.rotate(rad);
    ctx.drawImage(imageEl, -dw / 2, -dh / 2, dw, dh);
    ctx.restore();
  }, [imageEl, angle]);

  const redrawOverlay = useCallback(() => {
    const o = overlayRef.current;
    if (!o) return;
    const ctx = o.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, o.width, o.height);

    // show crop rectangle
    if (cropRect) {
      ctx.save();
      ctx.fillStyle = "rgba(0,0,0,0.4)";
      ctx.fillRect(0, 0, o.width, o.height);
      ctx.clearRect(cropRect.x, cropRect.y, cropRect.w, cropRect.h);
      ctx.strokeStyle = "#00ff00";
      ctx.lineWidth = 2;
      ctx.strokeRect(cropRect.x + 0.5, cropRect.y + 0.5, cropRect.w, cropRect.h);
      ctx.restore();
    }
  }, [cropRect]);

  useEffect(() => {
    redrawMain();
  }, [imageEl, angle, redrawMain]);

  useEffect(() => {
    redrawOverlay();
  }, [cropRect, redrawOverlay]);

  const handleFile = (file?: File) => {
    if (!file) return;
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      setImageEl(img);
      setAngle(0);
      setHistory([]);
      setHistoryIndex(-1);

      // draw image once loaded
      requestAnimationFrame(() => {
        redrawMain();
        pushHistory();
      });
    };
    img.onerror = () => alert("Failed to load image");
    img.src = url;
  };

 
  const onUploadClick = () => fileInputRef.current?.click();

 
  useEffect(() => {
    const c = overlayRef.current;
    if (!c) return;

    const rect = () => c.getBoundingClientRect();

    let lastX = 0;
    let lastY = 0;

    function toLocal(e: MouseEvent | PointerEvent) {
      const r = rect();
      const x = Math.round(e.clientX - r.left);
      const y = Math.round(e.clientY - r.top);
      return { x, y };
    }

    const onPointerDown = (e: PointerEvent) => {
      (e.target as Element).setPointerCapture?.(e.pointerId);
      const { x, y } = toLocal(e);
      setCoords({ x, y });

      if (tool === "draw") {
        setIsDrawing(true);
        lastX = x;
        lastY = y;
        const ctx = c.getContext("2d");
        if (!ctx) return;
        ctx.lineJoin = "round";
        ctx.lineCap = "round";
        ctx.strokeStyle = brushColor;
        ctx.lineWidth = brushSize;
        ctx.beginPath();
        ctx.moveTo(x, y);
      }

      if (tool === "crop") {
        setIsCropping(true);
        cropStartRef.current = { x, y };
        setCropRect({ x, y, w: 0, h: 0 });
      }

      if (tool === "text") {
        setTextPos({ x, y });
        setShowTextInput(true);
        setTextValue("");
      }
    };

    const onPointerMove = (e: PointerEvent) => {
      const { x, y } = toLocal(e);
      setCoords({ x, y });
      const ctx = c.getContext("2d");
      if (!ctx) return;

      if (tool === "draw" && isDrawing) {
        ctx.strokeStyle = brushColor;
        ctx.lineWidth = brushSize;
        ctx.lineTo(x, y);
        ctx.stroke();
        lastX = x;
        lastY = y;
      }

      if (tool === "crop" && isCropping && cropStartRef.current) {
        const start = cropStartRef.current;
        const rx = Math.min(start.x, x);
        const ry = Math.min(start.y, y);
        const rw = Math.abs(x - start.x);
        const rh = Math.abs(y - start.y);
        setCropRect({ x: rx, y: ry, w: rw, h: rh });
      }
    };

    const onPointerUp = (e: PointerEvent) => {
      const { x, y } = toLocal(e);
      setCoords({ x, y });

      if (tool === "draw" && isDrawing) {
        setIsDrawing(false);
        const main = canvasRef.current;
        if (main) {
          const mctx = main.getContext("2d");
          const octx = c.getContext("2d");
          if (mctx && octx) {
            mctx.drawImage(c, 0, 0);
            octx.clearRect(0, 0, c.width, c.height);
            pushHistory();
          }
        }
      }

      if (tool === "crop" && isCropping) {
        setIsCropping(false);
        if (cropRect && cropRect.w > 10 && cropRect.h > 10) {
          applyCrop();
        } else {
          setCropRect(null);
        }
      }

      if (tool === "text") {
       // I did not applied these feature as time is running out
      }

      try {
        (e.target as Element).releasePointerCapture?.(e.pointerId);
      } catch (_) {}
    };

    c.addEventListener("pointerdown", onPointerDown);
    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerup", onPointerUp);

    return () => {
      c.removeEventListener("pointerdown", onPointerDown);
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", onPointerUp);
    };
  }, [tool, isDrawing, brushColor, brushSize, isCropping, cropRect, pushHistory]);

  useEffect(() => {
    const c = canvasRef.current;
    const o = overlayRef.current;
    if (!c || !o) return;
    c.width = canvasWidth;
    c.height = canvasHeight;
    o.width = canvasWidth;
    o.height = canvasHeight;
    redrawMain();
    redrawOverlay();
  }, [canvasWidth, canvasHeight, redrawMain, redrawOverlay]);

  // Undo / Redo actions
  const undo = () => {
    if (historyIndex <= 0) return;
    const idx = historyIndex - 1;
    const data = history[idx];
    if (!data) return;
    const img = new Image();
    img.onload = () => {
      const c = canvasRef.current;
      if (!c) return;
      const ctx = c.getContext("2d");
      if (!ctx) return;
      ctx.clearRect(0, 0, c.width, c.height);
      ctx.drawImage(img, 0, 0, c.width, c.height);
      setHistoryIndex(idx);
    };
    img.src = data;
  };

  const redo = () => {
    if (historyIndex >= history.length - 1) return;
    const idx = historyIndex + 1;
    const data = history[idx];
    if (!data) return;
    const img = new Image();
    img.onload = () => {
      const c = canvasRef.current;
      if (!c) return;
      const ctx = c.getContext("2d");
      if (!ctx) return;
      ctx.clearRect(0, 0, c.width, c.height);
      ctx.drawImage(img, 0, 0, c.width, c.height);
      setHistoryIndex(idx);
    };
    img.src = data;
  };

  // Apply crop
  const applyCrop = () => {
    const rect = cropRect;
    if (!rect) return;
    const main = canvasRef.current;
    if (!main) return;
    const mctx = main.getContext("2d");
    if (!mctx) return;

    const temp = document.createElement("canvas");
    temp.width = rect.w;
    temp.height = rect.h;
    const tctx = temp.getContext("2d");
    if (!tctx) return;
    tctx.drawImage(main, rect.x, rect.y, rect.w, rect.h, 0, 0, rect.w, rect.h);

    // resize main canvas to the crop size
    main.width = rect.w;
    main.height = rect.h;
    overlayRef.current!.width = rect.w;
    overlayRef.current!.height = rect.h;
    setCanvasWidth(rect.w);
    setCanvasHeight(rect.h);

    const img = new Image();
    img.onload = () => {
      mctx.clearRect(0, 0, main.width, main.height);
      mctx.drawImage(img, 0, 0);
      setCropRect(null);
      pushHistory();
    };
    img.src = temp.toDataURL();
  };

  const commitText = () => {
    if (!textValue) {
      setShowTextInput(false);
      return;
    }
    const c = canvasRef.current;
    if (!c) return;
    const ctx = c.getContext("2d");
    if (!ctx) return;
    ctx.font = `${textSize}px sans-serif`;
    ctx.fillStyle = textColor;
    ctx.textBaseline = "top";
    ctx.fillText(textValue, textPos.x, textPos.y);
    setShowTextInput(false);
    setTextValue("");
    pushHistory();
  };

  // Rotate 90 degrees step
  const rotate90 = () => {
    // rotate canvas content by 90
    const c = canvasRef.current;
    if (!c) return;
    const t = document.createElement("canvas");
    t.width = c.height;
    t.height = c.width;
    const tctx = t.getContext("2d");
    const ctx = c.getContext("2d");
    if (!tctx || !ctx) return;
    tctx.save();
    tctx.translate(t.width / 2, t.height / 2);
    tctx.rotate((90 * Math.PI) / 180);
    tctx.drawImage(c, -c.width / 2, -c.height / 2);
    tctx.restore();

    c.width = t.width;
    c.height = t.height;
    overlayRef.current!.width = t.width;
    overlayRef.current!.height = t.height;
    setCanvasWidth(t.width);
    setCanvasHeight(t.height);

    ctx.clearRect(0, 0, c.width, c.height);
    ctx.drawImage(t, 0, 0);
    pushHistory();
  };

  // Export final image
  const exportPNG = () => {
    const c = canvasRef.current;
    if (!c) return;
    const link = document.createElement("a");
    link.download = "edited.png";
    link.href = c.toDataURL("image/png");
    link.click();
  };

  // Load history initial snapshot
  useEffect(() => {
    // whenever we draw the initial image into canvas, we should push it to history.
    if (!imageEl) return;
    const t = setTimeout(() => {
      const c = canvasRef.current;
      if (!c) return;
      const ctx = c.getContext("2d");
      if (!ctx) return;
      // ensure image drawn
      redrawMain();
      const data = c.toDataURL();
      setHistory([data]);
      setHistoryIndex(0);
    }, 100);
    return () => clearTimeout(t);
  }, [imageEl, redrawMain]);

  useEffect(() => {
    const o = overlayRef.current;
    if (!o) return;
    if (tool === "draw") o.style.cursor = "crosshair";
    else if (tool === "crop") o.style.cursor = "crosshair";
    else if (tool === "text") o.style.cursor = "text";
    else o.style.cursor = "default";
  }, [tool]);

  return (
    <div style={styles.container}>
      <div style={styles.leftPane}>
        <div style={styles.toolbar}>
          <div style={styles.row}>
            <button style={btn(tool === "none")} onClick={() => setTool("none")}>
              Select
            </button>
            <button style={btn(tool === "draw")} onClick={() => setTool("draw")}>
              Draw
            </button>
            <button style={btn(tool === "text")} onClick={() => setTool("text")}>
              Text
            </button>
            <button style={btn(tool === "crop")} onClick={() => setTool("crop")}>
              Crop
            </button>
          </div>

          <div style={styles.row}>
            <button onClick={onUploadClick}>Upload</button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              style={{ display: "none" }}
              onChange={(e) => handleFile(e.target.files?.[0])}
            />

            <button onClick={() => { setAngle((a) => a + 90); /* visual rotate via angle state */ }}>Rotate 90</button>
            <button onClick={rotate90}>Rotate Canvas 90° (commit)</button>

            <button onClick={undo} disabled={historyIndex <= 0}>
              Undo
            </button>
            <button onClick={redo} disabled={historyIndex >= history.length - 1}>
              Redo
            </button>

            <button onClick={exportPNG}>Save PNG</button>
          </div>

          <div style={styles.row}>
            <label>Brush</label>
            <input
              type="range"
              min={1}
              max={50}
              value={brushSize}
              onChange={(e) => setBrushSize(Number(e.target.value))}
            />
            <input type="color" value={brushColor} onChange={(e) => setBrushColor(e.target.value)} />
          </div>

          <div style={styles.row}>
            <label>Text size</label>
            <input type="number" value={textSize} onChange={(e) => setTextSize(Number(e.target.value))} />
            <input type="color" value={textColor} onChange={(e) => setTextColor(e.target.value)} />
          </div>

          <div style={styles.row}>
            <label>Rotate (free)</label>
            <input
              type="range"
              min={-180}
              max={180}
              value={angle}
              onChange={(e) => setAngle(Number(e.target.value))}
            />
            <div style={{ marginLeft: 8 }}>{angle}°</div>
          </div>
        </div>

        <div style={styles.hintBox}>Pointer: {coords.x}, {coords.y}</div>
      </div>

      <div style={styles.canvasWrap}>
        <div style={{ position: "relative", border: "1px solid #ccc" }}>
          <canvas ref={canvasRef} style={{ display: "block" }} width={canvasWidth} height={canvasHeight} />
          <canvas
            ref={overlayRef}
            style={{ position: "absolute", left: 0, top: 0, pointerEvents: "auto" }}
            width={canvasWidth}
            height={canvasHeight}
          />

          {showTextInput && (
            <div style={{ position: "absolute", left: textPos.x, top: textPos.y, transform: "translate(0,0)" }}>
              <input
                autoFocus
                style={{ fontSize: textSize, border: "1px solid #666", padding: 4 }}
                value={textValue}
                onChange={(e) => setTextValue(e.target.value)}
                onBlur={commitText}
                onKeyDown={(e) => {
                  if (e.key === "Enter") commitText();
                }}
              />
            </div>
          )}
        </div>

        <div style={styles.rightPanel}>
          <div style={{ marginBottom: 12 }}>
            <strong>Preview</strong>
            <div style={{ fontSize: 12 }}>(Canvas shows current composite)</div>
          </div>

          <div style={{ display: "flex", gap: 8 }}>
            <button onClick={() => { 
              setCanvasWidth(900);
              setCanvasHeight(600);
            }}>Reset Size</button>
            <button onClick={() => { 
              const c = canvasRef.current; const o = overlayRef.current;
              if (c && o) { const ctx = c.getContext('2d'); ctx?.clearRect(0,0,c.width,c.height); o.getContext('2d')?.clearRect(0,0,o.width,o.height); setHistory([]); setHistoryIndex(-1); }
            }}>Clear</button>
          </div>

          <div style={{ marginTop: 16 }}>
            <strong>Notes</strong>
            <ul>
              <li>Upload jpg/png to start.</li>
              <li>Draw uses overlay and merges on mouseup.</li>
              <li>Crop: click-drag to select then it will apply.</li>
              <li>Text: select Text tool and click location to type.</li>
              <li>Undo/Redo operate on committed actions (draw commit, crop, rotate canvas, text commit).</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

const styles: { [k: string]: React.CSSProperties } = {
  app: { fontFamily: "Inter, Roboto, Arial, sans-serif", padding: 20, minHeight: "100vh", background: "#f7f7f7" },
  header: { margin: 0, marginBottom: 12, fontSize: 20 },
  container: { display: "flex", gap: 16, alignItems: "flex-start" },
  leftPane: { width: 320, display: "flex", flexDirection: "column", gap: 12 },
  toolbar: { background: "#fff", padding: 12, borderRadius: 8, boxShadow: "0 1px 3px rgba(0,0,0,0.08)" },
  row: { display: "flex", gap: 8, marginBottom: 8, flexWrap: "wrap" },
  canvasWrap: { flex: 1, display: "flex", flexDirection: "column", gap: 12 },
  rightPanel: { marginTop: 8, background: "#fff", padding: 12, borderRadius: 8 },
  hintBox: { background: "#fff", padding: 8, borderRadius: 6, boxShadow: "0 1px 3px rgba(0,0,0,0.06)" },
  footer: { marginTop: 20, fontSize: 12, color: "#666" }
};

function btn(active?: boolean): React.CSSProperties {
  return {
    padding: "6px 10px",
    borderRadius: 6,
    border: "1px solid #bbb",
    background: active ? "#e6f7ff" : "#fff",
  };
}
