import { beforeAll, describe, expect, it } from "vitest";

// The engine bundle (public/dagitty-alg.js) is a classic <script> that assigns
// the global `DAGitty`. jsdom does not execute that script tag, so we load the
// source as raw text (Vite's `?raw`) and evaluate it ourselves, mirroring how a
// browser sets window.DAGitty. Using `?raw` + `new Function` keeps the test free
// of node: builtins so it typechecks under the project's `types` (no @types/node).
import bundleSource from "../../../public/dagitty-alg.js?raw";

import { analyze } from "../engine";

beforeAll(() => {
  // The bundle's top-level is `var DAGitty; (()=>{ ... DAGitty=n })();`, where its
  // inner IIFE references the module-scope `this`. Running the source inside a
  // function whose `this` is a fresh sandbox lets the hoisted `var DAGitty` land
  // on that sandbox, which we then expose as window.DAGitty just like the browser.
  const sandbox = { window: undefined as unknown, self: undefined as unknown } as Record<string, unknown>;
  sandbox.window = sandbox;
  sandbox.self = sandbox;
  sandbox.globalThis = sandbox;
  // eslint-disable-next-line @typescript-eslint/no-implied-eval
  const run = new Function(
    "sandbox",
    `with (sandbox) { var DAGitty; ${bundleSource}; sandbox.DAGitty = DAGitty; }`,
  );
  run(sandbox);

  const D = sandbox.DAGitty;
  if (!D) throw new Error("Evaluating dagitty-alg.js did not define DAGitty.");
  (window as unknown as { DAGitty: unknown }).DAGitty = D;
});

describe("analyze() parity smoke test", () => {
  it("identifies the classic confounding model and its adjustment set", () => {
    const a = analyze("dag { z x [exposure] y [outcome] z->x z->y x->y }");
    expect(a.ok).toBe(true);
    expect(a.acyclic).toBe(true);
    expect(a.totalEffect).not.toBeNull();
    expect(a.totalEffect?.status).toBe("identifiable");
    expect(a.totalEffect?.sets).toEqual([["z"]]);
  });

  it("derives the testable implication of a simple chain", () => {
    const a = analyze("dag { a->b b->c }");
    // NOTE: engine.ts types Implication.given as string[], but the underlying
    // listMinimalImplications() returns Vertex objects there, so each element is
    // a { id } object rather than a bare string. We read the id defensively.
    const givenIds = (im: (typeof a.implications)[number]): string[] =>
      im.given.map((v) => (typeof v === "string" ? v : (v as { id: string }).id));
    const found = a.implications.find((im) => {
      const ids = givenIds(im);
      return im.x === "a" && im.y === "c" && ids.length === 1 && ids[0] === "b";
    });
    expect(found).toBeTruthy();
  });
});
