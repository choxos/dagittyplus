# Test for Cycles

`isAcyclic(x)` returns `TRUE` if the given graph does not contain a
directed cycle.

## Usage

``` r
isAcyclic(x)

findCycle(x)
```

## Arguments

- x:

  the input graph, of any graph type.

## Details

`findCycle(x)` will try to find at least one cycle in x and return it as
a list of node names.

These functions will only consider simple directed edges in the given
graph.

## Examples

``` r
g1 <- dagitty("dag{X -> Y -> Z}")
stopifnot( isTRUE(isAcyclic( g1 )) )
g2 <- dagitty("dag{X -> Y -> Z -> X}")
stopifnot( isTRUE(!isAcyclic( g2 )) )
g3 <- dagitty("mag{X -- Y -- Z -- X}")
stopifnot( isTRUE(isAcyclic( g3 )) )
```
