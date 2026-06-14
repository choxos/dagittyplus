# Building and architecture

`dagittyplus` is a polyglot repository. One JavaScript causal-analysis engine
drives three interfaces, so results stay identical across all of them.

## Repository layout

| Path | Role | Branch |
| --- | --- | --- |
| `R/`, `man/`, `inst/`, `tests/`, `vignettes/`, `DESCRIPTION` | The R package, at the repository root | `master` |
| `inst/js/` | The prebuilt JavaScript engine the R package runs through V8 | `master` |
| `jslib/` | Readable upstream source for the engine (namespace-style `graph/*.js`) | `master` |
| `gui/`, `website/` | Legacy static browser GUI and the dagitty.net content | `master` (see Phase 7) |
| `ClaudeDesign/` | Design reference for the redesigned web editor | `master` |
| `test/` | The engine's QUnit test suite | `master` |
| React/TypeScript web app | The redesigned browser editor, deployed to GitHub Pages `/app/` | `webapp` |

## The engine (single source of truth)

`inst/js/dagitty-alg.js` is a **prebuilt, minified webpack bundle** that exposes
a single global object, `DAGitty`, with these namespaces:

```
DAGitty.Graph            DAGitty.GraphParser      DAGitty.GraphAnalyzer
DAGitty.GraphTransformer DAGitty.GraphSerializer  DAGitty.GraphLayouter
DAGitty.GraphGenerator   DAGitty.MPoly
```

It is loaded the same way everywhere a JavaScript runtime is available:

* **R package**: `R/internal.R` sources it into a `V8::new_context()` and calls
  `DAGitty.GraphAnalyzer.*`, `DAGitty.GraphParser.parseGuess`, and so on.
  `inst/js/RUtil.js` (the `DagittyR` helper, R only) reshapes results into R
  lists, and `inst/js/example-dags.js` provides the built-in example models.
* **Web app** (`webapp` branch): the same `dagitty-alg.js` is vendored and loaded
  as a classic `<script>`, so `window.DAGitty` is available to a typed
  TypeScript wrapper. Because the web app and the R package load the *identical*
  file, their analyses agree by construction; there is no second implementation
  to keep in sync.

A quick way to confirm the bundle is self-contained (this is what both V8 and the
browser do):

```js
const fs = require("fs"), vm = require("vm");
const ctx = {};
vm.createContext(ctx);
vm.runInContext(fs.readFileSync("inst/js/dagitty-alg.js", "utf8"), ctx);
const g = ctx.DAGitty.GraphParser.parseGuess("dag { x [exposure] y [outcome] z -> x z -> y x -> y }");
ctx.DAGitty.GraphAnalyzer.listMsasTotalEffect(g); // [[z]]
```

## Rebuilding the engine

The webpack configuration that produces `inst/js/dagitty-alg.js` lives upstream
and is not vendored in this repository; only the built bundle is committed. To
refresh the engine, drop in a new upstream build of `dagitty-alg.js` and copy the
same file into the `webapp` branch's vendored location.

`jslib/` holds the readable source the bundle is built from. `jslib/Makefile` is
the **legacy** pre-webpack build that simply concatenates the `graph/*.js` files;
it predates the `DAGitty` namespace and is retained for reference only. It is not
used to produce the shipped bundle.

## Building and testing each interface

**R package**

```sh
R CMD build .
R CMD check --as-cran dagittyplus_*.tar.gz
Rscript -e 'devtools::test()'
```

**Engine (QUnit)**

```sh
cd test && npm install && npm test
```

**Web app** (on the `webapp` branch)

```sh
npm install
npm run dev        # local dev server
npm run typecheck
npm test           # engine-parity smoke test
npm run build      # production bundle for GitHub Pages /app/
```

## Refreshing the bundled Shiny editor

The Shiny app serves the web editor offline from `inst/shiny-apps/DagittyPlus/www`.
That directory is a relative-base build of the web app. To refresh it after the
`webapp` branch changes, build the app with a relative base and copy the output
in:

```sh
# on the webapp branch
npx vite build --base=./
# then, on master
rm -rf inst/shiny-apps/DagittyPlus/www
cp -r <webapp>/dist/* inst/shiny-apps/DagittyPlus/www/
```

The `engine-checks` workflow fails if `dagitty-alg.js` / `example-dags.js` drift
between `inst/js`, this bundled `www`, and the web app's `public/`.
