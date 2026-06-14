import { type Analysis, type AdjustmentResult, type Implication } from "../lib/engine";
import { type DagNode, type Role } from "../lib/dag";
import { type Tab } from "../lib/model-ops";
import { CheckIcon, CopyIcon, RenameIcon, TargetIcon, TrashIcon, WarningIcon } from "./icons";

export type Estimand = "total" | "direct" | "instrument";

interface InspectorProps {
  tab: Tab;
  onTab: (t: Tab) => void;
  analysis: Analysis;
  selected: DagNode | null;
  estimand: Estimand;
  onEstimand: (e: Estimand) => void;
  onToggleRole: (id: string, role: Role) => void;
  onRename: (id: string) => void;
  onDelete: (id: string) => void;
  codeDraft: string;
  codeDirty: boolean;
  codeError: string | null;
  onCodeChange: (v: string) => void;
  onApplyCode: () => void;
  onRevertCode: () => void;
  onCopyCode: () => void;
}

const sectionLabel = "text-[11px] uppercase tracking-[0.6px] text-faint font-bold";
const card = "border border-line rounded-[12px] bg-bg";

const TABS: { id: Tab; label: string }[] = [
  { id: "inspect", label: "Inspect" },
  { id: "identify", label: "Identify" },
  { id: "implications", label: "Implications" },
  { id: "code", label: "Code" },
];

export default function Inspector(props: InspectorProps) {
  const { tab, onTab } = props;
  return (
    <aside className="flex-none w-[340px] border-l border-line bg-panel flex flex-col min-h-0">
      <div className="flex-none flex px-3 pt-2.5 gap-0.5 border-b border-line">
        {TABS.map((t) => {
          const active = tab === t.id;
          return (
            <button
              key={t.id}
              onClick={() => onTab(t.id)}
              aria-current={active}
              className={[
                "px-2.5 pb-2.5 pt-1.5 text-[13px] font-medium cursor-pointer bg-transparent border-b-2 -mb-px transition-colors",
                active ? "text-accent border-accent" : "text-dim border-transparent hover:text-text",
              ].join(" ")}
            >
              {t.label}
            </button>
          );
        })}
      </div>
      <div className="flex-1 overflow-y-auto p-4">
        {props.analysis.engineError && (
          <div
            className="mb-3 px-3 py-2.5 rounded-[9px] text-[12px]"
            style={{
              background: "color-mix(in srgb, var(--danger) 12%, transparent)",
              border: "1px solid color-mix(in srgb, var(--danger) 30%, transparent)",
              color: "var(--danger)",
            }}
          >
            The engine could not finish part of the analysis, so some results may be
            incomplete: {props.analysis.engineError}
          </div>
        )}
        {tab === "inspect" && <InspectTab {...props} />}
        {tab === "identify" && <IdentifyTab {...props} />}
        {tab === "implications" && <ImplicationsTab analysis={props.analysis} />}
        {tab === "code" && <CodeTab {...props} />}
      </div>
    </aside>
  );
}

/* ---------------------------------------------------------------- Inspect */

const ROLE_CHIPS: { role: Role; label: string; key: string }[] = [
  { role: "exposure", label: "Exposure", key: "E" },
  { role: "outcome", label: "Outcome", key: "O" },
  { role: "adjusted", label: "Adjusted", key: "A" },
  { role: "latent", label: "Unobserved", key: "U" },
  { role: "selected", label: "Selected", key: "S" },
];

function roleSummary(n: DagNode): string {
  const active = ROLE_CHIPS.filter((c) => n.roles[c.role]).map((c) => c.label.toLowerCase());
  return active.length ? active.join(" · ") : "no role assigned";
}

