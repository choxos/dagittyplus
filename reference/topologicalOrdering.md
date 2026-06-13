# Get Topological Ordering of DAG

Computes a topological ordering of the nodes, i.e., a number for each
node such that every node's number is smaller than the one of all its
descendants. Bidirected edges (\<-\>) are ignored.

## Usage

``` r
topologicalOrdering(x)
```

## Arguments

- x:

  the input graph, a DAG
