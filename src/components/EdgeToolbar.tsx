import { type EdgeType } from "../lib/dag";

interface EdgeToolbarProps {
  /** Edge midpoint in container pixels. */
  x: number;
  y: number;
  type: EdgeType;
  onReverse: () => void;
  onToggleType: () => void;
  onDelete: () => void;
}

/**
 * Small floating toolbar centered on a selected edge's midpoint. Positioned
 * absolutely inside the canvas container; pointer events are isolated.
 */
export default function EdgeToolbar({ x, y, type, onReverse, onToggleType, onDelete }: EdgeToolbarProps) {
  const stop = (e: React.PointerEvent | React.MouseEvent) => e.stopPropagation();
  const bidirected = type === "bidirected";

  return (
    <div
      className="absolute z-[35] flex items-center gap-0.5 px-1 py-1 bg-panel border border-line rounded-[10px] shadow-panel"
      style={{ left: x, top: y, transform: "translate(-50%, -50%)" }}
      onPointerDown={stop}
      onMouseDown={stop}
    >
      <button
        title="Reverse direction"
        onClick={onReverse}
        className="w-7 h-7 rounded-[7px] cursor-pointer border border-transparent bg-transparent text-dim hover:text-text transition-colors flex items-center justify-center"
      >
        <ReverseGlyph />
      </button>
      <button
        title={bidirected ? "Make directed" : "Make bidirected"}
        aria-pressed={bidirected}
        onClick={onToggleType}
        className="w-7 h-7 rounded-[7px] cursor-pointer border transition-colors flex items-center justify-center"
        style={
          bidirected
            ? { background: "var(--accent-ghost)", color: "var(--accent)", borderColor: "var(--accent)" }
            : { background: "transparent", color: "var(--dim)", borderColor: "transparent" }
        }
      >
        <BidirectedGlyph />
      </button>
      <button
        title="Delete edge"
        onClick={onDelete}
        className="w-7 h-7 rounded-[7px] cursor-pointer border border-transparent bg-transparent text-dim hover:text-danger transition-colors flex items-center justify-center"
      >
        <XGlyph />
      </button>
    </div>
  );
}

function ReverseGlyph() {
  return (
    <svg width={15} height={15} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M17 3l4 4-4 4M21 7H7M7 21l-4-4 4-4M3 17h14" />
    </svg>
  );
}

function BidirectedGlyph() {
  return (
    <svg width={15} height={15} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M8 7L4 12l4 5M16 7l4 5-4 5M4 12h16" />
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
