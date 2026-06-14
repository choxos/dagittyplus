test_that("selected nodes can be set and retrieved", {
	g <- dagitty("dag { x -> s <- y }")
	selectedNodes(g) <- "s"
	expect_equal(selectedNodes(g), "s")
	expect_true(grepl("selected", as.character(g)))
})

test_that("setVariableStatus accepts the 'selected' status", {
	g <- dagitty("dag { a -> b }")
	g2 <- setVariableStatus(g, "selected", "b")
	expect_equal(selectedNodes(g2), "b")
})

test_that("setVariableStatus rejects unknown statuses", {
	g <- dagitty("dag { a -> b }")
	expect_error(setVariableStatus(g, "bogus", "a"))
})
