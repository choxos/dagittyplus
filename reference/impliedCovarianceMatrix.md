# Implied Covariance Matrix of a Gaussian Graphical Model

Implied Covariance Matrix of a Gaussian Graphical Model

## Usage

``` r
impliedCovarianceMatrix(
  x,
  b.default = NULL,
  b.lower = -0.6,
  b.upper = 0.6,
  eps = 1,
  standardized = TRUE
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

  residual variance (only meaningful if `standardized=FALSE`).

- standardized:

  logical. If true, a standardized population covariance matrix is
  generated (all variables have variance 1).
