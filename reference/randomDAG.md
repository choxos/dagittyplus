# Generate DAG at Random

Generates a random DAG with N variables called x1,...,xN. For each pair
of variables xi,xj with i\<j, an edge i-\>j will be present with
probability p.

## Usage

``` r
randomDAG(N, p)
```

## Arguments

- N:

  desired number of variables.

- p:

  connectivity parameter, a number between 0 and 1.
