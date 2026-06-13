// Defensive reader for the engine's built-in example models exposed on
// `window.examples`. The vendored bundle (public/example-dags.js) declares an
// ARRAY of `{ d: code, l: label, ... }`, but older/other builds key an object
// by name where each value is a code string or an object with a code field.
// We accept all of those shapes and surface a uniform list.

export interface ExampleModel {
  name: string;
  code: string;
}

const CODE_FIELDS = ["d", "code", "complete", "simple", "model", "dagitty"];
const LABEL_FIELDS = ["l", "label", "name", "title"];

/** A string is "graphlike" if it opens a dagitty-style graph block. */
function looksLikeGraph(s: string): boolean {
  return /^\s*(dag|pdag|mag|pag|graph)\b/i.test(s) && s.includes("{");
}

function firstString(obj: Record<string, unknown>, fields: string[]): string | null {
  for (const f of fields) {
    const v = obj[f];
    if (typeof v === "string" && v.trim()) return v;
  }
  // Fall back to any graphlike string property.
  for (const v of Object.values(obj)) {
    if (typeof v === "string" && looksLikeGraph(v)) return v;
  }
  return null;
}

function pickLabel(obj: Record<string, unknown>, fallback: string): string {
  for (const f of LABEL_FIELDS) {
    const v = obj[f];
    if (typeof v === "string" && v.trim()) return v;
  }
  return fallback;
}

function fromEntry(value: unknown, fallbackName: string): ExampleModel | null {
  if (typeof value === "string") {
    return looksLikeGraph(value) ? { name: fallbackName, code: value } : null;
  }
  if (value && typeof value === "object") {
    const obj = value as Record<string, unknown>;
    const code = firstString(obj, CODE_FIELDS);
    if (code && looksLikeGraph(code)) {
      return { name: pickLabel(obj, fallbackName), code };
    }
  }
  return null;
}

/** Read all usable built-in examples, or an empty list if none are available. */
export function loadExamples(): ExampleModel[] {
  const raw = (window as Window).examples;
  if (!raw) return [];

  const out: ExampleModel[] = [];
  if (Array.isArray(raw)) {
    raw.forEach((entry, i) => {
      const m = fromEntry(entry, `Example ${i + 1}`);
      if (m) out.push(m);
    });
  } else if (typeof raw === "object") {
    for (const [key, entry] of Object.entries(raw)) {
      const m = fromEntry(entry, key);
      if (m) out.push({ ...m, name: m.name === key ? key : m.name });
    }
  }
  return out;
}
