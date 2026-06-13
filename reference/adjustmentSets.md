# Covariate Adjustment Sets

Enumerates sets of covariates that (asymptotically) allow unbiased
estimation of causal effects from observational data, assuming that the
input causal graph is correct.

## Usage

``` r
adjustmentSets(
  x,
  exposure = NULL,
  outcome = NULL,
  type = c("minimal", "canonical", "all"),
  effect = c("total", "direct"),
  max.results = Inf
)
```

## Arguments

- x:

  the input graph, a DAG, MAG, PDAG, or PAG.

- exposure:

  name(s) of the exposure variable(s). If not given (default), then the
  exposure variables are supposed to be defined in the graph itself.

- outcome:

  name(s) of the outcome variable(s), also taken from the graph if not
  given.

- type:

  which type of adjustment set(s) to compute. If `type="minimal"`, then
  only minimal sufficient adjustment sets are returned (default). For
  `type="all"`, all valid adjustment sets are returned. For
  `type="canonical"`, a single adjustment set is returned that consists
  of all (possible) ancestors of exposures and outcomes, minus
  (possible) descendants of nodes on proper causal paths. This canonical
  adjustment set is always valid if any valid set exists at all.

- effect:

  which effect is to be identified. If `effect="total"`, then the total
  effect is to be identified, and the adjustment criterion by Perkovic
  et al (2015; see also van der Zander et al., 2014), an extension of
  Pearl's back-door criterion, is used. Otherwise, if `effect="direct"`,
  then the average direct effect is to be identified, and Pearl's
  single-door criterion is used (Pearl, 2009). In a structural equation
  model (Gaussian graphical model), direct effects are simply the path
  coefficients.

- max.results:

  integer. The listing of adjustment set is stopped once this many
  results have been found. Use `Inf` to generate them all. This only
  applys when `type="minimal"`.

## Details

If the input graph is a MAG or PAG, then it must not contain any
undirected edges (=hidden selection variables).

## References

J. Pearl (2009), Causality: Models, Reasoning and Inference. Cambridge
University Press.

B. van der Zander, M. Liskiewicz and J. Textor (2014), Constructing
separators and adjustment sets in ancestral graphs. In *Proceedings of
UAI 2014.*

E. Perkovic, J. Textor, M. Kalisch and M. H. Maathuis (2015), A Complete
Generalized Adjustment Criterion. In *Proceedings of UAI 2015.*

## Examples

``` r
# The M-bias graph showing that adjustment for 
# pre-treatment covariates is not always valid
g <- dagitty( "dag{ x -> y ; x <-> m <-> y }" )
adjustmentSets( g, "x", "y" ) # empty set
#> {}
# Generate data where true effect (=path coefficient) is .5
set.seed( 123 ); d <- simulateSEM( g, .5, .5 )
confint( lm( y ~ x, d ) )["x",] # includes .5
#>     2.5 %    97.5 % 
#> 0.3888421 0.5543539 
confint( lm( y ~ x + m, d ) )["x",] # does not include .5
#>      2.5 %     97.5 % 
#> 0.08594607 0.22524480 

# Adjustment sets can also sometimes be computed for graphs in which not all 
# edge directions are known
g <- dagitty("pdag { x[e] y[o] a -- {i z b}; {a z i} -> x -> y <- {z b} }")
adjustmentSets( g )
#> { b, z }
#> { a, z }
```
