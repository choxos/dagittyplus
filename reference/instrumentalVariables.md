# Find Instrumental Variables

Generates a list of instrumental variables that can be used to infer the
total effect of an exposure on an outcome in the presence of latent
confounding, under linearity assumptions.

## Usage

``` r
instrumentalVariables(x, exposure = NULL, outcome = NULL)
```

## Arguments

- x:

  the input graph, a DAG.

- exposure:

  name of the exposure variable. If not given (default), then the
  exposure variable is supposed to be defined in the graph itself. Only
  a single exposure variable and a single outcome variable supported.

- outcome:

  name of the outcome variable, also taken from the graph if not given.
  Only a single outcome variable is supported.

## References

B. van der Zander, J. Textor and M. Liskiewicz (2015), Efficiently
Finding Conditional Instruments for Causal Inference. In *Proceedings of
the 24th International Joint Conference on Artificial Intelligence
(IJCAI 2015)*, pp. 3243-3249. AAAI Press, 2015.

## Examples

``` r
# The classic IV model
instrumentalVariables( "dag{ i->x->y; x<->y }", "x", "y" )
#>  i
# A conditional instrumental variable
instrumentalVariables( "dag{ i->x->y; x<->y ; y<-z->i }", "x", "y" )
#>  i |  z
```
