# Plot Results of Local Tests

Generates a summary plot of the results of local tests (see
[localTests](https://choxos.github.io/dagittyplus/reference/localTests.md)).
For each test, a test statistic and the confidence interval are shown.

## Usage

``` r
plotLocalTestResults(
  x,
  xlab = "test statistic (95% CI)",
  xlim = range(x[, c(ncol(x) - 1, ncol(x))]),
  sort.by.statistic = TRUE,
  n = Inf,
  axis.pars = list(las = 1),
  auto.margin = TRUE,
  ...
)
```

## Arguments

- x:

  data frame; results of the local tests as returned by
  [localTests](https://choxos.github.io/dagittyplus/reference/localTests.md).

- xlab:

  X axis label.

- xlim:

  numerical vector with 2 elements; range of X axis.

- sort.by.statistic:

  logical. Sort the rows of `x` by the absolute value of the test
  statistic before plotting.

- n:

  plot only the n tests for which the absolute value of the test
  statistics diverges most from 0.

- axis.pars:

  arguments to be passed on to
  [`axis`](https://rdrr.io/r/graphics/axis.html) when generating the Y
  axis for the plot.

- auto.margin:

  logical. Computes the left margin to fit the Y axis labels.

- ...:

  further arguments to be passed on to
  [`plot`](https://rdrr.io/r/graphics/plot.default.html).

## Examples

``` r
d <- simulateSEM("dag{X->{U1 M2}->Y U1->M1}",.6,.6)
par(mar=c(2,8,1,1)) # so we can see the test names
plotLocalTestResults(localTests( "dag{ X -> {M1 M2} -> Y }", d, "cis" ))

```
