import { useLayoutEffect, useRef, useState } from "react";
import { type DagNode, type Role } from "../lib/dag";
import { RenameIcon } from "./icons";

interface NodeToolbarProps {
  node: DagNode;
  /** Center of the node in container pixels (toolbar floats above this). */
  x: number;
  y: number;
  /** Node radius in screen pixels, so the toolbar clears the node. */
  screenR: number;
  /** Container width in pixels, so the toolbar can stay on-screen. */
  boundsW: number;
  drawing: boolean;
  onToggleRole: (id: string, role: Role) => void;
  onStartEdge: (id: string) => void;
  onRename: (id: string) => void;
  onDelete: (id: string) => void;
}

const ROLE_PILLS: { role: Role; key: string; title: string; color: string }[] = [
  { role: "exposure", key: "E", title: "Exposure", color: "var(--exposure)" },
  { role: "outcome", key: "O", title: "Outcome", color: "var(--outcome)" },
  { role: "adjusted", key: "A", title: "Adjusted", color: "var(--accent)" },
  { role: "latent", key: "U", title: "Unobserved", color: "var(--accent)" },
  { role: "selected", key: "S", title: "Selected (selection bias)", color: "var(--biasing)" },
];

const MARGIN = 8;

/**
 * Floating mini-toolbar shown just above a selected node. It sits above the node
 * so it never blocks dragging the node body. Positioned absolutely inside the
 * canvas container; pointer events are isolated from the canvas. The horizontal
 * position is clamped so the toolbar stays fully visible near the edges.
 */
export default function NodeToolbar({
  node,
  x,
  y,
  screenR,
  boundsW,
  drawing,
  onToggleRole,
  onStartEdge,
  onRename,
  onDelete,
}: NodeToolbarProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ w: 0, h: 0 });
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const w = el.offsetWidth;
    const h = el.offsetHeight;
    // Only update when it actually changes, or we loop (new object every render).
    setSize((prev) => (prev.w === w && prev.h === h ? prev : { w, h }));
  });

  const stop = (e: React.PointerEvent | React.MouseEvent) => e.stopPropagation();

  const half = size.w / 2;
  const canClamp = size.w > 0 && boundsW > size.w + 2 * MARGIN;
  const left = canClamp ? Math.min(Math.max(x, MARGIN + half), boundsW - MARGIN - half) : x;
  // Flip below the node if there isn't room above it.
  const flip = size.h > 0 && y - screenR - 12 - size.h < MARGIN;
  const top = flip ? y + screenR + 12 : y - screenR - 12;
  const transform = flip ? "translate(-50%, 0)" : "translate(-50%, -100%)";

  return (
    <div
      ref={ref}
      className="absolute z-[35] flex items-center gap-1 px-1.5 py-1 bg-panel border border-line rounded-[11px] shadow-panel"
      style={{ left, top, transform }}
      onPointerDown={stop}
      onMouseDown={stop}
    >
      {ROLE_PILLS.map((p) => {
        const on = !!node.roles[p.role];
        return (
          <button
            key={p.role}
            title={`${p.title} (${p.key})`}
            aria-pressed={on}
            onClick={() => onToggleRole(node.id, p.role)}
            className="w-7 h-7 rounded-[8px] text-[12px] font-bold cursor-pointer border transition-colors flex items-center justify-center"
            style={
              on
                ? { background: p.color, color: "#fff", borderColor: p.color }
                : { background: "transparent", color: "var(--dim)", borderColor: "transparent" }
            }
          >
            {p.key}
          </button>
        );
      })}

      <span className="w-px h-5 bg-line mx-0.5" />

      <button
        title={drawing ? "Click a target node, or Esc to cancel" : "Draw arrow from here"}
        aria-pressed={drawing}
        onClick={() => onStartEdge(node.id)}
        className="w-7 h-7 rounded-[8px] cursor-pointer border transition-colors flex items-center justify-center"
        style={
          drawing
            ? { background: "var(--accent-ghost)", color: "var(--accent)", borderColor: "var(--accent)" }
            : { background: "transparent", color: "var(--dim)", borderColor: "transparent" }
        }
      >
        <ArrowGlyph />
      </button>
      <button
        title="Rename"
        onClick={() => onRename(node.id)}
        className="w-7 h-7 rounded-[8px] cursor-pointer border border-transparent bg-transparent text-dim hover:text-text transition-colors flex items-center justify-center"
      >
        <RenameIcon size={14} />
      </button>
      <button
        title="Delete variable"
        onClick={() => onDelete(node.id)}
        className="w-7 h-7 rounded-[8px] cursor-pointer border border-transparent bg-transparent text-dim hover:text-danger transition-colors flex items-center justify-center"
      >
        <XGlyph />
      </button>
    </div>
  );
}

function ArrowGlyph() {
  return (
    <svg width={15} height={15} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M5 12h13M13 6l6 6-6 6" />
    </svg>
  );
}

function XGlyph() {
  return (
    <svg width={15} height={15} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M6 6l12 12M18 6L6 18" />
    </svg>
  );
}
