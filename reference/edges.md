# Graph Edges

Extracts edge information from the input graph.

## Usage

``` r
edges(x)
```

## Arguments

- x:

  the input graph, of any type.

## Value

a data frame with the following variables:

- v:

  name of the start node.

- w:

  name of the end node. For symmetric edges (bidirected and undirected),
  the order of start and end node is arbitrary.

- e:

  type of edge. Can be one of `"->"`, `"<->"` and `"--"`.

- x:

  X coordinate for a control point. If this is not `NA`, then the edge
  is drawn as an [`xspline`](https://rdrr.io/r/graphics/xspline.html)
  through the start point, this control point, and the end point. This
  is especially important for cases where there is more than one edge
  between two variables (for instance, both a directed and a bidirected
  edge).

- y:

  Y coordinate for a control point.

## Examples

``` r
## Which kinds of edges are used in the Shrier example?
levels( edges( getExample("Shrier") )$e )
#> NULL
```
