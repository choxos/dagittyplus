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
