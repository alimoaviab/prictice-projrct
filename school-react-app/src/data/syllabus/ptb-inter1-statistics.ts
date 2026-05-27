/**
 * PTB Inter Part-I Statistics Syllabus
 * Note: 8.7 and 8.8 marked as "a" in source — preserved exactly
 */

export interface Chapter { id: string; code: string; title: string; type: "chapter"; }
export interface Unit { id: string; title: string; type: "unit"; chapters: Chapter[]; }

export const PTB_INTER1_STATISTICS: Unit[] = [
  {
    id: "chap-1",
    title: "CHAP 1: Introduction to Statistics",
    type: "unit",
    chapters: [
      { id: "1.1", code: "1.1", title: "Introduction",                             type: "chapter" },
      { id: "1.2", code: "1.2", title: "Importance of Statistics in Various Disciplines", type: "chapter" },
      { id: "1.3", code: "1.3", title: "Variables",                                type: "chapter" },
      { id: "1.4", code: "1.4", title: "Description and Inferential Statistics",   type: "chapter" },
      { id: "1.5", code: "1.5", title: "Sources of Data",                          type: "chapter" },
    ],
  },
  {
    id: "chap-2",
    title: "CHAP 2: Representation of Data",
    type: "unit",
    chapters: [
      { id: "2.1", code: "2.1", title: "Introduction",                         type: "chapter" },
      { id: "2.2", code: "2.2", title: "Classification",                       type: "chapter" },
      { id: "2.3", code: "2.3", title: "Tabulation",                           type: "chapter" },
      { id: "2.4", code: "2.4", title: "Frequency Distribution",               type: "chapter" },
      { id: "2.5", code: "2.5", title: "Cumulative Frequency Distribution",    type: "chapter" },
      { id: "2.6", code: "2.6", title: "Graphic Representation of Data",       type: "chapter" },
      { id: "2.7", code: "2.7", title: "Bivariate Frequency Distribution",     type: "chapter" },
    ],
  },
  {
    id: "chap-3",
    title: "CHAP 3: Measure of Location",
    type: "unit",
    chapters: [
      { id: "3.1", code: "3.1", title: "Introduction",                                      type: "chapter" },
      { id: "3.2", code: "3.2", title: "Arithmetic Mean and Weighted Mean",                 type: "chapter" },
      { id: "3.3", code: "3.3", title: "Geometric Mean",                                    type: "chapter" },
      { id: "3.4", code: "3.4", title: "Harmonic Mean",                                     type: "chapter" },
      { id: "3.5", code: "3.5", title: "Median",                                            type: "chapter" },
      { id: "3.6", code: "3.6", title: "Quantiles",                                         type: "chapter" },
      { id: "3.7", code: "3.7", title: "Mode",                                              type: "chapter" },
      { id: "3.8", code: "3.8", title: "Selecting a Suitable Measure of Central Tendency",  type: "chapter" },
    ],
  },
  {
    id: "chap-4",
    title: "CHAP 4: Measure of Dispersion",
    type: "unit",
    chapters: [
      { id: "4.1", code: "4.1", title: "Introduction",                                           type: "chapter" },
      { id: "4.2", code: "4.2", title: "Co-efficient of Variation and Other Relative Measures",  type: "chapter" },
      { id: "4.3", code: "4.3", title: "Moments",                                                type: "chapter" },
      { id: "4.4", code: "4.4", title: "Sheppad's Correction for Grouping Error",               type: "chapter" },
      { id: "4.5", code: "4.5", title: "Skewness",                                              type: "chapter" },
    ],
  },
  {
    id: "chap-5",
    title: "CHAP 5: Index Numbers",
    type: "unit",
    chapters: [
      { id: "5.1", code: "5.1", title: "Introduction",                                              type: "chapter" },
      { id: "5.2", code: "5.2", title: "Construction of Price Index Numbers",                       type: "chapter" },
      { id: "5.3", code: "5.3", title: "Unweighted Index Numbers",                                  type: "chapter" },
      { id: "5.4", code: "5.4", title: "Weighted Index Number",                                     type: "chapter" },
      { id: "5.5", code: "5.5", title: "Consumer Price Index (CPI) and Wholesale Price Index (WPI)", type: "chapter" },
    ],
  },
  {
    id: "chap-6",
    title: "CHAP 6: Probability",
    type: "unit",
    chapters: [
      { id: "6.1", code: "6.1", title: "Introduction",    type: "chapter" },
      { id: "6.2", code: "6.2", title: "Permutations",    type: "chapter" },
      { id: "6.3", code: "6.3", title: "Combinations",    type: "chapter" },
      { id: "6.4", code: "6.4", title: "Probability",     type: "chapter" },
    ],
  },
  {
    id: "chap-7",
    title: "CHAP 7: Random Variables",
    type: "unit",
    chapters: [
      { id: "7.1", code: "7.1", title: "Introduction",                                                                  type: "chapter" },
      { id: "7.2", code: "7.2", title: "Random Numbers and Their Generation",                                           type: "chapter" },
      { id: "7.3", code: "7.3", title: "Application of Random Numbers",                                                 type: "chapter" },
      { id: "7.4", code: "7.4", title: "Concept of Random Variables and Their Construction from Different Fields",      type: "chapter" },
      { id: "7.5", code: "7.5", title: "Discrete and Continuous Random Variables",                                      type: "chapter" },
    ],
  },
  {
    id: "chap-8",
    title: "CHAP 8: Probability Distributions",
    type: "unit",
    chapters: [
      { id: "8.1", code: "8.1", title: "Introduction",                                                                      type: "chapter" },
      { id: "8.2", code: "8.2", title: "Probability Mass Function",                                                         type: "chapter" },
      { id: "8.3", code: "8.3", title: "Probability Density Function",                                                      type: "chapter" },
      { id: "8.4", code: "8.4", title: "Simple Univariate Discrete and Continuous Distributions",                           type: "chapter" },
      { id: "8.5", code: "8.5", title: "Drawing of Probability Mass Function and Probability Density Function",             type: "chapter" },
      { id: "8.6", code: "8.6", title: "Expectation and Variance of the Simple Discrete Random Variable",                   type: "chapter" },
      { id: "8.7", code: "8.7", title: "a",                                                                                 type: "chapter" },
      { id: "8.8", code: "8.8", title: "a",                                                                                 type: "chapter" },
      { id: "8.9", code: "8.9", title: "Distribution Function",                                                             type: "chapter" },
    ],
  },
  {
    id: "chap-9",
    title: "CHAP 9: Binomial and Hyper Geometric Probability Distribution",
    type: "unit",
    chapters: [
      { id: "9.1", code: "9.1", title: "Introduction",                                                                     type: "chapter" },
      { id: "9.2", code: "9.2", title: "Binomial Probability Distribution",                                                type: "chapter" },
      { id: "9.3", code: "9.3", title: "Hypergeometric Distribution and Hypergeometric Experiment",                        type: "chapter" },
    ],
  },
];

export function getAllChapters(): Chapter[] { return PTB_INTER1_STATISTICS.flatMap((u) => u.chapters); }
export function getChaptersByUnit(unitId: string): Chapter[] { return PTB_INTER1_STATISTICS.find((u) => u.id === unitId)?.chapters || []; }
export function getUnitByChapterId(chapterId: string): Unit | undefined { return PTB_INTER1_STATISTICS.find((u) => u.chapters.some((ch) => ch.id === chapterId)); }
