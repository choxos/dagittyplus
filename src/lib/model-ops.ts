// Pure helpers that produce a NEW DagModel from an old one. App holds the model
// in state and replaces it with these results; components stay presentational.

import { CANVAS, type DagModel, type DagNode, type EdgeType, type Role } from "./dag";

export type Tool = "select" | "node" | "edge" | "delete" | "layout" | "fit";
export type Tab = "inspect" | "identify" | "implications" | "code";

/** Clamp a point so a node stays fully inside the canvas with a margin. */
export function clampPoint(x: number, y: number): { x: number; y: number } {
  const m = 34;
  return {
    x: Math.max(m, Math.min(CANVAS.width - m, x)),
    y: Math.max(m, Math.min(CANVAS.height - m, y)),
  };
}

/** Next free auto-name: v1, v2, ... skipping ids already in use. */
export function nextNodeId(model: DagModel): string {
  const used = new Set(model.nodes.map((n) => n.id));
  let i = 1;
  while (used.has(`v${i}`)) i += 1;
  return `v${i}`;
}

// Coordinates arrive already clamped to the live canvas by the Canvas component,
// which is the only place that knows the current (responsive) drawing bounds.
export function addNode(model: DagModel, x: number, y: number, id?: string): DagModel {
  const newId = id ?? nextNodeId(model);
  if (model.nodes.some((n) => n.id === newId)) return model;
  const node: DagNode = { id: newId, x, y, roles: {} };
  return { nodes: [...model.nodes, node], edges: model.edges };
}

export function moveNode(model: DagModel, id: string, x: number, y: number): DagModel {
  return {
    nodes: model.nodes.map((n) => (n.id === id ? { ...n, x, y } : n)),
    edges: model.edges,
  };
}

export function removeNode(model: DagModel, id: string): DagModel {
  return {
    nodes: model.nodes.filter((n) => n.id !== id),
    edges: model.edges.filter((e) => e.from !== id && e.to !== id),
  };
}

export function renameNode(model: DagModel, from: string, to: string): DagModel {
  const trimmed = to.trim();
  if (!trimmed || trimmed === from) return model;
  if (model.nodes.some((n) => n.id === trimmed)) return model; // name taken
  return {
    nodes: model.nodes.map((n) => (n.id === from ? { ...n, id: trimmed } : n)),
    edges: model.edges.map((e) => ({
      from: e.from === from ? trimmed : e.from,
      to: e.to === from ? trimmed : e.to,
      type: e.type,
    })),
  };
}

export function addEdge(model: DagModel, from: string, to: string): DagModel {
  if (from === to) return model; // no self-loops
  const exists = model.edges.some(
    (e) => (e.from === from && e.to === to) || (e.from === to && e.to === from),
  );
  if (exists) return model; // ignore duplicates and reverse-duplicates
  return { nodes: model.nodes, edges: [...model.edges, { from, to, type: "directed" }] };
}

export function deleteEdge(model: DagModel, from: string, to: string): DagModel {
  return {
    nodes: model.nodes,
    edges: model.edges.filter((e) => !(e.from === from && e.to === to)),
  };
}

/** Flip an edge's direction, unless that would duplicate an existing edge. */
export function reverseEdge(model: DagModel, from: string, to: string): DagModel {
  if (model.edges.some((e) => e.from === to && e.to === from)) return model;
  return {
    nodes: model.nodes,
    edges: model.edges.map((e) =>
      e.from === from && e.to === to ? { from: to, to: from, type: e.type } : e,
    ),
  };
}

export function setEdgeType(
  model: DagModel,
  from: string,
  to: string,
  type: EdgeType,
): DagModel {
  return {
    nodes: model.nodes,
    edges: model.edges.map((e) => (e.from === from && e.to === to ? { ...e, type } : e)),
  };
}

/** Exposure and outcome are mutually exclusive; toggling one clears the other. */
export function toggleRole(model: DagModel, id: string, role: Role): DagModel {
  return {
    nodes: model.nodes.map((n) => {
      if (n.id !== id) return n;
      const roles = { ...n.roles };
      const now = !roles[role];
      roles[role] = now;
      if (now && role === "exposure") roles.outcome = false;
      if (now && role === "outcome") roles.exposure = false;
      return { ...n, roles };
    }),
    edges: model.edges,
  };
}

/**
 * Longest-path layering auto-layout: x by layer (longest path from a root),
 * y distributed within a layer. Positions snap into the canvas.
 */
export function autoLayout(model: DagModel): DagModel {
  const ids = model.nodes.map((n) => n.id);
  if (ids.length === 0) return model;

  const parents = new Map<string, string[]>();
  const children = new Map<string, string[]>();
  ids.forEach((id) => {
    parents.set(id, []);
    children.set(id, []);
  });
  for (const e of model.edges) {
    if (e.type !== "directed") continue;
    if (!parents.has(e.to) || !children.has(e.from)) continue;
    parents.get(e.to)!.push(e.from);
    children.get(e.from)!.push(e.to);
  }

  // Longest path from any root (memoized DFS; guard against cycles).
  const layer = new Map<string, number>();
  const visiting = new Set<string>();
  const depth = (id: string): number => {
    if (layer.has(id)) return layer.get(id)!;
    if (visiting.has(id)) return 0; // cycle guard
    visiting.add(id);
    const ps = parents.get(id) ?? [];
    const d = ps.length === 0 ? 0 : 1 + Math.max(...ps.map(depth));
    visiting.delete(id);
    layer.set(id, d);
    return d;
  };
  ids.forEach(depth);

  const byLayer = new Map<number, string[]>();
  let maxLayer = 0;
  for (const id of ids) {
    const l = layer.get(id) ?? 0;
    maxLayer = Math.max(maxLayer, l);
    if (!byLayer.has(l)) byLayer.set(l, []);
    byLayer.get(l)!.push(id);
  }

  const { width, height, pad } = CANVAS;
  const colGap = maxLayer > 0 ? (width - 2 * pad) / maxLayer : 0;
  const pos = new Map<string, { x: number; y: number }>();
  for (const [l, group] of byLayer) {
    const x = maxLayer > 0 ? pad + l * colGap : width / 2;
    const rowGap = group.length > 1 ? (height - 2 * pad) / (group.length - 1) : 0;
    group.forEach((id, i) => {
      const y = group.length > 1 ? pad + i * rowGap : height / 2;
      pos.set(id, clampPoint(x, y));
    });
  }

  return {
    nodes: model.nodes.map((n) => {
      const p = pos.get(n.id);
      return p ? { ...n, x: p.x, y: p.y } : n;
    }),
    edges: model.edges,
  };
}
