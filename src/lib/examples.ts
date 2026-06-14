// A curated library of example causal models drawn from many fields, not just
// health research. Each model is valid dagitty syntax with positions, so it
// lays out cleanly when loaded. Grouped by field for the Examples menu.

export interface ExampleModel {
  name: string;
  field: string;
  code: string;
}

export const EXAMPLES: ExampleModel[] = [
  // ---------------------------------------------------------------- core ideas
  {
    name: "Confounding",
    field: "Core concepts",
    code: `dag {
      X [exposure,pos="0,1"]
      Y [outcome,pos="2,1"]
      Z [pos="1,0"]
      X -> Y
      Z -> X
      Z -> Y
    }`,
  },
  {
    name: "Mediation",
    field: "Core concepts",
    code: `dag {
      X [exposure,pos="0,0"]
      M [pos="1,0"]
      Y [outcome,pos="2,0"]
      X -> M
      M -> Y
      X -> Y
    }`,
  },
  {
    name: "Collider (selection bias)",
    field: "Core concepts",
    code: `dag {
      X [exposure,pos="0,0"]
      Y [outcome,pos="2,0"]
      C [pos="1,1"]
      X -> Y
      X -> C
      Y -> C
    }`,
  },
  {
    name: "M-bias",
    field: "Core concepts",
    code: `dag {
      X [exposure,pos="0,2"]
      Y [outcome,pos="3,2"]
      U1 [latent,pos="0,0"]
      U2 [latent,pos="3,0"]
      Z [pos="1.5,1"]
      X -> Y
      U1 -> X
      U1 -> Z
      U2 -> Y
      U2 -> Z
    }`,
  },

  // ------------------------------------------------------------------ economics
  {
    name: "Returns to schooling (IV)",
    field: "Economics",
    code: `dag {
      Education [exposure,pos="1,1"]
      Earnings [outcome,pos="3,1"]
      Ability [latent,pos="2,0"]
      Proximity [pos="0,1"]
      Education -> Earnings
      Ability -> Education
      Ability -> Earnings
      Proximity -> Education
    }`,
  },
  {
    name: "Job training and employment",
    field: "Economics",
    code: `dag {
      Training [exposure,pos="0,1"]
      Employment [outcome,pos="2,1"]
      Motivation [latent,pos="1,0"]
      PriorEarnings [pos="1,2"]
      Training -> Employment
      Motivation -> Training
      Motivation -> Employment
      PriorEarnings -> Training
      PriorEarnings -> Employment
    }`,
  },

  // ------------------------------------------------------------- social science
  {
    name: "Education and adult income",
    field: "Social science",
    code: `dag {
      FamilyIncome [pos="0,0"]
      Education [exposure,pos="1,1"]
      AdultIncome [outcome,pos="3,1"]
      Neighborhood [pos="0,2"]
      FamilyIncome -> Education
      FamilyIncome -> AdultIncome
      Education -> AdultIncome
      Neighborhood -> Education
      Neighborhood -> AdultIncome
    }`,
  },

  // ------------------------------------------------------------ political science
  {
    name: "Campaign spending and votes",
    field: "Political science",
    code: `dag {
      Spending [exposure,pos="0,1"]
      VoteShare [outcome,pos="2,1"]
      Incumbency [pos="1,0"]
      Spending -> VoteShare
      Incumbency -> Spending
      Incumbency -> VoteShare
    }`,
  },

  // -------------------------------------------------------------------- education
  {
    name: "Class size and test scores",
    field: "Education",
    code: `dag {
      ClassSize [exposure,pos="0,1"]
      TestScore [outcome,pos="2,1"]
      SchoolSES [pos="1,0"]
      TeacherQuality [pos="1,2"]
      ClassSize -> TestScore
      SchoolSES -> ClassSize
      SchoolSES -> TestScore
      TeacherQuality -> TestScore
    }`,
  },

  // -------------------------------------------------------------------- marketing
  {
    name: "Advertising and purchases",
    field: "Marketing",
    code: `dag {
      AdExposure [exposure,pos="0,1"]
      Purchase [outcome,pos="2,1"]
      BrandAffinity [latent,pos="1,0"]
      AdExposure -> Purchase
      BrandAffinity -> AdExposure
      BrandAffinity -> Purchase
    }`,
  },

  // -------------------------------------------------------------------- psychology
  {
    name: "Stress, sleep, and mood",
    field: "Psychology",
    code: `dag {
      Stress [exposure,pos="0,1"]
      Sleep [pos="1,0"]
      Mood [outcome,pos="2,1"]
      Stress -> Sleep
      Sleep -> Mood
      Stress -> Mood
    }`,
  },

  // ----------------------------------------------------------------------- ecology
  {
    name: "Rainfall and herbivores",
    field: "Ecology",
    code: `dag {
      Rainfall [exposure,pos="0,1"]
      Vegetation [pos="1,1"]
      Herbivores [outcome,pos="3,1"]
      Temperature [pos="1,0"]
      Rainfall -> Vegetation
      Vegetation -> Herbivores
      Temperature -> Vegetation
      Temperature -> Herbivores
    }`,
  },

  // -------------------------------------------------------------- machine learning
  {
    name: "Recommender click selection",
    field: "Machine learning",
    code: `dag {
      Shown [exposure,pos="0,1"]
      Click [outcome,pos="2,1"]
      Interest [latent,pos="1,0"]
      Click [selected]
      Shown -> Click
      Interest -> Shown
      Interest -> Click
    }`,
  },

  // ----------------------------------------------------------------------- genetics
  {
    name: "Mendelian randomization",
    field: "Genetic epidemiology",
    code: `dag {
      Genotype [pos="0,1"]
      Exposure [exposure,pos="1,1"]
      Outcome [outcome,pos="3,1"]
      Confounder [latent,pos="2,0"]
      Genotype -> Exposure
      Exposure -> Outcome
      Confounder -> Exposure
      Confounder -> Outcome
    }`,
  },

  // ------------------------------------------------------------------- epidemiology
  {
    name: "Smoking, tar, and cancer",
    field: "Epidemiology",
    code: `dag {
      Smoking [exposure,pos="0,1"]
      Tar [pos="1,1"]
      Cancer [outcome,pos="3,1"]
      Genes [latent,pos="2,0"]
      Smoking -> Tar
      Tar -> Cancer
      Genes -> Smoking
      Genes -> Cancer
    }`,
  },
  {
    name: "Berkson's bias (hospitalization)",
    field: "Medicine",
    code: `dag {
      DiseaseA [exposure,pos="0,0"]
      DiseaseB [outcome,pos="2,0"]
      Hospitalized [pos="1,1"]
      Hospitalized [selected]
      DiseaseA -> Hospitalized
      DiseaseB -> Hospitalized
    }`,
  },
  {
    name: "Simpson's paradox (treatment)",
    field: "Medicine",
    code: `dag {
      Treatment [exposure,pos="0,1"]
      Recovery [outcome,pos="2,1"]
      Severity [pos="1,0"]
      Treatment -> Recovery
      Severity -> Treatment
      Severity -> Recovery
    }`,
  },
];

/** All curated examples (the default source for the Examples menu). */
export function loadExamples(): ExampleModel[] {
  return EXAMPLES;
}

/** Examples grouped by field, preserving first-seen field order. */
export function examplesByField(): { field: string; items: ExampleModel[] }[] {
  const groups: { field: string; items: ExampleModel[] }[] = [];
  for (const ex of EXAMPLES) {
    let g = groups.find((x) => x.field === ex.field);
    if (!g) {
      g = { field: ex.field, items: [] };
      groups.push(g);
    }
    g.items.push(ex);
  }
  return groups;
}
