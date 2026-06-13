# Names of Variables in Graph

Extracts the variable names from an input graph. Useful for iterating
over all variables.

## Usage

``` r
# S3 method for class 'dagitty'
names(x)
```

## Arguments

- x:

  the input graph, of any type.

## Examples

``` r
## A "DAG" with Romanian and Swedish variable names. These can be
## input using quotes to overcome the limitations on unquoted identifiers.
g <- dagitty( 'digraph {
  "coração" [pos="0.297,0.502"]
  "hjärta" [pos="0.482,0.387"]
  "coração" -> "hjärta"
}' )
names( g )
#> [1] "coração" "hjärta" 
```