function InspectTab({ analysis, selected, onToggleRole, onRename, onDelete }: InspectorProps) {
  const stats = [
    { value: analysis.variables.length, label: "Variables", color: "var(--text)" },
    { value: analysis.edges, label: "Edges", color: "var(--text)" },
    { value: analysis.sources.length, label: "Exposure(s)", color: "var(--exposure)" },
    { value: analysis.targets.length, label: "Outcome(s)", color: "var(--outcome)" },
  ];

  return (
    <div>
      {selected ? (
        <div className="border border-line rounded-[14px] overflow-hidden mb-3.5">
          <div className="px-[15px] py-3.5 flex items-center gap-3 bg-bg border-b border-line">
            <RoleBadge node={selected} />
            <div className="min-w-0">
              <div className="font-sans font-semibold text-[15px] text-text truncate">
                Variable {selected.id}
              </div>
              <div className="text-[12px] text-dim">{roleSummary(selected)}</div>
            </div>
          </div>
          <div className="px-[15px] py-[13px]">
            <div className={`${sectionLabel} mb-2.5`}>Role</div>
            <div className="flex flex-wrap gap-[7px]">
              {ROLE_CHIPS.map((c) => {
                const on = !!selected.roles[c.role];
                return (
                  <button
                    key={c.role}
                    onClick={() => onToggleRole(selected.id, c.role)}
                    aria-pressed={on}
                    className={[
                      "flex items-center gap-1.5 px-2.5 h-8 rounded-full text-[12.5px] font-medium cursor-pointer border transition-colors",
                      on
                        ? "border-accent bg-accent-ghost text-text"
                        : "border-line bg-bg text-dim hover:text-text hover:border-accent",
                    ].join(" ")}
                  >
                    <span
                      className="w-1.5 h-1.5 rounded-full"
                      style={{ background: on ? "var(--accent)" : "var(--faint)" }}
                    />
                    {c.label}
                    <span className="opacity-50 text-[10px] ml-px">{c.key}</span>
                  </button>
                );
              })}
            </div>
            <div className="flex gap-2 mt-3.5">
              <button
                onClick={() => onRename(selected.id)}
                className="flex-1 h-9 rounded-[9px] border border-line bg-panel text-text text-[13px] font-medium cursor-pointer flex items-center justify-center gap-1.5 hover:border-accent hover:text-accent transition-colors"
              >
                <RenameIcon />
                Rename
              </button>
              <button
                onClick={() => onDelete(selected.id)}
                className="flex-1 h-9 rounded-[9px] border text-[13px] font-medium cursor-pointer flex items-center justify-center gap-1.5 transition-colors"
                style={{
                  borderColor: "color-mix(in srgb, var(--danger) 35%, transparent)",
                  background: "color-mix(in srgb, var(--danger) 12%, transparent)",
                  color: "var(--danger)",
                }}
              >
                <TrashIcon />
                Delete
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className={`${card} p-4 mb-3.5 text-[12.5px] text-dim leading-[1.5]`}>
          Select a variable on the canvas to edit its role, rename, or delete it. Use the tool rail
          to add variables and connections.
        </div>
      )}

      <div className={`${sectionLabel} mb-[9px] ml-0.5`}>Summary</div>
      <div className="grid grid-cols-2 gap-2">
        {stats.map((s) => (
          <div key={s.label} className={`${card} px-[13px] py-3`}>
            <div className="font-sans font-bold text-[20px] leading-none" style={{ color: s.color }}>
              {s.value}
            </div>
            <div className="text-[11.5px] text-dim mt-[5px]">{s.label}</div>
          </div>
        ))}
      </div>

      <div className={`${sectionLabel} mb-2 mt-4 ml-0.5`}>Structure</div>
      <div className="flex flex-col gap-2">
        <StructureRow
          label="Mediators"
          dot="var(--causal)"
          ids={analysis.mediators}
          note={
            analysis.sources.length === 1 && analysis.targets.length === 1
              ? undefined
              : "set one exposure and one outcome"
          }
        />
        <StructureRow
          label="Common causes"
          dot="var(--biasing)"
          ids={analysis.confounders}
          note={
            analysis.sources.length === 1 && analysis.targets.length === 1
              ? undefined
              : "set one exposure and one outcome"
          }
        />
        <StructureRow label="Colliders" dot="var(--neutral)" ids={analysis.colliders} />
      </div>
    </div>
  );
}

