import { useEffect, useRef, useState } from "react";

interface ExportMenuProps {
  onExportPNG: (transparent: boolean) => void;
  onExportSVG: (transparent: boolean) => void;
  onClose: () => void;
}

/**
 * Small export popover anchored under the Export button. Offers PNG (2x), SVG,
 * and a transparent-background toggle. Styled like the Header dropdowns.
 */
export default function ExportMenu({ onExportPNG, onExportSVG, onClose }: ExportMenuProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [transparent, setTransparent] = useState(false);

  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    const id = window.setTimeout(() => document.addEventListener("mousedown", onDoc), 0);
    document.addEventListener("keydown", onKey);
    return () => {
      window.clearTimeout(id);
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onKey);
    };
  }, [onClose]);

  return (
    <div
      ref={ref}
      className="absolute top-[46px] right-0 z-[60] w-[220px] bg-panel border border-line rounded-[13px] shadow-panel p-2"
    >
      <div className="px-1.5 pt-0.5 pb-1.5 text-[11px] uppercase tracking-[0.6px] text-faint font-bold">
        Export diagram
      </div>
      <button
        onClick={() => {
          onClose();
          onExportPNG(transparent);
        }}
        className="flex w-full items-center justify-between text-left border-none bg-transparent px-2.5 py-2 rounded-lg hover:bg-bg cursor-pointer transition-colors"
      >
        <span className="text-[13px] font-medium text-text">PNG image</span>
        <span className="text-[11px] text-faint font-mono">2×</span>
      </button>
      <button
        onClick={() => {
          onClose();
          onExportSVG(transparent);
        }}
        className="flex w-full items-center justify-between text-left border-none bg-transparent px-2.5 py-2 rounded-lg hover:bg-bg cursor-pointer transition-colors"
      >
        <span className="text-[13px] font-medium text-text">SVG vector</span>
        <span className="text-[11px] text-faint font-mono">.svg</span>
      </button>
      <label className="flex items-center gap-2 mt-1 px-2.5 py-2 rounded-lg cursor-pointer hover:bg-bg transition-colors">
        <input
          type="checkbox"
          checked={transparent}
          onChange={(e) => setTransparent(e.target.checked)}
          className="accent-accent cursor-pointer"
        />
        <span className="text-[12.5px] text-dim">Transparent background</span>
      </label>
    </div>
  );
}
