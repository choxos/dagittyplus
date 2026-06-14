import { useCallback, useEffect, useRef, useState, type RefObject } from "react";
import { CANVAS, type DagEdge, type DagModel, type DagNode, type EdgeType, type Role } from "../lib/dag";
import { type Tool } from "../lib/model-ops";
import { HelpGlyphIcon } from "./icons";
import ContextMenu, { type MenuEntry } from "./ContextMenu";
import NodeToolbar from "./NodeToolbar";
import EdgeToolbar from "./EdgeToolbar";

const NODE_R = 25;
const ADJ_R = 26;

export interface SelectedEdge {
  from: string;
  to: string;
}

interface CanvasProps {
  svgRef: RefObject<SVGSVGElement>;
  model: DagModel;
  tool: Tool;
  selectedId: string | null;
  selectedEdge: SelectedEdge | null;
  acyclic: boolean;
  zoom: number;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onZoomReset: () => void;
  onSelect: (id: string | null) => void;
  onSelectEdge: (edge: SelectedEdge | null) => void;
  onMoveNode: (id: string, x: number, y: number) => void;
  onAddNodeAt: (x: number, y: number) => void;
  onAddEdge: (from: string, to: string) => void;
  onDeleteNode: (id: string) => void;
  onToggleRole: (id: string, role: Role) => void;
  onRename: (id: string) => void;
  onDeleteEdge: (from: string, to: string) => void;
  onReverseEdge: (from: string, to: string) => void;
  onSetEdgeType: (from: string, to: string, type: EdgeType) => void;
  onAutoLayout: () => void;
  onFit: () => void;
  onOpenLoad: () => void;
  onStartEmpty: () => void;
  onLoadExample: () => void;
}

function nodeRadius(n: DagNode): number {
  return n.roles.adjusted ? ADJ_R : NODE_R;
}

// Measure label width so nodes grow to fit long names instead of clipping.
let measureCtx: CanvasRenderingContext2D | null = null;
function labelWidth(text: string): number {
  if (typeof document !== "undefined") {
    if (!measureCtx) measureCtx = document.createElement("canvas").getContext("2d");
    if (measureCtx) {
      measureCtx.font = "700 17px Inter, system-ui, sans-serif";
      const w = measureCtx.measureText(text).width;
      if (w > 0) return w;
    }
  }
  return text.length * 9.5;
}

/** Horizontal half-width: a circle for short ids, a pill for long ones. */
function nodeHalfWidth(n: DagNode): number {
  return Math.max(nodeRadius(n), labelWidth(n.id) / 2 + 12);
}

/** Distance from a node center to its elliptical boundary along a unit vector. */
function boundaryDist(halfW: number, ry: number, ux: number, uy: number): number {
  const d = Math.sqrt((ux * ux) / (halfW * halfW) + (uy * uy) / (ry * ry));
  return d > 0 ? 1 / d : Math.max(halfW, ry);
}

/** Drawing role: first matching flag wins (matches the design's precedence). */
type DrawRole = "exposure" | "outcome" | "adjusted" | "latent" | "selected" | "plain";
function drawRole(n: DagNode): DrawRole {
  if (n.roles.exposure) return "exposure";
  if (n.roles.outcome) return "outcome";
  if (n.roles.adjusted) return "adjusted";
  if (n.roles.latent) return "latent";
  if (n.roles.selected) return "selected";
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
  /** Full center-to-center line for the hit target and midpoint. */
  cx1: number;
  cy1: number;
  cx2: number;
  cy2: number;
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
  const sBound = boundaryDist(nodeHalfWidth(s), nodeRadius(s), ux, uy);
  const tBound = boundaryDist(nodeHalfWidth(t), nodeRadius(t), ux, uy);
  const sr = sBound + 3;
  const tr = tBound + 11;
  const x1 = s.x + ux * sr;
  const y1 = s.y + uy * sr;
  const x2 = t.x - ux * tr;
  const y2 = t.y - uy * tr;
  const tipx = t.x - ux * (tBound + 3);
  const tipy = t.y - uy * (tBound + 3);
  const bx = tipx - ux * 12;
  const by = tipy - uy * 12;
  const arrow = `${tipx.toFixed(1)},${tipy.toFixed(1)} ${(bx + px * 6).toFixed(1)},${(by + py * 6).toFixed(1)} ${(bx - px * 6).toFixed(1)},${(by - py * 6).toFixed(1)}`;
  // Second arrowhead at the source for bidirected edges.
  const stipx = s.x + ux * (sBound + 3);
  const stipy = s.y + uy * (sBound + 3);
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
    cx1: x1,
    cy1: y1,
    cx2: x2,
    cy2: y2,
  };
}

