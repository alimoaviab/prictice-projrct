/**
 * PTB Class 9 Physics Syllabus
 * 9 chapters with topics
 * "(SMART)" preserved exactly where written
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

export const PTB_CLASS9_PHYSICS: Unit[] = [
  {
    id: "chap-1",
    title: "CHAP 1: Physical Quantities and Measurements",
    type: "unit",
    chapters: [
      { id: "1.1",  code: "1.1",  title: "PHYSICAL AND NON-PHYSICAL QUANTITIES (SMART)", type: "chapter" },
      { id: "1.2",  code: "1.2",  title: "BASE AND DERIVED PHYSICAL QUANTITIES (SMART)", type: "chapter" },
      { id: "1.3",  code: "1.3",  title: "INTERNATIONAL SYSTEM OF UNITS (SMART)",        type: "chapter" },
      { id: "1.4",  code: "1.4",  title: "SCIENTIFIC NOTATION (SMART)",                  type: "chapter" },
      { id: "1.5",  code: "1.5",  title: "LENGTH MEASURING INSTRUMENTS (SMART)",         type: "chapter" },
      { id: "1.6",  code: "1.6",  title: "Mass Measuring Instruments",                   type: "chapter" },
      { id: "1.7",  code: "1.7",  title: "Time Measuring Instruments",                   type: "chapter" },
      { id: "1.8",  code: "1.8",  title: "Volume Measuring Instrument",                  type: "chapter" },
      { id: "1.9",  code: "1.9",  title: "Errors In Measurements",                       type: "chapter" },
      { id: "1.10", code: "1.10", title: "Uncertainty in a Measurement",                 type: "chapter" },
      { id: "1.11", code: "1.11", title: "SIGNIFICANT FIGURES (SMART)",                  type: "chapter" },
      { id: "1.12", code: "1.12", title: "Precision and Accuracy",                       type: "chapter" },
      { id: "1.13", code: "1.13", title: "ROUNDING OFF THE DIGITS (SMART)",              type: "chapter" },
    ],
  },
  {
    id: "chap-2",
    title: "CHAP 2: Kinematics",
    type: "unit",
    chapters: [
      { id: "2.1",  code: "2.1",  title: "SCALARS AND VECTORS (SMART)",                 type: "chapter" },
      { id: "2.2",  code: "2.2",  title: "REST AND MOTION (SMART)",                     type: "chapter" },
      { id: "2.3",  code: "2.3",  title: "Types of Motion",                             type: "chapter" },
      { id: "2.4",  code: "2.4",  title: "DISTANCE AND DISPLACEMENT (SMART)",           type: "chapter" },
      { id: "2.5",  code: "2.5",  title: "SPEED AND VELOCITY (SMART)",                  type: "chapter" },
      { id: "2.6",  code: "2.6",  title: "ACCELERATION (SMART)",                        type: "chapter" },
      { id: "2.7",  code: "2.7",  title: "GRAPHICAL ANALYSIS OF MOTION (SMART)",        type: "chapter" },
      { id: "2.8",  code: "2.8",  title: "Gradient of a Distance-Time Graph",           type: "chapter" },
      { id: "2.9",  code: "2.9",  title: "SPEED-TIME GRAPH (SMART)",                    type: "chapter" },
      { id: "2.10", code: "2.10", title: "Gradient of a speed-Time Graph",              type: "chapter" },
      { id: "2.11", code: "2.11", title: "AREA UNDER SPEED-TIME GRAPH (SMART)",         type: "chapter" },
      { id: "2.12", code: "2.12", title: "SOLVING PROBLEMS FOR MOTION UNDER GRAVITY (SMART)", type: "chapter" },
      { id: "2.13", code: "2.13", title: "FREE FALL ACCELERATION (SMART)",              type: "chapter" },
    ],
  },
  {
    id: "chap-3",
    title: "CHAP 3: Dynamics",
    type: "unit",
    chapters: [
      { id: "3.1",  code: "3.1",  title: "CONCEPT OF FORCE (SMART)",                              type: "chapter" },
      { id: "3.2",  code: "3.2",  title: "Fundamental Forces",                                    type: "chapter" },
      { id: "3.3",  code: "3.3",  title: "Forces in a Free-Body Diagram",                         type: "chapter" },
      { id: "3.4",  code: "3.4",  title: "NEWTON'S LAWS OF MOTION (SMART)",                       type: "chapter" },
      { id: "3.5",  code: "3.5",  title: "Limitations of Newton's Laws of Motion",                type: "chapter" },
      { id: "3.6",  code: "3.6",  title: "MASS AND WEIGHT (SMART)",                               type: "chapter" },
      { id: "3.7",  code: "3.7",  title: "Mechanical and electrical Balances",                    type: "chapter" },
      { id: "3.8",  code: "3.8",  title: "FRICTION (SMART)",                                      type: "chapter" },
      { id: "3.9",  code: "3.9",  title: "MOMENTUM AND IMPULSE (SMART)",                          type: "chapter" },
      { id: "3.10", code: "3.10", title: "PRINCIPLE OF CONSERVATION OF MOMENTUM (SMART)",         type: "chapter" },
    ],
  },
  {
    id: "chap-4",
    title: "CHAP 4: Turning Effects of Forces",
    type: "unit",
    chapters: [
      { id: "4.1",  code: "4.1",  title: "LIKE AND UNLIKE PARALLEL FORCES (SMART)",                    type: "chapter" },
      { id: "4.2",  code: "4.2",  title: "ADDITION OF FORCES (SMART)",                                 type: "chapter" },
      { id: "4.3",  code: "4.3",  title: "TURNING EFFECT OF A FORCE (SMART)",                          type: "chapter" },
      { id: "4.4",  code: "4.4",  title: "RESOLUTION OF VECTORS (SMART)",                              type: "chapter" },
      { id: "4.5",  code: "4.5",  title: "DETERMINATION OF A FORCE FROM ITS PREPENDICULAR COMPONENT (SMART)", type: "chapter" },
      { id: "4.6",  code: "4.6",  title: "PRINCIPLE OF MOMENTS (SMART)",                               type: "chapter" },
      { id: "4.7",  code: "4.7",  title: "Centre of Gravity and Centre of Mass",                       type: "chapter" },
      { id: "4.8",  code: "4.8",  title: "EQUILIBRIUM (SMART)",                                        type: "chapter" },
      { id: "4.9",  code: "4.9",  title: "CONDITIONS OF EQUILIBRIUM (SMART)",                          type: "chapter" },
      { id: "4.10", code: "4.10", title: "STATES OF EQUILIBRIUM (SMART)",                              type: "chapter" },
      { id: "4.11", code: "4.11", title: "Improvement of Stability",                                   type: "chapter" },
      { id: "4.12", code: "4.12", title: "Application of Stability in Real Life",                      type: "chapter" },
      { id: "4.13", code: "4.13", title: "CENTRIPETAL FORCES (SMART)",                                 type: "chapter" },
    ],
  },
  {
    id: "chap-5",
    title: "CHAP 5: Work, Energy and Power",
    type: "unit",
    chapters: [
      { id: "5.1", code: "5.1", title: "WORK (SMART)",                                            type: "chapter" },
      { id: "5.2", code: "5.2", title: "ENERGY (SMART)",                                          type: "chapter" },
      { id: "5.3", code: "5.3", title: "CONSERVATION OF ENERGY (SMART)",                          type: "chapter" },
      { id: "5.4", code: "5.4", title: "Sources of Energy",                                       type: "chapter" },
      { id: "5.5", code: "5.5", title: "RENEWABLE AND NON-RENEWABLE SOURCES (SMART)",             type: "chapter" },
      { id: "5.6", code: "5.6", title: "The Advantages and Disadvantages of method of Energy production", type: "chapter" },
      { id: "5.7", code: "5.7", title: "POWER (SMART)",                                           type: "chapter" },
      { id: "5.8", code: "5.8", title: "EFFICIENCY (SMART)",                                      type: "chapter" },
    ],
  },
  {
    id: "chap-6",
    title: "CHAP 6: Mechanical Properties of Matter",
    type: "unit",
    chapters: [
      { id: "6.1", code: "6.1", title: "DEFORMATION OF SOLIDS (SMART)",         type: "chapter" },
      { id: "6.2", code: "6.2", title: "HOOKE'S LAW (SMART)",                   type: "chapter" },
      { id: "6.3", code: "6.3", title: "DENSITY (SMART)",                       type: "chapter" },
      { id: "6.4", code: "6.4", title: "PRESSURE (SMART)",                      type: "chapter" },
      { id: "6.5", code: "6.5", title: "PRESSURE IN LIQUIDS (SMART)",           type: "chapter" },
      { id: "6.6", code: "6.6", title: "ATMOSPHERIC PRESSURE (SMART)",          type: "chapter" },
      { id: "6.7", code: "6.7", title: "Measurement of Atmospheric Pressure",   type: "chapter" },
      { id: "6.8", code: "6.8", title: "Measurement of Pressure by Manometer",  type: "chapter" },
      { id: "6.9", code: "6.9", title: "PASCAL'S LAW (SMART)",                  type: "chapter" },
    ],
  },
  {
    id: "chap-7",
    title: "CHAP 7: Thermal Properties of Matter",
    type: "unit",
    chapters: [
      { id: "7.1", code: "7.1", title: "Kinetic Molecular Theory of Matter",                        type: "chapter" },
      { id: "7.2", code: "7.2", title: "TEMPERATURE AND HEAT (SMART)",                              type: "chapter" },
      { id: "7.3", code: "7.3", title: "THERMOMETERS (SMART)",                                      type: "chapter" },
      { id: "7.4", code: "7.4", title: "Sensitivity, Range and Linearity of Thermometers",          type: "chapter" },
      { id: "7.5", code: "7.5", title: "Structure of a Liquid-in-Glass Thermometer",                type: "chapter" },
    ],
  },
  {
    id: "chap-8",
    title: "CHAP 8: Magnetism",
    type: "unit",
    chapters: [
      { id: "8.1",  code: "8.1",  title: "MAGNETIC MATERIALS (SMART)",                         type: "chapter" },
      { id: "8.2",  code: "8.2",  title: "PROPERTIES OF MAGNETS (SMART)",                      type: "chapter" },
      { id: "8.3",  code: "8.3",  title: "INDUCE MAGNETISM (SMART)",                           type: "chapter" },
      { id: "8.4",  code: "8.4",  title: "TEMPORARY AND PERMANENT MAGNETS (SMART)",            type: "chapter" },
      { id: "8.5",  code: "8.5",  title: "MAGNETIC FIELDS (SMART)",                            type: "chapter" },
      { id: "8.6",  code: "8.6",  title: "USES OF PERMANENT MAGNETS (SMART)",                  type: "chapter" },
      { id: "8.7",  code: "8.7",  title: "ELECTROMAGNETS (SMART)",                             type: "chapter" },
      { id: "8.8",  code: "8.8",  title: "Domain Theory of Magnetism",                         type: "chapter" },
      { id: "8.9",  code: "8.9",  title: "MAGNETIZATION AND DEMAGNETIZATION (SMART)",          type: "chapter" },
      { id: "8.10", code: "8.10", title: "Applications of Magnets in Recording Technology",    type: "chapter" },
      { id: "8.11", code: "8.11", title: "Soft Iron as Magnetic Shield",                       type: "chapter" },
    ],
  },
  {
    id: "chap-9",
    title: "CHAP 9: Nature of Science",
    type: "unit",
    chapters: [
      { id: "9.1", code: "9.1", title: "SCOPE OF PHYSICS (SMART)",                         type: "chapter" },
      { id: "9.2", code: "9.2", title: "BRANCHES OF PHYSICS (SMART)",                      type: "chapter" },
      { id: "9.3", code: "9.3", title: "INTERDISCIPLINARY NATURE OF PHYSICS (SMART)",      type: "chapter" },
      { id: "9.4", code: "9.4", title: "Interdisciplinary Research",                       type: "chapter" },
      { id: "9.5", code: "9.5", title: "SCIENTIFIC METHOD (SMART)",                        type: "chapter" },
      { id: "9.6", code: "9.6", title: "Scientific Base of Technology and Engineering",    type: "chapter" },
    ],
  },
];

export function getAllChapters(): Chapter[] {
  return PTB_CLASS9_PHYSICS.flatMap((u) => u.chapters);
}
export function getChaptersByUnit(unitId: string): Chapter[] {
  return PTB_CLASS9_PHYSICS.find((u) => u.id === unitId)?.chapters || [];
}
export function getUnitByChapterId(chapterId: string): Unit | undefined {
  return PTB_CLASS9_PHYSICS.find((u) => u.chapters.some((ch) => ch.id === chapterId));
}
