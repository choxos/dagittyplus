import { useEffect, useState } from "react";
import { DEFAULT_DPI, type PngExportOptions, type SvgExportOptions } from "../lib/export";

interface ExportMenuProps {
  onExportPNG: (options: PngExportOptions) => void;
  onExportSVG: (options: SvgExportOptions) => void;
  onClose: () => void;
}

type BgKey = "theme" | "white" | "black" | "transparent" | "custom";

const BG_PRESETS: { key: Exclude<BgKey, "custom">; label: string; swatch: string }[] = [
  { key: "theme", label: "Theme", swatch: "var(--canvas)" },
  { key: "white", label: "White", swatch: "#ffffff" },
  { key: "black", label: "Black", swatch: "#000000" },
  { key: "transparent", label: "Transparent", swatch: "transparent" },
];

const DPIS = [150, 300, 600];

/**
 * Export popover anchored under the Export button. Lets the user pick the
 * background (theme color, white, black, transparent, or a custom color) and the
 * PNG resolution, then download a PNG or SVG. Styled like the Header dropdowns.
 */
export default function ExportMenu({ onExportPNG, onExportSVG, onClose }: ExportMenuProps) {
  const [bgKey, setBgKey] = useState<BgKey>("theme");
  const [custom, setCustom] = useState("#ffffff");
  const [dpi, setDpi] = useState(DEFAULT_DPI);

  // Outside-click is handled by the Header wrapper (which includes the trigger
  // button) so toggling the Export button works; here we only handle Escape.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  const background =
    bgKey === "custom"
      ? custom
      : bgKey === "white"
        ? "#ffffff"
        : bgKey === "black"
          ? "#000000"
          : bgKey; // "theme" | "transparent"

  const swatchRing = (active: boolean) =>
    active ? "border-accent ring-2 ring-accent" : "border-line";

  return (
    <div className="absolute top-[46px] right-0 z-[60] w-[252px] bg-panel border border-line rounded-[13px] shadow-panel p-2.5">
      <div className="px-0.5 pb-1.5 text-[11px] uppercase tracking-[0.6px] text-faint font-bold">
        Background
      </div>
      <div className="flex items-center gap-1.5 px-0.5">
        {BG_PRESETS.map((p) => (
          <button
            key={p.key}
            type="button"
            onClick={() => setBgKey(p.key)}
            title={p.label}
            aria-pressed={bgKey === p.key}
            className={`w-7 h-7 rounded-full border flex items-center justify-center cursor-pointer transition-colors ${swatchRing(
              bgKey === p.key,
            )}`}
            style={p.key === "transparent" ? undefined : { background: p.swatch }}
          >
            {p.key === "transparent" && (
              <span className="text-[13px] leading-none text-dim">⌀</span>
            )}
          </button>
        ))}
        <label
          title="Custom color"
          className={`relative w-7 h-7 rounded-full border cursor-pointer overflow-hidden ${swatchRing(
            bgKey === "custom",
          )}`}
          style={{ background: custom }}
        >
          <input
            type="color"
            value={custom}
            onChange={(e) => {
              setCustom(e.target.value);
              setBgKey("custom");
            }}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            aria-label="Custom background color"
          />
        </label>
      </div>

      <div className="px-0.5 pt-3 pb-1.5 text-[11px] uppercase tracking-[0.6px] text-faint font-bold">
        Resolution · PNG
      </div>
      <div className="flex gap-1.5 px-0.5">
        {DPIS.map((d) => (
          <button
            key={d}
            type="button"
            onClick={() => setDpi(d)}
            aria-pressed={dpi === d}
            className={`flex-1 h-8 rounded-[9px] border text-[12px] font-medium cursor-pointer transition-colors ${
              dpi === d
                ? "border-accent text-accent bg-accent-ghost"
                : "border-line text-dim hover:text-text"
            }`}
          >
            {d}
            <span className="text-[10px] font-normal"> dpi</span>
          </button>
        ))}
      </div>

      <div className="h-px bg-line my-2.5" />

      <button
        type="button"
        onClick={() => {
          onClose();
          onExportPNG({ background, dpi });
        }}
        className="flex w-full items-center justify-between text-left border-none bg-transparent px-2.5 py-2 rounded-lg hover:bg-bg cursor-pointer transition-colors"
      >
        <span className="text-[13px] font-medium text-text">PNG image</span>
        <span className="text-[11px] text-faint font-mono">{dpi} dpi</span>
      </button>
      <button
        type="button"
        onClick={() => {
          onClose();
          onExportSVG({ background });
        }}
        className="flex w-full items-center justify-between text-left border-none bg-transparent px-2.5 py-2 rounded-lg hover:bg-bg cursor-pointer transition-colors"
      >
        <span className="text-[13px] font-medium text-text">SVG vector</span>
        <span className="text-[11px] text-faint font-mono">.svg</span>
      </button>
    </div>
  );
}
