#' Launch the DAGitty+ Shiny application
#'
#' Starts a local Shiny app that embeds the DAGitty+ web editor and provides
#' point-and-click causal analysis (adjustment sets, testable implications, and
#' instrumental variables) powered by this package. The bundled app requires the
#' \pkg{shiny} and \pkg{bslib} packages.
#'
#' @param ... Additional arguments passed to [shiny::runApp()], for example
#'   `launch.browser` or `port`.
#' @return Called for its side effect of launching the app; does not return a
#'   useful value.
#' @examples
#' \dontrun{
#' launch_dagittyplus()
#' }
#' @export
launch_dagittyplus <- function(...) {
	for (pkg in c("shiny", "bslib")) {
		if (!requireNamespace(pkg, quietly = TRUE)) {
			stop(
				"Package '", pkg, "' is required to run the DAGitty+ app. ",
				"Install it with install.packages(\"", pkg, "\").",
				call. = FALSE
			)
		}
	}
	app_dir <- system.file("shiny-apps", "DagittyPlus", package = "dagittyplus")
	if (!nzchar(app_dir)) {
		stop(
			"Could not find the bundled Shiny app. Try reinstalling dagittyplus.",
			call. = FALSE
		)
	}
	shiny::runApp(app_dir, ...)
}
