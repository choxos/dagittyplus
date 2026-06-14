// Typed wrapper around the vendored DAGitty engine (window.DAGitty), which is
// the exact same JavaScript bundle the dagittyplus R package runs through V8.
// Because both interfaces load this identical file, their analyses agree by
// construction.

export interface Vertex {
  id: string;
  layout_pos_x?: number;
  layout_pos_y?: number;
  getParents(): Vertex[];
}

export interface RawEdge {
  v1: Vertex;
  v2: Vertex;
  /** 0 = undirected (--), 1 = directed (->), 2 = bidirected (<->) */
  directed: number;
}

export interface DagittyGraph {
  getType(): string;
  getVertices(): Vertex[];
  getVertexIDs(): string[];
  getEdges(): RawEdge[];
  getNumberOfVertices(): number;
  getSources(): Vertex[];
  getTargets(): Vertex[];
  getLatentNodes(): Vertex[];
  getAdjustedNodes(): Vertex[];
  getSelectedNodes(): Vertex[];
  getVertex(id: string): Vertex;
  ancestorsOf(vs: Vertex[], setup?: () => void): Vertex[];
  descendantsOf(vs: Vertex[]): Vertex[];
  clearTraversalInfo(): void;
  toString(): string;
}

interface GraphAnalyzerApi {
  containsCycle(g: DagittyGraph): false | Vertex[];
  listMsasTotalEffect(g: DagittyGraph): Vertex[][];
  listMsasDirectEffect(g: DagittyGraph): Vertex[][];
  conditionalInstruments(g: DagittyGraph): Array<[Vertex, Vertex[]]>;
  listMinimalImplications(g: DagittyGraph): Array<[string, string, Vertex[][]]>;
}

export interface DagittyEngine {
  GraphParser: { parseGuess(code: string): DagittyGraph };
  GraphAnalyzer: GraphAnalyzerApi;
  GraphTransformer: Record<string, (...args: unknown[]) => unknown>;
  GraphSerializer: Record<string, (...args: unknown[]) => unknown>;
  Graph: {
    Edgetype: Record<string, unknown>;
    Vertex: { markAsVisited(v: Vertex): void };
  };
}

declare global {
  interface Window {
    DAGitty: DagittyEngine;
    examples?: Record<string, unknown>;
  }
}

export function engine(): DagittyEngine {
  const D = window.DAGitty;
  if (!D) throw new Error("The DAGitty engine (dagitty-alg.js) is not loaded.");
  return D;
}

const ids = (vs: Vertex[]): string[] => vs.map((v) => v.id);

export type AdjustmentStatus =
  | "identifiable"
  | "not-identifiable"
  | "no-adjustment-needed";

export interface AdjustmentResult {
  status: AdjustmentStatus;
  sets: string[][];
}

export interface Instrument {
  name: string;
  conditioning: string[];
}

export interface Implication {
  x: string;
  y: string;
  given: string[];
}

export interface Analysis {
  ok: boolean;
  error?: string;
  acyclic: boolean;
  type: string;
  variables: string[];
  edges: number;
  sources: string[];
  targets: string[];
  adjusted: string[];
  latent: string[];
  selected: string[];
  /** Variables on a causal path from the (single) exposure to the outcome. */
  mediators: string[];
  /** Common causes of the (single) exposure and outcome. */
  confounders: string[];
  /** Variables with two or more incoming arrows (structural colliders). */
  colliders: string[];
  totalEffect: AdjustmentResult | null;
  directEffect: AdjustmentResult | null;
  instruments: Instrument[];
  implications: Implication[];
  /** Non-null when the engine threw while computing one of the analyses. */
  engineError: string | null;
}

function adjustment(sets: Vertex[][]): AdjustmentResult {
  if (!sets || sets.length === 0) {
    return { status: "not-identifiable", sets: [] };
  }
  const mapped = sets.map(ids);
  if (mapped.length === 1 && mapped[0].length === 0) {
    return { status: "no-adjustment-needed", sets: [[]] };
  }
  return { status: "identifiable", sets: mapped };
}

interface Structure {
  mediators: string[];
  confounders: string[];
  colliders: string[];
}

