# dagittyplus 0.4.0

`dagittyplus` is an enhanced fork of the `dagitty` R package by Johannes
Textor and colleagues. This first release re-homes the package and modernizes
its tooling, without changing any analysis behavior.

* Renamed the package to `dagittyplus` and moved it to the repository root so
  it installs with `remotes::install_github("choxos/dagittyplus")` and builds a
  pkgdown site cleanly.
* Every exported function name and the `dagitty` S3 class are preserved, so
  existing `dagitty` code and the `ggdag` package keep working unchanged.
* Added a pkgdown documentation website, Air code formatting, and code coverage
  configuration.
* The causal-analysis engine, the redesigned web interface, and a bundled Shiny
  application are all driven by the same JavaScript library that powers the R
  package, so results stay consistent across every interface.
* Added `launch_dagittyplus()`, which starts a bundled Shiny app that embeds the
  web editor and runs adjustment-set, implication, and instrument analyses from
  R.
* Added a vignette, "Plotting dagittyplus models with ggdag", documenting how
  the preserved `dagitty` S3 class lets the `ggdag` package plot dagittyplus
  models directly.

# dagitty 0.3-2

* New export options for the causal.effect package and for Python-style edge
  lists.
* DAGs can now be specified without the enclosing "dag { ... }" if the
  specification contains at least one directed or bi-directed arrow.

# dagitty 0.3 (2020-06-11)

* `toString`: added options 'singular' and 'bnlearn'.
* `toMAG`: added function to create a MAG from a given DAG.
* `impliedConditionalIndependencies`: adds option 'all.pairs' for 'type'
  argument.
* `instrumentalVariables`: added new algorithm (van der Zander et al., 2015).
* `simulateLogistic`: added function to simulate binary data.
* `localTests`: added option 'cis.chisq' for argument 'type' to test
  categorical variables.
* `isCollider`: added function to check for colliders in structure.
* `adjustmentSets`: added argument 'max.results'.
* `simulateSEM`: added options 'empirical' and 'verbose'.
* `plot.dagitty`: show coefficient values for edges.
* `plot.dagitty`: fixed bug where bent undirected lines were not drawn thick
  but non-bent undirected lines were.

# dagitty 0.2-2 (2016-08-26)

* Added capability to specify arbitrary path coefficients for `simulateSEM`.
* Semi-parametric conditional independence testing for additive noise using
  loess smoothing.
* Plot function now sets margins properly and gives better error messages.
* Bugfix in `adjustmentSets` with type="all" when exposure was defined in graph.
* Bugfix in `dconnected` and `isAdjustmentSet` when graphs contain inducing
  paths with 3 or more nodes.
* Improved parser for larger graphs.
