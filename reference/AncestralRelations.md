# Ancestral Relations

Retrieve the names of all variables in a given graph that are in the
specified ancestral relationship to the input variable `v`.

## Usage

``` r
descendants(x, v, proper = FALSE)

ancestors(x, v, proper = FALSE)

children(x, v)

parents(x, v)

neighbours(x, v)

spouses(x, v)

adjacentNodes(x, v)

markovBlanket(x, v)
```

## Arguments

- x:

  the input graph, of any type.

- v:

  name(s) of variable(s).

- proper:

  logical. By default (`proper=FALSE`), the `descendants` or `ancestors`
  of a variable include the variable itself. For (`proper=TRUE`), the
  variable itself is not included.

  `descendants(x,v)` retrieves variables that are are reachable from `v`
  via a directed path.

  `ancestors(x,v)` retrieves variables from which `v` is reachable via a
  directed path.

  `children(x,v)` finds all variables `w` connected to `v` by an edge
  \\v\\ -\> \\w\\.

  `parents(x,v)` finds all variables `w` connected to `v` by an edge
  \\w\\ -\> \\v\\.

  `markovBlanket(x,v`) returns `x`'s parents, its children, and all
  other parents of its children. The Markov blanket always renders `x`
  independent of all other nodes in the graph.

  By convention, `descendants(x,v)` and `ancestors(x,v)` include `v` but
  `children(x,v)` and `parents(x,v)` do not.

## Examples

``` r
g <- dagitty("graph{ a <-> x -> b ; c -- x <- d }")
# Includes "x"
descendants(g,"x")
#> [1] "x" "b"
# Does not include "x"
descendants(g,"x",TRUE)
#> [1] "b"
parents(g,"x")
#> [1] "d"
spouses(g,"x") 
#> [1] "a"
```