// Mediators, common causes (confounders), and structural colliders. Mediators
// and confounders are defined relative to a single exposure and outcome; the
// engine's ancestorsOf/descendantsOf include the queried node, so we drop the
// exposure and outcome themselves.
function computeStructure(
  D: DagittyEngine,
  g: DagittyGraph,
  sources: string[],
  targets: string[],
  acyclic: boolean,
): Structure {
  const colliders = g
    .getVertices()
    .filter((v) => v.getParents().length >= 2)
    .map((v) => v.id);

  if (!acyclic || sources.length !== 1 || targets.length !== 1) {
    return { mediators: [], confounders: [], colliders };
  }
  const x = sources[0];
  const y = targets[0];
  const drop = new Set([x, y]);
  const xVertex = g.getVertex(x);
  const descX = new Set(ids(g.descendantsOf([xVertex])));
  const ancX = new Set(ids(g.ancestorsOf([xVertex])));
  const ancY = new Set(ids(g.ancestorsOf([g.getVertex(y)])));
  // Ancestors of the outcome reached WITHOUT passing through the exposure: a
  // confounder must open a back-door path, not act only through X (which would
  // make it an instrument, not a confounder).
  const ancYavoidingX = new Set(
    ids(
      g.ancestorsOf([g.getVertex(y)], () => {
        g.clearTraversalInfo();
        D.Graph.Vertex.markAsVisited(xVertex);
      }),
    ),
  );

  const mediators = [...descX].filter((id) => ancY.has(id) && !drop.has(id)).sort();
  const mediatorSet = new Set(mediators);
  const confounders = [...ancX]
    .filter((id) => ancYavoidingX.has(id) && !drop.has(id) && !mediatorSet.has(id))
    .sort();
  return { mediators, confounders, colliders };
}

/** Parse a dagitty model string and run the full causal analysis. */
export function analyze(code: string): Analysis {
  let D: DagittyEngine;
  try {
    D = engine();
  } catch (e) {
    return emptyAnalysis((e as Error).message);
  }

  let g: DagittyGraph;
  try {
    g = D.GraphParser.parseGuess(code);
  } catch (e) {
    return emptyAnalysis((e as Error).message);
  }

  // Record (rather than swallow) engine errors so the UI can tell a real
  // "not identifiable" answer apart from an engine failure.
  const errors: string[] = [];
  const attempt = <T>(label: string, fn: () => T, fallback: T): T => {
    try {
      return fn();
    } catch (e) {
      errors.push(`${label}: ${(e as Error).message || "engine error"}`);
      return fallback;
    }
  };

  const sources = ids(g.getSources());
  const targets = ids(g.getTargets());
  const adjusted = ids(g.getAdjustedNodes());
  const latent = ids(g.getLatentNodes());
  const selected = ids(g.getSelectedNodes());
  const acyclic = !D.GraphAnalyzer.containsCycle(g);
  const hasEffect = sources.length > 0 && targets.length > 0 && acyclic;
  const structure = attempt("structure", () => computeStructure(D, g, sources, targets, acyclic), {
    mediators: [],
    confounders: [],
    colliders: [],
  });

  return {
    ok: true,
    acyclic,
    type: g.getType(),
    variables: g.getVertexIDs(),
    edges: g.getEdges().length,
    sources,
    targets,
    adjusted,
    latent,
    selected,
    mediators: structure.mediators,
    confounders: structure.confounders,
    colliders: structure.colliders,
    totalEffect: hasEffect
      ? attempt("total effect", () => adjustment(D.GraphAnalyzer.listMsasTotalEffect(g)), null)
      : null,
    directEffect: hasEffect
      ? attempt("direct effect", () => adjustment(D.GraphAnalyzer.listMsasDirectEffect(g)), null)
      : null,
    instruments: hasEffect
      ? attempt(
          "instruments",
          () =>
            D.GraphAnalyzer.conditionalInstruments(g).map(([v, cond]) => ({
              name: v.id,
              conditioning: ids(cond),
            })),
          [],
        )
      : [],
    implications: attempt(
      "implications",
      () =>
        D.GraphAnalyzer.listMinimalImplications(g).map(([x, y, given]) => ({
          x,
          y,
          given: given && given.length > 0 ? given[0].map((v) => v.id) : [],
        })),
      [],
    ),
    engineError: errors.length ? errors.join("; ") : null,
  };
}

function emptyAnalysis(error?: string): Analysis {
  return {
    ok: false,
    error,
    acyclic: true,
    type: "dag",
    variables: [],
    edges: 0,
    sources: [],
    targets: [],
    adjusted: [],
    latent: [],
    selected: [],
    mediators: [],
    confounders: [],
    colliders: [],
    totalEffect: null,
    directEffect: null,
    instruments: [],
    implications: [],
    engineError: null,
  };
}
