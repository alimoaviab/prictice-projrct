/**
 * PTB Class 9 Chemistry Syllabus
 * 13 chapters with topics
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

export const PTB_CLASS9_CHEMISTRY: Unit[] = [
  {
    id: "chap-1",
    title: "CHAP 1: States of Matter and Phase Changes",
    type: "unit",
    chapters: [
      { id: "1.1", code: "1.1", title: "WHAT IS CHEMISTRY? (SMART)",                                  type: "chapter" },
      { id: "1.2", code: "1.2", title: "States of Matter",                                            type: "chapter" },
      { id: "1.3", code: "1.3", title: "ELEMENT, COMPOUND AND MIXTURE (SMART)",                       type: "chapter" },
      { id: "1.4", code: "1.4", title: "Allotropic Forms of Substances",                              type: "chapter" },
      { id: "1.5", code: "1.5", title: "DIFFERENCES BETWEEN ELEMENTS, COMPOUNDS AND MIXTURES (SMART)", type: "chapter" },
      { id: "1.6", code: "1.6", title: "SOLUTION, COLLOIDAL SOLUTION AND SUSPENSION (SMART)",         type: "chapter" },
      { id: "1.7", code: "1.7", title: "FORMATION OF UNSATURATED AND SATURATED SOLUTIONS (SMART)",    type: "chapter" },
      { id: "1.8", code: "1.8", title: "Effect of Temperature on the Solubility of Solutes",          type: "chapter" },
    ],
  },
  {
    id: "chap-2",
    title: "CHAP 2: Atomic Structure",
    type: "unit",
    chapters: [
      { id: "2.1", code: "2.1", title: "STRUCTURE OF ATOM (SMART)",         type: "chapter" },
      { id: "2.2", code: "2.2", title: "ATOMIC NUMBER AND MASS NUMBER (SMART)", type: "chapter" },
      { id: "2.3", code: "2.3", title: "Isotopes and their Masses",         type: "chapter" },
      { id: "2.4", code: "2.4", title: "RELATIVE ATOMIC MASS (SMART)",      type: "chapter" },
    ],
  },
  {
    id: "chap-3",
    title: "CHAP 3: Chemical Bonding",
    type: "unit",
    chapters: [
      { id: "3.1", code: "3.1", title: "WHY DO ATOMS FORM CHEMICAL BONDS? (SMART)",              type: "chapter" },
      { id: "3.2", code: "3.2", title: "CHEMICAL BOND (SMART)",                                  type: "chapter" },
      { id: "3.3", code: "3.3", title: "METALLIC BOND (SMART)",                                  type: "chapter" },
      { id: "3.4", code: "3.4", title: "ELECTROPOSITIVE CHARACTER OF METALS (SMART)",            type: "chapter" },
      { id: "3.5", code: "3.5", title: "ELECTRONEGATIVE CHARACTER OF NON-METALS (SMART)",        type: "chapter" },
      { id: "3.6", code: "3.6", title: "Compare the properties of ionic and covalent compounds.", type: "chapter" },
      { id: "3.7", code: "3.7", title: "INTERMOLECULAR FORCES OF ATTRACTION (SMART)",            type: "chapter" },
      { id: "3.8", code: "3.8", title: "Nature of Bonding and Properties",                       type: "chapter" },
    ],
  },
  {
    id: "chap-4",
    title: "CHAP 4: Stoichometry",
    type: "unit",
    chapters: [
      { id: "4.1", code: "4.1", title: "CHEMICAL FORMULA (SMART)",                                  type: "chapter" },
      { id: "4.2", code: "4.2", title: "EMPIRICAL FORMULA (SMART)",                                 type: "chapter" },
      { id: "4.3", code: "4.3", title: "CHEMICAL FORMULAS OF BINARY IONIC COMPOUNDS (SMART)",       type: "chapter" },
      { id: "4.4", code: "4.4", title: "CHEMICAL FORMULAS OF COMPOUNDS (SMART)",                    type: "chapter" },
      { id: "4.5", code: "4.5", title: "DEDUCE THE MOLECULAR FORMULA FROM THE STRUCTURAL FORMULA (SMART)", type: "chapter" },
      { id: "4.6", code: "4.6", title: "AVOGADRO'S NUMBER (NA) (SMART)",                            type: "chapter" },
      { id: "4.7", code: "4.7", title: "THE MOLE AND MOLAR MASS (SMART)",                           type: "chapter" },
      { id: "4.8", code: "4.8", title: "CHEMICAL EQUATIONS AND CHEMICAL REACTIONS (SMART)",         type: "chapter" },
      { id: "4.9", code: "4.9", title: "CALCULATIONS BASED ON CHEMICAL EQUATION (SMART)",           type: "chapter" },
    ],
  },
  {
    id: "chap-5",
    title: "CHAP 5: Energetics",
    type: "unit",
    chapters: [
      { id: "5.1", code: "5.1", title: "SYSTEM AND SURROUNDING (SMART)",             type: "chapter" },
      { id: "5.2", code: "5.2", title: "ENTHALPY (SMART)",                           type: "chapter" },
      { id: "5.3", code: "5.3", title: "EXOTHERMIC AND ENDOTHERMIC REACTIONS (SMART)", type: "chapter" },
      { id: "5.4", code: "5.4", title: "HOW DOES A REACTION TAKE PLACE? (SMART)",   type: "chapter" },
      { id: "5.5", code: "5.5", title: "AEROBIC AND ANAEROBIC RESPIRATION (SMART)",  type: "chapter" },
    ],
  },
  {
    id: "chap-6",
    title: "CHAP 6: Equilibria",
    type: "unit",
    chapters: [
      { id: "6.1", code: "6.1", title: "REVERSIBLE AND IRREVERSIBLE CHANGES (SMART)",          type: "chapter" },
      { id: "6.2", code: "6.2", title: "DYNAMIC EQUILIBRIUM (SMART)",                          type: "chapter" },
      { id: "6.3", code: "6.3", title: "Changing the Physical Conditions of a Chemical Reaction", type: "chapter" },
    ],
  },
  {
    id: "chap-7",
    title: "CHAP 7: Acid Base Chemistry",
    type: "unit",
    chapters: [
      { id: "7.1", code: "7.1", title: "ACIDS AND BASES (SMART)",                              type: "chapter" },
      { id: "7.2", code: "7.2", title: "DIFFERENT CONCEPTS OF ACIDS AND BASES (SMART)",        type: "chapter" },
      { id: "7.3", code: "7.3", title: "BRONSTED - LOWRY CONCEPTS OF ACIDS AND BASES (SMART)", type: "chapter" },
      { id: "7.4", code: "7.4", title: "PROPERTIES OF ACIDS AND BASES (SMART)",                type: "chapter" },
      { id: "7.5", code: "7.5", title: "Acid Rain and its Effects",                            type: "chapter" },
    ],
  },
  {
    id: "chap-8",
    title: "CHAP 8: Periodic Table and Periodicity",
    type: "unit",
    chapters: [
      { id: "8.1", code: "8.1", title: "MODERN PERIODIC TABLE (SMART)",                                          type: "chapter" },
      { id: "8.2", code: "8.2", title: "SALIENT FEATURES OF MODERN PERIODIC TABLE (SMART)",                      type: "chapter" },
      { id: "8.3", code: "8.3", title: "SIMILARITIES IN THE CHEMICAL PROPERTIES OF ELEMENTS IN THE SAME GROUP (SMART)", type: "chapter" },
      { id: "8.4", code: "8.4", title: "VARIATION OF PERIODIC PROPERTIES IN PERIODS AND GROUPS (SMART)",         type: "chapter" },
      { id: "8.5", code: "8.5", title: "Metallic Character and Reactivity",                                      type: "chapter" },
    ],
  },
  {
    id: "chap-9",
    title: "CHAP 9: Group Properties and Elements",
    type: "unit",
    chapters: [
      { id: "9.1", code: "9.1", title: "PROPERTIES OF GROUP 1 ELEMENTS (SMART)",           type: "chapter" },
      { id: "9.2", code: "9.2", title: "PROPERTIES OF GROUP 17 ELEMENTS (SMART)",          type: "chapter" },
      { id: "9.3", code: "9.3", title: "GROUP PROPERTIES OF TRANSITION ELEMENTS (SMART)",  type: "chapter" },
      { id: "9.4", code: "9.4", title: "PROPERTIES OF NOBLE GASES (SMART)",                type: "chapter" },
      { id: "9.5", code: "9.5", title: "Physical Properties of Metals and Non-metals",     type: "chapter" },
    ],
  },
  {
    id: "chap-10",
    title: "CHAP 10: Environmental Chemistry",
    type: "unit",
    chapters: [
      { id: "10.1", code: "10.1", title: "COMPOSITION OF ATMOSPHERE (SMART)",        type: "chapter" },
      { id: "10.2", code: "10.2", title: "AIR POLLUTANTS (SMART)",                   type: "chapter" },
      { id: "10.3", code: "10.3", title: "ACID RAIN (SMART)",                        type: "chapter" },
      { id: "10.4", code: "10.4", title: "Global Warning (Greenhouse Effect)",       type: "chapter" },
      { id: "10.5", code: "10.5", title: "Strategies to Reduce Environmental Issues", type: "chapter" },
    ],
  },
  {
    id: "chap-11",
    title: "CHAP 11: Hydrocarbons",
    type: "unit",
    chapters: [
      { id: "11.1", code: "11.1", title: "HYDROCARBONS (SMART)",         type: "chapter" },
      { id: "11.2", code: "11.2", title: "ALKANES (SMART)",              type: "chapter" },
      { id: "11.3", code: "11.3", title: "PREPARATION OF ALKANES (SMART)", type: "chapter" },
      { id: "11.4", code: "11.4", title: "Important Reactions",          type: "chapter" },
    ],
  },
  {
    id: "chap-12",
    title: "CHAP 12: Empirical Data Collection and Analysis",
    type: "unit",
    chapters: [
      { id: "12.1", code: "12.1", title: "SI UNITS IN CHEMISTRY",                              type: "chapter" },
      { id: "12.2", code: "12.2", title: "TOOLS AND TECHNIQUES TO MANAGE ACCURACY AND PRECISION", type: "chapter" },
      { id: "12.3", code: "12.3", title: "ACCURACY AND PRECISION",                             type: "chapter" },
    ],
  },
  {
    id: "chap-13",
    title: "CHAP 13: Laboratory and Practical Skills",
    type: "unit",
    chapters: [
      { id: "13.1", code: "13.1", title: "CHEMICAL HAZARDS IN THE LABORATORY",        type: "chapter" },
      { id: "13.2", code: "13.2", title: "HAZARD SIGNS",                              type: "chapter" },
      { id: "13.3", code: "13.3", title: "PERSONAL PROTECTIVE EQUIPMENT (PPE) IN THE LABORATORY", type: "chapter" },
      { id: "13.4", code: "13.4", title: "LOCATION OF FIRE EXTINGUISHER",             type: "chapter" },
      { id: "13.5", code: "13.5", title: "EMERGENCY SITUATION IN THE LAB.",           type: "chapter" },
    ],
  },
];

export function getAllChapters(): Chapter[] {
  return PTB_CLASS9_CHEMISTRY.flatMap((u) => u.chapters);
}
export function getChaptersByUnit(unitId: string): Chapter[] {
  return PTB_CLASS9_CHEMISTRY.find((u) => u.id === unitId)?.chapters || [];
}
export function getUnitByChapterId(chapterId: string): Unit | undefined {
  return PTB_CLASS9_CHEMISTRY.find((u) => u.chapters.some((ch) => ch.id === chapterId));
}
