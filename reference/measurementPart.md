# Extract Measurement Part from Structural Equation Model

Removes all edges between latent variables, then removes any latent
variables without adjacent edges, then returns the graph.

## Usage

``` r
measurementPart(x)
```

## Arguments

- x:

  the input graph, a DAG.

## Details

Assumes that x is a graph where there are edges between the latent
variables, between the observed variables, and from latent to observed
variables, but no edge between a latent L and an observed X may have an
arrowhead at L.
