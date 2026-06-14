# Variable Statuses

Get or set variables with a given status in a graph. Variables in
dagitty graphs can have one of several statuses. Variables with status
*exposure* and *outcome* are important when determining causal effects
via the functions
[`adjustmentSets`](https://choxos.github.io/dagittyplus/reference/adjustmentSets.md)
and
[`instrumentalVariables`](https://choxos.github.io/dagittyplus/reference/instrumentalVariables.md).
Variables with status *latent* are assumed to be unobserved variables or
latent constructs, which is respected when deriving testable
implications of a graph via the functions
[`impliedConditionalIndependencies`](https://choxos.github.io/dagittyplus/reference/impliedConditionalIndependencies.md)
or
[`vanishingTetrads`](https://choxos.github.io/dagittyplus/reference/vanishingTetrads.md).

## Usage

``` r
exposures(x)

exposures(x) <- value

outcomes(x)

outcomes(x) <- value

latents(x)

latents(x) <- value

adjustedNodes(x)

adjustedNodes(x) <- value

selectedNodes(x)

selectedNodes(x) <- value

setVariableStatus(x, status, value)
```

## Arguments

- x:

  the input graph, of any type.

- value:

  character vector; names of variables to receive the given status.

- status:

  character, one of "exposure", "outcome", "latent", "adjustedNode", or
  "selected".

## Details

`setVariableStatus` first removes the given status from all variables in
the graph that had it, and then sets it on the given variables. For
instance, if `status="exposure"` and `value="X"` are given, then `X`
will be the only exposure in the resulting graph.

## Examples

``` r
g <- dagitty("dag{ x<->m<->y<-x }") # m-bias graph
exposures(g) <- "x"
outcomes(g) <- "y"
adjustmentSets(g)
#> {}
```
