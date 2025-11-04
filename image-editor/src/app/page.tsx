"use client";
import React from "react";
import CanvasEditor from "../components/CanvasEditor";
import "../styles/globals.css";

export default function Page() {
  return (
    <main className="min-h-screen bg-gray-50 p-6">
      <div className="mx-auto max-w-full">
        <CanvasEditor />

        <footer className="mt-8 text-xs text-gray-500">
          Built for a take-home assignment — modular, typed, responsive.
        </footer>
      </div>
    </main>
  );
}
