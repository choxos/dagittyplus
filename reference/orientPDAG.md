# Orient Edges in PDAG.

Orients as many edges as possible in a partially directed acyclic graph
(PDAG) by converting induced subgraphs X -\> Y – Z to X -\> Y -\> Z.

## Usage

``` r
orientPDAG(x)
```

## Arguments

- x:

  the input graph, a PDAG.

## Examples

``` r
orientPDAG( "pdag { x -> y -- z }" )
#> pdag {
#> x
#> y
#> z
#> x -> y
#> y -> z
#> }
```
