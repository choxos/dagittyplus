# Show Paths

Returns a list with two compontents: `path` gives the actual paths, and
`open` shows whether each path is open (d-connected) or closed
(d-separated).

## Usage

``` r
paths(
  x,
  from = exposures(x),
  to = outcomes(x),
  Z = list(),
  limit = 100,
  directed = FALSE
)
```

## Arguments

- x:

  the input graph, a DAG, PDAG, or MAG.

- from:

  name(s) of first variable(s).

- to:

  name(s) of last variable(s).

- Z:

  names of variables to condition on for determining open paths.

- limit:

  maximum amount of paths to show. In general, the number of paths grows
  exponentially with the number of variables in the graph, such that
  path inspection is not useful except for the most simple models.

- directed:

  logical; should only directed (i.e., causal) paths be shown?

## Examples

``` r
sum( paths(backDoorGraph(getExample("Shrier")))$open ) # Any open Back-Door paths?
#> [1] 9
```
