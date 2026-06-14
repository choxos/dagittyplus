// The editor's own model of a DAG. Editing happens against this model; the
// engine (engine.ts) is only consulted for analysis and for parsing pasted
// dagitty code. Node positions live here and never affect analysis.

import { engine, type DagittyGraph, type Vertex } from "./engine";

export type Role = "exposure" | "outcome" | "adjusted" | "latent" | "selected";
export const ROLES: Role[] = ["exposure", "outcome", "adjusted", "latent", "selected"];

export type RoleFlags = Partial<Record<Role, boolean>>;

export interface DagNode {
  id: string;
  x: number;
  y: number;
  roles: RoleFlags;
}

export type EdgeType = "directed" | "bidirected";

export interface DagEdge {
  from: string;
  to: string;
  type: EdgeType;
}

export interface DagModel {
  nodes: DagNode[];
  edges: DagEdge[];
}

export const CANVAS = { width: 760, height: 480, pad: 70 };

// Node-label font size at 100% (canvas units). The diagram-size control is
// expressed in terms of this: the whole diagram scales so the label reads at the
// chosen pixel size, and exports carry the same size.
export const BASE_FONT_PX = 17;

const ROLE_KEYWORD: Record<Role, string> = {
  exposure: "exposure",
  outcome: "outcome",
  adjusted: "adjusted",
  latent: "latent",
  selected: "selected",
};

function quote(id: string): string {
  return /^[A-Za-z0-9_.]+$/.test(id) ? id : `"${id.replace(/"/g, '\\"')}"`;
}

/** Serialize the model to dagitty syntax, including node positions. */
export function serialize(model: DagModel): string {
  const lines: string[] = ["dag {"];
  for (const n of model.nodes) {
    const attrs = ROLES.filter((r) => n.roles[r]).map((r) => ROLE_KEYWORD[r]);
    attrs.push(`pos="${(n.x / 100).toFixed(3)},${(n.y / 100).toFixed(3)}"`);
    lines.push(`  ${quote(n.id)} [${attrs.join(",")}]`);
  }
  for (const e of model.edges) {
    const op = e.type === "bidirected" ? "<->" : "->";
    lines.push(`  ${quote(e.from)} ${op} ${quote(e.to)}`);
  }
  lines.push("}");
  return lines.join("\n");
}

/** Parse dagitty syntax into the editor model (positions fit to the canvas). */
export function parse(code: string): DagModel {
  return fromGraph(engine().GraphParser.parseGuess(code));
}

export function fromGraph(g: DagittyGraph): DagModel {
  // This editor models DAGs with directed (->) and bidirected (<->) edges only.
  // Reject anything else (undirected, partially directed, PDAG/MAG/PAG) rather
  // than silently coercing it into a different causal model.
  const rawEdges = g.getEdges();
  if (rawEdges.some((e) => e.directed !== 1 && e.directed !== 2)) {
    throw new Error(
      "This editor supports directed (->) and bidirected (<->) edges only; the model contains undirected or partially directed edges.",
    );
  }

  const has = (vs: Vertex[]) => new Set(vs.map((v) => v.id));
  const exposure = has(g.getSources());
  const outcome = has(g.getTargets());
  const adjusted = has(g.getAdjustedNodes());
  const latent = has(g.getLatentNodes());
  const selected = has(g.getSelectedNodes());

  const placed = layout(
    g.getVertices().map((v) => ({
      id: v.id,
      px: v.layout_pos_x,
      py: v.layout_pos_y,
    })),
  );

  const nodes: DagNode[] = placed.map((p) => ({
    id: p.id,
    x: p.x,
    y: p.y,
    roles: {
      exposure: exposure.has(p.id),
      outcome: outcome.has(p.id),
      adjusted: adjusted.has(p.id),
      latent: latent.has(p.id),
      selected: selected.has(p.id),
    },
  }));

  const edges: DagEdge[] = rawEdges.map((e) => ({
    from: e.v1.id,
    to: e.v2.id,
    type: e.directed === 2 ? "bidirected" : "directed",
  }));

  return { nodes, edges };
}

interface RawPos {
  id: string;
  px?: number;
  py?: number;
}

function layout(raw: RawPos[]): { id: string; x: number; y: number }[] {
  const { width, height, pad } = CANVAS;
  const positioned = raw.filter((r) => r.px !== undefined && r.py !== undefined);

  if (raw.length > 0 && positioned.length === raw.length) {
    const xs = positioned.map((r) => r.px as number);
    const ys = positioned.map((r) => r.py as number);
    const minX = Math.min(...xs);
    const maxX = Math.max(...xs);
    const minY = Math.min(...ys);
    const maxY = Math.max(...ys);
    const spanX = maxX - minX;
    const spanY = maxY - minY;
    return raw.map((r) => ({
      id: r.id,
      x: spanX > 0 ? pad + ((r.px as number) - minX) * ((width - 2 * pad) / spanX) : width / 2,
      y: spanY > 0 ? pad + ((r.py as number) - minY) * ((height - 2 * pad) / spanY) : height / 2,
    }));
  }

  // Grid fallback when positions are missing.
  const cols = Math.max(1, Math.ceil(Math.sqrt(raw.length || 1)));
  const rows = Math.max(1, Math.ceil(raw.length / cols));
  const gx = cols > 1 ? (width - 2 * pad) / (cols - 1) : 0;
  const gy = rows > 1 ? (height - 2 * pad) / (rows - 1) : 0;
  return raw.map((r, i) => ({
    id: r.id,
    x: cols > 1 ? pad + (i % cols) * gx : width / 2,
    y: rows > 1 ? pad + Math.floor(i / cols) * gy : height / 2,
  }));
}

/**
 * A starter model that shows off the app: an exposure and outcome, a measured
 * confounder to adjust for (z), a mediator (m) so total and direct effects
 * differ, a conditional instrument (iv), an unobserved common cause (u, drawn
 * as a dashed "unobserved" node), and a collider (s).
 */
export function exampleModel(): DagModel {
  return parse(
    `dag {
      iv [pos="0.0,1.5"]
      x [exposure,pos="1.3,1.5"]
      m [pos="2.6,2.7"]
      y [outcome,pos="3.9,1.5"]
      z [pos="2.0,0.3"]
      u [latent,pos="0.7,0.3"]
      s [pos="3.2,0.3"]
      iv -> x
      x -> y
      x -> m
      m -> y
      z -> x
      z -> y
      x -> s
      y -> s
      u -> iv
      u -> z
    }`,
  );
}
