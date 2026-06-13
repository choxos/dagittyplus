# Launch the DAGitty+ Shiny application

Starts a local Shiny app that embeds the DAGitty+ web editor and
provides point-and-click causal analysis (adjustment sets, testable
implications, and instrumental variables) powered by this package. The
bundled app requires the shiny and bslib packages.

## Usage

``` r
launch_dagittyplus(...)
```

## Arguments

- ...:

  Additional arguments passed to
  [`shiny::runApp()`](https://rdrr.io/pkg/shiny/man/runApp.html), for
  example `launch.browser` or `port`.

## Value

Called for its side effect of launching the app; does not return a
useful value.

## Examples

``` r
if (FALSE) { # \dontrun{
launch_dagittyplus()
} # }
```
