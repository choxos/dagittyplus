# Simulate Binary Data from DAG Structure

Interprets input DAG as a structural description of a logistic model in
which each variable is binary and its log-odds ratio is a linear
combination of its parent values.

## Usage

``` r
simulateLogistic(
  x,
  b.default = NULL,
  b.lower = -0.6,
  b.upper = 0.6,
  eps = 0,
  N = 500,
  verbose = FALSE
)
```

## Arguments

- x:

  the input graph, a DAG (which may contain bidirected edges).

- b.default:

  default path coefficient applied to arrows for which no coefficient is
  defined in the model syntax.

- b.lower:

  lower bound for random path coefficients, applied if `b.default=NULL`.

- b.upper:

  upper bound for path coefficients.

- eps:

  base log-odds ratio.

- N:

  number of samples to generate.

- verbose:

  logical. If true, prints the order in which the data are generated
  (which should be a topological order).
