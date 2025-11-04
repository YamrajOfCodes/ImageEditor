"use client";
import React, { useRef, useState, useEffect } from "react";
import Toolbar from "./Toolbar";
import CanvasOverlay from "./CanvasOverlay";
import useCanvasTools from "../hooks/useCanvasTools";
import useHistory from "../hooks/useHistory";
import { fitImageToCanvas } from "../app/lib/canvasUtils";

export default function CanvasEditor() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const overlayRef = useRef<HTMLCanvasElement | null>(null);

  const [imageEl, setImageEl] = useState<HTMLImageElement | null>(null);
  const [angle, setAngle] = useState(0);
  const [canvasSize, setCanvasSize] = useState({ w: 900, h: 600 });

  const { pushSnapshot, undo, redo, canUndo, canRedo } = useHistory();

  const tools = useCanvasTools({
    canvasRef,
    overlayRef,
    imageEl,
    angle,
    canvasSize,
    setCanvasSize,
    pushSnapshot,
  });

  // File load
  const handleFile = (file?: File) => {
    if (!file) return;
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      setImageEl(img);
      const { w, h } = fitImageToCanvas(img.width, img.height, 1200, 800);
      setCanvasSize({ w, h });
      // draw once mounted
      requestAnimationFrame(() => tools.redrawImage(img, angle));
      setTimeout(() => pushSnapshot(canvasRef.current), 120);
    };
    img.src = url;
  };

  // Export using toBlob
  const exportPNG = async () => {
    const c = canvasRef.current;
    if (!c) return;
    c.toBlob((blob) => {
      if (!blob) return;
      const link = document.createElement("a");
      link.download = "edited.png";
      link.href = URL.createObjectURL(blob);
      link.click();
      URL.revokeObjectURL(link.href);
    }, "image/png");
  };

  // sync canvas sizes
  useEffect(() => {
    const c = canvasRef.current;
    const o = overlayRef.current;
    if (!c || !o) return;
    c.width = canvasSize.w;
    c.height = canvasSize.h;
    o.width = canvasSize.w;
    o.height = canvasSize.h;
    tools.redrawImage(imageEl, angle);
  }, [canvasSize, imageEl, angle]);

  return (
    <div className="min-h-screen  bg-gradient-to-br from-slate-950 via-purple-950 to-slate-950 p-6">
      <div className="max-w-[1800px] mx-auto">
        {/* Header */}
        <div className="mb-6 text-center">
          <h1 className="text-5xl font-bold mb-2 text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-pink-400 to-blue-400 animate-pulse">
            Canvas Editor Pro
          </h1>
          <p className="text-slate-400 text-sm">Professional image editing at your fingertips</p>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-[780px_1fr] gap-6">
          {/* Sidebar */}
          <aside className="space-y-6">
            {/* Toolbar */}
            <Toolbar
              onFile={handleFile}
              onRotate={(a) => setAngle(a)}
              angle={angle}
              onRotate90={() => {
                tools.rotateCanvas90();
                pushSnapshot(canvasRef.current);
              }}
              onExport={exportPNG}
              onUndo={() => undo(canvasRef.current)}
              onRedo={() => redo(canvasRef.current)}
              canUndo={canUndo}
              canRedo={canRedo}
              toolsState={tools}
            />

            {/* Info Panel */}
            <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-6 rounded-2xl shadow-2xl border border-slate-700/50 backdrop-blur-xl">
              <div className="flex items-center gap-3 mb-4 pb-4 border-b border-slate-700/50">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400">
                  Editor Info
                </h3>
              </div>

              <div className="space-y-4">
                {/* Active Tool */}
                <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-700/30">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-slate-400 font-medium">Active Tool</span>
                    <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                  </div>
                  <div className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-pink-400 to-purple-400 uppercase tracking-wider">
                    {tools.active}
                  </div>
                </div>

                {/* Coordinates */}
                <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-700/30">
                  <div className="text-sm text-slate-400 font-medium mb-3">Cursor Position</div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-gradient-to-br from-blue-500/10 to-purple-500/10 p-3 rounded-lg border border-blue-500/20">
                      <div className="text-xs text-blue-400 mb-1">X Axis</div>
                      <div className="text-xl font-bold text-white">{tools.coords.x}</div>
                    </div>
                    <div className="bg-gradient-to-br from-purple-500/10 to-pink-500/10 p-3 rounded-lg border border-purple-500/20">
                      <div className="text-xs text-purple-400 mb-1">Y Axis</div>
                      <div className="text-xl font-bold text-white">{tools.coords.y}</div>
                    </div>
                  </div>
                </div>

                {/* Pro Tip */}
                <div className="relative overflow-hidden bg-gradient-to-br from-amber-500/10 to-orange-500/10 p-4 rounded-xl border border-amber-500/30">
                  <div className="absolute top-0 right-0 w-20 h-20 bg-amber-500/20 rounded-full blur-2xl"></div>
                  <div className="relative">
                    <div className="flex items-center gap-2 mb-2">
                      <svg className="w-5 h-5 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                      </svg>
                      <span className="text-sm font-semibold text-amber-400">Pro Tip</span>
                    </div>
                    <p className="text-xs text-amber-200/80 leading-relaxed">
                      Use Draw tool to create custom annotations, then Save PNG to export your masterpiece!
                    </p>
                  </div>
                </div>

                {/* Canvas Stats */}
                <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-700/30">
                  <div className="text-sm text-slate-400 font-medium mb-3">Canvas Size</div>
                  <div className="flex items-center gap-3">
                    <div className="flex-1">
                      <div className="text-xs text-slate-500 mb-1">Width</div>
                      <div className="text-lg font-bold text-cyan-400">{canvasSize.w}px</div>
                    </div>
                    <div className="text-slate-600">×</div>
                    <div className="flex-1">
                      <div className="text-xs text-slate-500 mb-1">Height</div>
                      <div className="text-lg font-bold text-pink-400">{canvasSize.h}px</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-5 rounded-2xl shadow-2xl border border-slate-700/50 backdrop-blur-xl">
              <h4 className="text-sm font-semibold text-slate-400 mb-3 flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                Keyboard Shortcuts
              </h4>
              <div className="space-y-2 text-xs">
                <div className="flex justify-between items-center text-slate-400">
                  <span>Undo</span>
                  <kbd className="px-2 py-1 bg-slate-800 rounded border border-slate-700 font-mono text-slate-300">Ctrl+Z</kbd>
                </div>
                <div className="flex justify-between items-center text-slate-400">
                  <span>Redo</span>
                  <kbd className="px-2 py-1 bg-slate-800 rounded border border-slate-700 font-mono text-slate-300">Ctrl+Y</kbd>
                </div>
                <div className="flex justify-between items-center text-slate-400">
                  <span>Export</span>
                  <kbd className="px-2 py-1 bg-slate-800 rounded border border-slate-700 font-mono text-slate-300">Ctrl+S</kbd>
                </div>
              </div>
            </div>
          </aside>

          {/* Main Canvas Area */}
          <section className="space-y-4">
            <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-6 rounded-2xl shadow-2xl border border-slate-700/50 backdrop-blur-xl">
              {/* Canvas Header */}
              <div className="flex items-center justify-between mb-4 pb-4 border-b border-slate-700/50">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-white">Canvas Workspace</h2>
                    <p className="text-xs text-slate-400">Drag and edit your image</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                  <span className="text-xs text-slate-400">Live Preview</span>
                </div>
              </div>

              {/* Canvas Container */}
              <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-slate-950 to-slate-900 p-8 border border-slate-700/30 shadow-inner">
                {/* Decorative corners */}
                <div className="absolute top-4 left-4 w-6 h-6 border-t-2 border-l-2 border-purple-500/30"></div>
                <div className="absolute top-4 right-4 w-6 h-6 border-t-2 border-r-2 border-purple-500/30"></div>
                <div className="absolute bottom-4 left-4 w-6 h-6 border-b-2 border-l-2 border-purple-500/30"></div>
                <div className="absolute bottom-4 right-4 w-6 h-6 border-b-2 border-r-2 border-purple-500/30"></div>
                
                {/* Canvas with glow effect */}
                <div className="relative group">
                  <div className="absolute inset-0 bg-gradient-to-r from-purple-500/20 via-blue-500/20 to-pink-500/20 rounded-lg blur-xl opacity-50 group-hover:opacity-75 transition-opacity duration-500"></div>
                  <div className="relative bg-white rounded-lg shadow-2xl overflow-hidden">
                    <canvas ref={canvasRef} className="block w-full h-auto" />
                    <CanvasOverlay overlayRef={overlayRef} tools={tools} />
                  </div>
                </div>

                {/* Floating badge */}
                {!imageEl && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-center space-y-4 animate-pulse">
                      <div className="w-20 h-20 mx-auto rounded-full bg-gradient-to-br from-purple-500/20 to-blue-500/20 flex items-center justify-center border border-purple-500/30">
                        <svg className="w-10 h-10 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      </div>
                      <div>
                        <p className="text-lg font-semibold text-slate-300">No image loaded</p>
                        <p className="text-sm text-slate-500 mt-1">Upload an image to get started</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}