"use client";
import React from "react";
import type { UseCanvasToolsReturn } from "../hooks/useCanvasTools";

interface Props {
  onFile: (file?: File) => void;
  onRotate: (angle: number) => void;
  angle: number;
  onRotate90: () => void;
  onExport: () => void;
  onUndo: () => void;
  onRedo: () => void;
  canUndo: boolean;
  canRedo: boolean;
  toolsState: UseCanvasToolsReturn;
}

export default function Toolbar(props: Props) {
  const {
    onFile, onRotate, angle, onRotate90, onExport, onUndo, onRedo, canUndo, canRedo, toolsState,
  } = props;

  return (
    <div className="bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-6 rounded-2xl shadow-2xl border border-purple-500/20">
      <div className="space-y-4">
        {/* Main Tools Section */}
        <div className="flex gap-3 items-center">
          <label className="group relative flex-1 inline-flex items-center justify-center px-5 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-xl cursor-pointer font-semibold transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-purple-500/50 overflow-hidden">
            <span className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300"></span>
            <span className="relative flex items-center gap-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
              Upload Image
            </span>
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => onFile(e.target.files?.[0])}
            />
          </label>

          <button
            className={`group relative px-5 py-3 rounded-xl font-semibold transition-all duration-300 hover:scale-105 ${
              toolsState.active === "draw" 
                ? "bg-gradient-to-r from-pink-500 to-rose-500 text-white shadow-lg shadow-pink-500/50" 
                : "bg-slate-800 text-slate-300 hover:bg-slate-700 border border-slate-700"
            }`}
            onClick={() => toolsState.setActiveTool("draw")}
          >
            <span className="flex items-center gap-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
              </svg>
              Draw
            </span>
          </button>

          <button
            className={`group relative px-5 py-3 rounded-xl font-semibold transition-all duration-300 hover:scale-105 ${
              toolsState.active === "text" 
                ? "bg-gradient-to-r from-cyan-500 to-blue-500 text-white shadow-lg shadow-cyan-500/50" 
                : "bg-slate-800 text-slate-300 hover:bg-slate-700 border border-slate-700"
            }`}
            onClick={() => toolsState.setActiveTool("text")}
          >
            <span className="flex items-center gap-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" />
              </svg>
              Text
            </span>
          </button>

          <button
            className={`group relative px-5 py-3 rounded-xl font-semibold transition-all duration-300 hover:scale-105 ${
              toolsState.active === "crop" 
                ? "bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-lg shadow-emerald-500/50" 
                : "bg-slate-800 text-slate-300 hover:bg-slate-700 border border-slate-700"
            }`}
            onClick={() => toolsState.setActiveTool("crop")}
          >
            <span className="flex items-center gap-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16V4m0 0h12m-12 0l12 12m8 4V8m0 0H8m12 0L8 20" />
              </svg>
              Crop
            </span>
          </button>
        </div>

        {/* History & Rotation Section */}
        <div className="flex gap-3 items-center bg-slate-800/50 p-4 rounded-xl border border-slate-700/50 backdrop-blur-sm">
          <button 
            className={`px-4 py-2 rounded-lg font-medium transition-all duration-300 ${
              canUndo 
                ? "bg-amber-500 text-white hover:bg-amber-600 hover:scale-105 hover:shadow-lg hover:shadow-amber-500/30" 
                : "bg-slate-700 text-slate-500 cursor-not-allowed"
            }`}
            onClick={onUndo} 
            disabled={!canUndo}
          >
            <span className="flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
              </svg>
              Undo
            </span>
          </button>

          <button 
            className={`px-4 py-2 rounded-lg font-medium transition-all duration-300 ${
              canRedo 
                ? "bg-amber-500 text-white hover:bg-amber-600 hover:scale-105 hover:shadow-lg hover:shadow-amber-500/30" 
                : "bg-slate-700 text-slate-500 cursor-not-allowed"
            }`}
            onClick={onRedo} 
            disabled={!canRedo}
          >
            <span className="flex items-center gap-2">
              Redo
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 10h-10a8 8 0 00-8 8v2m18-10l-6-6m6 6l-6 6" />
              </svg>
            </span>
          </button>

          <div className="h-8 w-px bg-slate-600"></div>

          <button 
            className="px-4 py-2 rounded-lg font-medium bg-violet-500 text-white hover:bg-violet-600 transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-violet-500/30"
            onClick={onRotate90}
          >
            <span className="flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Rotate 90°
            </span>
          </button>

          <div className="flex items-center gap-3 ml-auto bg-slate-900/80 px-4 py-2 rounded-lg border border-violet-500/30">
            <svg className="w-4 h-4 text-violet-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            <input 
              type="range" 
              min={-180} 
              max={180} 
              value={angle} 
              onChange={(e) => onRotate(Number(e.target.value))}
              className="w-40 accent-violet-500"
            />
            <div className="text-sm font-bold text-violet-300 w-14 text-right">{angle}°</div>
          </div>
        </div>

        {/* Brush Controls & Export Section */}
        <div className="flex gap-4 items-center bg-slate-800/50 p-4 rounded-xl border border-slate-700/50 backdrop-blur-sm">
          <div className="flex items-center gap-3 bg-slate-900/80 px-4 py-2 rounded-lg border border-pink-500/30">
            <svg className="w-5 h-5 text-pink-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
            </svg>
            <span className="text-sm font-medium text-slate-300">Brush</span>
            <input 
              type="range" 
              min={1} 
              max={72} 
              value={toolsState.brushSize} 
              onChange={(e) => toolsState.setBrushSize(Number(e.target.value))}
              className="w-32 accent-pink-500"
            />
            <span className="text-sm font-bold text-pink-300 w-8">{toolsState.brushSize}</span>
          </div>

          <div className="relative group">
            <input 
              type="color" 
              value={toolsState.brushColor} 
              onChange={(e) => toolsState.setBrushColor(e.target.value)}
              className="w-14 h-12 rounded-lg cursor-pointer border-2 border-slate-600 transition-all duration-300 hover:border-pink-500 hover:scale-110"
            />
            <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
              Color: {toolsState.brushColor}
            </div>
          </div>

          <div className="ml-auto flex gap-3">
            <button 
              className="group relative px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl font-semibold transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-green-500/50 overflow-hidden"
              onClick={onExport}
            >
              <span className="absolute inset-0 bg-white/20 translate-x-full group-hover:translate-x-0 transition-transform duration-300"></span>
              <span className="relative flex items-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
                </svg>
                Save PNG
              </span>
            </button>
          </div>
        </div>

        {/* Status Bar */}
        <div className="flex items-center justify-between bg-gradient-to-r from-purple-900/30 to-blue-900/30 px-4 py-2 rounded-lg border border-purple-500/20">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
            <span className="text-xs font-medium text-slate-400">Active Tool:</span>
            <span className="text-sm font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400 uppercase tracking-wide">
              {toolsState.active}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}