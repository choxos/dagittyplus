// Export the diagram SVG to a standalone SVG file or a rasterized PNG.
// The on-screen SVG paints with CSS custom properties (var(--exposure), ...) and
// is wrapped in a zoom transform; for export we resolve those variables to
// concrete colors and reset the zoom so the whole diagram is captured 1:1.

import { CANVAS } from "./dag";

const TOKENS = [
  "--bg", "--canvas", "--panel", "--line", "--text", "--dim", "--faint",
  "--accent", "--accent-ghost", "--exposure", "--outcome", "--causal",
  "--biasing", "--neutral", "--ok", "--danger",
];

function resolveVars(markup: string): string {
  const cs = getComputedStyle(document.documentElement);
  let out = markup;
  for (const token of TOKENS) {
    const value = cs.getPropertyValue(token).trim();
    if (value) out = out.split(`var(${token})`).join(value);
  }
  // Any leftover var(...) gets a neutral fallback so the file is self-contained.
  return out.replace(/var\([^)]*\)/g, "#888888");
}

interface Box {
  x: number;
  y: number;
  width: number;
  height: number;
}

/**
 * Crop the export to the diagram's content (the zoomable group) plus a margin,
 * so the file is tight regardless of how large the responsive canvas grew. Falls
 * back to the live viewBox, then to the base canvas, if the bounding box is
 * unavailable (e.g. an empty diagram).
 */
function contentBox(svg: SVGSVGElement): Box {
  const group = svg.querySelector("g");
  if (group) {
    try {
      const b = (group as SVGGraphicsElement).getBBox();
      if (b.width > 0 && b.height > 0) {
        const pad = 40;
        return { x: b.x - pad, y: b.y - pad, width: b.width + 2 * pad, height: b.height + 2 * pad };
      }
    } catch {
      // getBBox can throw if the node is not rendered; fall through.
    }
  }
  const vb = svg.getAttribute("viewBox")?.split(/[\s,]+/).map(Number);
  if (vb && vb.length === 4 && vb.every((n) => Number.isFinite(n))) {
    return { x: vb[0], y: vb[1], width: vb[2], height: vb[3] };
  }
  return { x: 0, y: 0, width: CANVAS.width, height: CANVAS.height };
}

/**
 * The exported background. `"transparent"` omits the fill; `"theme"` uses the
 * current canvas color (light or dark); any other value is used as a CSS color
 * (a hex string from the picker, or `"#ffffff"` / `"#000000"`).
 */
export type ExportBackground = "transparent" | "theme" | string;

/** Resolve a background choice to a concrete color, or null for transparent. */
function resolveBackground(background: ExportBackground): string | null {
  if (background === "transparent") return null;
  if (background === "theme") {
    return (
      getComputedStyle(document.documentElement).getPropertyValue("--canvas").trim() || "#ffffff"
    );
  }
  return background;
}

function buildSVGMarkup(
  svg: SVGSVGElement,
  background: ExportBackground,
  scale = 1,
): { markup: string; width: number; height: number } {
  const box = contentBox(svg);
  const clone = svg.cloneNode(true) as SVGSVGElement;

  // Reset the on-screen scale; export size is controlled by `scale` below.
  clone.querySelectorAll("g").forEach((g) => {
    const style = g.getAttribute("style");
    if (style && style.includes("scale(")) g.removeAttribute("style");
  });
  // Drop the canvas chrome (the transparent hit target and the bounded-area
  // frame); they are editor affordances, not part of the diagram, and would
  // otherwise show up as a border in the exported file.
  clone.querySelectorAll(":scope > rect").forEach((r) => r.remove());

  // The viewBox stays in content coordinates; the intrinsic width/height carry
  // the chosen diagram size, so the export reflects the on-screen size control.
  const width = box.width * scale;
  const height = box.height * scale;
  clone.setAttribute("xmlns", "http://www.w3.org/2000/svg");
  clone.setAttribute("width", String(width));
  clone.setAttribute("height", String(height));
  clone.setAttribute("viewBox", `${box.x} ${box.y} ${box.width} ${box.height}`);

  let serialized = new XMLSerializer().serializeToString(clone);

  const fill = resolveBackground(background);
  if (fill) {
    const bg = `<rect x="${box.x}" y="${box.y}" width="${box.width}" height="${box.height}" fill="${fill}"/>`;
    serialized = serialized.replace(/(<svg[^>]*>)/, `$1${bg}`);
  }

  return { markup: resolveVars(serialized), width, height };
}

