# Ancestor Graph

Creates the induced subgraph containing only the vertices in `v`, their
ancestors, and the edges between them. All other vertices and edges are
discarded.

## Usage

``` r
ancestorGraph(x, v = NULL)
```

## Arguments

- x:

  the input graph, a DAG, MAG, or PDAG.

- v:

  variable names.

## Details

If the input graph is a MAG or PDAG, then all \*possible\* ancestors
will be returned (see Examples).

## Examples

``` r
g <- dagitty("dag{ z <- x -> y }")
ancestorGraph( g, "z" )
#> dag {
#> x
#> z
#> x -> z
#> }

g <- dagitty("pdag{ z -- x -> y }")
ancestorGraph( g, "y" ) # includes z
#> pdag {
#> x
#> y
#> z
#> x -- z
#> x -> y
#> }
```
