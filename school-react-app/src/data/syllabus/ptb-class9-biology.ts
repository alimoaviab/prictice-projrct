/**
 * PTB Class 9 Biology Syllabus
 * 11 chapters with topics
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

export const PTB_CLASS9_BIOLOGY: Unit[] = [
  {
    id: "chap-1",
    title: "CHAP 1: The Science of Biology",
    type: "unit",
    chapters: [
      { id: "1.1", code: "1.1", title: "BIOLOGY AND ITS BRANCHES (SMART)",                        type: "chapter" },
      { id: "1.2", code: "1.2", title: "Relation of Biology With Other Sciences",                 type: "chapter" },
      { id: "1.3", code: "1.3", title: "Careers in Biology",                                      type: "chapter" },
      { id: "1.4", code: "1.4", title: "QURANIC INSTRUCTIONS TO REVEAL THE STUDY OF LIFE (SMART)", type: "chapter" },
      { id: "1.5", code: "1.5", title: "Science is a Collaborative Field",                        type: "chapter" },
      { id: "1.6", code: "1.6", title: "SCIENTIFIC METHOD (SMART)",                               type: "chapter" },
      { id: "1.7", code: "1.7", title: "THEORY AND LAW/PRINCIPLE (SMART)",                        type: "chapter" },
      { id: "1.8", code: "1.8", title: "Malaria-An Example of Biological Method",                 type: "chapter" },
    ],
  },
  {
    id: "chap-2",
    title: "CHAP 2: Biodiversity",
    type: "unit",
    chapters: [
      { id: "2.1", code: "2.1", title: "BIODIVERSITY (SMART)",                          type: "chapter" },
      { id: "2.2", code: "2.2", title: "CLASSIFICATION (SMART)",                        type: "chapter" },
      { id: "2.3", code: "2.3", title: "TAXONOMIC RANKS (SMART)",                       type: "chapter" },
      { id: "2.4", code: "2.4", title: "History of Classification",                     type: "chapter" },
      { id: "2.5", code: "2.5", title: "DOMAINS OF LIVING ORGANISMS (SMART)",           type: "chapter" },
      { id: "2.6", code: "2.6", title: "CLASSIFICATION OF DOMAIN EUKARYA (SMART)",      type: "chapter" },
      { id: "2.7", code: "2.7", title: "STATUS OF VIRUS IN CLASSIFICATION (SMART)",     type: "chapter" },
      { id: "2.8", code: "2.8", title: "BINOMIAL NOMENCLATURE (SMART)",                 type: "chapter" },
    ],
  },
  {
    id: "chap-3",
    title: "CHAP 3: The Cell",
    type: "unit",
    chapters: [
      { id: "3.1", code: "3.1", title: "CELL (SMART)",                                            type: "chapter" },
      { id: "3.2", code: "3.2", title: "STRUCTURE OF CELL (SMART)",                               type: "chapter" },
      { id: "3.3", code: "3.3", title: "Structural Advantages of Plant and Animal Cells",         type: "chapter" },
      { id: "3.4", code: "3.4", title: "CELL SPECIALIZATION (SMART)",                             type: "chapter" },
      { id: "3.5", code: "3.5", title: "STEM CELLS (SMART)",                                      type: "chapter" },
    ],
  },
  {
    id: "chap-4",
    title: "CHAP 4: Cell Cycle",
    type: "unit",
    chapters: [
      { id: "4.1", code: "4.1", title: "CELL CYCLE (SMART)",                              type: "chapter" },
      { id: "4.2", code: "4.2", title: "MITOSIS (SMART)",                                 type: "chapter" },
      { id: "4.3", code: "4.3", title: "MEIOSIS (SMART)",                                 type: "chapter" },
      { id: "4.4", code: "4.4", title: "Comparison between Meiosis and Mitosis",          type: "chapter" },
    ],
  },
  {
    id: "chap-5",
    title: "CHAP 5: Tissues, Organs, And Organ System",
    type: "unit",
    chapters: [
      { id: "5.1", code: "5.1", title: "LEVELS OF ORGANIZATION (SMART)",              type: "chapter" },
      { id: "5.2", code: "5.2", title: "ORGANS AND ORGAN SYSTEM IN PLANTS (SMART)",   type: "chapter" },
      { id: "5.3", code: "5.3", title: "ORGANS AND ORGAN SYSTEM IN HUMANS (SMART)",   type: "chapter" },
      { id: "5.4", code: "5.4", title: "HOMEOSTASIS (SMART)",                         type: "chapter" },
    ],
  },
  {
    id: "chap-6",
    title: "CHAP 6: Biomolecules",
    type: "unit",
    chapters: [
      { id: "6.1", code: "6.1", title: "BIOMOLECULES (SMART)",                type: "chapter" },
      { id: "6.2", code: "6.2", title: "CARBOHYDRATES (SMART)",               type: "chapter" },
      { id: "6.3", code: "6.3", title: "PROTEINS (SMART)",                    type: "chapter" },
      { id: "6.4", code: "6.4", title: "LIPIDS (SMART)",                      type: "chapter" },
      { id: "6.5", code: "6.5", title: "NUCLEIC ACIDS (SMART)",               type: "chapter" },
      { id: "6.6", code: "6.6", title: "THE WORKING OF DNA AND RNA (SMART)",  type: "chapter" },
    ],
  },
  {
    id: "chap-7",
    title: "CHAP 7: Enzymes",
    type: "unit",
    chapters: [
      { id: "7.1", code: "7.1", title: "METABOLISM (SMART)",                              type: "chapter" },
      { id: "7.2", code: "7.2", title: "ENZYMES (SMART)",                                 type: "chapter" },
      { id: "7.3", code: "7.3", title: "MECHANISM OF ENZYME ACTION (SMART)",              type: "chapter" },
      { id: "7.4", code: "7.4", title: "FACTORS THAT AFFECT THE ACTIVITY OF ENZYMES (SMART)", type: "chapter" },
      { id: "7.5", code: "7.5", title: "ENZYME INHIBITION (SMART)",                      type: "chapter" },
    ],
  },
  {
    id: "chap-8",
    title: "CHAP 8: Bioenergetics",
    type: "unit",
    chapters: [
      { id: "8.1", code: "8.1", title: "ATP: THE CELL'S ENERGY CURRENCY (SMART)", type: "chapter" },
      { id: "8.2", code: "8.2", title: "PHOTOSYNTHESIS (SMART)",                   type: "chapter" },
      { id: "8.3", code: "8.3", title: "CELLULAR RESPIRATION (SMART)",             type: "chapter" },
    ],
  },
  {
    id: "chap-9",
    title: "CHAP 9: Plant Physiology",
    type: "unit",
    chapters: [
      { id: "9.1", code: "9.1", title: "NUTRITION IN PLANTS (SMART)",                  type: "chapter" },
      { id: "9.2", code: "9.2", title: "TRANSPORT IN PLANTS (SMART)",                  type: "chapter" },
      { id: "9.3", code: "9.3", title: "TRANSPIRATION (SMART)",                        type: "chapter" },
      { id: "9.4", code: "9.4", title: "TRANSPORT OF WATER AND SALTS IN PLANTS (SMART)", type: "chapter" },
      { id: "9.5", code: "9.5", title: "TRANSLOCATION OF FOOD IN PLANTS (SMART)",     type: "chapter" },
      { id: "9.6", code: "9.6", title: "GASEOUS EXCHANGE IN PLANTS (SMART)",          type: "chapter" },
      { id: "9.7", code: "9.7", title: "MECHANISMS FOR EXCRETION IN PLANTS (SMART)",  type: "chapter" },
      { id: "9.8", code: "9.8", title: "OSMOTIC ADJUSTMENTS IN PLANTS (SMART)",       type: "chapter" },
    ],
  },
  {
    id: "chap-10",
    title: "CHAP 10: Reproduction In Plants",
    type: "unit",
    chapters: [
      { id: "10.1", code: "10.1", title: "TYPES OF ASEXUAL REPRODUCTION (SMART)",   type: "chapter" },
      { id: "10.2", code: "10.2", title: "ARTIFICIAL PROPAGATION (SMART)",           type: "chapter" },
      { id: "10.3", code: "10.3", title: "SEXUAL REPRODUCTION IN PLANTS (SMART)",   type: "chapter" },
    ],
  },
  {
    id: "chap-11",
    title: "CHAP 11: Biostatistics",
    type: "unit",
    chapters: [
      { id: "11.1", code: "11.1", title: "INTRODUCTION OF BIOSTATISTICS", type: "chapter" },
      { id: "11.2", code: "11.2", title: "MEAN, MEDIAN, AND MODE",        type: "chapter" },
      { id: "11.3", code: "11.3", title: "BAR CHART",                     type: "chapter" },
    ],
  },
];

export function getAllChapters(): Chapter[] {
  return PTB_CLASS9_BIOLOGY.flatMap((u) => u.chapters);
}
export function getChaptersByUnit(unitId: string): Chapter[] {
  return PTB_CLASS9_BIOLOGY.find((u) => u.id === unitId)?.chapters || [];
}
export function getUnitByChapterId(chapterId: string): Unit | undefined {
  return PTB_CLASS9_BIOLOGY.find((u) => u.chapters.some((ch) => ch.id === chapterId));
}
