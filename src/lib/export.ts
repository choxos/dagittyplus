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

function buildSVGMarkup(svg: SVGSVGElement, transparent: boolean): string {
  const clone = svg.cloneNode(true) as SVGSVGElement;

  // Reset the zoom transform so export is always the full, unzoomed diagram.
  clone.querySelectorAll("g").forEach((g) => {
    const style = g.getAttribute("style");
    if (style && style.includes("scale(")) g.removeAttribute("style");
  });

  clone.setAttribute("xmlns", "http://www.w3.org/2000/svg");
  clone.setAttribute("width", String(CANVAS.width));
  clone.setAttribute("height", String(CANVAS.height));
  clone.setAttribute("viewBox", `0 0 ${CANVAS.width} ${CANVAS.height}`);

  let serialized = new XMLSerializer().serializeToString(clone);

  if (!transparent) {
    const canvasColor =
      getComputedStyle(document.documentElement).getPropertyValue("--canvas").trim() || "#ffffff";
    const bg = `<rect x="0" y="0" width="${CANVAS.width}" height="${CANVAS.height}" fill="${canvasColor}"/>`;
    serialized = serialized.replace(/(<svg[^>]*>)/, `$1${bg}`);
  }

  return resolveVars(serialized);
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
  const markup = buildSVGMarkup(svg, transparent);
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
  const markup = buildSVGMarkup(svg, transparent);
  const src = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(markup);

  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = CANVAS.width * scale;
      canvas.height = CANVAS.height * scale;
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        reject(new Error("Could not get a 2D drawing context."));
        return;
      }
      ctx.scale(scale, scale);
      ctx.drawImage(img, 0, 0, CANVAS.width, CANVAS.height);
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
