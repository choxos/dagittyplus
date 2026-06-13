# List Implied Conditional Independencies

Generates a list of conditional independence statements that must hold
in every probability distribution compatible with the given model.

## Usage

``` r
impliedConditionalIndependencies(x, type = "missing.edge", max.results = Inf)
```

## Arguments

- x:

  the input graph, a DAG, MAG, or PDAG.

- type:

  can be one of "missing.edge", "basis.set", or "all.pairs". With the
  first, one or more minimal testable implication (with the smallest
  possible conditioning set) is returned per missing edge of the graph.
  With "basis.set", one testable implication is returned per vertex of
  the graph that has non-descendants other than its parents. Basis sets
  can be smaller, but they involve higher-dimensional independencies,
  whereas missing edge sets involve only independencies between two
  variables at a time. With "all.pairs", the function will return a list
  of all implied conditional independencies between two variables at a
  time. Beware, because this can be a very long list and it may not be
  feasible to compute this except for small graphs.

- max.results:

  integer. The listing of conditional independencies is stopped once
  this many results have been found. Use `Inf` to generate them all.
  This applies only when `type="missing.edge"` or `type="all"`.

## Examples

``` r
g <- dagitty( "dag{ x -> m -> y }" )
impliedConditionalIndependencies( g ) # one
#> x _||_ y | m
latents( g ) <- c("m")
impliedConditionalIndependencies( g ) # none
```
