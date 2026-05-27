/**
 * PTB Class 8 General Science Syllabus
 * 12 units with topics in uppercase/mixed case as provided
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

export const PTB_CLASS8_GENERAL_SCIENCE: Unit[] = [
  {
    id: "unit-1",
    title: "UNIT 1: Ecology",
    type: "unit",
    chapters: [
      { id: "1.1", code: "1.1", title: "CARBON AND OXYGEN CYCLE",             type: "chapter" },
      { id: "1.2", code: "1.2", title: "ENERGY FLOW IN THE ECOSYSTEM",        type: "chapter" },
      { id: "1.3", code: "1.3", title: "ENVIRONMENTAL PROBLEMS",              type: "chapter" },
      { id: "1.4", code: "1.4", title: "SOLUTIONS OF ENVIRONMENTAL PROBLEMS", type: "chapter" },
    ],
  },
  {
    id: "unit-2",
    title: "UNIT 2: Human Nervous System",
    type: "unit",
    chapters: [
      { id: "2.1", code: "2.1", title: "NERVOUS SYSTEM",  type: "chapter" },
      { id: "2.2", code: "2.2", title: "REFLEX ACTION",   type: "chapter" },
    ],
  },
  {
    id: "unit-3",
    title: "UNIT 3: Variation, Heredity and Cell division",
    type: "unit",
    chapters: [
      { id: "3.1", code: "3.1", title: "Variation, Heredity and Cell division",    type: "chapter" },
      { id: "3.2", code: "3.2", title: "DIFFERENCE BETWEEN ADAPTATION AND VARIATION", type: "chapter" },
      { id: "3.3", code: "3.3", title: "BASIS OF HEREDITY",                        type: "chapter" },
      { id: "3.4", code: "3.4", title: "WATSON AND CRICK MODEL OF DNA",            type: "chapter" },
      { id: "3.5", code: "3.5", title: "TRANSMISSION OF CHARACTERS",              type: "chapter" },
      { id: "3.6", code: "3.6", title: "CELL DIVISION",                           type: "chapter" },
    ],
  },
  {
    id: "unit-4",
    title: "UNIT 4: Biotechnology",
    type: "unit",
    chapters: [
      { id: "4.1", code: "4.1", title: "GENETIC ENGINEERING",           type: "chapter" },
      { id: "4.2", code: "4.2", title: "FERMENTATION",                  type: "chapter" },
      { id: "4.3", code: "4.3", title: "BIOTECHNOLOGY PRODUCTS",        type: "chapter" },
      { id: "4.4", code: "4.4", title: "APPLICATIONS OF BIOTECHNOLOGY", type: "chapter" },
    ],
  },
  {
    id: "unit-5",
    title: "UNIT 5: Periodic Table",
    type: "unit",
    chapters: [
      { id: "5.1", code: "5.1", title: "PERIODIC TABLE OF ELEMENTS",               type: "chapter" },
      { id: "5.2", code: "5.2", title: "FIRST 18 ELEMENTS OF THE PERIODIC TABLE",  type: "chapter" },
      { id: "5.3", code: "5.3", title: "METALS AND NON-METALS",                    type: "chapter" },
    ],
  },
  {
    id: "unit-6",
    title: "UNIT 6: Chemical Reactions",
    type: "unit",
    chapters: [
      { id: "6.1", code: "6.1", title: "Chemical Reactions",                    type: "chapter" },
      { id: "6.2", code: "6.2", title: "ENERGY CHANGES IN CHEMICAL REACTIONS",  type: "chapter" },
      { id: "6.3", code: "6.3", title: "CHEMICAL BOND",                         type: "chapter" },
    ],
  },
  {
    id: "unit-7",
    title: "UNIT 7: Acids, Bases and Salts",
    type: "unit",
    chapters: [
      { id: "7.1", code: "7.1", title: "ACIDS",          type: "chapter" },
      { id: "7.2", code: "7.2", title: "BASES / ALKALIS", type: "chapter" },
      { id: "7.3", code: "7.3", title: "SALTS",          type: "chapter" },
      { id: "7.4", code: "7.4", title: "PH SCALE",       type: "chapter" },
      { id: "7.5", code: "7.5", title: "INDICTORS",      type: "chapter" },
    ],
  },
  {
    id: "unit-8",
    title: "UNIT 8: Force and Pressure",
    type: "unit",
    chapters: [
      { id: "8.1", code: "8.1", title: "BALANCED AND UNBALANCED FORCES",                           type: "chapter" },
      { id: "8.2", code: "8.2", title: "FLOATING AND SINKING WITH REFERENCE TO DENSITY",          type: "chapter" },
      { id: "8.3", code: "8.3", title: "PRESSURE, FORCE AND AREA",                                type: "chapter" },
      { id: "8.4", code: "8.4", title: "WATER PRESSURE",                                          type: "chapter" },
      { id: "8.5", code: "8.5", title: "HYDRAULIC LIFT (ELEVATOR)",                               type: "chapter" },
      { id: "8.6", code: "8.6", title: "EXAMINE THE EFFECT OF FORCE IN THE PRESENCE OF AIR PRESSURE", type: "chapter" },
    ],
  },
  {
    id: "unit-9",
    title: "UNIT 9: Reflection and Refraction",
    type: "unit",
    chapters: [
      { id: "9.1", code: "9.1", title: "SPEED OF LIGHT",                      type: "chapter" },
      { id: "9.2", code: "9.2", title: "OCCURANCE OF REFLECTION",             type: "chapter" },
      { id: "9.3", code: "9.3", title: "OPTICAL INSTRUMENTS USING PLANE MIRROR", type: "chapter" },
      { id: "9.4", code: "9.4", title: "REFRACTION",                          type: "chapter" },
      { id: "9.5", code: "9.5", title: "SPHERICAL MIRRORS",                   type: "chapter" },
    ],
  },
  {
    id: "unit-10",
    title: "UNIT 10: Electricity and Magnetism",
    type: "unit",
    chapters: [
      { id: "10.1", code: "10.1", title: "ELECTRIC CURRENT",                                              type: "chapter" },
      { id: "10.2", code: "10.2", title: "VOLTAGE AND RESISTANCE",                                        type: "chapter" },
      { id: "10.3", code: "10.3", title: "ELECTRIC POWER",                                                type: "chapter" },
      { id: "10.4", code: "10.4", title: "DANGERS OF OVERLOADING AND SHORT CIRCUIT",                      type: "chapter" },
      { id: "10.5", code: "10.5", title: "EARTH WIF, FUSE AND CIRCUIT BREAKER",                           type: "chapter" },
      { id: "10.6", code: "10.6", title: "PRECAUTIONARY MEASURES TO ENSURE THE SAFE USE OF ELECTRICITY",  type: "chapter" },
      { id: "10.7", code: "10.7", title: "USES OF ELECTROMAGNETS",                                        type: "chapter" },
    ],
  },
  {
    id: "unit-11",
    title: "UNIT 11: Technology in Everyday life",
    type: "unit",
    chapters: [
      { id: "11.1", code: "11.1", title: "MAKING BIOPLASTIC",                                    type: "chapter" },
      { id: "11.2", code: "11.2", title: "MAKING TOOTHPASTE",                                    type: "chapter" },
      { id: "11.3", code: "11.3", title: "PREPARATION OF SOAP AND DETERGENTS",                   type: "chapter" },
      { id: "11.4", code: "11.4", title: "ASSEMBLING A CONCAVE MIRROR SOLAR COOKER",             type: "chapter" },
      { id: "11.5", code: "11.5", title: "WORKING OF UPS TO OPERATE A FAN OR ENERGY SAVER",     type: "chapter" },
      { id: "11.6", code: "11.6", title: "ASSEMBLING A SIMPLE WIND TURBINE TO PRODUCE ELECTRICITY", type: "chapter" },
    ],
  },
  {
    id: "unit-12",
    title: "UNIT 12: Our Universe",
    type: "unit",
    chapters: [
      { id: "12.1", code: "12.1", title: "GALAXIES",                                                         type: "chapter" },
      { id: "12.2", code: "12.2", title: "SPACE EXPLORATION",                                                type: "chapter" },
      { id: "12.3", code: "12.3", title: "HOW DO ASTRONAUTS SURVIVE AND RESEARCH IN SPACE?",                 type: "chapter" },
      { id: "12.4", code: "12.4", title: "TECHNOLOGICAL TOOLS USED IN SPACE EXPLORATION",                   type: "chapter" },
      { id: "12.5", code: "12.5", title: "NEW TECHNOLOGIES DEVELOPED ON THE EARTH AS A RESULT OF SPACE EXPLORATION", type: "chapter" },
    ],
  },
];

export function getAllChapters(): Chapter[] {
  return PTB_CLASS8_GENERAL_SCIENCE.flatMap((u) => u.chapters);
}
export function getChaptersByUnit(unitId: string): Chapter[] {
  return PTB_CLASS8_GENERAL_SCIENCE.find((u) => u.id === unitId)?.chapters || [];
}
export function getUnitByChapterId(chapterId: string): Unit | undefined {
  return PTB_CLASS8_GENERAL_SCIENCE.find((u) => u.chapters.some((ch) => ch.id === chapterId));
}
