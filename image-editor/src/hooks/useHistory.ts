import { useCallback, useState } from "react";

const MAX = 20;

export default function useHistory() {
  const [stack, setStack] = useState<string[]>([]);
  const [ptr, setPtr] = useState(-1);

  const pushSnapshot = useCallback((canvas?: HTMLCanvasElement | null) => {
    if (!canvas) return;
    const data = canvas.toDataURL("image/png");
    setStack((s) => {
      const next = s.slice(0, ptr + 1).concat(data);
      if (next.length > MAX) next.shift();
      return next;
    });
    setPtr((p) => {
      const next = Math.min(MAX - 1, p + 1);
      return next < 0 ? 0 : next;
    });
  }, [ptr]);

  const undo = useCallback((canvas?: HTMLCanvasElement | null) => {
    if (ptr <= 0 || !canvas) return;
    const idx = ptr - 1;
    const data = stack[idx];
    if (!data) return;
    const img = new Image();
    img.onload = () => {
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      setPtr(idx);
    };
    img.src = data;
  }, [ptr, stack]);

  const redo = useCallback((canvas?: HTMLCanvasElement | null) => {
    if (ptr >= stack.length - 1 || !canvas) return;
    const idx = ptr + 1;
    const data = stack[idx];
    if (!data) return;
    const img = new Image();
    img.onload = () => {
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      setPtr(idx);
    };
    img.src = data;
  }, [ptr, stack]);

  return {
    pushSnapshot,
    undo,
    redo,
    canUndo: ptr > 0,
    canRedo: ptr < stack.length - 1,
  };
}
