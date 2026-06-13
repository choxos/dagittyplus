# d-Separation

A set Z d-separates a path p if (1) Z contains a non-collider on p, e.g.
x-\>m-\>y with `Z=c("m")`; or (2) some collider on p is not on Z, e.g.
x-\>m\<-y with `Z=c()`.

## Usage

``` r
dconnected(x, X, Y = list(), Z = list())

dseparated(x, X, Y = list(), Z = list())
```

## Arguments

- x:

  the input graph, a DAG, PDAG, or MAG.

- X:

  vector of variable names.

- Y:

  vector of variable names.

- Z:

  vector of variable names.

  `dseparated(x,X,Y,Z)` checks if all paths between X and Y are
  d-separated by Z.

  `dconnected(x,X,Y,Z)` checks if at least one path between X and Y is
  not d-separated by Z.

## Details

The functions also work for mixed graphs with directed, undirected, and
bidirected edges. The definition of a collider in such graphs is: a node
where two arrowheads collide, e.g. x\<-\>m\<-y but not x-\>m–y.

## Examples

``` r
dconnected( "dag{x->m->y}", "x", "y", c() ) # TRUE
#> [1] TRUE
dconnected( "dag{x->m->y}", "x", "y", c("m") ) # FALSE
#> [1] FALSE
dseparated( "dag{x->m->y}", "x", "y", c() ) # FALSE 
#> [1] FALSE
dseparated( "dag{x->m->y}", "x", "y", c("m") ) # TRUE
#> [1] TRUE
```
