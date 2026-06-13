# dagittyplus

`dagittyplus` is an enhanced fork of the
[`dagitty`](https://github.com/jtextor/dagitty) R package for the
graphical analysis of structural causal models, also known as directed
acyclic graphs (DAGs). It computes covariate adjustment sets for
estimating causal effects, enumerates instrumental variables, derives
testable implications (d-separation and vanishing tetrads), generates
equivalent models, and simulates data from a model.

Every exported function and the `dagitty` S3 class are kept identical to
the upstream package, so existing `dagitty` code and the
[`ggdag`](https://r-causal.github.io/ggdag/) package work unchanged.

## Try it in your browser

A redesigned, polished web editor runs entirely in the browser, with no
R installation required:

**<https://choxos.github.io/dagittyplus/app/>**

## Installation

Install the development version from GitHub:

``` r

# install.packages("remotes")
remotes::install_github("choxos/dagittyplus")
```

The package depends on [V8](https://cran.r-project.org/package=V8),
which runs the bundled JavaScript analysis engine.

## Quick start

``` r

library(dagittyplus)

g <- dagitty("dag {
  x [exposure]
  y [outcome]
  z -> x
  z -> y
  x -> y
}")

# Which variables must we adjust for to estimate the total effect of x on y?
adjustmentSets(g, exposure = "x", outcome = "y")
#> { z }

# Testable implications of the model
impliedConditionalIndependencies(g)

# Is the model acyclic?
isAcyclic(g)
#> [1] TRUE
```

## Plotting with ggdag

Because `dagittyplus` returns standard `dagitty` objects, the
[`ggdag`](https://r-causal.github.io/ggdag/) package can tidy and plot
them with `ggplot2`:

``` r

library(ggdag)
ggdag(g)
```

## The Shiny app

The package bundles a point-and-click Shiny application. Its “Draw” tab
embeds the web editor, and its “Analyze” tab runs this package’s own
functions on a model you type, so it works offline:

``` r

# install.packages(c("shiny", "bslib"))
library(dagittyplus)
launch_dagittyplus()
```

## Citation

`dagittyplus` builds on the `dagitty` engine. Please cite the original
papers:

1.  Textor, J., van der Zander, B., Gilthorpe, M. S., Liśkiewicz, M., &
    Ellison, G. T. H. (2016). Robust causal inference using directed
    acyclic graphs: the R package ‘dagitty’. *International Journal of
    Epidemiology*, 45(6), 1887–1894.
    <https://doi.org/10.1093/ije/dyw341>
2.  Ankan, A., Wortel, I. M. N., & Textor, J. (2021). Testing Graphical
    Causal Models Using the R Package ‘dagitty’. *Current Protocols*,
    1(2), e45. <https://doi.org/10.1002/cpz1.45>

## License

GPL-2, the same license as the upstream `dagitty` package.
