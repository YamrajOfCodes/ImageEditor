export function fitImageToCanvas(iw: number, ih: number, maxW: number, maxH: number) {
  const scale = Math.min(maxW / iw, maxH / ih, 1);
  return { w: Math.round(iw * scale), h: Math.round(ih * scale) };
}
