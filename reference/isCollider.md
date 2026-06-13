# Test for Colliders

Returns `TRUE` if three given variables form a collider in a given
graph.

## Usage

``` r
isCollider(x, u, v, w)
```

## Arguments

- x:

  the input graph, a DAG.

- u:

  the first endpoint of the putative collider

- v:

  the midpoint of the putative collider

- w:

  the second endpoint of the putative collider

## Examples

``` r
g1 <- dagitty("dag{X -> Y -> Z}")
stopifnot( isTRUE(!isCollider( g1, "X", "Y", "Z" )) )
g2 <- dagitty("dag{X -> Y <- Z }")
stopifnot( isTRUE(isCollider( g2, "X", "Y", "Z" )) )
```
