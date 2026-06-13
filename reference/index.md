# Package index

## Create and load models

- [`dagitty()`](https://choxos.github.io/dagittyplus/reference/dagitty.md)
  : Parse DAGitty Graph
- [`as.dagitty()`](https://choxos.github.io/dagittyplus/reference/as.dagitty.md)
  : Convert to DAGitty object
- [`is.dagitty()`](https://choxos.github.io/dagittyplus/reference/is.dagitty.md)
  : Test for Graph Class
- [`getExample()`](https://choxos.github.io/dagittyplus/reference/getExample.md)
  : Get Bundled Examples
- [`downloadGraph()`](https://choxos.github.io/dagittyplus/reference/downloadGraph.md)
  : Load Graph from dagitty.net
- [`randomDAG()`](https://choxos.github.io/dagittyplus/reference/randomDAG.md)
  : Generate DAG at Random
- [`graphLayout()`](https://choxos.github.io/dagittyplus/reference/graphLayout.md)
  : Generate Graph Layout
- [`canonicalize()`](https://choxos.github.io/dagittyplus/reference/canonicalize.md)
  : Canonicalize an Ancestral Graph
- [`completeDAG()`](https://choxos.github.io/dagittyplus/reference/completeDAG.md)
  : Generate Complete DAG

## Variables and their roles

- [`exposures()`](https://choxos.github.io/dagittyplus/reference/VariableStatus.md)
  [`` `exposures<-`() ``](https://choxos.github.io/dagittyplus/reference/VariableStatus.md)
  [`outcomes()`](https://choxos.github.io/dagittyplus/reference/VariableStatus.md)
  [`` `outcomes<-`() ``](https://choxos.github.io/dagittyplus/reference/VariableStatus.md)
  [`latents()`](https://choxos.github.io/dagittyplus/reference/VariableStatus.md)
  [`` `latents<-`() ``](https://choxos.github.io/dagittyplus/reference/VariableStatus.md)
  [`adjustedNodes()`](https://choxos.github.io/dagittyplus/reference/VariableStatus.md)
  [`` `adjustedNodes<-`() ``](https://choxos.github.io/dagittyplus/reference/VariableStatus.md)
  [`setVariableStatus()`](https://choxos.github.io/dagittyplus/reference/VariableStatus.md)
  : Variable Statuses
- [`coordinates()`](https://choxos.github.io/dagittyplus/reference/coordinates.md)
  [`` `coordinates<-`() ``](https://choxos.github.io/dagittyplus/reference/coordinates.md)
  : Plot Coordinates of Variables in Graph
- [`names(`*`<dagitty>`*`)`](https://choxos.github.io/dagittyplus/reference/names.dagitty.md)
  : Names of Variables in Graph

## Graph relations

- [`descendants()`](https://choxos.github.io/dagittyplus/reference/AncestralRelations.md)
  [`ancestors()`](https://choxos.github.io/dagittyplus/reference/AncestralRelations.md)
  [`children()`](https://choxos.github.io/dagittyplus/reference/AncestralRelations.md)
  [`parents()`](https://choxos.github.io/dagittyplus/reference/AncestralRelations.md)
  [`neighbours()`](https://choxos.github.io/dagittyplus/reference/AncestralRelations.md)
  [`spouses()`](https://choxos.github.io/dagittyplus/reference/AncestralRelations.md)
  [`adjacentNodes()`](https://choxos.github.io/dagittyplus/reference/AncestralRelations.md)
  [`markovBlanket()`](https://choxos.github.io/dagittyplus/reference/AncestralRelations.md)
  : Ancestral Relations
- [`exogenousVariables()`](https://choxos.github.io/dagittyplus/reference/exogenousVariables.md)
  : Retrieve Exogenous Variables

## Edges, paths, and structure

- [`edges()`](https://choxos.github.io/dagittyplus/reference/edges.md) :
  Graph Edges
- [`paths()`](https://choxos.github.io/dagittyplus/reference/paths.md) :
  Show Paths
- [`graphType()`](https://choxos.github.io/dagittyplus/reference/graphType.md)
  : Get Graph Type
- [`isAcyclic()`](https://choxos.github.io/dagittyplus/reference/isAcyclic.md)
  [`findCycle()`](https://choxos.github.io/dagittyplus/reference/isAcyclic.md)
  : Test for Cycles
- [`isCollider()`](https://choxos.github.io/dagittyplus/reference/isCollider.md)
  : Test for Colliders
- [`topologicalOrdering()`](https://choxos.github.io/dagittyplus/reference/topologicalOrdering.md)
  : Get Topological Ordering of DAG

## Causal effect identification

- [`adjustmentSets()`](https://choxos.github.io/dagittyplus/reference/adjustmentSets.md)
  : Covariate Adjustment Sets
- [`isAdjustmentSet()`](https://choxos.github.io/dagittyplus/reference/isAdjustmentSet.md)
  : Adjustment Criterion
- [`backDoorGraph()`](https://choxos.github.io/dagittyplus/reference/backDoorGraph.md)
  : Back-Door Graph
- [`instrumentalVariables()`](https://choxos.github.io/dagittyplus/reference/instrumentalVariables.md)
  : Find Instrumental Variables

## d-separation and testable implications

- [`dconnected()`](https://choxos.github.io/dagittyplus/reference/dconnected.md)
  [`dseparated()`](https://choxos.github.io/dagittyplus/reference/dconnected.md)
  : d-Separation
- [`impliedConditionalIndependencies()`](https://choxos.github.io/dagittyplus/reference/impliedConditionalIndependencies.md)
  : List Implied Conditional Independencies
- [`localTests()`](https://choxos.github.io/dagittyplus/reference/localTests.md)
  [`ciTest()`](https://choxos.github.io/dagittyplus/reference/localTests.md)
  : Test Graph against Data
- [`plotLocalTestResults()`](https://choxos.github.io/dagittyplus/reference/plotLocalTestResults.md)
  : Plot Results of Local Tests
- [`vanishingTetrads()`](https://choxos.github.io/dagittyplus/reference/vanishingTetrads.md)
  : List Implied Vanishing Tetrads
- [`impliedCovarianceMatrix()`](https://choxos.github.io/dagittyplus/reference/impliedCovarianceMatrix.md)
  : Implied Covariance Matrix of a Gaussian Graphical Model

## Equivalence and graph transformations

- [`equivalenceClass()`](https://choxos.github.io/dagittyplus/reference/EquivalentModels.md)
  [`equivalentDAGs()`](https://choxos.github.io/dagittyplus/reference/EquivalentModels.md)
  : Generating Equivalent Models
- [`orientPDAG()`](https://choxos.github.io/dagittyplus/reference/orientPDAG.md)
  : Orient Edges in PDAG.
- [`moralize()`](https://choxos.github.io/dagittyplus/reference/moralize.md)
  : Moral Graph
- [`ancestorGraph()`](https://choxos.github.io/dagittyplus/reference/ancestorGraph.md)
  : Ancestor Graph
- [`toMAG()`](https://choxos.github.io/dagittyplus/reference/toMAG.md) :
  Convert DAG to MAG.
- [`measurementPart()`](https://choxos.github.io/dagittyplus/reference/measurementPart.md)
  : Extract Measurement Part from Structural Equation Model
- [`structuralPart()`](https://choxos.github.io/dagittyplus/reference/structuralPart.md)
  : Extract Structural Part from Structural Equation Model

## Data simulation

- [`simulateSEM()`](https://choxos.github.io/dagittyplus/reference/simulateSEM.md)
  : Simulate Data from Structural Equation Model
- [`simulateLogistic()`](https://choxos.github.io/dagittyplus/reference/simulateLogistic.md)
  : Simulate Binary Data from DAG Structure

## Conversion and interoperability

- [`convert()`](https://choxos.github.io/dagittyplus/reference/convert.md)
  : Convert from DAGitty object to other graph types
- [`lavaanToGraph()`](https://choxos.github.io/dagittyplus/reference/lavaanToGraph.md)
  : Convert Lavaan Model to DAGitty Graph

## Plotting

- [`plot(`*`<dagitty>`*`)`](https://choxos.github.io/dagittyplus/reference/plot.dagitty.md)
  : Plot Graph

## Shiny app

- [`launch_dagittyplus()`](https://choxos.github.io/dagittyplus/reference/launch_dagittyplus.md)
  : Launch the DAGitty+ Shiny application
