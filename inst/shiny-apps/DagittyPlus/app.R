# DAGitty+ bundled Shiny app.
# "Draw" embeds the redesigned web editor (the same JavaScript engine this
# package runs through V8). "Analyze" runs the package's own R functions on a
# model you type, so it works offline and matches the editor's results.

library(shiny)
library(bslib)
library(dagittyplus)

`%||%` <- function(a, b) if (is.null(a) || length(a) == 0 || !nzchar(a[1])) b else a

default_model <- 'dag {
  x [exposure]
  y [outcome]
  z -> x
  z -> y
  x -> y
}'

ui <- page_navbar(
  title = "DAGitty+",
  theme = bs_theme(version = 5),
  nav_panel(
    "Draw",
    card(
      full_screen = TRUE,
      card_header("Interactive editor"),
      tags$iframe(
        src = "https://choxos.github.io/dagittyplus/app/",
        style = "width:100%; height:78vh; border:0;",
        title = "DAGitty+ web editor"
      ),
      card_footer(
        "The browser editor runs the same analysis engine as this package. ",
        "It needs an internet connection; the Analyze tab works offline."
      )
    )
  ),
  nav_panel(
    "Analyze",
    layout_sidebar(
      sidebar = sidebar(
        width = 360,
        textAreaInput("code", "Model (dagitty syntax)", value = default_model, rows = 12),
        selectInput("exposure", "Exposure", choices = NULL),
        selectInput("outcome", "Outcome", choices = NULL),
        actionButton("go", "Analyze", class = "btn-primary"),
        uiOutput("parse_error")
      ),
      navset_card_tab(
        nav_panel("Diagram", plotOutput("dag_plot", height = "440px")),
        nav_panel("Adjustment sets", verbatimTextOutput("adj")),
        nav_panel("Implications", verbatimTextOutput("impl")),
        nav_panel("Instruments", verbatimTextOutput("iv"))
      )
    )
  )
)

server <- function(input, output, session) {
  parsed <- reactive({
    req(input$code)
    tryCatch(dagitty(input$code), error = function(e) e)
  })

  output$parse_error <- renderUI({
    p <- parsed()
    if (inherits(p, "error")) {
      div(class = "text-danger small mt-2", "Parse error: ", conditionMessage(p))
    }
  })

  observeEvent(parsed(), {
    g <- parsed()
    if (!inherits(g, "error")) {
      vars <- names(g)
      updateSelectInput(session, "exposure", choices = vars,
                        selected = exposures(g) %||% vars[1])
      updateSelectInput(session, "outcome", choices = vars,
                        selected = outcomes(g) %||% vars[length(vars)])
    }
  })

  model <- eventReactive(input$go, {
    g <- parsed()
    validate(need(!inherits(g, "error"), "Fix the model syntax first."))
    if (!is.null(input$exposure) && nzchar(input$exposure)) exposures(g) <- input$exposure
    if (!is.null(input$outcome) && nzchar(input$outcome)) outcomes(g) <- input$outcome
    g
  }, ignoreNULL = FALSE)

  output$dag_plot <- renderPlot({
    g <- model()
    g <- tryCatch(graphLayout(g), error = function(e) g)
    plot(g)
  })
  output$adj <- renderPrint(print(adjustmentSets(model())))
  output$impl <- renderPrint(print(impliedConditionalIndependencies(model())))
  output$iv <- renderPrint(print(instrumentalVariables(model())))
}

shinyApp(ui, server)
