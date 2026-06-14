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

function buildSVGMarkup(svg: SVGSVGElement, transparent: boolean): { markup: string } & Box {
  const box = contentBox(svg);
  const clone = svg.cloneNode(true) as SVGSVGElement;

  // Reset the zoom transform so export is always the full, unzoomed diagram.
  clone.querySelectorAll("g").forEach((g) => {
    const style = g.getAttribute("style");
    if (style && style.includes("scale(")) g.removeAttribute("style");
  });

  clone.setAttribute("xmlns", "http://www.w3.org/2000/svg");
  clone.setAttribute("width", String(box.width));
  clone.setAttribute("height", String(box.height));
  clone.setAttribute("viewBox", `${box.x} ${box.y} ${box.width} ${box.height}`);

  let serialized = new XMLSerializer().serializeToString(clone);

  if (!transparent) {
    const canvasColor =
      getComputedStyle(document.documentElement).getPropertyValue("--canvas").trim() || "#ffffff";
    const bg = `<rect x="${box.x}" y="${box.y}" width="${box.width}" height="${box.height}" fill="${canvasColor}"/>`;
    serialized = serialized.replace(/(<svg[^>]*>)/, `$1${bg}`);
  }

  return { markup: resolveVars(serialized), ...box };
}

function triggerDownload(url: string, filename: string): void {
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
}

export function exportSVG(svg: SVGSVGElement, filename = "dag.svg", transparent = false): void {
  const { markup } = buildSVGMarkup(svg, transparent);
  const blob = new Blob([markup], { type: "image/svg+xml;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  triggerDownload(url, filename);
  setTimeout(() => URL.revokeObjectURL(url), 1500);
}

export function exportPNG(
  svg: SVGSVGElement,
  filename = "dag.png",
  scale = 2,
  transparent = false,
): Promise<void> {
  const { markup, width, height } = buildSVGMarkup(svg, transparent);
  const src = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(markup);

  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = width * scale;
      canvas.height = height * scale;
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        reject(new Error("Could not get a 2D drawing context."));
        return;
      }
      ctx.scale(scale, scale);
      ctx.drawImage(img, 0, 0, width, height);
      canvas.toBlob((blob) => {
        if (!blob) {
          reject(new Error("Could not encode the PNG."));
          return;
        }
        const url = URL.createObjectURL(blob);
        triggerDownload(url, filename);
        setTimeout(() => URL.revokeObjectURL(url), 1500);
        resolve();
      }, "image/png");
    };
    img.onerror = () => reject(new Error("Could not render the diagram for export."));
    img.src = src;
  });
}
