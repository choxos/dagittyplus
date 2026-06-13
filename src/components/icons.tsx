// Inline SVG line icons (no icon library). Sizes and stroke weights follow the
// ClaudeDesign reference. Each takes an optional `size`; color is `currentColor`
// so callers control it with text color / Tailwind classes.

interface IconProps {
  size?: number;
  className?: string;
}

function svgProps(size: number, className?: string) {
  return {
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor" as const,
    strokeWidth: 1.9,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    className,
    "aria-hidden": true,
  };
}

/** App logo: three circles joined by two strokes (rendered white on accent). */
export function LogoMark({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle cx="5" cy="6" r="3" fill="#fff" />
      <circle cx="19" cy="6" r="3" fill="#fff" opacity=".75" />
      <circle cx="12" cy="18" r="3" fill="#fff" />
      <path d="M6.5 8.2 L11 15.4 M17.5 8.2 L13 15.4" stroke="#fff" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

export function SelectIcon({ size = 20, className }: IconProps) {
  return (
    <svg {...svgProps(size, className)}>
      <path d="M5 3l6.5 16 2.2-6.3L20 10.5z" />
    </svg>
  );
}

export function AddNodeIcon({ size = 20, className }: IconProps) {
  return (
    <svg {...svgProps(size, className)}>
      <circle cx="12" cy="10" r="5" />
      <path d="M12 17v4M10 21h4" />
    </svg>
  );
}

export function AddEdgeIcon({ size = 20, className }: IconProps) {
  return (
    <svg {...svgProps(size, className)}>
      <circle cx="6" cy="6" r="2.4" />
      <circle cx="18" cy="18" r="2.4" />
      <path d="M7.7 7.7l8.6 8.6" />
    </svg>
  );
}

export function DeleteToolIcon({ size = 20, className }: IconProps) {
  return (
    <svg {...svgProps(size, className)} strokeWidth={2}>
      <path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m2 0v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" />
    </svg>
  );
}

export function LayoutIcon({ size = 20, className }: IconProps) {
  return (
    <svg {...svgProps(size, className)}>
      <circle cx="7" cy="7" r="2.4" />
      <circle cx="17" cy="9" r="2.4" />
      <circle cx="11" cy="17" r="2.4" />
      <path d="M8.7 8.2l3 7M15.4 10.4L13 15" />
    </svg>
  );
}

export function FitIcon({ size = 20, className }: IconProps) {
  return (
    <svg {...svgProps(size, className)}>
      <path d="M4 9V5a1 1 0 0 1 1-1h4M20 9V5a1 1 0 0 0-1-1h-4M4 15v4a1 1 0 0 0 1 1h4M20 15v4a1 1 0 0 1-1 1h-4" />
    </svg>
  );
}

export function SunIcon({ size = 18, className }: IconProps) {
  return (
    <svg {...svgProps(size, className)} strokeWidth={2}>
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M4 12H2M22 12h-2M5 5l1.5 1.5M17.5 17.5L19 19M19 5l-1.5 1.5M6.5 17.5L5 19" />
    </svg>
  );
}

export function MoonIcon({ size = 17, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden>
      <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z" />
    </svg>
  );
}

export function ExportIcon({ size = 15, className }: IconProps) {
  return (
    <svg {...svgProps(size, className)} strokeWidth={2.2}>
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3" />
    </svg>
  );
}

export function RenameIcon({ size = 14, className }: IconProps) {
  return (
    <svg {...svgProps(size, className)} strokeWidth={2}>
      <path d="M12 20h9M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z" />
    </svg>
  );
}

export function TrashIcon({ size = 14, className }: IconProps) {
  return (
    <svg {...svgProps(size, className)} strokeWidth={2}>
      <path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m2 0v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" />
    </svg>
  );
}

export function CheckIcon({ size = 18, className }: IconProps) {
  return (
    <svg {...svgProps(size, className)} strokeWidth={2.4}>
      <path d="M20 6 9 17l-5-5" />
    </svg>
  );
}

export function WarningIcon({ size = 18, className }: IconProps) {
  return (
    <svg {...svgProps(size, className)} strokeWidth={2.2}>
      <path d="M12 8v5M12 16.5h.01M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h16.9a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z" />
    </svg>
  );
}

export function TargetIcon({ size = 16, className }: IconProps) {
  return (
    <svg {...svgProps(size, className)} strokeWidth={2}>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 8v8M8 12h8" />
    </svg>
  );
}

export function CopyIcon({ size = 14, className }: IconProps) {
  return (
    <svg {...svgProps(size, className)} strokeWidth={2}>
      <rect x="9" y="9" width="11" height="11" rx="2" />
      <path d="M5 15V5a2 2 0 0 1 2-2h10" />
    </svg>
  );
}

export function CloseIcon({ size = 14, className }: IconProps) {
  return (
    <svg {...svgProps(size, className)} strokeWidth={2.2}>
      <path d="M6 6l12 12M18 6L6 18" />
    </svg>
  );
}

export function HelpGlyphIcon({ size = 34, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.7} className={className} aria-hidden>
      <circle cx="5" cy="6" r="2.6" />
      <circle cx="19" cy="6" r="2.6" />
      <circle cx="12" cy="18" r="2.6" />
      <path d="M6.6 7.7 L10.6 16M17.4 7.7 L13.4 16" strokeLinecap="round" />
    </svg>
  );
}
