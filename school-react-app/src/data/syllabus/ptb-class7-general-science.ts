/**
 * PTB Class 7 General Science Syllabus
 * 12 units with topics in uppercase as provided
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

export const PTB_CLASS7_GENERAL_SCIENCE: Unit[] = [
  {
    id: "unit-1",
    title: "UNIT 1: Plant System",
    type: "unit",
    chapters: [
      { id: "1.1", code: "1.1", title: "ROOT AND SHOOT SYSTEM IN PLANT", type: "chapter" },
      { id: "1.2", code: "1.2", title: "PHOTOSYNTHESIS",                 type: "chapter" },
      { id: "1.3", code: "1.3", title: "RESPIRATION IN PLANTS",          type: "chapter" },
      { id: "1.4", code: "1.4", title: "TRANSPIRATION",                  type: "chapter" },
    ],
  },
  {
    id: "unit-2",
    title: "UNIT 2: Human Respiratory and Circulatory system",
    type: "unit",
    chapters: [
      { id: "2.1", code: "2.1", title: "BREATHING",          type: "chapter" },
      { id: "2.2", code: "2.2", title: "RESPIRATION",        type: "chapter" },
      { id: "2.3", code: "2.3", title: "BLOOD CIRCULATION",  type: "chapter" },
      { id: "2.4", code: "2.4", title: "BLOOD",              type: "chapter" },
    ],
  },
  {
    id: "unit-3",
    title: "UNIT 3: Immunity and Diseases",
    type: "unit",
    chapters: [
      { id: "3.1", code: "3.1", title: "LINES OF DEFENCE AGAINST PATHOGENS",    type: "chapter" },
      { id: "3.2", code: "3.2", title: "IMMUNITY OR SPECIFIC DEFENCE",          type: "chapter" },
      { id: "3.3", code: "3.3", title: "PATHOGENS CAUSING INFECTIOUS DISEASES", type: "chapter" },
      { id: "3.4", code: "3.4", title: "PARTS OF IMMUNE SYSTEM",                type: "chapter" },
      { id: "3.5", code: "3.5", title: "AVOIDING INFECTIONS",                   type: "chapter" },
    ],
  },
  {
    id: "unit-4",
    title: "UNIT 4: Structure of an Atom",
    type: "unit",
    chapters: [
      { id: "4.1", code: "4.1", title: "ATOM-AS A NEUTRAL PARTICLE",            type: "chapter" },
      { id: "4.2", code: "4.2", title: "SHELL OR ORBITS",                       type: "chapter" },
      { id: "4.3", code: "4.3", title: "ATOMIC STRUCTURES OF FIRST 18 ELEMENTS",type: "chapter" },
      { id: "4.4", code: "4.4", title: "PERIODIC TABLE",                        type: "chapter" },
    ],
  },
  {
    id: "unit-5",
    title: "UNIT 5: Physical and Chemical Changes",
    type: "unit",
    chapters: [
      { id: "5.1", code: "5.1", title: "Physical and Chemical Changes",          type: "chapter" },
      { id: "5.2", code: "5.2", title: "CHEMICAL EQUATION",                     type: "chapter" },
      { id: "5.3", code: "5.3", title: "PHYSICAL AND CHEMICAL PROPERTIES",      type: "chapter" },
      { id: "5.4", code: "5.4", title: "USING CHEMICAL PROPERTIES MATERIALS",   type: "chapter" },
      { id: "5.5", code: "5.5", title: "USING PHYSICAL PROPERTIRES OF MATERIALS",type: "chapter" },
      { id: "5.6", code: "5.6", title: "PREVENTION OF RUSRING",                 type: "chapter" },
    ],
  },
  {
    id: "unit-6",
    title: "UNIT 6: Chemical Bonds",
    type: "unit",
    chapters: [
      { id: "6.1", code: "6.1", title: "ION",           type: "chapter" },
      { id: "6.2", code: "6.2", title: "VALENCY",       type: "chapter" },
      { id: "6.3", code: "6.3", title: "CHEMICAL BOND", type: "chapter" },
    ],
  },
  {
    id: "unit-7",
    title: "UNIT 7: Solutions",
    type: "unit",
    chapters: [
      { id: "7.1", code: "7.1", title: "UNSATURATED AND SATURATED SOLUTIONS",              type: "chapter" },
      { id: "7.2", code: "7.2", title: "SOLUBILITY",                                       type: "chapter" },
      { id: "7.3", code: "7.3", title: "WAYS ACCELERATING THE PROCESS OF DISSOLVING MATERIALS", type: "chapter" },
    ],
  },
  {
    id: "unit-8",
    title: "UNIT 8: Force and Motion",
    type: "unit",
    chapters: [
      { id: "8.1", code: "8.1", title: "FORCE",                                           type: "chapter" },
      { id: "8.2", code: "8.2", title: "UNIT OF FORCE",                                   type: "chapter" },
      { id: "8.3", code: "8.3", title: "RELATIONSHIP BETWEEN SPEED, DISTANCE AND TIME",   type: "chapter" },
      { id: "8.4", code: "8.4", title: "CONTACT AND NON-CONTACT FORCES",                  type: "chapter" },
    ],
  },
  {
    id: "unit-9",
    title: "UNIT 9: Waves and Energy",
    type: "unit",
    chapters: [
      { id: "9.1", code: "9.1", title: "WAVES",                      type: "chapter" },
      { id: "9.2", code: "9.2", title: "MECHANICAL WAVES",           type: "chapter" },
      { id: "9.3", code: "9.3", title: "BASIC TERMS RELATED TO WAVES", type: "chapter" },
      { id: "9.4", code: "9.4", title: "CHARACTERISTIC OF SOUND",    type: "chapter" },
      { id: "9.5", code: "9.5", title: "ELECTROMAGNETIC WAVE",       type: "chapter" },
    ],
  },
  {
    id: "unit-10",
    title: "UNIT 10: Heat and Temperature",
    type: "unit",
    chapters: [
      { id: "10.1", code: "10.1", title: "Heat and Temperature",              type: "chapter" },
      { id: "10.2", code: "10.2", title: "THERMAL EXPANSION AND CONTRACTION", type: "chapter" },
      { id: "10.3", code: "10.3", title: "MODES OF HEAT TRANSFER",            type: "chapter" },
      { id: "10.4", code: "10.4", title: "THERMAL INSULATION IN BUILDING",    type: "chapter" },
    ],
  },
  {
    id: "unit-11",
    title: "UNIT 11: Technology in Everyday Life",
    type: "unit",
    chapters: [
      { id: "11.1", code: "11.1", title: "DRIP AND SPRINKLER IRRIGATION",   type: "chapter" },
      { id: "11.2", code: "11.2", title: "TECHNIQUES OF PRESERVING FOODS",  type: "chapter" },
      { id: "11.3", code: "11.3", title: "SIMPLE STETHOSCOPE",              type: "chapter" },
      { id: "11.4", code: "11.4", title: "HAND SANITIZER",                  type: "chapter" },
    ],
  },
  {
    id: "unit-12",
    title: "UNIT 12: Earth and Space",
    type: "unit",
    chapters: [
      { id: "12.1", code: "12.1", title: "GRAVITATIONAL FORCE",                          type: "chapter" },
      { id: "12.2", code: "12.2", title: "MASS AND WEIGHT",                              type: "chapter" },
      { id: "12.3", code: "12.3", title: "WEIGHTLESSNESS",                               type: "chapter" },
      { id: "12.4", code: "12.4", title: "TIDES",                                        type: "chapter" },
      { id: "12.5", code: "12.5", title: "ANNUAL REVOLUTION OF THE EARTH AROUND THE SUN", type: "chapter" },
      { id: "12.6", code: "12.6", title: "CONSTELLATIONS",                               type: "chapter" },
    ],
  },
];

export function getAllChapters(): Chapter[] {
  return PTB_CLASS7_GENERAL_SCIENCE.flatMap((u) => u.chapters);
}
export function getChaptersByUnit(unitId: string): Chapter[] {
  return PTB_CLASS7_GENERAL_SCIENCE.find((u) => u.id === unitId)?.chapters || [];
}
export function getUnitByChapterId(chapterId: string): Unit | undefined {
  return PTB_CLASS7_GENERAL_SCIENCE.find((u) => u.chapters.some((ch) => ch.id === chapterId));
}