function triggerDownload(url: string, filename: string): void {
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
}

// CSS reference pixels are 96 per inch, so a DPI maps to that many raster pixels
// per logical unit.
const CSS_DPI = 96;
/** The default raster resolution for PNG export (print quality). */
export const DEFAULT_DPI = 300;

function crc32(bytes: Uint8Array): number {
  let crc = 0xffffffff;
  for (let i = 0; i < bytes.length; i += 1) {
    crc ^= bytes[i];
    for (let j = 0; j < 8; j += 1) crc = (crc >>> 1) ^ (0xedb88320 & -(crc & 1));
  }
  return (crc ^ 0xffffffff) >>> 0;
}

/**
 * Insert a PNG `pHYs` chunk so the file's metadata reports the intended DPI
 * (canvas.toBlob alone only sets the pixel count). Resolution is recorded in
 * pixels per meter; image viewers and word processors then show "300 DPI" and
 * the correct physical size.
 */
function withDpiMetadata(png: Uint8Array, dpi: number): Uint8Array {
  const ppm = Math.round(dpi / 0.0254); // pixels per metre
  const SIG = 8; // PNG signature length; IHDR chunk follows immediately
  const view = new DataView(png.buffer, png.byteOffset, png.byteLength);
  const ihdrLen = view.getUint32(SIG);
  const insertAt = SIG + 4 + 4 + ihdrLen + 4; // end of the IHDR chunk

  const chunk = new Uint8Array(4 + 4 + 9 + 4); // length + type + data + crc
  const cv = new DataView(chunk.buffer);
  cv.setUint32(0, 9);
  chunk.set([0x70, 0x48, 0x59, 0x73], 4); // "pHYs"
  cv.setUint32(8, ppm); // pixels per unit, X
  cv.setUint32(12, ppm); // pixels per unit, Y
  chunk[16] = 1; // unit = metre
  cv.setUint32(17, crc32(chunk.subarray(4, 17)));

  const out = new Uint8Array(png.length + chunk.length);
  out.set(png.subarray(0, insertAt), 0);
  out.set(chunk, insertAt);
  out.set(png.subarray(insertAt), insertAt + chunk.length);
  return out;
}

export interface SvgExportOptions {
  background?: ExportBackground;
  /** Diagram size multiplier from the on-screen size control. Defaults to 1. */
  scale?: number;
}

export interface PngExportOptions {
  background?: ExportBackground;
  /** Raster resolution in dots per inch. Defaults to 300. */
  dpi?: number;
  /** Diagram size multiplier from the on-screen size control. Defaults to 1. */
  scale?: number;
}

export function exportSVG(svg: SVGSVGElement, filename = "dag.svg", options: SvgExportOptions = {}): void {
  const { markup } = buildSVGMarkup(svg, options.background ?? "theme", options.scale ?? 1);
  const blob = new Blob([markup], { type: "image/svg+xml;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  triggerDownload(url, filename);
  setTimeout(() => URL.revokeObjectURL(url), 1500);
}

export function exportPNG(
  svg: SVGSVGElement,
  filename = "dag.png",
  options: PngExportOptions = {},
): Promise<void> {
  const dpi = options.dpi ?? DEFAULT_DPI;
  const raster = dpi / CSS_DPI;
  const { markup, width, height } = buildSVGMarkup(
    svg,
    options.background ?? "theme",
    options.scale ?? 1,
  );
  const src = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(markup);

  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = Math.round(width * raster);
      canvas.height = Math.round(height * raster);
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        reject(new Error("Could not get a 2D drawing context."));
        return;
      }
      ctx.scale(raster, raster);
      ctx.drawImage(img, 0, 0, width, height);
      canvas.toBlob((blob) => {
        if (!blob) {
          reject(new Error("Could not encode the PNG."));
          return;
        }
        blob
          .arrayBuffer()
          .then((buf) => {
            const tagged = withDpiMetadata(new Uint8Array(buf), dpi);
            const url = URL.createObjectURL(
              new Blob([tagged.buffer as ArrayBuffer], { type: "image/png" }),
            );
            triggerDownload(url, filename);
            setTimeout(() => URL.revokeObjectURL(url), 1500);
            resolve();
          })
          .catch(reject);
      }, "image/png");
    };
    img.onerror = () => reject(new Error("Could not render the diagram for export."));
    img.src = src;
  });
}
