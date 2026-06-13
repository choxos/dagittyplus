import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { analyze } from "./lib/engine";
import {
  CANVAS,
  exampleModel,
  parse,
  serialize,
  type DagModel,
  type Role,
} from "./lib/dag";
import { loadExamples } from "./lib/examples";
import {
  addEdge,
  addNode,
  autoLayout,
  moveNode,
  removeNode,
  renameNode,
  toggleRole,
  type Tab,
  type Tool,
} from "./lib/model-ops";
import Header from "./components/Header";
import ToolRail from "./components/ToolRail";
import Canvas from "./components/Canvas";
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
  const [zoom, setZoom] = useState(1);
  const [estimand, setEstimand] = useState<Estimand>("total");

  // Code tab draft, kept in sync with the model unless the user is editing it.
  const [codeDraft, setCodeDraft] = useState("");
  const [codeDirty, setCodeDirty] = useState(false);
  const [codeError, setCodeError] = useState<string | null>(null);

  const [modal, setModal] = useState<null | "load" | "about">(null);
  const [loadDraft, setLoadDraft] = useState("");
  const [loadError, setLoadError] = useState<string | null>(null);

  const examples = useMemo(() => loadExamples(), []);

  // Serialize once, analyze once; everything downstream reads from these.
  const code = useMemo(() => serialize(model), [model]);
  const analysis = useMemo(() => analyze(code), [code]);

  // Keep the Code tab in sync when the model changes and there are no unsaved edits.
  useEffect(() => {
    if (!codeDirty) setCodeDraft(code);
  }, [code, codeDirty]);

  // Apply theme to <html>.
  useEffect(() => {
    document.documentElement.dataset.theme = theme;
  }, [theme]);

  const selected = useMemo(
    () => model.nodes.find((n) => n.id === selectedId) ?? null,
    [model, selectedId],
  );

  /* ----------------------------------------------------------- model edits */

  const replaceModel = useCallback((next: DagModel, keepSelection = true) => {
    setModel(next);
    setCodeDirty(false);
    setCodeError(null);
    if (!keepSelection) setSelectedId(null);
  }, []);

  const handleAddNodeAt = useCallback(
    (x: number, y: number) => {
      setModel((m) => {
        const before = new Set(m.nodes.map((n) => n.id));
        const next = addNode(m, x, y);
        const created = next.nodes.find((n) => !before.has(n.id));
        if (created) setSelectedId(created.id);
        return next;
      });
    },
    [],
  );

  const handleDeleteNode = useCallback((id: string) => {
    setModel((m) => removeNode(m, id));
    setSelectedId((cur) => (cur === id ? null : cur));
  }, []);

  const handleToggleRole = useCallback((id: string, role: Role) => {
    setModel((m) => toggleRole(m, id, role));
  }, []);

  const handleRename = useCallback(
    (id: string) => {
      const next = window.prompt("Rename variable", id);
      if (next === null) return;
      const name = next.trim();
      if (!name) return;
      if (model.nodes.some((n) => n.id === name && n.id !== id)) {
        window.alert(`A variable named "${name}" already exists.`);
        return;
      }
      setModel((m) => renameNode(m, id, name));
      setSelectedId((cur) => (cur === id ? name : cur));
    },
    [model],
  );

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

  const firstExampleOrStarter = useCallback(() => {
    if (examples.length > 0) loadExampleCode(examples[0].code);
    else loadExampleCode(serialize(exampleModel()));
  }, [examples, loadExampleCode]);

  /* -------------------------------------------------------------- zoom etc */

  const zoomIn = useCallback(() => setZoom((z) => Math.min(1.8, +(z + 0.15).toFixed(2))), []);
  const zoomOut = useCallback(() => setZoom((z) => Math.max(0.5, +(z - 0.15).toFixed(2))), []);
  const zoomReset = useCallback(() => setZoom(1), []);

  const startEmptyNode = useCallback(() => {
    setTool("node");
    handleAddNodeAt(CANVAS.width / 2, CANVAS.height / 2);
  }, [handleAddNodeAt]);

  /* ------------------------------------------------------------- keyboard */

  const stateRef = useRef({ selectedId, modal });
  stateRef.current = { selectedId, modal };

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
      const { selectedId: sel, modal: openModal } = stateRef.current;

      if (e.key === "Escape") {
        if (openModal) setModal(null);
        else setSelectedId(null);
        return;
      }
      if (openModal) return;

      // Tool shortcuts.
      const k = e.key.toLowerCase();
      if (k === "v") return setTool("select");
      if (k === "n") return setTool("node");
      if (k === "c") return setTool("edge");

      if (!sel) return;
      if (e.key === "Delete" || e.key === "Backspace") {
        e.preventDefault();
        handleDeleteNode(sel);
        return;
      }
      const roleKey: Record<string, Role> = { e: "exposure", o: "outcome", a: "adjusted", u: "latent" };
      if (roleKey[k]) {
        e.preventDefault();
        handleToggleRole(sel, roleKey[k]);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [handleDeleteNode, handleToggleRole]);

  /* ---------------------------------------------------------------- render */

  return (
    <>
      <Header
        theme={theme}
        onToggleTheme={() => setTheme((t) => (t === "dark" ? "light" : "dark"))}
        examples={examples}
        onNew={newModel}
        onLoadExample={loadExampleCode}
        onOpenLoad={() => {
          setLoadDraft(code);
          setLoadError(null);
          setModal("load");
        }}
        onExport={() => setModal("about")}
        onAbout={() => setModal("about")}
      />

      <div className="flex-1 flex min-h-0">
        <ToolRail
          tool={tool}
          onSelectTool={setTool}
          onAutoLayout={() => setModel((m) => autoLayout(m))}
          onFit={zoomReset}
          onHelp={() => setModal("about")}
        />
        <Canvas
          model={model}
          tool={tool}
          selectedId={selectedId}
          acyclic={analysis.acyclic}
          zoom={zoom}
          onZoomIn={zoomIn}
          onZoomOut={zoomOut}
          onZoomReset={zoomReset}
          onSelect={setSelectedId}
          onMoveNode={(id, x, y) => setModel((m) => moveNode(m, id, x, y))}
          onAddNodeAt={handleAddNodeAt}
          onAddEdge={(from, to) => setModel((m) => addEdge(m, from, to))}
          onDeleteNode={handleDeleteNode}
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
        />
      </div>

      <Footer acyclic={analysis.acyclic} variables={analysis.variables.length} edges={analysis.edges} />

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
            construction. PNG export and shareable links are coming soon.
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
    </>
  );
}
