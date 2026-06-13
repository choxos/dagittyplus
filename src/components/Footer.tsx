interface FooterProps {
  acyclic: boolean;
  variables: number;
  edges: number;
}

export default function Footer({ acyclic, variables, edges }: FooterProps) {
  return (
    <footer className="flex-none flex items-center gap-[18px] h-[34px] px-4 bg-panel border-t border-line text-[12px] text-dim">
      <span className="flex items-center gap-1.5">
        <span
          className="w-[7px] h-[7px] rounded-full"
          style={{ background: acyclic ? "var(--ok)" : "var(--danger)" }}
        />
        <span style={{ color: acyclic ? "var(--ok)" : "var(--danger)" }} className="font-medium">
          {acyclic ? "Acyclic" : "Contains a cycle"}
        </span>
      </span>
      <span className="text-line">|</span>
      <span>{variables} variables</span>
      <span>{edges} edges</span>
      <div className="flex-1" />
      <span className="font-mono text-[11px] text-faint whitespace-nowrap hidden md:inline">
        E/O/A/U toggle role · Del removes · Esc deselects
      </span>
    </footer>
  );
}
