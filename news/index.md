# Changelog

## dagittyplus 0.4.0

`dagittyplus` is an enhanced fork of the `dagitty` R package by Johannes
Textor and colleagues. This first release re-homes the package and
modernizes its tooling, without changing any analysis behavior.

- Renamed the package to `dagittyplus` and moved it to the repository
  root so it installs with
  `remotes::install_github("choxos/dagittyplus")` and builds a pkgdown
  site cleanly.
- Every exported function name and the `dagitty` S3 class are preserved,
  so existing `dagitty` code and the `ggdag` package keep working
  unchanged.
- Added a pkgdown documentation website, Air code formatting, and code
  coverage configuration.
- The causal-analysis engine, the redesigned web interface, and a
  bundled Shiny application are all driven by the same JavaScript
  library that powers the R package, so results stay consistent across
  every interface.
- Added
  [`launch_dagittyplus()`](https://choxos.github.io/dagittyplus/reference/launch_dagittyplus.md),
  which starts a bundled Shiny app that embeds the web editor and runs
  adjustment-set, implication, and instrument analyses from
  18. 
- Added a vignette, “Plotting dagittyplus models with ggdag”,
  documenting how the preserved `dagitty` S3 class lets the `ggdag`
  package plot dagittyplus models directly.
- Added the selection-node role to the R API:
  [`selectedNodes()`](https://choxos.github.io/dagittyplus/reference/VariableStatus.md),
  `selectedNodes<-`, and `setVariableStatus(..., "selected")`, for
  parity with the web app and the JavaScript engine.
- [`downloadGraph()`](https://choxos.github.io/dagittyplus/reference/downloadGraph.md)
  now uses HTTPS, validates and URL-encodes the graph id, and fails
  clearly on an invalid id, an empty response, or a timeout.
- The bundled Shiny app serves the web editor locally (offline, version
  locked to the installed package) instead of embedding the deployed
  site, and points to copying the model code into the Analyze tab.
- Added cross-surface CI: an engine-parity check (the vendored DAGitty
  engine is byte-identical across the R package, the bundled Shiny
  editor, and the web app) and the JavaScript engine QUnit suite.
