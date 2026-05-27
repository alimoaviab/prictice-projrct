/**
 * PTB Class 10 Physics Syllabus
 * Chapters 10–21 (continuation from Class 9)
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

export const PTB_CLASS10_PHYSICS: Unit[] = [
  {
    id: "chap-10",
    title: "CHAP 10: THERMAL PHYSICS",
    type: "unit",
    chapters: [
      { id: "10.1", code: "10.1", title: "THERMAL EXPANSION",   type: "chapter" },
      { id: "10.2", code: "10.2", title: "SPECIFIC HEAT CAPACITY", type: "chapter" },
      { id: "10.3", code: "10.3", title: "CHANGE IN STATE",     type: "chapter" },
      { id: "10.4", code: "10.4", title: "EVAPORATION",         type: "chapter" },
      { id: "10.5", code: "10.5", title: "LATENT HEAT",         type: "chapter" },
      { id: "10.6", code: "10.6", title: "SUPERCONDUCTIVITY",   type: "chapter" },
    ],
  },
  {
    id: "chap-11",
    title: "CHAP 11: TRANSFER OF THERMAL ENERGY",
    type: "unit",
    chapters: [
      { id: "11.1", code: "11.1", title: "CONDUCTION",                    type: "chapter" },
      { id: "11.2", code: "11.2", title: "CONVECTION IN LIQUIDS AND GASES", type: "chapter" },
      { id: "11.3", code: "11.3", title: "HEAT TRANSFER THROUGH RADIATION", type: "chapter" },
      { id: "11.4", code: "11.4", title: "GREENHOUSE EFFECT",             type: "chapter" },
    ],
  },
  {
    id: "chap-12",
    title: "CHAP 12: WAVES",
    type: "unit",
    chapters: [
      { id: "12.1", code: "12.1", title: "WAVES AND NATURE OF WAVES",      type: "chapter" },
      { id: "12.2", code: "12.2", title: "TYPES OF WAVES",                 type: "chapter" },
      { id: "12.3", code: "12.3", title: "TERMS AND PARAMETERS OF WAVES",  type: "chapter" },
      { id: "12.4", code: "12.4", title: "PROPERTIES OF WAVES",            type: "chapter" },
      { id: "12.5", code: "12.5", title: "SEISMIC AND TSUNAMI WAVES",      type: "chapter" },
    ],
  },
  {
    id: "chap-13",
    title: "CHAP 13: SOUND",
    type: "unit",
    chapters: [
      { id: "13.1", code: "13.1", title: "PRODUCTION AND PROPAGATION OF SOUND", type: "chapter" },
      { id: "13.2", code: "13.2", title: "SPEED OF SOUND",                       type: "chapter" },
      { id: "13.3", code: "13.3", title: "CHARACTERISTICS OF SOUND",             type: "chapter" },
      { id: "13.4", code: "13.4", title: "REFLECTION OF SOUND (ECHO)",           type: "chapter" },
      { id: "13.5", code: "13.5", title: "REFRACTION AND DIFFRACTION OF SOUND",  type: "chapter" },
      { id: "13.6", code: "13.6", title: "AUDIBLE FREQUENCY",                    type: "chapter" },
      { id: "13.7", code: "13.7", title: "ACOUSTIC PROTECTION OF BUILDINGS",     type: "chapter" },
    ],
  },
  {
    id: "chap-14",
    title: "CHAP 14: LIGHT",
    type: "unit",
    chapters: [
      { id: "14.1", code: "14.1", title: "REFLECTION OF LIGHT",                     type: "chapter" },
      { id: "14.2", code: "14.2", title: "REFRACTION OF LIGHT",                     type: "chapter" },
      { id: "14.3", code: "14.3", title: "OPTICAL FIBRE",                           type: "chapter" },
      { id: "14.4", code: "14.4", title: "THIN LENSES",                             type: "chapter" },
      { id: "14.5", code: "14.5", title: "OPTICAL DEVICES",                         type: "chapter" },
      { id: "14.6", code: "14.6", title: "IMAGE FORMATION IN A NORMAL EYE",         type: "chapter" },
      { id: "14.7", code: "14.7", title: "GRAVITATIONAL LENS AND ACOUSTIC LENS",    type: "chapter" },
      { id: "14.8", code: "14.8", title: "DISPERSION OF LIGHT BY PRISM",            type: "chapter" },
    ],
  },
  {
    id: "chap-15",
    title: "CHAP 15: ELECTROSTATICS",
    type: "unit",
    chapters: [
      { id: "15.1", code: "15.1", title: "ELECTRIC CHARGE",                  type: "chapter" },
      { id: "15.2", code: "15.2", title: "ELECTROSTATIC INDUCTION",          type: "chapter" },
      { id: "15.3", code: "15.3", title: "APPLICATIONS OF ELECTROSTATICS",   type: "chapter" },
      { id: "15.4", code: "15.4", title: "COULOMB'S LAW",                    type: "chapter" },
      { id: "15.5", code: "15.5", title: "ELECTRIC FIELD",                   type: "chapter" },
      { id: "15.6", code: "15.6", title: "CONDUCTION OF ELECTRIC CHARGES",   type: "chapter" },
      { id: "15.7", code: "15.7", title: "ACCUMULATION OF CHARGES",          type: "chapter" },
    ],
  },
  {
    id: "chap-16",
    title: "CHAP 16: ELECTRICITY",
    type: "unit",
    chapters: [
      { id: "16.1",  code: "16.1",  title: "ELECTRIC CURRENT",                       type: "chapter" },
      { id: "16.2",  code: "16.2",  title: "ELECTROMOTIVE FORCE AND POTENTIAL DIFFERENCE", type: "chapter" },
      { id: "16.3",  code: "16.3",  title: "OHM'S LAW",                              type: "chapter" },
      { id: "16.4",  code: "16.4",  title: "COMBINATION OF RESISTANCES",             type: "chapter" },
      { id: "16.5",  code: "16.5",  title: "ELECTRICAL RESISTIVITY",                 type: "chapter" },
      { id: "16.6",  code: "16.6",  title: "POTENTIAL DIVIDER CIRCUIT",              type: "chapter" },
      { id: "16.7",  code: "16.7",  title: "RESISTOR COLOUR CODES",                  type: "chapter" },
      { id: "16.8",  code: "16.8",  title: "COMMON USE OF ELECTRICITY",              type: "chapter" },
      { id: "16.9",  code: "16.9",  title: "ELECTRIC POWER",                         type: "chapter" },
      { id: "16.10", code: "16.10", title: "HOUSEHOLD CIRCUITS AND SAFETY MEASURES", type: "chapter" },
    ],
  },
  {
    id: "chap-17",
    title: "CHAP 17: ELECTROMAGNETISM",
    type: "unit",
    chapters: [
      { id: "17.1", code: "17.1", title: "MAGNETIC EFFECT OF STEADY CURRENT",                          type: "chapter" },
      { id: "17.2", code: "17.2", title: "FORCE ON A CURRENT-CARRYING CONDUCTOR IN A MAGNETIC FIELD",  type: "chapter" },
      { id: "17.3", code: "17.3", title: "TURNING EFFECT ON A CURRENT-CARRYING COIL IN MAGNETIC FIELD", type: "chapter" },
      { id: "17.4", code: "17.4", title: "ELECTRIC MOTOR",                                             type: "chapter" },
      { id: "17.5", code: "17.5", title: "USE OF MAGNETIC EFFECTS OF CURRENT",                         type: "chapter" },
      { id: "17.6", code: "17.6", title: "EARTH'S MAGNETIC FIELD",                                     type: "chapter" },
    ],
  },
  {
    id: "chap-18",
    title: "CHAP 18: ELECTROMAGNETIC INDUCTION AND ELECTROMAGNETIC WAVES",
    type: "unit",
    chapters: [
      { id: "18.1", code: "18.1", title: "ELECTROMAGNETIC INDUCTION",                            type: "chapter" },
      { id: "18.2", code: "18.2", title: "A.C. GENERATOR",                                       type: "chapter" },
      { id: "18.3", code: "18.3", title: "TRANSFORMER",                                          type: "chapter" },
      { id: "18.4", code: "18.4", title: "DEFLECTION OF ELECTRON BEAM IN ELECTRIC AND MAGNETIC FIELDS", type: "chapter" },
      { id: "18.5", code: "18.5", title: "WAVEFORM ON OSCILLOSCOPE",                             type: "chapter" },
      { id: "18.6", code: "18.6", title: "SCATTERING OF LIGHT IN THE ATMOSPHERE",               type: "chapter" },
      { id: "18.7", code: "18.7", title: "PARTICLE NATURE OF LIGHT",                            type: "chapter" },
    ],
  },
  {
    id: "chap-19",
    title: "CHAP 19: ELECTRONICS",
    type: "unit",
    chapters: [
      { id: "19.1", code: "19.1", title: "SEMICONDUCTORS",             type: "chapter" },
      { id: "19.2", code: "19.2", title: "ANALOG AND DIGITAL ELECTRONICS", type: "chapter" },
      { id: "19.3", code: "19.3", title: "BOOLEAN LOGIC",              type: "chapter" },
      { id: "19.4", code: "19.4", title: "LOGIC GATES",                type: "chapter" },
      { id: "19.5", code: "19.5", title: "APPLICATIONS OF LOGIC GATES", type: "chapter" },
    ],
  },
  {
    id: "chap-20",
    title: "CHAP 20: ATOMIC AND NUCLEAR PHYSICS",
    type: "unit",
    chapters: [
      { id: "20.1", code: "20.1", title: "ATOMIC STRUCTURE",                        type: "chapter" },
      { id: "20.2", code: "20.2", title: "ATOMIC NUCLEUS",                          type: "chapter" },
      { id: "20.3", code: "20.3", title: "ISOTOPES",                                type: "chapter" },
      { id: "20.4", code: "20.4", title: "RADIOACTIVITY",                           type: "chapter" },
      { id: "20.5", code: "20.5", title: "RADIOACTIVE DECAY",                       type: "chapter" },
      { id: "20.6", code: "20.6", title: "NUCLEAR REACTIONS",                       type: "chapter" },
      { id: "20.7", code: "20.7", title: "INTERCONVERSION OF MATTER AND ENERGY",    type: "chapter" },
      { id: "20.8", code: "20.8", title: "HALF-LIFE",                               type: "chapter" },
      { id: "20.9", code: "20.9", title: "EFFECT AND USES OF NUCLEAR RADIATION",   type: "chapter" },
    ],
  },
  {
    id: "chap-21",
    title: "CHAP 21: SPACE AND ENVIRONMENT",
    type: "unit",
    chapters: [
      { id: "21.1", code: "21.1", title: "SUN AND PLANETARY DATA",                type: "chapter" },
      { id: "21.2", code: "21.2", title: "GLOBAL WARMING AND GEOTHERMAL ACTIVITY", type: "chapter" },
      { id: "21.3", code: "21.3", title: "RADIATION EXPOSURE",                    type: "chapter" },
    ],
  },
];

export function getAllChapters(): Chapter[] {
  return PTB_CLASS10_PHYSICS.flatMap((u) => u.chapters);
}
export function getChaptersByUnit(unitId: string): Chapter[] {
  return PTB_CLASS10_PHYSICS.find((u) => u.id === unitId)?.chapters || [];
}
export function getUnitByChapterId(chapterId: string): Unit | undefined {
  return PTB_CLASS10_PHYSICS.find((u) => u.chapters.some((ch) => ch.id === chapterId));
}
