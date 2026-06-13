import { useCallback, useRef, useState } from "react";
import { CANVAS, type DagEdge, type DagModel, type DagNode, type Role } from "../lib/dag";
import { type Tool } from "../lib/model-ops";
import { HelpGlyphIcon } from "./icons";

const NODE_R = 25;
const ADJ_R = 26;

interface CanvasProps {
  model: DagModel;
  tool: Tool;
  selectedId: string | null;
  acyclic: boolean;
  zoom: number;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onZoomReset: () => void;
  onSelect: (id: string | null) => void;
  onMoveNode: (id: string, x: number, y: number) => void;
  onAddNodeAt: (x: number, y: number) => void;
  onAddEdge: (from: string, to: string) => void;
  onDeleteNode: (id: string) => void;
  onStartEmpty: () => void;
  onLoadExample: () => void;
}

function nodeRadius(n: DagNode): number {
  return n.roles.adjusted ? ADJ_R : NODE_R;
}

/** Drawing role: first matching flag wins (matches the design's precedence). */
type DrawRole = "exposure" | "outcome" | "adjusted" | "latent" | "plain";
function drawRole(n: DagNode): DrawRole {
  if (n.roles.exposure) return "exposure";
  if (n.roles.outcome) return "outcome";
  if (n.roles.adjusted) return "adjusted";
  if (n.roles.latent) return "latent";
  return "plain";
}

const ROLE_CAPTION: Record<Role, string> = {
  exposure: "exposure",
  outcome: "outcome",
  adjusted: "adjusted",
  latent: "unobserved",
  selected: "selected",
};

interface EdgeGeom {
  key: string;
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  arrow: string;
  bidirected: boolean;
  backArrow: string;
}

function edgeGeom(model: DagModel, e: DagEdge): EdgeGeom | null {
  const s = model.nodes.find((n) => n.id === e.from);
  const t = model.nodes.find((n) => n.id === e.to);
  if (!s || !t) return null;
  const dx = t.x - s.x;
  const dy = t.y - s.y;
  const L = Math.hypot(dx, dy) || 1;
  const ux = dx / L;
  const uy = dy / L;
  const px = -uy;
  const py = ux;
  const sr = nodeRadius(s) + 3;
  const tr = nodeRadius(t) + 11;
  const x1 = s.x + ux * sr;
  const y1 = s.y + uy * sr;
  const x2 = t.x - ux * tr;
  const y2 = t.y - uy * tr;
  const tipx = t.x - ux * (nodeRadius(t) + 3);
  const tipy = t.y - uy * (nodeRadius(t) + 3);
  const bx = tipx - ux * 12;
  const by = tipy - uy * 12;
  const arrow = `${tipx.toFixed(1)},${tipy.toFixed(1)} ${(bx + px * 6).toFixed(1)},${(by + py * 6).toFixed(1)} ${(bx - px * 6).toFixed(1)},${(by - py * 6).toFixed(1)}`;
  // Second arrowhead at the source for bidirected edges.
  const stipx = s.x + ux * (nodeRadius(s) + 3);
  const stipy = s.y + uy * (nodeRadius(s) + 3);
  const sbx = stipx + ux * 12;
  const sby = stipy + uy * 12;
  const backArrow = `${stipx.toFixed(1)},${stipy.toFixed(1)} ${(sbx + px * 6).toFixed(1)},${(sby + py * 6).toFixed(1)} ${(sbx - px * 6).toFixed(1)},${(sby - py * 6).toFixed(1)}`;
  return {
    key: `${e.from}->${e.to}:${e.type}`,
    x1,
    y1,
    x2: e.type === "bidirected" ? x1 : x2,
    y2: e.type === "bidirected" ? y1 : y2,
    arrow,
    bidirected: e.type === "bidirected",
    backArrow,
  };
}

const TOOL_HINT: Record<Tool, string> = {
  select: "Click to select · drag to move",
  node: "Click the canvas to add a variable",
  edge: "Click a source, then a target",
  delete: "Click a variable to delete it",
  layout: "Click to select · drag to move",
  fit: "Click to select · drag to move",
};