function StructureRow({
  label,
  dot,
  ids,
  note,
}: {
  label: string;
  dot: string;
  ids: string[];
  note?: string;
}) {
  return (
    <div className="rounded-[10px] border border-line bg-bg px-[13px] py-2.5">
      <div className="flex items-center gap-2 mb-1.5">
        <span className="w-2 h-2 rounded-full" style={{ background: dot }} />
        <span className="text-[12px] font-semibold text-text">{label}</span>
        <span className="text-[11px] text-faint ml-auto">{ids.length}</span>
      </div>
      {note ? (
        <div className="text-[11.5px] text-faint">{note}</div>
      ) : ids.length === 0 ? (
        <div className="text-[11.5px] text-faint">none</div>
      ) : (
        <div className="flex flex-wrap gap-1">
          {ids.map((id) => (
            <span
              key={id}
              className="px-2 py-0.5 rounded-full bg-panel border border-line text-[11.5px] font-mono text-text"
            >
              {id}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

function RoleBadge({ node }: { node: DagNode }) {
  const isExp = node.roles.exposure;
  const isOut = node.roles.outcome;
  const isAdj = node.roles.adjusted;
  const bg = isExp ? "var(--exposure)" : isOut ? "var(--outcome)" : "var(--panel)";
  const color = isExp || isOut ? "#fff" : "var(--text)";
  const borderWidth = isAdj ? "2.4px" : isExp || isOut ? "0" : "1.5px";
  const borderColor = isAdj ? "var(--text)" : "var(--line)";
  const borderStyle = node.roles.latent ? "dashed" : "solid";
  return (
    <span
      title={node.id}
      className="flex-none w-[42px] h-[42px] flex items-center justify-center font-sans font-bold text-[16px] overflow-hidden leading-none"
      style={{
        background: bg,
        color,
        borderWidth,
        borderColor,
        borderStyle,
        borderRadius: isAdj ? "9px" : "50%",
      }}
    >
      {node.id.length > 3 ? node.id.slice(0, 2) : node.id}
    </span>
  );
}

/* --------------------------------------------------------------- Identify */

const ESTIMANDS: { id: Estimand; label: string }[] = [
  { id: "total", label: "Total effect (adjustment)" },
  { id: "direct", label: "Direct effect (adjustment)" },
  { id: "instrument", label: "Instrumental variable" },
];

function formatSet(set: string[]): string {
  if (set.length === 0) return "{ } (no adjustment needed)";
  return `{ ${set.join(", ")} }`;
}

function StatusBox({
  kind,
  title,
  text,
}: {
  kind: "ok" | "prompt" | "bad";
  title: string;
  text: string;
}) {
  const color = kind === "ok" ? "var(--ok)" : kind === "prompt" ? "var(--accent)" : "var(--danger)";
  return (
    <div
      className="px-[15px] py-[13px] rounded-[12px] flex gap-[11px] items-start mb-4 border"
      style={{
        background: `color-mix(in srgb, ${color} 12%, transparent)`,
        borderColor: `color-mix(in srgb, ${color} 30%, transparent)`,
      }}
    >
      <span className="flex-none mt-px" style={{ color }}>
        {kind === "ok" ? <CheckIcon /> : <WarningIcon />}
      </span>
      <div>
        <div className="font-semibold text-[13.5px] text-text">{title}</div>
        <div className="text-[12.5px] text-dim mt-[3px] leading-[1.45]">{text}</div>
      </div>
    </div>
  );
}

function AdjustmentView({
  result,
  header,
}: {
  result: AdjustmentResult | null;
  header: string;
}) {
  const ok = result !== null && result.status !== "not-identifiable";
  const title = !result
    ? "Not identifiable"
    : result.status === "no-adjustment-needed"
      ? "Identifiable — no adjustment needed"
      : result.status === "identifiable"
        ? "Effect is identifiable"
        : "Not identifiable";
  const text = !result
    ? "The effect cannot be identified from this graph by covariate adjustment. There may be an open biasing path with no valid blocking set."
    : result.status === "no-adjustment-needed"
      ? "The exposure–outcome relationship is unconfounded; the effect can be read off directly."
      : result.status === "identifiable"
        ? "Adjusting for any of the sets below blocks all biasing paths while leaving the causal path open."
        : "The effect cannot be identified by covariate adjustment in this graph.";

  return (
    <>
      <StatusBox kind={ok ? "ok" : "bad"} title={title} text={text} />
      {result && result.sets.length > 0 && (
        <>
          <div className={`${sectionLabel} mb-[9px] ml-0.5`}>{header}</div>
          <div className="flex flex-col gap-2 mb-4">
            {result.sets.map((set, i) => (
              <div
                key={i}
                className={`${card} flex items-center gap-2.5 px-3.5 py-3`}
              >
                <span className="flex-none text-accent">
                  <TargetIcon />
                </span>
                <span className="font-mono text-[13.5px] text-text">{formatSet(set)}</span>
                <span className="ml-auto text-[11px] text-faint">
                  {set.length === 0 ? "empty set" : `${set.length} variable${set.length > 1 ? "s" : ""}`}
                </span>
              </div>
            ))}
          </div>
        </>
      )}
    </>
  );
}

function IdentifyTab({ analysis, estimand, onEstimand }: InspectorProps) {
  const hasEndpoints = analysis.sources.length > 0 && analysis.targets.length > 0;

  return (
    <div>
      <div className={`${sectionLabel} mb-[9px] ml-0.5`}>Estimand</div>
      <select
        value={estimand}
        onChange={(e) => onEstimand(e.target.value as Estimand)}
        className="w-full h-10 px-3 rounded-[10px] border border-line bg-bg text-text text-[13.5px] font-medium cursor-pointer mb-4"
      >
        {ESTIMANDS.map((e) => (
          <option key={e.id} value={e.id}>
            {e.label}
          </option>
        ))}
      </select>

      {!hasEndpoints ? (
        <StatusBox
          kind="prompt"
          title="Set an exposure and an outcome"
          text="Mark one variable as the exposure and one as the outcome (Inspect tab, or keys E and O) to analyze identification."
        />
      ) : !analysis.acyclic ? (
        <StatusBox
          kind="bad"
          title="Graph contains a cycle"
          text="Identification requires an acyclic graph. Remove the cycle to continue."
        />
      ) : estimand === "total" ? (
        <AdjustmentView result={analysis.totalEffect} header="Minimal sufficient adjustment sets" />
      ) : estimand === "direct" ? (
        <AdjustmentView result={analysis.directEffect} header="Minimal sufficient adjustment sets" />
      ) : (
        <InstrumentsView analysis={analysis} />
      )}
    </div>
  );
}

function InstrumentsView({ analysis }: { analysis: Analysis }) {
  if (analysis.instruments.length === 0) {
    return (
      <StatusBox
        kind="bad"
        title="No instruments found"
        text="No (conditional) instrumental variable was found for this exposure–outcome pair in the current graph."
      />
    );
  }
  return (
    <>
      <div className={`${sectionLabel} mb-[9px] ml-0.5`}>Instrumental variables</div>
      <div className="flex flex-col gap-2">
        {analysis.instruments.map((iv) => (
          <div key={iv.name} className={`${card} flex items-center gap-[11px] px-3.5 py-3`}>
            <span className="flex-none w-[30px] h-[30px] rounded-[9px] bg-accent-ghost flex items-center justify-center font-sans font-bold text-[14px] text-accent">
              {iv.name}
            </span>
            <div className="min-w-0">
              <div className="text-[13px] font-semibold text-text">Instrument {iv.name}</div>
              <div className="text-[11.5px] text-dim mt-px">
                {iv.conditioning.length === 0
                  ? "unconditional"
                  : `conditional on { ${iv.conditioning.join(", ")} }`}
              </div>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}

/* ----------------------------------------------------------- Implications */

/**
 * engine.ts types Implication.given as string[], but the underlying
 * listMinimalImplications() leaves Vertex objects in that slot, so each element
 * may be a { id } object instead of a bare string. Read the id either way.
 */
function givenIds(given: Implication["given"]): string[] {
  return given.map((v) => (typeof v === "string" ? v : (v as { id?: string }).id ?? String(v)));
}

function ImplicationsTab({ analysis }: { analysis: Analysis }) {
  const list = analysis.implications;
  return (
    <div>
      <div className="text-[12.5px] text-dim leading-[1.5] mb-3.5">
        The model implies the following conditional independencies. Each can be checked against your
        data to test the DAG.
      </div>
      {list.length > 0 ? (
        <>
          <div className="flex flex-col gap-2">
            {list.map((im, i) => {
              const given = givenIds(im.given);
              return (
                <div key={i} className={`${card} flex items-center gap-[11px] px-3.5 py-3`}>
                  <span className="flex-none w-[22px] h-[22px] rounded-[7px] bg-accent-ghost flex items-center justify-center text-accent">
                    <CheckIcon size={13} />
                  </span>
                  <span className="font-mono text-[13px] text-text">
                    {im.x} ⫫ {im.y}
                    {given.length > 0 ? ` | ${given.join(", ")}` : ""}
                  </span>
                </div>
              );
            })}
          </div>
          <div className="mt-3.5 text-[11.5px] text-faint">
            {list.length} testable implication{list.length > 1 ? "s" : ""} · symbol ⫫ denotes
            independence
          </div>
        </>
      ) : (
        <div className="p-4 border border-dashed border-line rounded-[12px] text-center text-[12.5px] text-faint">
          No testable implications — the model is either saturated or not a valid DAG.
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------- Code */

function CodeTab({
  codeDraft,
  codeDirty,
  codeError,
  onCodeChange,
  onApplyCode,
  onRevertCode,
  onCopyCode,
}: InspectorProps) {
  const dotColor = codeError ? "var(--danger)" : codeDirty ? "var(--accent)" : "var(--ok)";
  const status = codeError ? "error" : codeDirty ? "unsaved edits" : "live";

  return (
    <div>
      <div className="flex items-center justify-between mb-[9px]">
        <div className={sectionLabel}>Model code</div>
        <span className="flex items-center gap-1.5 text-[11px] font-semibold" style={{ color: dotColor }}>
          <span className="w-1.5 h-1.5 rounded-full" style={{ background: dotColor }} />
          {status}
        </span>
      </div>
      <textarea
        value={codeDraft}
        onChange={(e) => onCodeChange(e.target.value)}
        spellCheck={false}
        className="w-full h-[280px] resize-y p-3.5 rounded-[12px] border border-line bg-bg text-text font-mono text-[12.5px] leading-[1.65] outline-none focus:border-accent transition-colors"
      />
      {codeError && (
        <div
          className="mt-2 px-3 py-2.5 rounded-[9px] text-[12px]"
          style={{
            background: "color-mix(in srgb, var(--danger) 12%, transparent)",
            border: "1px solid color-mix(in srgb, var(--danger) 30%, transparent)",
            color: "var(--danger)",
          }}
        >
          {codeError}
        </div>
      )}
      <div className="flex gap-2 mt-2.5">
        {codeDirty ? (
          <>
            <button
              onClick={onApplyCode}
              className="flex-1 h-[38px] rounded-[9px] border-none bg-accent text-white text-[13px] font-semibold cursor-pointer flex items-center justify-center gap-[7px] hover:brightness-110 transition"
            >
              <CheckIcon size={14} />
              Update diagram
            </button>
            <button
              onClick={onRevertCode}
              className="h-[38px] px-3.5 rounded-[9px] border border-line bg-panel text-dim text-[13px] font-medium cursor-pointer hover:border-accent hover:text-text transition-colors"
            >
              Revert
            </button>
          </>
        ) : (
          <button
            onClick={onCopyCode}
            className="flex-1 h-[38px] rounded-[9px] border border-line bg-panel text-text text-[13px] font-semibold cursor-pointer flex items-center justify-center gap-[7px] hover:border-accent hover:text-accent transition-colors"
          >
            <CopyIcon />
            Copy code
          </button>
        )}
      </div>
      <div className={`${card} mt-3.5 px-3.5 py-3 text-[12px] text-dim leading-[1.5]`}>
        Edit this <span className="font-mono text-text">dagitty</span> code and press{" "}
        <b className="text-text">Update diagram</b> to rebuild the graph, or paste output from the R{" "}
        <span className="font-mono text-text">dagitty()</span> function to import a model.
      </div>
    </div>
  );
}
