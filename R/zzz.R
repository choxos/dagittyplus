.onAttach <- function(libname, pkgname) {
	version <- utils::packageVersion(pkgname)
	packageStartupMessage(sprintf(
		paste0(
			"dagittyplus %s: draw and analyze causal diagrams (DAGs).\n",
			"Build a model with dagitty(); find adjustment sets with adjustmentSets(); ",
			"launch the editor with launch_dagittyplus().\n",
			"Web editor: https://choxos.github.io/dagittyplus/app/ | ",
			"Docs: https://choxos.github.io/dagittyplus/"
		),
		version
	))
	invisible()
}
