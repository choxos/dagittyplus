import { useEffect, useLayoutEffect, useRef, useState, type ReactNode } from "react";

export interface MenuEntry {
  /** A divider when true; other fields ignored. */
  divider?: boolean;
  label?: string;
  /** Leading glyph (e.g. a colored role dot or icon). */
  icon?: ReactNode;
  /** Show a check on the right (for active toggles). */
  checked?: boolean;
  /** Style the row as destructive. */
  danger?: boolean;
  onClick?: () => void;
}

interface ContextMenuProps {
  /** Anchor position in pixels, relative to the canvas container (offset parent). */
  x: number;
  y: number;
  /** Container size, so the menu can stay fully visible near the edges. */
  boundsW: number;
  boundsH: number;
  entries: MenuEntry[];
  onClose: () => void;
}

const MARGIN = 8;

/**
 * A small floating menu styled like the Header dropdowns. Positioned absolutely
 * inside the canvas container and clamped to stay on-screen. Closes on outside
 * click, Esc, or scroll/resize (the parent drops the menu on those events).
 */
export default function ContextMenu({ x, y, boundsW, boundsH, entries, onClose }: ContextMenuProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ w: 0, h: 0 });

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const w = el.offsetWidth;
    const h = el.offsetHeight;
    setSize((prev) => (prev.w === w && prev.h === h ? prev : { w, h }));
  });

  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    };
    // Defer so the opening click (mousedown that spawned us) doesn't immediately close.
    const id = window.setTimeout(() => document.addEventListener("mousedown", onDoc), 0);
    return () => {
      window.clearTimeout(id);
      document.removeEventListener("mousedown", onDoc);
    };
  }, [onClose]);

  // Open to the left / above the cursor when there isn't room on the default side.
  let left = x;
  let top = y;
  if (size.w > 0 && boundsW > size.w + 2 * MARGIN) {
    if (x + size.w > boundsW - MARGIN) left = Math.max(MARGIN, x - size.w);
    left = Math.min(left, boundsW - MARGIN - size.w);
  }
  if (size.h > 0 && boundsH > size.h + 2 * MARGIN) {
    if (y + size.h > boundsH - MARGIN) top = Math.max(MARGIN, y - size.h);
    top = Math.min(top, boundsH - MARGIN - size.h);
  }

  return (
    <div
      ref={ref}
      role="menu"
      className="absolute z-[40] min-w-[184px] bg-panel border border-line rounded-[12px] shadow-panel p-1.5 select-none"
      style={{ left, top }}
      onContextMenu={(e) => e.preventDefault()}
    >
      {entries.map((entry, i) =>
        entry.divider ? (
          <div key={`d${i}`} className="my-1 mx-1 h-px bg-line" />
        ) : (
          <button
            key={entry.label ?? i}
            role="menuitem"
            onClick={() => {
              onClose();
              entry.onClick?.();
            }}
            className={[
              "flex w-full items-center gap-2.5 text-left border-none bg-transparent px-2.5 py-[7px] rounded-lg cursor-pointer transition-colors",
              entry.danger ? "text-danger hover:bg-bg" : "text-text hover:bg-bg",
            ].join(" ")}
          >
            {entry.icon != null && (
              <span className="flex-none w-3.5 flex items-center justify-center">{entry.icon}</span>
            )}
            <span className="flex-1 text-[13px] font-medium">{entry.label}</span>
            {entry.checked && (
              <span className="flex-none text-accent">
                <CheckGlyph />
              </span>
            )}
          </button>
        ),
      )}
    </div>
  );
}

function CheckGlyph() {
  return (
    <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.6} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M20 6 9 17l-5-5" />
    </svg>
  );
}