const TOOL_HINT: Record<Tool, string> = {
  select: "Click to select · double-click empty space to add · right-click for options",
  node: "Click the canvas to add a variable",
  edge: "Click a source, then a target",
  delete: "Click a variable to delete it",
  layout: "Click to select · drag to move",
  fit: "Click to select · drag to move",
};

type MenuTarget =
  | { kind: "empty"; vx: number; vy: number }
  | { kind: "node"; id: string }
  | { kind: "edge"; from: string; to: string };

/** Menu target plus its screen position (pixels, relative to the canvas box). */
type Menu = MenuTarget & { sx: number; sy: number };

export default function Canvas(props: CanvasProps) {
  const {
    svgRef,
    model,
    tool,
    selectedId,
    selectedEdge,
    acyclic,
    zoom,
    onZoomIn,
    onZoomOut,
    onZoomReset,
    onSelect,
    onSelectEdge,
    onMoveNode,
    onAddNodeAt,
    onAddEdge,
    onDeleteNode,
    onToggleRole,
    onRename,
    onDeleteEdge,
    onReverseEdge,
    onSetEdgeType,
    onAutoLayout,
    onFit,
    onOpenLoad,
    onStartEmpty,
    onLoadExample,
  } = props;

  const dragRef = useRef<{ id: string; dx: number; dy: number; moved: boolean } | null>(null);
  const [pendingEdge, setPendingEdge] = useState<string | null>(null);
  const [cursor, setCursor] = useState<{ x: number; y: number } | null>(null);
  const [menu, setMenu] = useState<Menu | null>(null);
  // Bumped on scroll/resize so floating overlays recompute their screen positions.
  const [, forceTick] = useState(0);

  /** Geometry shared by toScreen/toViewBox: maps the canvas into the SVG box. */
  const frame = useCallback(() => {
    const svg = svgRef.current;
    const rect = svg?.getBoundingClientRect();
    const scale = rect ? Math.min(rect.width / CANVAS.width, rect.height / CANVAS.height) || 1 : 1;
    const drawW = CANVAS.width * scale;
    const drawH = CANVAS.height * scale;
    return {
      rect,
      scale,
      offX: rect ? (rect.width - drawW) / 2 : 0,
      offY: rect ? (rect.height - drawH) / 2 : 0,
    };
  }, [svgRef]);

  /** Convert a client point to viewBox coords, undoing meet-fit and zoom. */
  const toViewBox = useCallback(
    (clientX: number, clientY: number): { x: number; y: number } => {
      const { rect, scale, offX, offY } = frame();
      if (!rect) return { x: 0, y: 0 };
      let vx = (clientX - rect.left - offX) / scale;
      let vy = (clientY - rect.top - offY) / scale;
      const cx = CANVAS.width / 2;
      const cy = CANVAS.height / 2;
      vx = cx + (vx - cx) / zoom;
      vy = cy + (vy - cy) / zoom;
      return { x: vx, y: vy };
    },
    [frame, zoom],
  );

  /** Inverse of toViewBox: viewBox coords -> pixels relative to the SVG box top-left. */
  const toScreen = useCallback(
    (vx: number, vy: number): { x: number; y: number } => {
      const { scale, offX, offY } = frame();
      const cx = CANVAS.width / 2;
      const cy = CANVAS.height / 2;
      const zx = cx + (vx - cx) * zoom;
      const zy = cy + (vy - cy) * zoom;
      return { x: offX + zx * scale, y: offY + zy * scale };
    },
    [frame, zoom],
  );

  /** Screen-space radius of a node (for clearing the toolbar above it). */
  const screenRadius = useCallback(
    (n: DagNode) => nodeRadius(n) * frame().scale * zoom,
    [frame, zoom],
  );

  // Reposition overlays and dismiss the context menu on scroll/resize.
  useEffect(() => {
    const onMove = () => {
      setMenu(null);
      forceTick((t) => t + 1);
    };
    window.addEventListener("resize", onMove);
    window.addEventListener("scroll", onMove, true);
    return () => {
      window.removeEventListener("resize", onMove);
      window.removeEventListener("scroll", onMove, true);
    };
  }, []);

  // Esc cancels a pending edge / closes the menu (selection Esc lives in App).
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      if (menu) setMenu(null);
      if (pendingEdge !== null) {
        setPendingEdge(null);
        setCursor(null);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [menu, pendingEdge]);

  const completeOrStartEdge = useCallback(
    (id: string) => {
      if (pendingEdge === null) {
        setPendingEdge(id);
        onSelect(id);
      } else {
        if (pendingEdge !== id) onAddEdge(pendingEdge, id);
        setPendingEdge(null);
        setCursor(null);
      }
    },
    [pendingEdge, onAddEdge, onSelect],
  );

  const onNodeDown = (e: React.PointerEvent, n: DagNode) => {
    if (e.button !== 0) return; // let right-click bubble to onContextMenu
    e.stopPropagation();
    setMenu(null);
    if (tool === "delete") {
      onDeleteNode(n.id);
      return;
    }
    if (tool === "edge" || pendingEdge !== null) {
      completeOrStartEdge(n.id);
      return;
    }
    // select / move
    onSelect(n.id);
    const p = toViewBox(e.clientX, e.clientY);
    dragRef.current = { id: n.id, dx: p.x - n.x, dy: p.y - n.y, moved: false };
    (e.target as Element).setPointerCapture?.(e.pointerId);
  };

  const onEdgeDown = (e: React.PointerEvent, edge: DagEdge) => {
    if (e.button !== 0) return;
    e.stopPropagation();
    setMenu(null);
    if (tool === "delete") {
      onDeleteEdge(edge.from, edge.to);
      return;
    }
    if (tool === "edge" || pendingEdge !== null) {
      // Mid-edge clicks shouldn't hijack an in-progress connection.
      if (pendingEdge !== null) {
        setPendingEdge(null);
        setCursor(null);
      }
      return;
    }
    onSelectEdge({ from: edge.from, to: edge.to });
  };

  const onPointerMove = (e: React.PointerEvent) => {
    if (dragRef.current) {
      const p = toViewBox(e.clientX, e.clientY);
      dragRef.current.moved = true;
      onMoveNode(dragRef.current.id, p.x - dragRef.current.dx, p.y - dragRef.current.dy);
      return;
    }
    if (pendingEdge !== null) {
      setCursor(toViewBox(e.clientX, e.clientY));
    }
  };

  const endDrag = () => {
    dragRef.current = null;
  };

  const onCanvasDown = (e: React.PointerEvent) => {
    if (e.button !== 0) return;
    // Only fires for clicks on empty canvas (nodes/edges stop propagation).
    setMenu(null);
    if (tool === "node") {
      const p = toViewBox(e.clientX, e.clientY);
      onAddNodeAt(p.x, p.y);
      return;
    }
    if (pendingEdge !== null) {
      setPendingEdge(null);
      setCursor(null);
      return;
    }
    onSelect(null);
    onSelectEdge(null);
  };

  const onCanvasDoubleClick = (e: React.MouseEvent) => {
    // Double-click empty space adds a variable there immediately.
    if (pendingEdge !== null) return;
    const p = toViewBox(e.clientX, e.clientY);
    onAddNodeAt(p.x, p.y);
  };

  const openMenu = (e: React.MouseEvent, target: MenuTarget) => {
    e.preventDefault();
    e.stopPropagation();
    const { rect } = frame();
    const sx = rect ? e.clientX - rect.left : 0;
    const sy = rect ? e.clientY - rect.top : 0;
    setMenu({ ...target, sx, sy });
  };

  const onCanvasContextMenu = (e: React.MouseEvent) => {
    const p = toViewBox(e.clientX, e.clientY);
    openMenu(e, { kind: "empty", vx: p.x, vy: p.y });
  };

  const startEdgeFromToolbar = useCallback(
    (id: string) => {
      if (pendingEdge === id) {
        setPendingEdge(null);
        setCursor(null);
      } else {
        setPendingEdge(id);
      }
    },
    [pendingEdge],
  );

  const hasNodes = model.nodes.length > 0;
  const pendingNode = pendingEdge ? model.nodes.find((n) => n.id === pendingEdge) : null;
  const selectedNode = selectedId ? model.nodes.find((n) => n.id === selectedId) ?? null : null;
  const selectedEdgeObj =
    selectedEdge &&
    model.edges.find((e) => e.from === selectedEdge.from && e.to === selectedEdge.to);

  const cursorStyle =
    tool === "node"
      ? "copy"
      : tool === "edge" || pendingEdge !== null
        ? "crosshair"
        : tool === "delete"
          ? "not-allowed"
          : "default";

  // Build context-menu entries lazily from the open menu's target.
  const menuEntries = (): MenuEntry[] => {
    if (!menu) return [];
    if (menu.kind === "empty") {
      return [
        { label: "Add variable here", onClick: () => onAddNodeAt(menu.vx, menu.vy) },
        { label: "Auto-layout", onClick: onAutoLayout },
        { label: "Fit to view", onClick: onFit },
        { divider: true },
        { label: "Load model…", onClick: onOpenLoad },
      ];
    }
    if (menu.kind === "node") {
      const n = model.nodes.find((x) => x.id === menu.id);
      if (!n) return [];
      const roleDot = (color: string) => (
        <span className="w-2 h-2 rounded-full" style={{ background: color }} />
      );
      return [
        {
          label: "Exposure",
          icon: roleDot("var(--exposure)"),
          checked: !!n.roles.exposure,
          onClick: () => onToggleRole(n.id, "exposure"),
        },
        {
          label: "Outcome",
          icon: roleDot("var(--outcome)"),
          checked: !!n.roles.outcome,
          onClick: () => onToggleRole(n.id, "outcome"),
        },
        {
          label: "Adjusted",
          icon: roleDot("var(--text)"),
          checked: !!n.roles.adjusted,
          onClick: () => onToggleRole(n.id, "adjusted"),
        },
        {
          label: "Unobserved",
          icon: roleDot("var(--faint)"),
          checked: !!n.roles.latent,
          onClick: () => onToggleRole(n.id, "latent"),
        },
        {
          label: "Selected",
          icon: roleDot("var(--biasing)"),
          checked: !!n.roles.selected,
          onClick: () => onToggleRole(n.id, "selected"),
        },
        { divider: true },
        { label: "Rename…", onClick: () => onRename(n.id) },
        { label: "Delete variable", danger: true, onClick: () => onDeleteNode(n.id) },
      ];
    }
    // edge
    const e = model.edges.find((x) => x.from === menu.from && x.to === menu.to);
    if (!e) return [];
    return [
      { label: "Reverse direction", onClick: () => onReverseEdge(e.from, e.to) },
      e.type === "bidirected"
        ? { label: "Make directed", onClick: () => onSetEdgeType(e.from, e.to, "directed") }
        : { label: "Make bidirected", onClick: () => onSetEdgeType(e.from, e.to, "bidirected") },
      { divider: true },
      { label: "Delete edge", danger: true, onClick: () => onDeleteEdge(e.from, e.to) },
    ];
  };

  // Floating toolbars only when nothing is being dragged/connected mid-stream.
  const fr = frame();
  const boundsW = fr.rect?.width ?? 0;
  const boundsH = fr.rect?.height ?? 0;
  const showNodeToolbar = selectedNode && tool === "select" && !menu;
  const nodeToolbarPos = showNodeToolbar ? toScreen(selectedNode.x, selectedNode.y) : null;

  let edgeMid: { x: number; y: number } | null = null;
  if (selectedEdgeObj && tool === "select" && !menu) {
    const g = edgeGeom(model, selectedEdgeObj);
    if (g) edgeMid = toScreen((g.cx1 + g.cx2) / 2, (g.cy1 + g.cy2) / 2);
  }

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
        <div className="hidden sm:block absolute top-4 right-4 z-[5] max-w-[280px] px-[13px] py-1.5 bg-accent-ghost border border-accent rounded-full text-accent text-[12px] font-semibold text-center">
          {pendingEdge !== null ? "Click a target node to connect · Esc to cancel" : TOOL_HINT[tool]}
        </div>
      )}

      <svg
        ref={svgRef}
        viewBox={`0 0 ${CANVAS.width} ${CANVAS.height}`}
        preserveAspectRatio="xMidYMid meet"
        className="absolute inset-0 w-full h-full"
        style={{ cursor: cursorStyle, touchAction: "none" }}
        onPointerMove={onPointerMove}
        onPointerUp={endDrag}
        onPointerLeave={endDrag}
      >
        {/*
          Full-canvas hit target for empty-space interactions. Using a real
          element (rather than the <svg> root) keeps React's delegated
          onContextMenu / onDoubleClick reliable; nodes and edges render on top
          and stop propagation, so they take precedence where present.
        */}
        <rect
          x={0}
          y={0}
          width={CANVAS.width}
          height={CANVAS.height}
          fill="transparent"
          onPointerDown={onCanvasDown}
          onDoubleClick={onCanvasDoubleClick}
          onContextMenu={onCanvasContextMenu}
        />
        {/* Visible frame marking the bounded region nodes are clamped within. */}
        <rect
          x={1}
          y={1}
          width={CANVAS.width - 2}
          height={CANVAS.height - 2}
          rx={16}
          fill="none"
          stroke="var(--line)"
          strokeWidth={1.5}
          pointerEvents="none"
        />
        <g style={{ transform: `scale(${zoom})`, transformOrigin: "380px 240px" }}>
          {/* edges */}
          {model.edges.map((e) => {
            const g = edgeGeom(model, e);
            if (!g) return null;
            const isSel =
              selectedEdge && selectedEdge.from === e.from && selectedEdge.to === e.to;
            return (
              <g
                key={g.key}
                onPointerDown={(ev) => onEdgeDown(ev, e)}
                onContextMenu={(ev) => openMenu(ev, { kind: "edge", from: e.from, to: e.to })}
                style={{ cursor: tool === "select" ? "pointer" : cursorStyle }}
              >
                {/* transparent thick hit target */}
                <line
                  x1={g.cx1}
                  y1={g.cy1}
                  x2={g.cx2}
                  y2={g.cy2}
                  stroke="transparent"
                  strokeWidth={14}
                  strokeLinecap="round"
                  style={{ pointerEvents: "stroke" }}
                />
                <line
                  x1={g.x1}
                  y1={g.y1}
                  x2={g.x2}
                  y2={g.y2}
                  stroke={isSel ? "var(--accent)" : "var(--neutral)"}
                  strokeWidth={isSel ? 2.8 : 2}
                  strokeLinecap="round"
                  style={{ pointerEvents: "none" }}
                />
                <polygon points={g.arrow} fill={isSel ? "var(--accent)" : "var(--neutral)"} style={{ pointerEvents: "none" }} />
                {g.bidirected && (
                  <polygon points={g.backArrow} fill={isSel ? "var(--accent)" : "var(--neutral)"} style={{ pointerEvents: "none" }} />
                )}
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
            const halfW = nodeHalfWidth(n);
            const selected = n.id === selectedId;
            const isSquare = role === "adjusted";
            const isPending = n.id === pendingEdge;
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
                  : role === "selected"
                    ? "var(--biasing)"
                    : role === "latent"
                      ? "var(--faint)"
                      : "var(--text)";
            const textFill = role === "exposure" || role === "outcome" ? "#fff" : role === "latent" ? "var(--faint)" : "var(--text)";
            const sw = role === "adjusted" || role === "selected" ? 2.6 : 2;
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
                  : role === "selected"
                    ? "var(--biasing)"
                    : role === "adjusted"
                      ? "var(--text)"
                      : "var(--faint)";
            return (
              <g
                key={n.id}
                onPointerDown={(e) => onNodeDown(e, n)}
                onContextMenu={(e) => openMenu(e, { kind: "node", id: n.id })}
                style={{ cursor: tool === "select" ? "grab" : cursorStyle }}
              >
                {(selected || isPending) && (
                  <rect
                    x={n.x - halfW - 7}
                    y={n.y - r - 7}
                    width={halfW * 2 + 14}
                    height={r * 2 + 14}
                    rx={isSquare ? 14 : r + 7}
                    fill="none"
                    stroke="var(--accent)"
                    strokeWidth={2}
                    strokeDasharray="4 4"
                  />
                )}
                <rect
                  x={n.x - halfW}
                  y={n.y - r}
                  width={halfW * 2}
                  height={r * 2}
                  rx={isSquare ? 9 : r}
                  fill={fill}
                  stroke={stroke}
                  strokeWidth={sw}
                  strokeDasharray={nodeDash}
                />
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

      {/* floating node toolbar */}
      {showNodeToolbar && selectedNode && nodeToolbarPos && (
        <NodeToolbar
          node={selectedNode}
          x={nodeToolbarPos.x}
          y={nodeToolbarPos.y}
          screenR={screenRadius(selectedNode)}
          boundsW={boundsW}
          drawing={pendingEdge === selectedNode.id}
          onToggleRole={onToggleRole}
          onStartEdge={startEdgeFromToolbar}
          onRename={onRename}
          onDelete={onDeleteNode}
        />
      )}

      {/* floating edge toolbar */}
      {edgeMid && selectedEdgeObj && (
        <EdgeToolbar
          x={edgeMid.x}
          y={edgeMid.y}
          type={selectedEdgeObj.type}
          onReverse={() => onReverseEdge(selectedEdgeObj.from, selectedEdgeObj.to)}
          onToggleType={() =>
            onSetEdgeType(
              selectedEdgeObj.from,
              selectedEdgeObj.to,
              selectedEdgeObj.type === "bidirected" ? "directed" : "bidirected",
            )
          }
          onDelete={() => onDeleteEdge(selectedEdgeObj.from, selectedEdgeObj.to)}
        />
      )}

      {/* context menu */}
      {menu && (
        <ContextMenu
          x={menu.sx}
          y={menu.sy}
          boundsW={boundsW}
          boundsH={boundsH}
          entries={menuEntries()}
          onClose={() => setMenu(null)}
        />
      )}

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
          <LegendItem>
            <svg width="22" height="16" viewBox="0 0 26 18" aria-hidden>
              <circle cx="13" cy="9" r="7" fill="var(--panel)" stroke="var(--biasing)" strokeWidth={2.4} />
            </svg>
            Selected
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
