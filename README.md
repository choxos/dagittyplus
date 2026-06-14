# DAGitty+ web app

A browser editor for drawing and analyzing causal directed acyclic graphs
(DAGs), deployed to GitHub Pages at <https://choxos.github.io/dagittyplus/app/>.
It is the web interface of the `dagittyplus` R package; both run the same
analysis engine, so their results agree by construction.

This is the `webapp` branch (separate history from `master`, which holds the R
package).

## Engine provenance and license

`public/dagitty-alg.js` is the prebuilt, minified DAGitty analysis engine (it
defines the global `DAGitty`), and `public/example-dags.js` is its example set.
Both are vendored from the upstream DAGitty / `dagitty` project
(<https://github.com/jtextor/dagitty>), which is licensed under the GNU General
Public License v2.

The app loads `dagitty-alg.js` as a classic `<script>` (intentionally, so that
`window.DAGitty` is populated before React mounts); the typed wrapper in
`src/lib/engine.ts` then calls into it. Because the R package loads the identical
file through V8, the web app and the R package compute the same answers.

To refresh the engine, replace `public/dagitty-alg.js` (and `example-dags.js`)
with a newer upstream build.

Because this app distributes DAGitty-derived assets, it is licensed under the
**GNU General Public License v2 or later**; see [`LICENSE`](./LICENSE).

## Development

```sh
npm install
npm run dev        # local dev server
npm run typecheck  # tsc --noEmit
npm test           # Vitest (engine parity, selection semantics, round trips)
npm run build      # production bundle for GitHub Pages /app/
```
