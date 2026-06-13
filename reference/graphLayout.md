# Generate Graph Layout

This function generates plot coordinates for each variable in a graph
that does not have them already. To this end, the well-known “Spring”
layout algorithm is used. Note that this is a stochastic algorithm, so
the generated layout will be different every time (which also means that
you can try several times until you find a decent layout).

## Usage

``` r
graphLayout(x, method = "spring")
```

## Arguments

- x:

  the input graph, of any type.

- method:

  the layout method; currently, only `"spring"` is supported.

## Value

the same graph as `x` but with layout coordinates added.

## Examples

``` r
## Generate a layout for the M-bias graph and plot it
plot( graphLayout( dagitty( "dag { X <- U1 -> M <- U2 -> Y } " ) ) )

## Plot larger graph and abbreviate its variable names.
plot( getExample("Shrier"), abbreviate.names=TRUE )

```
