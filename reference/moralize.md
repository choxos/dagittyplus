# Moral Graph

Graph obtained from `x` by (1) “marrying” (inserting an undirected ede
between) all nodes that have common children, and then replacing all
edges by undirected edges. If `x` contains bidirected edges, then all
sets of nodes connected by a path containing only bidirected edges are
treated like a single node (see Examples).

## Usage

``` r
moralize(x)
```

## Arguments

- x:

  the input graph, a DAG, MAG, or PDAG.

## Examples

``` r
# returns a complete graph
moralize( "dag{ x->m<-y }" )
#> graph {
#> m
#> x
#> y
#> m -- x
#> m -- y
#> x -- y
#> }
# also returns a complete graph
moralize( "dag{ x -> m1 <-> m2 <-> m3 <-> m4 <- y }" )
#> graph {
#> m1
#> m2
#> m3
#> m4
#> x
#> y
#> m1 -- m2
#> m1 -- m3
#> m1 -- m4
#> m1 -- x
#> m1 -- y
#> m2 -- m3
#> m2 -- m4
#> m2 -- x
#> m2 -- y
#> m3 -- m4
#> m3 -- x
#> m3 -- y
#> m4 -- x
#> m4 -- y
#> x -- y
#> }
```