export default function Canvas(props: CanvasProps) {
  const {
    model,
    tool,
    selectedId,
    acyclic,
    zoom,
    onZoomIn,
    onZoomOut,
    onZoomReset,
    onSelect,
    onMoveNode,
    onAddNodeAt,
    onAddEdge,
    onDeleteNode,
    onStartEmpty,
    onLoadExample,
  } = props;

  const svgRef = useRef<SVGSVGElement>(null);
  const dragRef = useRef<{ id: string; dx: number; dy: number } | null>(null);
  const [pendingEdge, setPendingEdge] = useState<string | null>(null);
  const [cursor, setCursor] = useState<{ x: number; y: number } | null>(null);

  /** Convert a client point to viewBox coords, undoing meet-fit and zoom. */
  const toViewBox = useCallback(
    (clientX: number, clientY: number): { x: number; y: number } => {
      const svg = svgRef.current;
      if (!svg) return { x: 0, y: 0 };
      const rect = svg.getBoundingClientRect();
      const scale = Math.min(rect.width / CANVAS.width, rect.height / CANVAS.height) || 1;
      const drawW = CANVAS.width * scale;
      const drawH = CANVAS.height * scale;
      const offX = (rect.width - drawW) / 2;
      const offY = (rect.height - drawH) / 2;
      let vx = (clientX - rect.left - offX) / scale;
      let vy = (clientY - rect.top - offY) / scale;
      // Undo the zoom transform (origin at canvas center).
      const cx = CANVAS.width / 2;
      const cy = CANVAS.height / 2;
      vx = cx + (vx - cx) / zoom;
      vy = cy + (vy - cy) / zoom;
      return { x: vx, y: vy };
    },
    [zoom],
  );

  const onNodeDown = (e: React.PointerEvent, n: DagNode) => {
    e.stopPropagation();
    if (tool === "delete") {
      onDeleteNode(n.id);
      return;
    }
    if (tool === "edge") {
      if (pendingEdge === null) {
        setPendingEdge(n.id);
        onSelect(n.id);
      } else {
        onAddEdge(pendingEdge, n.id);
        setPendingEdge(null);
        setCursor(null);
      }
      return;
    }
    // select / move
    onSelect(n.id);
    const p = toViewBox(e.clientX, e.clientY);
    dragRef.current = { id: n.id, dx: p.x - n.x, dy: p.y - n.y };
    (e.target as Element).setPointerCapture?.(e.pointerId);
  };

  const onPointerMove = (e: React.PointerEvent) => {
    if (dragRef.current) {
      const p = toViewBox(e.clientX, e.clientY);
      onMoveNode(dragRef.current.id, p.x - dragRef.current.dx, p.y - dragRef.current.dy);
      return;
    }
    if (tool === "edge" && pendingEdge !== null) {
      setCursor(toViewBox(e.clientX, e.clientY));
    }
  };

  const endDrag = () => {
    dragRef.current = null;
  };

  const onCanvasDown = (e: React.PointerEvent) => {
    // Only fires for clicks on empty canvas (nodes stop propagation).
    if (tool === "node") {
      const p = toViewBox(e.clientX, e.clientY);
      onAddNodeAt(p.x, p.y);
      return;
    }
    if (tool === "edge" && pendingEdge !== null) {
      setPendingEdge(null);
      setCursor(null);
      return;
    }
    onSelect(null);
  };

  const hasNodes = model.nodes.length > 0;
  const pendingNode = pendingEdge ? model.nodes.find((n) => n.id === pendingEdge) : null;

  const cursorStyle =
    tool === "node" ? "copy" : tool === "edge" ? "crosshair" : tool === "delete" ? "not-allowed" : "default";

  return (
    <main className="flex-1 relative min-w-0 bg-canvas overflow-hidden">
      {/* dotted grid */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: "radial-gradient(var(--line) 1.2px, transparent 1.2px)",
          backgroundSize: "24px 24px",
          backgroundPosition: "center",
        }}
      />

      {/* canvas heading chip */}
      <div className="absolute top-4 left-4 z-[5] flex items-center gap-2">
        <div className="flex items-center gap-2.5 pl-[13px] pr-3 py-[7px] bg-panel border border-line rounded-[12px] shadow-panel">
          <span
            className="w-[7px] h-[7px] rounded-full"
            style={{ background: acyclic ? "var(--ok)" : "var(--danger)" }}
          />
          <span className="font-sans font-semibold text-[14px] text-text">Causal model</span>
        </div>
      </div>

      {/* tool hint */}
      {hasNodes && (
        <div className="absolute top-4 right-4 z-[5] max-w-[230px] px-[13px] py-1.5 bg-accent-ghost border border-accent rounded-full text-accent text-[12px] font-semibold text-center">
          {TOOL_HINT[tool]}
        </div>
      )}

      <svg
        ref={svgRef}
        viewBox={`0 0 ${CANVAS.width} ${CANVAS.height}`}
        preserveAspectRatio="xMidYMid meet"
        className="absolute inset-0 w-full h-full"
        style={{ cursor: cursorStyle, touchAction: "none" }}
        onPointerDown={onCanvasDown}
        onPointerMove={onPointerMove}
        onPointerUp={endDrag}
        onPointerLeave={endDrag}
      >
        <g style={{ transform: `scale(${zoom})`, transformOrigin: "380px 240px" }}>
          {/* edges */}
          {model.edges.map((e) => {
            const g = edgeGeom(model, e);
            if (!g) return null;
            return (
              <g key={g.key}>
                <line
                  x1={g.x1}
                  y1={g.y1}
                  x2={g.x2}
                  y2={g.y2}
                  stroke="var(--neutral)"
                  strokeWidth={2}
                  strokeLinecap="round"
                />
                <polygon points={g.arrow} fill="var(--neutral)" />
                {g.bidirected && <polygon points={g.backArrow} fill="var(--neutral)" />}
              </g>
            );
          })}

          {/* rubber-band edge preview */}
          {pendingNode && cursor && (
            <line
              x1={pendingNode.x}
              y1={pendingNode.y}
              x2={cursor.x}
              y2={cursor.y}
              stroke="var(--accent)"
              strokeWidth={2.4}
              strokeDasharray="3 6"
              strokeLinecap="round"
              opacity={0.8}
              style={{ pointerEvents: "none" }}
            />
          )}

          {/* nodes */}
          {model.nodes.map((n) => {
            const role = drawRole(n);
            const r = nodeRadius(n);
            const selected = n.id === selectedId;
            const isSquare = role === "adjusted";
            const fill =
              role === "exposure"
                ? "var(--exposure)"
                : role === "outcome"
                  ? "var(--outcome)"
                  : "var(--panel)";
            const stroke =
              role === "exposure"
                ? "var(--exposure)"
                : role === "outcome"
                  ? "var(--outcome)"
                  : role === "latent"
                    ? "var(--faint)"
                    : "var(--text)";
            const textFill = role === "exposure" || role === "outcome" ? "#fff" : role === "latent" ? "var(--faint)" : "var(--text)";
            const sw = role === "adjusted" ? 2.6 : 2;
            const nodeDash = role === "latent" ? "4 4" : undefined;
            const caption =
              role !== "plain"
                ? ROLE_CAPTION[role]
                : n.roles.selected
                  ? "selected"
                  : "";
            const captionColor =
              role === "exposure"
                ? "var(--exposure)"
                : role === "outcome"
                  ? "var(--outcome)"
                  : role === "adjusted"
                    ? "var(--text)"
                    : "var(--faint)";
            return (
              <g
                key={n.id}
                onPointerDown={(e) => onNodeDown(e, n)}
                style={{ cursor: tool === "select" ? "grab" : cursorStyle }}
              >
                {selected && (
                  <rect
                    x={n.x - r - 7}
                    y={n.y - r - 7}
                    width={r * 2 + 14}
                    height={r * 2 + 14}
                    rx={isSquare ? 14 : r + 7}
                    fill="none"
                    stroke="var(--accent)"
                    strokeWidth={2}
                    strokeDasharray="4 4"
                  />
                )}
                {isSquare ? (
                  <rect
                    x={n.x - r}
                    y={n.y - r}
                    width={r * 2}
                    height={r * 2}
                    rx={8}
                    fill={fill}
                    stroke={stroke}
                    strokeWidth={sw}
                  />
                ) : (
                  <circle
                    cx={n.x}
                    cy={n.y}
                    r={r}
                    fill={fill}
                    stroke={stroke}
                    strokeWidth={sw}
                    strokeDasharray={nodeDash}
                  />
                )}
                <text
                  x={n.x}
                  y={n.y}
                  textAnchor="middle"
                  dominantBaseline="central"
                  fontSize={17}
                  fontWeight={700}
                  fill={textFill}
                  style={{ pointerEvents: "none", fontFamily: "Inter, sans-serif" }}
                >
                  {n.id}
                </text>
                {caption && (
                  <text
                    x={n.x}
                    y={n.y + r + 15}
                    textAnchor="middle"
                    fontSize={11}
                    fontWeight={600}
                    fill={captionColor}
                    style={{
                      pointerEvents: "none",
                      textTransform: "uppercase",
                      letterSpacing: "0.5px",
                      fontFamily: "Inter, sans-serif",
                    }}
                  >
                    {caption}
                  </text>
                )}
              </g>
            );
          })}
        </g>
      </svg>

      {/* empty state */}
      {!hasNodes && (
        <div className="absolute inset-0 z-[6] flex items-center justify-center">
          <div className="text-center max-w-[360px] p-[30px]">
            <div className="w-[72px] h-[72px] mx-auto mb-[18px] rounded-[20px] bg-accent-ghost flex items-center justify-center text-accent">
              <HelpGlyphIcon />
            </div>
            <div className="font-sans font-semibold text-[19px] text-text mb-[7px]">
              Start your causal diagram
            </div>
            <div className="text-[13.5px] text-dim leading-[1.55] mb-5">
              Add variables and draw the arrows that represent your causal assumptions. DAGitty+
              analyzes confounding and identification as you build.
            </div>
            <div className="flex gap-2.5 justify-center">
              <button
                onClick={onStartEmpty}
                className="h-10 px-[18px] rounded-[10px] border-none bg-accent text-white text-[13.5px] font-semibold cursor-pointer shadow-[0_2px_10px_-3px_var(--accent)] hover:brightness-110 transition"
              >
                Add first variable
              </button>
              <button
                onClick={onLoadExample}
                className="h-10 px-[18px] rounded-[10px] border border-line bg-panel text-text text-[13.5px] font-medium cursor-pointer hover:border-accent hover:text-accent transition-colors"
              >
                Load example model
              </button>
            </div>
          </div>
        </div>
      )}

      {/* legend */}
      {hasNodes && (
        <div className="absolute left-4 bottom-4 right-[74px] z-[5] flex flex-wrap items-center gap-x-[18px] gap-y-[7px] px-4 py-2.5 bg-panel border border-line rounded-[13px] shadow-panel">
          <span className="text-[10.5px] uppercase tracking-[0.8px] text-faint font-bold mr-0.5">
            Legend
          </span>
          <LegendItem>
            <svg width="22" height="16" viewBox="0 0 26 18" aria-hidden>
              <circle cx="13" cy="9" r="7" fill="var(--exposure)" />
            </svg>
            Exposure
          </LegendItem>
          <LegendItem>
            <svg width="22" height="16" viewBox="0 0 26 18" aria-hidden>
              <circle cx="13" cy="9" r="7" fill="var(--outcome)" />
            </svg>
            Outcome
          </LegendItem>
          <LegendItem>
            <svg width="22" height="16" viewBox="0 0 26 18" aria-hidden>
              <rect x="6" y="2" width="14" height="14" rx="3" fill="var(--panel)" stroke="var(--text)" strokeWidth={2} />
            </svg>
            Adjusted
          </LegendItem>
          <LegendItem>
            <svg width="22" height="16" viewBox="0 0 26 18" aria-hidden>
              <circle cx="13" cy="9" r="7" fill="var(--panel)" stroke="var(--faint)" strokeWidth={2} strokeDasharray="3 3" />
            </svg>
            Unobserved
          </LegendItem>
        </div>
      )}

      {/* zoom controls */}
      <div className="absolute right-4 bottom-4 z-[5] flex flex-col bg-panel border border-line rounded-[12px] shadow-panel overflow-hidden">
        <button
          onClick={onZoomIn}
          aria-label="Zoom in"
          className="w-[38px] h-[38px] border-none bg-transparent text-text text-[18px] cursor-pointer border-b border-line hover:bg-bg transition-colors"
        >
          +
        </button>
        <button
          onClick={onZoomOut}
          aria-label="Zoom out"
          className="w-[38px] h-[38px] border-none bg-transparent text-text text-[18px] cursor-pointer border-b border-line hover:bg-bg transition-colors"
        >
          −
        </button>
        <button
          onClick={onZoomReset}
          aria-label="Reset zoom"
          className="w-[38px] h-[38px] border-none bg-transparent text-dim text-[11px] font-semibold cursor-pointer hover:bg-bg transition-colors"
        >
          {Math.round(zoom * 100)}%
        </button>
      </div>
    </main>
  );
}

function LegendItem({ children }: { children: React.ReactNode }) {
  return <div className="flex items-center gap-2 text-[12px] text-text">{children}</div>;
}
