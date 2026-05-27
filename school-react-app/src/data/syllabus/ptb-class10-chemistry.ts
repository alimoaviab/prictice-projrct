/**
 * PTB Class 10 Chemistry Syllabus
 * Chapters 14–26 (continuation from Class 9)
 */

export interface Chapter {
  id: string;
  code: string;
  title: string;
  type: "chapter";
}

export interface Unit {
  id: string;
  title: string;
  type: "unit";
  chapters: Chapter[];
}

export const PTB_CLASS10_CHEMISTRY: Unit[] = [
  {
    id: "chap-14",
    title: "CHAP 14: STATES OF MATTER AND PHASE CHANGES",
    type: "unit",
    chapters: [
      { id: "14.1", code: "14.1", title: "Internal Energy",                                                   type: "chapter" },
      { id: "14.2", code: "14.2", title: "Interconversion of Physical States",                                type: "chapter" },
      { id: "14.3", code: "14.3", title: "HEATING AND COOLING CURVES",                                        type: "chapter" },
      { id: "14.4", code: "14.4", title: "Evaporation and Boiling",                                           type: "chapter" },
      { id: "14.5", code: "14.5", title: "Sublimation",                                                       type: "chapter" },
      { id: "14.6", code: "14.6", title: "APPLICATIONS OF SUBLIMATION",                                       type: "chapter" },
      { id: "14.7", code: "14.7", title: "KINETIC THEORY AND THE GAS LAWS",                                   type: "chapter" },
      { id: "14.8", code: "14.8", title: "Diffusion",                                                         type: "chapter" },
      { id: "14.9", code: "14.9", title: "IMPORTANCE OF RATES OF DIFFUSION OF MEDICINES IN HUMAN BODY",      type: "chapter" },
    ],
  },
  {
    id: "chap-15",
    title: "CHAP 15: STOICHIOMETRY",
    type: "unit",
    chapters: [
      { id: "15.1", code: "15.1", title: "MOLAR VOLUME",                                                                        type: "chapter" },
      { id: "15.2", code: "15.2", title: "CONCENTRATION OF A SOLUTION",                                                         type: "chapter" },
      { id: "15.3", code: "15.3", title: "CALCULATE THE CONCENTRATION OF A SOLUTION IN TITRATION USING EMPIRICAL DATA",        type: "chapter" },
      { id: "15.4", code: "15.4", title: "PERCENTAGE COMPOSITION BY MASS, EMPIRICAL FORMULA AND MOLECULAR FORMULA",           type: "chapter" },
      { id: "15.5", code: "15.5", title: "Empirical Formula",                                                                   type: "chapter" },
      { id: "15.6", code: "15.6", title: "Limiting Reactant",                                                                   type: "chapter" },
      { id: "15.7", code: "15.7", title: "Yield",                                                                               type: "chapter" },
    ],
  },
  {
    id: "chap-16",
    title: "CHAP 16: ELECTROCHEMISTRY",
    type: "unit",
    chapters: [
      { id: "16.1",  code: "16.1",  title: "OXIDATION NUMBER OF ATOMS IN COMPOUNDS AND IONS",                                              type: "chapter" },
      { id: "16.2",  code: "16.2",  title: "WRITING CHEMICAL FORMULAS OF IONIC COMPOUNDS BY APPLYING OXIDATION NUMBERS",                  type: "chapter" },
      { id: "16.3",  code: "16.3",  title: "WRITING CHEMICAL FORMULAS OF IONIC COMPOUNDS USING IONIC CHARGES",                           type: "chapter" },
      { id: "16.4",  code: "16.4",  title: "OXIDATION AND REDUCTION",                                                                      type: "chapter" },
      { id: "16.5",  code: "16.5",  title: "OXIDATION-REDUCTION REACTIONS",                                                               type: "chapter" },
      { id: "16.6",  code: "16.6",  title: "ELECTROLYSIS",                                                                                 type: "chapter" },
      { id: "16.7",  code: "16.7",  title: "ELECTROLYSIS OF A CONCENTRATED AQUEOUS SOLUTION OF SODIUM CHLORIDE (BRINE) USING INERT ELECTRODES (GRAPHITE /PT)", type: "chapter" },
      { id: "16.8",  code: "16.8",  title: "ELECTROLYSIS OF DILUTE AND CONCENTRATED AQUEOUS SOLUTIONS OF METAL HALIDES",                 type: "chapter" },
      { id: "16.9",  code: "16.9",  title: "ELECTROLYSIS OF CONCENTRATED AQUEOUS SOLUTIONS OF METAL HALIDES",                           type: "chapter" },
      { id: "16.10", code: "16.10", title: "ELECTROLYSIS OF MOLTEN LEAD (II) CHLORIDE",                                                   type: "chapter" },
      { id: "16.11", code: "16.11", title: "ELECTROLYSIS OF DILUTE SOLUTION OF SULPHURIC ACID USING INERT ELECTRODES (CARBON OR PT)",   type: "chapter" },
      { id: "16.12", code: "16.12", title: "ELECTROLYSIS OF DILUTE AQUEOUS SOLUTION OF COPPER SULPHATE USING INERT ELECTRODES OR COPPER ELECTRODES", type: "chapter" },
      { id: "16.13", code: "16.13", title: "FUEL CELLS",                                                                                  type: "chapter" },
      { id: "16.14", code: "16.14", title: "CORROSION",                                                                                   type: "chapter" },
      { id: "16.15", code: "16.15", title: "ELECTROPLATING",                                                                              type: "chapter" },
      { id: "16.16", code: "16.16", title: "GALVANIC CELLS",                                                                              type: "chapter" },
      { id: "16.17", code: "16.17", title: "ORDER OF REACTIVITY OF METALS USING VOLTAGE DATA",                                           type: "chapter" },
    ],
  },
  {
    id: "chap-17",
    title: "CHAP 17: REACTION KINETICS",
    type: "unit",
    chapters: [
      { id: "17.1", code: "17.1", title: "COLLISION THEORY OF REACTION RATE",                type: "chapter" },
      { id: "17.2", code: "17.2", title: "CHANGE IN MASS DURING A CHEMICAL REACTION",        type: "chapter" },
      { id: "17.3", code: "17.3", title: "CHANGE IN TEMPERATURE DURING A CHEMICAL REACTION", type: "chapter" },
      { id: "17.4", code: "17.4", title: "FACTORS AFFECTING THE RATES OF REACTIONS",         type: "chapter" },
      { id: "17.5", code: "17.5", title: "Importance of Chemical Kinetics in Food Industry", type: "chapter" },
    ],
  },
  {
    id: "chap-18",
    title: "CHAP 18: SALTS",
    type: "unit",
    chapters: [
      { id: "18.1", code: "18.1", title: "Arrangement of Ions in Salts",              type: "chapter" },
      { id: "18.2", code: "18.2", title: "Melting Points of Ionic Compounds",         type: "chapter" },
      { id: "18.3", code: "18.3", title: "Conduction of Electricity by Ionic Compounds", type: "chapter" },
      { id: "18.4", code: "18.4", title: "Soluble and Insoluble Salts",               type: "chapter" },
      { id: "18.5", code: "18.5", title: "Preparation of Soluble Salts",              type: "chapter" },
    ],
  },
  {
    id: "chap-19",
    title: "CHAP 19: NITROGEN AND SULPHUR",
    type: "unit",
    chapters: [
      { id: "19.1", code: "19.1", title: "Ammonia",                                              type: "chapter" },
      { id: "19.2", code: "19.2", title: "Sulphuric Acid",                                       type: "chapter" },
      { id: "19.3", code: "19.3", title: "Oxides",                                               type: "chapter" },
      { id: "19.4", code: "19.4", title: "Metals",                                               type: "chapter" },
      { id: "19.5", code: "19.5", title: "Reactivity Series of metals",                          type: "chapter" },
      { id: "19.6", code: "19.6", title: "Role of oxides of nitrogen in spreading air pollution", type: "chapter" },
    ],
  },
  {
    id: "chap-20",
    title: "CHAP 20: WATER",
    type: "unit",
    chapters: [
      { id: "20.1",  code: "20.1",  title: "Water",                                                    type: "chapter" },
      { id: "20.2",  code: "20.2",  title: "Purity of Water",                                          type: "chapter" },
      { id: "20.3",  code: "20.3",  title: "Difference between distilled water and tap water",         type: "chapter" },
      { id: "20.4",  code: "20.4",  title: "SUBSTANCES PRESENT IN WATER obtained from natural sources", type: "chapter" },
      { id: "20.5",  code: "20.5",  title: "Treatment of Domestic Water Supply",                       type: "chapter" },
      { id: "20.6",  code: "20.6",  title: "Effects of pollutants present in water",                   type: "chapter" },
      { id: "20.7",  code: "20.7",  title: "WATER SCARCITY IN PAKISTAN",                               type: "chapter" },
      { id: "20.8",  code: "20.8",  title: "Elements Essential for Plant Growth",                      type: "chapter" },
      { id: "20.9",  code: "20.9",  title: "Fertilizers",                                              type: "chapter" },
      { id: "20.10", code: "20.10", title: "Classification of Fertilizers",                            type: "chapter" },
    ],
  },
  {
    id: "chap-21",
    title: "CHAP 21: ORGANIC CHEMISTRY",
    type: "unit",
    chapters: [
      { id: "21.1", code: "21.1", title: "Classifications of Organic Compounds", type: "chapter" },
      { id: "21.2", code: "21.2", title: "Structural Formula",                   type: "chapter" },
      { id: "21.3", code: "21.3", title: "Homologous Series",                    type: "chapter" },
      { id: "21.4", code: "21.4", title: "Isomerism",                            type: "chapter" },
      { id: "21.5", code: "21.5", title: "Functional Group",                     type: "chapter" },
      { id: "21.6", code: "21.6", title: "Naming Organic Compounds",             type: "chapter" },
    ],
  },
  {
    id: "chap-22",
    title: "CHAP 22: HYDROCARBONS",
    type: "unit",
    chapters: [
      { id: "22.1", code: "22.1", title: "Alkenes",                         type: "chapter" },
      { id: "22.2", code: "22.2", title: "Important Reactions of Alkenes",  type: "chapter" },
      { id: "22.3", code: "22.3", title: "Alkynes",                         type: "chapter" },
      { id: "22.4", code: "22.4", title: "Sources of organic compounds",    type: "chapter" },
      { id: "22.5", code: "22.5", title: "Refining of Petroleum",           type: "chapter" },
    ],
  },
  {
    id: "chap-23",
    title: "CHAP 23: MONOHYDROXY ALKANES OR ALCOHOLS",
    type: "unit",
    chapters: [
      { id: "23.1", code: "23.1", title: "MANUFACTURE OF ETHYL ALCOHOL (CH3-CH2-OH)", type: "chapter" },
      { id: "23.2", code: "23.2", title: "Combustion of Alcohols",                    type: "chapter" },
      { id: "23.3", code: "23.3", title: "Applications of Alcohols as Fuels",         type: "chapter" },
      { id: "23.4", code: "23.4", title: "Role of Ethanol in Industries",             type: "chapter" },
      { id: "23.5", code: "23.5", title: "Impact of Alcohols on Daily life",          type: "chapter" },
    ],
  },
  {
    id: "chap-24",
    title: "CHAP 24: CARBOXYLIC ACIDS",
    type: "unit",
    chapters: [
      { id: "24.1", code: "24.1", title: "Preparation of Acetic Acid or Ethanoic Acid",             type: "chapter" },
      { id: "24.2", code: "24.2", title: "Reactions of Carboxylic Acids",                           type: "chapter" },
      { id: "24.3", code: "24.3", title: "REACTION OF CARBOXYLIC ACIDS WITH ALCOHOLS (ESTERIFICATION)", type: "chapter" },
      { id: "24.4", code: "24.4", title: "Industrial Applications of Carboxylic Acids and Esters",  type: "chapter" },
      { id: "24.5", code: "24.5", title: "Carboxylic Acids and Esters in Daily Life",               type: "chapter" },
    ],
  },
  {
    id: "chap-25",
    title: "CHAP 25: BIOCHEMISTRY",
    type: "unit",
    chapters: [
      { id: "25.1", code: "25.1", title: "The Importance of Nutrition",     type: "chapter" },
      { id: "25.2", code: "25.2", title: "Carbohydrates",                   type: "chapter" },
      { id: "25.3", code: "25.3", title: "Proteins",                        type: "chapter" },
      { id: "25.4", code: "25.4", title: "Lipids",                          type: "chapter" },
      { id: "25.5", code: "25.5", title: "Vitamins",                        type: "chapter" },
      { id: "25.6", code: "25.6", title: "Nucleic Acids",                   type: "chapter" },
      { id: "25.7", code: "25.7", title: "Applications of Biochemistry",    type: "chapter" },
    ],
  },
  {
    id: "chap-26",
    title: "CHAP 26: POLYMERS",
    type: "unit",
    chapters: [
      { id: "26.1", code: "26.1", title: "TYPES OF POLYMERS",                             type: "chapter" },
      { id: "26.2", code: "26.2", title: "Structure of Monomer from Polymer",             type: "chapter" },
      { id: "26.3", code: "26.3", title: "Plastics",                                      type: "chapter" },
      { id: "26.4", code: "26.4", title: "Importance of Polymers in Textile Industry",   type: "chapter" },
      { id: "26.5", code: "26.5", title: "Adverse Effects of Plastics",                  type: "chapter" },
    ],
  },
];

export function getAllChapters(): Chapter[] {
  return PTB_CLASS10_CHEMISTRY.flatMap((u) => u.chapters);
}
export function getChaptersByUnit(unitId: string): Chapter[] {
  return PTB_CLASS10_CHEMISTRY.find((u) => u.id === unitId)?.chapters || [];
}
export function getUnitByChapterId(chapterId: string): Unit | undefined {
  return PTB_CLASS10_CHEMISTRY.find((u) => u.chapters.some((ch) => ch.id === chapterId));
}
