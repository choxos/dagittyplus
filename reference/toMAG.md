# Convert DAG to MAG.

Given a DAG, possibly with latent variables, construct a MAG that
represents its marginal independence model.

## Usage

``` r
toMAG(x)
```

## Arguments

- x:

  the input graph, a DAG

## Examples

``` r
toMAG( "dag { ParentalSmoking->Smoking 
  { Profession [latent] } -> {Income->Smoking}
  Genotype -> {Smoking->LungCancer} }")
#> mag {
#> Genotype
#> Income
#> LungCancer
#> ParentalSmoking
#> Smoking
#> Genotype -> LungCancer
#> Genotype -> Smoking
#> Income -> Smoking
#> ParentalSmoking -> Smoking
#> Smoking -> LungCancer
#> }
```
