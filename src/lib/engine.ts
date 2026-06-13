// Typed wrapper around the vendored DAGitty engine (window.DAGitty), which is
// the exact same JavaScript bundle the dagittyplus R package runs through V8.
// Because both interfaces load this identical file, their analyses agree by
// construction.

export interface Vertex {
  id: string;
  layout_pos_x?: number;
  layout_pos_y?: number;
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
  Graph: { Edgetype: Record<string, unknown> };
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
  totalEffect: AdjustmentResult | null;
  directEffect: AdjustmentResult | null;
  instruments: Instrument[];
  implications: Implication[];
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

function safe<T>(fn: () => T, fallback: T): T {
  try {
    return fn();
  } catch {
    return fallback;
  }
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

  const sources = ids(g.getSources());
  const targets = ids(g.getTargets());
  const adjusted = ids(g.getAdjustedNodes());
  const latent = ids(g.getLatentNodes());
  const acyclic = !D.GraphAnalyzer.containsCycle(g);
  const hasEffect = sources.length > 0 && targets.length > 0 && acyclic;

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
    totalEffect: hasEffect
      ? safe(() => adjustment(D.GraphAnalyzer.listMsasTotalEffect(g)), null)
      : null,
    directEffect: hasEffect
      ? safe(() => adjustment(D.GraphAnalyzer.listMsasDirectEffect(g)), null)
      : null,
    instruments: hasEffect
      ? safe(
          () =>
            D.GraphAnalyzer.conditionalInstruments(g).map(([v, cond]) => ({
              name: v.id,
              conditioning: ids(cond),
            })),
          [],
        )
      : [],
    implications: safe(
      () =>
        D.GraphAnalyzer.listMinimalImplications(g).map(([x, y, given]) => ({
          x,
          y,
          given: given && given.length > 0 ? given[0].map((v) => v.id) : [],
        })),
      [],
    ),
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
    totalEffect: null,
    directEffect: null,
    instruments: [],
    implications: [],
  };
}
