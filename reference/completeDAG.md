# Generate Complete DAG

Generates a complete DAG on the given variable names. The order in which
the variables are given corresponds to the topological ordering of the
DAG. Returns a named list.

## Usage

``` r
completeDAG(x)
```

## Arguments

- x:

  variable names. Can also be a positive integer, in which case the
  variables will be called x1,...,xN.
