# Back-Door Graph

Removes every first edge on a proper causal path from `x`. If `x` is a
MAG or PAG, then only “visible” directed edges are removed (Zhang,
2008).

## Usage

``` r
backDoorGraph(x)
```

## Arguments

- x:

  the input graph, a DAG, MAG, PDAG, or PAG.

## References

J. Zhang (2008), Causal Reasoning with Ancestral Graphs. *Journal of
Machine Learning Research* 9: 1437-1474.

## Examples

``` r
g <- dagitty( "dag { x <-> m <-> y <- x }" )
backDoorGraph( g ) # x->y edge is removed
#> dag {
#> m
#> x
#> y
#> m <-> x
#> m <-> y
#> x -> y
#> }

g <- dagitty( "mag { x <-> m <-> y <- x }" )
backDoorGraph( g ) # x->y edge is not removed
#> mag {
#> m
#> x
#> y
#> m <-> x
#> m <-> y
#> x -> y
#> }

g <- dagitty( "mag { x <-> m <-> y <- x <- i }" )
backDoorGraph( g ) # x->y edge is removed
#> mag {
#> i
#> m
#> x
#> y
#> i -> x
#> m <-> x
#> m <-> y
#> x -> y
#> }
```
