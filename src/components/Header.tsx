import { useEffect, useRef, useState } from "react";
import { examplesByField } from "../lib/examples";
import { ExportIcon, LogoMark, MoonIcon, SunIcon } from "./icons";
import ExportMenu from "./ExportMenu";
import { type PngExportOptions, type SvgExportOptions } from "../lib/export";

interface MenuItem {
  label: string;
  sub: string;
  onClick: () => void;
}

interface HeaderProps {
  theme: "light" | "dark";
  onToggleTheme: () => void;
  projectName: string;
  onRenameProject: (name: string) => void;
  onNew: () => void;
  onLoadExample: (code: string) => void;
  onOpenLoad: () => void;
  onExportPNG: (options: PngExportOptions) => void;
  onExportSVG: (options: SvgExportOptions) => void;
  onAbout: () => void;
}

const menuBtn =
  "px-3 h-[34px] rounded-[9px] text-[13px] font-medium text-dim bg-transparent hover:bg-bg hover:text-text transition-colors cursor-pointer";

function Menu({ label, items }: { label: string; items: MenuItem[] }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [open]);

  return (
    <div className="relative" ref={ref}>
      <button className={menuBtn} onClick={() => setOpen((o) => !o)} aria-expanded={open}>
        {label}
      </button>
      {open && (
        <div className="absolute top-10 left-0 min-w-[236px] bg-panel border border-line rounded-[13px] shadow-panel p-1.5 z-50">
          {items.map((it) => (
            <button
              key={it.label}
              onClick={() => {
                setOpen(false);
                it.onClick();
              }}
              className="block w-full text-left border-none bg-transparent px-2.5 py-2 rounded-lg hover:bg-bg cursor-pointer transition-colors"
            >
              <span className="block text-[13px] font-medium text-text">{it.label}</span>
              <span className="block text-[11px] text-faint mt-px">{it.sub}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/** Examples menu, grouped by field with section headers and a scrollable body. */
function ExamplesMenu({ onLoadExample }: { onLoadExample: (code: string) => void }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const groups = examplesByField();

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [open]);

  return (
    <div className="relative" ref={ref}>
      <button className={menuBtn} onClick={() => setOpen((o) => !o)} aria-expanded={open}>
        Examples
      </button>
      {open && (
        <div className="absolute top-10 left-0 min-w-[244px] max-h-[360px] overflow-y-auto bg-panel border border-line rounded-[13px] shadow-panel p-1.5 z-50">
          {groups.length === 0 ? (
            <div className="px-2.5 py-2 text-[12px] text-faint">No examples available.</div>
          ) : (
            groups.map((group) => (
              <div key={group.field}>
                <div className="px-2.5 pt-2 pb-1 text-[10.5px] uppercase tracking-[0.6px] text-faint font-bold">
                  {group.field}
                </div>
                {group.items.map((ex) => (
                  <button
                    key={ex.name}
                    onClick={() => {
                      setOpen(false);
                      onLoadExample(ex.code);
                    }}
                    className="block w-full text-left border-none bg-transparent px-2.5 py-[7px] rounded-lg hover:bg-bg cursor-pointer transition-colors text-[13px] font-medium text-text"
                  >
                    {ex.name}
                  </button>
                ))}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}

/** Editable project name; the export filenames are built from it. */
function ProjectTitle({ name, onChange }: { name: string; onChange: (n: string) => void }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(name);

  useEffect(() => {
    if (!editing) setDraft(name);
  }, [name, editing]);

  const commit = () => {
    onChange(draft.trim() || "Untitled");
    setEditing(false);
  };

  if (editing) {
    return (
      <input
        autoFocus
        value={draft}
        onFocus={(e) => e.target.select()}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.key === "Enter") commit();
          if (e.key === "Escape") {
            setDraft(name);
            setEditing(false);
          }
        }}
        spellCheck={false}
        aria-label="Project name"
        className="h-[30px] w-[170px] px-2 rounded-[8px] border border-accent bg-bg text-text text-[13.5px] font-medium outline-none"
      />
    );
  }
  return (
    <button
      onClick={() => setEditing(true)}
      title="Rename project (used in export filenames)"
      className="h-[30px] max-w-[110px] sm:max-w-[200px] min-w-0 shrink truncate px-2 rounded-[8px] text-[13.5px] font-medium text-dim hover:text-text hover:bg-bg cursor-text transition-colors"
    >
      {name}
    </button>
  );
}

export default function Header({
  theme,
  onToggleTheme,
  projectName,
  onRenameProject,
  onNew,
  onLoadExample,
  onOpenLoad,
  onExportPNG,
  onExportSVG,
  onAbout,
}: HeaderProps) {
  const [exportOpen, setExportOpen] = useState(false);
  const exportRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!exportOpen) return;
    const onDoc = (e: MouseEvent) => {
      if (exportRef.current && !exportRef.current.contains(e.target as Node)) setExportOpen(false);
    };
    // Defer so the click that opened the menu (e.g. the Model menu item) does
    // not immediately close it.
    const id = window.setTimeout(() => document.addEventListener("mousedown", onDoc), 0);
    return () => {
      window.clearTimeout(id);
      document.removeEventListener("mousedown", onDoc);
    };
  }, [exportOpen]);

  const modelItems: MenuItem[] = [
    { label: "New model", sub: "start from an empty canvas", onClick: onNew },
    { label: "Load model…", sub: "paste dagitty code", onClick: onOpenLoad },
    { label: "Export…", sub: "download the diagram", onClick: () => setExportOpen(true) },
  ];

  const helpItems: MenuItem[] = [
    { label: "About DAGitty+", sub: "what this tool does", onClick: onAbout },
    {
      label: "DAGitty documentation",
      sub: "opens dagitty.net",
      onClick: () => window.open("https://www.dagitty.net/", "_blank", "noopener"),
    },
  ];

  return (
    <header className="flex-none flex items-center gap-2.5 sm:gap-[18px] h-14 px-3 sm:px-4 bg-panel border-b border-line z-30">
      <div className="flex items-center gap-2.5">
        <div className="w-[30px] h-[30px] rounded-[9px] bg-accent flex items-center justify-center shadow-[0_2px_8px_-2px_var(--accent)]">
          <LogoMark />
        </div>
        <div className="flex items-baseline gap-px">
          <span className="font-sans font-bold text-[18px] tracking-[-0.3px] text-text">DAGitty</span>
          <span className="font-sans font-bold text-[18px] text-accent">+</span>
        </div>
      </div>

      <div className="h-5 w-px bg-line hidden sm:block" />
      <ProjectTitle name={projectName} onChange={onRenameProject} />

      <nav className="hidden sm:flex items-center gap-0.5">
        <Menu label="Model" items={modelItems} />
        <ExamplesMenu onLoadExample={onLoadExample} />
        <Menu label="Help" items={helpItems} />
      </nav>

      <div className="flex-1" />

      <button
        onClick={onToggleTheme}
        title="Toggle light / dark"
        aria-label="Toggle light or dark mode"
        className="flex items-center justify-center w-[38px] h-[38px] rounded-[10px] border border-line bg-bg text-text hover:border-accent cursor-pointer transition-colors"
      >
        {theme === "dark" ? <MoonIcon /> : <SunIcon />}
      </button>

      <div className="relative" ref={exportRef}>
        <button
          onClick={() => setExportOpen((o) => !o)}
          aria-expanded={exportOpen}
          className="flex items-center gap-[7px] h-[38px] px-3 sm:px-4 rounded-[10px] border-none bg-accent text-white text-[13.5px] font-semibold cursor-pointer shadow-[0_2px_10px_-3px_var(--accent)] hover:brightness-110 transition"
        >
          <ExportIcon />
          <span className="hidden sm:inline">Export</span>
        </button>
        {exportOpen && (
          <ExportMenu
            onExportPNG={onExportPNG}
            onExportSVG={onExportSVG}
            onClose={() => setExportOpen(false)}
          />
        )}
      </div>
    </header>
  );
}
