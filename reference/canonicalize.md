# Canonicalize an Ancestral Graph

Takes an input ancestral graph (a graph with directed, bidirected and
undirected edges) and converts it to a DAG by replacing every bidirected
edge x \<-\> y with a substructure x \<- L -\> y, where L is a latent
variable, and every undirected edge x – y with a substructure x -\> S
\<- y, where S is a selection variable. This function does not check
whether the input is actually an ancestral graph.

## Usage

``` r
canonicalize(x)
```

## Arguments

- x:

  the input graph, a DAG or MAG.

## Value

A list containing the following components:

- g:

  The resulting graph.

- L:

  Names of newly inserted latent variables.

- S:

  Names of newly inserted selection variables.

## Examples

``` r
canonicalize("mag{x<->y--z}") # introduces two new variables
#> $g
#> dag {
#> L1 [latent]
#> S1 [selected]
#> x
#> y
#> z
#> L1 -> x
#> L1 -> y
#> y -> S1
#> z -> S1
#> }
#> 
#> $L
#> [1] "L1"
#> 
#> $S
#> [1] "S1"
#> 
```
