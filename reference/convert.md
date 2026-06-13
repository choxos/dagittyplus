# Convert from DAGitty object to other graph types

Converts its argument from a DAGitty object (or character string
describing it) to another package's format, if possible.

## Usage

``` r
convert(x, to, ...)
```

## Arguments

- x:

  a `dagitty` object or a character string.

- to:

  destination format, currently one of "dagitty", "tikz", "lavaan",
  "bnlearn", or "causaleffect".

- ...:

  further arguments passed on to methods (currently unused)
