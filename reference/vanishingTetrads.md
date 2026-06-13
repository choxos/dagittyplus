# List Implied Vanishing Tetrads

Interpret the given graph as a structural equation model and list all
the vanishing tetrads that it implies.

## Usage

``` r
vanishingTetrads(x, type = NA)
```

## Arguments

- x:

  the input graph, a DAG.

- type:

  restrict output to one level of Kenny's tetrad typology. Possible
  values are "within" (homogeneity within constructs; all four variables
  have the same parents), "between" (homogeneity between constructs; two
  pairs of variables each sharing one parent) and "epistemic"
  (consistency of epistemic correlations; three variables have the same
  parent). By default, all tetrads are listed.

## Value

a data frame with four columns, where each row of the form i,j,k,l means
that the tetrad Cov(i,j)Cov(k,l) - Cov(i,k)Cov(j,l) vanishes (is equal
to 0) according to the model.

## References

Kenny, D. A. (1979), Correlation and Causality. Wiley, New York.

## Examples

``` r
# Specify two-factor model with 4 indicators each
g <- dagitty("dag{{x1 x2 x3 x4} <- x <-> y -> {y1 y2 y3 y4}}")
latents(g) <- c("x","y")

# Check how many tetrads are implied
nrow(vanishingTetrads(g))
#> [1] 138
# Check how these distribute across the typology
nrow(vanishingTetrads(g,"within"))
#> [1] 6
nrow(vanishingTetrads(g,"between"))
#> [1] 36
nrow(vanishingTetrads(g,"epistemic"))
#> [1] 96
```
