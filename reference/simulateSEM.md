# Simulate Data from Structural Equation Model

Interprets the input graph as a structural equation model, generates
random path coefficients, and simulates data from the model. This is a
very bare-bones function and probably not very useful except for quick
validation purposes (e.g. checking that an implied vanishing tetrad
truly vanishes in simulated data). For more elaborate simulation
studies, please use the lavaan package or similar facilities in other
packages.

## Usage

``` r
simulateSEM(
  x,
  b.default = NULL,
  b.lower = -0.6,
  b.upper = 0.6,
  eps = 1,
  N = 500,
  standardized = TRUE,
  empirical = FALSE,
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

  residual variance (only meaningful if `standardized=FALSE`).

- N:

  number of samples to generate.

- standardized:

  logical. If true, a standardized population covariance matrix is
  generated (all variables have variance 1).

- empirical:

  logical. If true, the empirical covariance matrix will be equal to the
  population covariance matrix.

- verbose:

  logical. If true, prints the generated population covariance matrix.

## Value

Returns a data frame containing `N` values for each variable in `x`.

## Details

Data are generated in the following manner. Each directed arrow is
assigned a path coefficient that can be given using the attribute "beta"
in the model syntax (see the examples). All coefficients not set in this
manner are set to the `b.default` argument, or if that is not given, are
chosen uniformly at random from the interval given by `b.lower` and
`b.upper` (inclusive; set both parameters to the same value for constant
path coefficients). Each bidirected arrow a \<-\> b is replaced by a
substructure a \<- L -\> b, where L is an exogenous latent variable.
Path coefficients on such substructures are set to `sqrt(x)`, where `x`
is again chosen at random from the given interval; if `x` is negative,
one path coefficient is set to `-sqrt(x)` and the other to `sqrt(x)`.
All residual variances are set to `eps`.

If `standardized=TRUE`, all path coefficients are interpreted as
standardized coefficients. But not all standardized coefficients are
compatible with all graph structures. For instance, the graph structure
z \<- x -\> y -\> z is incompatible with standardized coefficients of
0.9, since this would imply that the variance of z must be larger
than 1. For large graphs with many parallel paths, it can be very
difficult to find coefficients that work.

## Examples

``` r
## Simulate data with pre-defined path coefficients of -.6
g <- dagitty('dag{z -> x [beta=-.6] x <- y [beta=-.6] }')
x <- simulateSEM( g ) 
cov(x)
#>            x           y           z
#> x  1.0411816 -0.60967927 -0.63667828
#> y -0.6096793  1.01562557  0.01269518
#> z -0.6366783  0.01269518  1.01392535

```
