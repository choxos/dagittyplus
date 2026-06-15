import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { analyze } from "./lib/engine";
import {
  BASE_FONT_PX,
  CANVAS,
  exampleModel,
  parse,
  serialize,
  type DagModel,
  type EdgeType,
  type Role,
} from "./lib/dag";
import { loadExamples } from "./lib/examples";
import {
  exportPNG,
  exportSVG,
  type PngExportOptions,
  type SvgExportOptions,
} from "./lib/export";
import {
  addEdge,
  addNode,
  autoLayout,
  deleteEdge,
  moveNode,
  removeNode,
  renameNode,
  reverseEdge,
  setEdgeType,
  toggleRole,
  type Tab,
  type Tool,
} from "./lib/model-ops";
import Header from "./components/Header";
import ToolRail from "./components/ToolRail";
import Canvas, { type SelectedEdge } from "./components/Canvas";
import Inspector, { type Estimand } from "./components/Inspector";
import Footer from "./components/Footer";
import Modal from "./components/Modal";

type Theme = "light" | "dark";

function initialTheme(): Theme {
  if (typeof window !== "undefined" && window.matchMedia) {
    return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  }
  return "light";
}

export default function App() {
  const [model, setModel] = useState<DagModel>(() => {
    try {
      return exampleModel();
    } catch {
      return { nodes: [], edges: [] };
    }
  });
  const [theme, setTheme] = useState<Theme>(initialTheme);
  const [tool, setTool] = useState<Tool>("select");
  const [tab, setTab] = useState<Tab>("inspect");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [selectedEdge, setSelectedEdge] = useState<SelectedEdge | null>(null);
  const [fontSize, setFontSize] = useState(BASE_FONT_PX);
  const [estimand, setEstimand] = useState<Estimand>("total");

  // The analysis panel is a static column on desktop and a slide-over drawer
  // below the lg breakpoint, where a fixed-width sidebar would crowd the canvas.
  // The drawer only opens when the user taps its tab, so it never covers the
  // diagram while editing nodes.
  const [inspectorOpen, setInspectorOpen] = useState(false);

  // Code tab draft, kept in sync with the model unless the user is editing it.
  const [codeDraft, setCodeDraft] = useState("");
  const [codeDirty, setCodeDirty] = useState(false);
  const [codeError, setCodeError] = useState<string | null>(null);

  const [modal, setModal] = useState<null | "load" | "about">(null);
  const [loadDraft, setLoadDraft] = useState("");
  const [loadError, setLoadError] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [projectName, setProjectName] = useState("Untitled");

  // In-app rename dialog (replaces the browser prompt).
  const [renameId, setRenameId] = useState<string | null>(null);
  const [renameDraft, setRenameDraft] = useState("");
  const [renameError, setRenameError] = useState<string | null>(null);

  const svgRef = useRef<SVGSVGElement>(null);
  const examples = useMemo(() => loadExamples(), []);

  // Serialize once, analyze once; everything downstream reads from these.
  const code = useMemo(() => serialize(model), [model]);
  const analysis = useMemo(() => analyze(code), [code]);

  // True when running inside the bundled Shiny app's iframe; enables a button
  // that pushes the model straight into the R Analyze tab (cross-origin access
  // to window.top throws, which also means we are embedded).
  const embedded = useMemo(() => {
    try {
      return window.self !== window.top;
    } catch {
      return true;
    }
  }, []);

  // Keep the Code tab in sync when the model changes and there are no unsaved edits.
  useEffect(() => {
    if (!codeDirty) setCodeDraft(code);
  }, [code, codeDirty]);

  // Apply theme to <html>.
  useEffect(() => {
    document.documentElement.dataset.theme = theme;
  }, [theme]);

  // Auto-dismiss the toast.
  useEffect(() => {
    if (!toast) return;
    const id = window.setTimeout(() => setToast(null), 3200);
    return () => window.clearTimeout(id);
  }, [toast]);

  const selected = useMemo(
    () => model.nodes.find((n) => n.id === selectedId) ?? null,
    [model, selectedId],
  );

  /* -------------------------------------------------------------- selection */

  // Selecting a node (or clearing) drops any edge selection.
  const selectNode = useCallback((id: string | null) => {
    setSelectedId(id);
    setSelectedEdge(null);
  }, []);

  // Selecting an edge drops the node selection so only one toolbar shows.
  const selectEdge = useCallback((edge: SelectedEdge | null) => {
    setSelectedEdge(edge);
    if (edge) setSelectedId(null);
  }, []);

  /* ----------------------------------------------------------- model edits */

  const replaceModel = useCallback((next: DagModel, keepSelection = true) => {
    setModel(next);
    setCodeDirty(false);
    setCodeError(null);
    if (!keepSelection) {
      setSelectedId(null);
      setSelectedEdge(null);
    }
  }, []);

  const handleAddNodeAt = useCallback((x: number, y: number) => {
    setModel((m) => {
      const before = new Set(m.nodes.map((n) => n.id));
      const next = addNode(m, x, y);
      const created = next.nodes.find((n) => !before.has(n.id));
      if (created) {
        setSelectedId(created.id);
        setSelectedEdge(null);
      }
      return next;
    });
  }, []);

  const handleDeleteNode = useCallback((id: string) => {
    setModel((m) => removeNode(m, id));
    setSelectedId((cur) => (cur === id ? null : cur));
    setSelectedEdge((cur) => (cur && (cur.from === id || cur.to === id) ? null : cur));
  }, []);

  const handleToggleRole = useCallback((id: string, role: Role) => {
    setModel((m) => toggleRole(m, id, role));
  }, []);

  // Opening the rename dialog needs only the id; validation happens on commit.
  const handleRename = useCallback((id: string) => {
    setRenameId(id);
    setRenameDraft(id);
    setRenameError(null);
  }, []);

  const commitRename = useCallback(() => {
    if (renameId === null) return;
    const name = renameDraft.trim();
    if (!name) {
      setRenameError("Enter a variable name.");
      return;
    }
    if (name !== renameId && model.nodes.some((n) => n.id === name)) {
      setRenameError(`A variable named "${name}" already exists.`);
      return;
    }
    const id = renameId;
    setModel((m) => renameNode(m, id, name));
    setSelectedId((cur) => (cur === id ? name : cur));
    setSelectedEdge((cur) =>
      cur ? { from: cur.from === id ? name : cur.from, to: cur.to === id ? name : cur.to } : cur,
    );
    setRenameId(null);
    setRenameError(null);
  }, [renameId, renameDraft, model]);

  const handleAddEdge = useCallback((from: string, to: string) => {
    setModel((m) => addEdge(m, from, to));
  }, []);

  const handleDeleteEdge = useCallback((from: string, to: string) => {
    setModel((m) => deleteEdge(m, from, to));
    setSelectedEdge((cur) => (cur && cur.from === from && cur.to === to ? null : cur));
  }, []);

  const handleReverseEdge = useCallback((from: string, to: string) => {
    setModel((m) => reverseEdge(m, from, to));
    // After a flip the selected edge points the other way; track it.
    setSelectedEdge((cur) =>
      cur && cur.from === from && cur.to === to ? { from: to, to: from } : cur,
    );
  }, []);

  const handleSetEdgeType = useCallback((from: string, to: string, type: EdgeType) => {
    setModel((m) => setEdgeType(m, from, to, type));
  }, []);

  /* ----------------------------------------------------------- code / load */

  const applyCode = useCallback(() => {
    try {
      const next = parse(codeDraft);
      replaceModel(next, false);
    } catch (e) {
      setCodeError((e as Error).message || "Could not parse the model code.");
    }
  }, [codeDraft, replaceModel]);

  const revertCode = useCallback(() => {
    setCodeDraft(code);
    setCodeDirty(false);
    setCodeError(null);
  }, [code]);

  const copyCode = useCallback(() => {
    navigator.clipboard?.writeText(code).catch(() => {});
  }, [code]);

  const onCodeChange = useCallback(
    (v: string) => {
      setCodeDraft(v);
      setCodeDirty(v !== code);
      setCodeError(null);
    },
    [code],
  );

  const loadExampleCode = useCallback(
    (exampleCode: string) => {
      try {
        replaceModel(parse(exampleCode), false);
      } catch {
        // Fall back to the built-in starter if an example fails to parse.
        try {
          replaceModel(exampleModel(), false);
        } catch {
          replaceModel({ nodes: [], edges: [] }, false);
        }
      }
    },
    [replaceModel],
  );

  const doLoadFromModal = useCallback(() => {
    try {
      const next = parse(loadDraft);
      replaceModel(next, false);
      setModal(null);
      setLoadError(null);
    } catch (e) {
      setLoadError((e as Error).message || "Could not parse the model code.");
    }
  }, [loadDraft, replaceModel]);

  const newModel = useCallback(() => replaceModel({ nodes: [], edges: [] }, false), [replaceModel]);

  const openLoad = useCallback(() => {
    setLoadDraft(code);
    setLoadError(null);
    setModal("load");
  }, [code]);

  const firstExampleOrStarter = useCallback(() => {
    if (examples.length > 0) loadExampleCode(examples[0].code);
    else loadExampleCode(serialize(exampleModel()));
  }, [examples, loadExampleCode]);

  /* ----------------------------------------------------------------- export */

  // Filenames use the project name: "Untitled_DAG.png", "MyStudy_DAG.svg", ...
  const fileBase = useCallback(
    () => (projectName.trim() || "Untitled").replace(/[^A-Za-z0-9._-]+/g, "_"),
    [projectName],
  );

  const doExportPNG = useCallback(
    (options: PngExportOptions) => {
      const svg = svgRef.current;
      if (!svg) {
        setToast("Nothing to export yet.");
        return;
      }
      exportPNG(svg, `${fileBase()}_DAG.png`, options).catch(() => {
        setToast("Could not export the PNG. Try the SVG option instead.");
      });
    },
    [fileBase],
  );

  const doExportSVG = useCallback(
    (options: SvgExportOptions) => {
      const svg = svgRef.current;
      if (!svg) {
        setToast("Nothing to export yet.");
        return;
      }
      exportSVG(svg, `${fileBase()}_DAG.svg`, options);
    },
    [fileBase],
  );

  // Hand the current model to the embedding Shiny app, which fills its Analyze
  // tab and switches to it. A no-op outside an iframe.
  const sendToR = useCallback(() => {
    window.parent?.postMessage({ source: "dagittyplus-editor", type: "model", code }, "*");
    setToast("Sent to the Analyze tab.");
  }, [code]);

  /* ---------------------------------------------------------- font size etc */

  // The control sets the node-label font size in pixels (1 to 100). It scales the
  // node and label sizes only; node positions stay put, so smaller fonts still
  // use the whole canvas instead of shrinking the layout.
  const FONT_MIN = 1;
  const FONT_MAX = 100;
  const setFont = useCallback(
    (px: number) =>
      setFontSize(() => (Number.isFinite(px) ? Math.max(FONT_MIN, Math.min(FONT_MAX, Math.round(px))) : BASE_FONT_PX)),
    [],
  );
  const fontInc = useCallback(() => setFontSize((f) => Math.min(FONT_MAX, f + 1)), []);
  const fontDec = useCallback(() => setFontSize((f) => Math.max(FONT_MIN, f - 1)), []);
  const fontReset = useCallback(() => setFontSize(BASE_FONT_PX), []);

  const startEmptyNode = useCallback(() => {
    setTool("node");
    handleAddNodeAt(CANVAS.width / 2, CANVAS.height / 2);
  }, [handleAddNodeAt]);

  const handleAutoLayout = useCallback(() => setModel((m) => autoLayout(m)), []);

  /* ------------------------------------------------------------- keyboard */

  const stateRef = useRef({ selectedId, selectedEdge, modal });
  stateRef.current = { selectedId, selectedEdge, modal };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      const typing =
        target &&
        (target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.tagName === "SELECT" ||
          target.isContentEditable);
      if (typing) return;
      const { selectedId: sel, selectedEdge: selEdge, modal: openModal } = stateRef.current;

      if (e.key === "Escape") {
        // Canvas handles cancelling a pending edge / closing its menu itself.
        if (openModal) setModal(null);
        else {
          setSelectedId(null);
          setSelectedEdge(null);
        }
        return;
      }
      if (openModal) return;

      // Tool shortcuts.
      const k = e.key.toLowerCase();
      if (k === "v") return setTool("select");
      if (k === "n") return setTool("node");
      if (k === "c") return setTool("edge");

      if (e.key === "Delete" || e.key === "Backspace") {
        if (selEdge) {
          e.preventDefault();
          handleDeleteEdge(selEdge.from, selEdge.to);
          return;
        }
        if (sel) {
          e.preventDefault();
          handleDeleteNode(sel);
          return;
        }
        return;
      }

      if (!sel) return;
      const roleKey: Record<string, Role> = {
        e: "exposure",
        o: "outcome",
        a: "adjusted",
        u: "latent",
        s: "selected",
      };
      if (roleKey[k]) {
        e.preventDefault();
        handleToggleRole(sel, roleKey[k]);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [handleDeleteNode, handleDeleteEdge, handleToggleRole]);

  /* ---------------------------------------------------------------- render */

  return (
    <>
      <Header
        theme={theme}
        onToggleTheme={() => setTheme((t) => (t === "dark" ? "light" : "dark"))}
        onSendToR={embedded ? sendToR : undefined}
        projectName={projectName}
        onRenameProject={setProjectName}
        onNew={newModel}
        onLoadExample={loadExampleCode}
        onOpenLoad={openLoad}
        onExportPNG={doExportPNG}
        onExportSVG={doExportSVG}
        onAbout={() => setModal("about")}
      />

      <div className="flex-1 flex min-h-0 relative overflow-hidden">
        <ToolRail
          tool={tool}
          onSelectTool={setTool}
          onAutoLayout={handleAutoLayout}
          onFit={fontReset}
          onHelp={() => setModal("about")}
        />
        <Canvas
          svgRef={svgRef}
          model={model}
          tool={tool}
          selectedId={selectedId}
          selectedEdge={selectedEdge}
          acyclic={analysis.acyclic}
          fontSize={fontSize}
          onFontInc={fontInc}
          onFontDec={fontDec}
          onFontReset={fontReset}
          onFontSet={setFont}
          onSelect={selectNode}
          onSelectEdge={selectEdge}
          onMoveNode={(id, x, y) => setModel((m) => moveNode(m, id, x, y))}
          onAddNodeAt={handleAddNodeAt}
          onAddEdge={handleAddEdge}
          onDeleteNode={handleDeleteNode}
          onToggleRole={handleToggleRole}
          onRename={handleRename}
          onDeleteEdge={handleDeleteEdge}
          onReverseEdge={handleReverseEdge}
          onSetEdgeType={handleSetEdgeType}
          onAutoLayout={handleAutoLayout}
          onFit={fontReset}
          onOpenLoad={openLoad}
          onStartEmpty={startEmptyNode}
          onLoadExample={firstExampleOrStarter}
        />
        <Inspector
          tab={tab}
          onTab={setTab}
          analysis={analysis}
          selected={selected}
          estimand={estimand}
          onEstimand={setEstimand}
          onToggleRole={handleToggleRole}
          onRename={handleRename}
          onDelete={handleDeleteNode}
          codeDraft={codeDraft}
          codeDirty={codeDirty}
          codeError={codeError}
          onCodeChange={onCodeChange}
          onApplyCode={applyCode}
          onRevertCode={revertCode}
          onCopyCode={copyCode}
          open={inspectorOpen}
          onClose={() => setInspectorOpen(false)}
        />

        {/* Drawer backdrop (mobile/tablet only). */}
        {inspectorOpen && (
          <button
            type="button"
            aria-label="Close analysis panel"
            onClick={() => setInspectorOpen(false)}
            className="lg:hidden absolute inset-0 z-20 bg-black/35 border-none cursor-default"
          />
        )}

        {/* Edge tab that opens the drawer (mobile/tablet only). */}
        {!inspectorOpen && (
          <button
            type="button"
            onClick={() => setInspectorOpen(true)}
            aria-label="Open analysis panel"
            className="lg:hidden absolute top-1/2 right-0 -translate-y-1/2 z-[15] flex items-center justify-center w-9 h-16 rounded-l-[14px] bg-accent text-white shadow-panel border-none cursor-pointer"
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M15 6l-6 6 6 6" />
            </svg>
          </button>
        )}
      </div>

      <Footer acyclic={analysis.acyclic} variables={analysis.variables.length} edges={analysis.edges} />

      {toast && (
        <div className="fixed left-1/2 bottom-6 z-[120] -translate-x-1/2 px-4 py-2.5 rounded-[10px] bg-panel border border-line shadow-panel text-[13px] font-medium text-text">
          {toast}
        </div>
      )}

      {modal === "load" && (
        <Modal title="Load model" width={560} onClose={() => setModal(null)}>
          {examples.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-3.5">
              {examples.slice(0, 10).map((ex) => (
                <button
                  key={ex.name}
                  title={ex.name}
                  onClick={() => setLoadDraft(ex.code)}
                  className="px-[13px] py-[7px] rounded-full border border-line bg-bg text-text text-[12.5px] font-medium cursor-pointer hover:border-accent hover:text-accent transition-colors"
                >
                  {ex.name}
                </button>
              ))}
            </div>
          )}
          <textarea
            value={loadDraft}
            onChange={(e) => {
              setLoadDraft(e.target.value);
              setLoadError(null);
            }}
            spellCheck={false}
            placeholder="dag { X -> Y }"
            className="w-full h-[200px] resize-y p-3.5 rounded-[12px] border border-line bg-bg text-text font-mono text-[12.5px] leading-[1.6] outline-none focus:border-accent transition-colors"
          />
          {loadError && (
            <div
              className="mt-2 px-3 py-2.5 rounded-[9px] text-[12px]"
              style={{
                background: "color-mix(in srgb, var(--danger) 12%, transparent)",
                border: "1px solid color-mix(in srgb, var(--danger) 30%, transparent)",
                color: "var(--danger)",
              }}
            >
              {loadError}
            </div>
          )}
          <div className="flex justify-end gap-2 mt-4">
            <button
              onClick={() => setModal(null)}
              className="h-[38px] px-4 rounded-[9px] border border-line bg-panel text-text text-[13px] font-medium cursor-pointer hover:border-accent transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={doLoadFromModal}
              className="h-[38px] px-[18px] rounded-[9px] border-none bg-accent text-white text-[13px] font-semibold cursor-pointer hover:brightness-110 transition"
            >
              Load model
            </button>
          </div>
        </Modal>
      )}

      {modal === "about" && (
        <Modal title="About DAGitty+" width={420} onClose={() => setModal(null)}>
          <p className="text-[13.5px] text-dim leading-[1.6] mb-3">
            DAGitty+ is a browser editor for drawing causal directed acyclic graphs (DAGs) and
            analyzing them: confounding, minimal adjustment sets, instrumental variables, and the
            testable conditional-independence implications of your model.
          </p>
          <p className="text-[13px] text-faint leading-[1.6] mb-4">
            Analysis runs through the same engine as the{" "}
            <span className="font-mono text-text">dagittyplus</span> R package, so results agree by
            construction.
          </p>
          <div className="flex justify-end">
            <button
              onClick={() => setModal(null)}
              className="h-[38px] px-[22px] rounded-[9px] border-none bg-accent text-white text-[13px] font-semibold cursor-pointer hover:brightness-110 transition"
            >
              Close
            </button>
          </div>
        </Modal>
      )}

      {renameId !== null && (
        <Modal title="Rename variable" width={380} onClose={() => setRenameId(null)}>
          <label className="block text-[12px] text-dim mb-1.5">Variable name</label>
          <input
            autoFocus
            value={renameDraft}
            onChange={(e) => {
              setRenameDraft(e.target.value);
              setRenameError(null);
            }}
            onFocus={(e) => e.target.select()}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                commitRename();
              }
            }}
            spellCheck={false}
            placeholder="e.g. Smoking"
            className="w-full h-[40px] px-3 rounded-[10px] border border-line bg-bg text-text text-[13.5px] outline-none focus:border-accent transition-colors"
          />
          {renameError && (
            <div
              className="mt-2 px-3 py-2.5 rounded-[9px] text-[12px]"
              style={{
                background: "color-mix(in srgb, var(--danger) 12%, transparent)",
                border: "1px solid color-mix(in srgb, var(--danger) 30%, transparent)",
                color: "var(--danger)",
              }}
            >
              {renameError}
            </div>
          )}
          <div className="flex justify-end gap-2 mt-4">
            <button
              onClick={() => setRenameId(null)}
              className="h-[38px] px-4 rounded-[9px] border border-line bg-panel text-text text-[13px] font-medium cursor-pointer hover:border-accent transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={commitRename}
              className="h-[38px] px-[18px] rounded-[9px] border-none bg-accent text-white text-[13px] font-semibold cursor-pointer hover:brightness-110 transition"
            >
              Rename
            </button>
          </div>
        </Modal>
      )}
    </>
  );
}
