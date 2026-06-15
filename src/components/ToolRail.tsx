import { type ReactNode } from "react";
import { type Tool } from "../lib/model-ops";
import {
  AddEdgeIcon,
  AddNodeIcon,
  DeleteToolIcon,
  FitIcon,
  LayoutIcon,
  SelectIcon,
} from "./icons";

interface ToolRailProps {
  tool: Tool;
  onSelectTool: (t: Tool) => void;
  onAutoLayout: () => void;
  onFit: () => void;
  onHelp: () => void;
}

interface ToolDef {
  id: Tool;
  title: string;
  icon: ReactNode;
  /** Momentary actions (layout/fit) fire immediately and don't stay active. */
  action?: boolean;
}

export default function ToolRail({
  tool,
  onSelectTool,
  onAutoLayout,
  onFit,
  onHelp,
}: ToolRailProps) {
  const tools: ToolDef[] = [
    { id: "select", title: "Select & move (V)", icon: <SelectIcon /> },
    { id: "node", title: "Add variable (N)", icon: <AddNodeIcon /> },
    { id: "edge", title: "Add connection (C)", icon: <AddEdgeIcon /> },
    { id: "delete", title: "Delete (X)", icon: <DeleteToolIcon /> },
    { id: "layout", title: "Auto-layout", icon: <LayoutIcon />, action: true },
    { id: "fit", title: "Reset font size", icon: <FitIcon />, action: true },
  ];

  const handle = (t: ToolDef) => {
    if (t.id === "layout") return onAutoLayout();
    if (t.id === "fit") return onFit();
    onSelectTool(t.id);
  };

  return (
    <aside className="flex-none w-[60px] bg-panel border-r border-line flex flex-col items-center py-3 gap-1.5 z-20">
      {tools.map((t) => {
        const active = !t.action && tool === t.id;
        return (
          <button
            key={t.id}
            onClick={() => handle(t)}
            title={t.title}
            aria-label={t.title}
            aria-pressed={active}
            className={[
              "w-10 h-10 rounded-[11px] flex items-center justify-center cursor-pointer transition-colors border",
              active
                ? "bg-accent-ghost text-accent border-accent"
                : "bg-transparent text-dim border-transparent hover:text-text hover:bg-bg",
            ].join(" ")}
          >
            {t.icon}
          </button>
        );
      })}
      <div className="flex-1" />
      <button
        onClick={onHelp}
        title="About"
        aria-label="About"
        className="w-10 h-10 rounded-[11px] border border-line bg-transparent text-dim cursor-pointer flex items-center justify-center font-semibold hover:text-text hover:border-accent transition-colors"
      >
        ?
      </button>
    </aside>
  );
}
