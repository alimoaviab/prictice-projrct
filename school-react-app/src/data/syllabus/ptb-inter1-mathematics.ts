/**
 * PTB Inter Part-I Mathematics Syllabus
 * 14 units with exercises
 * "(SMART)" preserved exactly; Unit 1 first item is "EX 1.1" (no SMART), rest have "(SMART)"
 * Units 8 not present in source data
 */

export interface Chapter { id: string; code: string; title: string; type: "chapter"; }
export interface Unit { id: string; title: string; type: "unit"; chapters: Chapter[]; }

export const PTB_INTER1_MATHEMATICS: Unit[] = [
  {
    id: "unit-1",
    title: "UNIT 1: Complex Numbers",
    type: "unit",
    chapters: [
      { id: "1.1", code: "1.1", title: "EX 1.1",              type: "chapter" },
      { id: "1.2", code: "1.2", title: "E.X: 1.2 (SMART)",   type: "chapter" },
      { id: "1.3", code: "1.3", title: "E.X: 1.3 (SMART)",   type: "chapter" },
      { id: "1.4", code: "1.4", title: "E.X: 1.4 (SMART)",   type: "chapter" },
      { id: "1.5", code: "1.5", title: "E.X: 1.5 (SMART)",   type: "chapter" },
    ],
  },
  {
    id: "unit-2",
    title: "UNIT 2: Functions and Graphs",
    type: "unit",
    chapters: [
      { id: "2.1", code: "2.1", title: "E.X: 2.1 (SMART)", type: "chapter" },
      { id: "2.2", code: "2.2", title: "E.X: 2.2 (SMART)", type: "chapter" },
    ],
  },
  {
    id: "unit-3",
    title: "UNIT 3: Theory of Quadratic Functions",
    type: "unit",
    chapters: [
      { id: "3.1", code: "3.1", title: "E.X: 3.1 (SMART)", type: "chapter" },
      { id: "3.2", code: "3.2", title: "E.X: 3.2 (SMART)", type: "chapter" },
    ],
  },
  {
    id: "unit-4",
    title: "UNIT 4: Matrices and Determinants",
    type: "unit",
    chapters: [
      { id: "4.1", code: "4.1", title: "E.X: 4.1 (SMART)", type: "chapter" },
      { id: "4.2", code: "4.2", title: "E.X: 4.2 (SMART)", type: "chapter" },
      { id: "4.3", code: "4.3", title: "E.X: 4.3 (SMART)", type: "chapter" },
    ],
  },
  {
    id: "unit-5",
    title: "UNIT 5: Partial Fractions",
    type: "unit",
    chapters: [
      { id: "5.1", code: "5.1", title: "E.X: 5.1 (SMART)", type: "chapter" },
      { id: "5.2", code: "5.2", title: "E.X: 5.2 (SMART)", type: "chapter" },
    ],
  },
  {
    id: "unit-6",
    title: "UNIT 6: Sequences and Series",
    type: "unit",
    chapters: [
      { id: "6.1",  code: "6.1",  title: "E.X: 6.1 (SMART)",  type: "chapter" },
      { id: "6.2",  code: "6.2",  title: "E.X: 6.2 (SMART)",  type: "chapter" },
      { id: "6.3",  code: "6.3",  title: "E.X: 6.3 (SMART)",  type: "chapter" },
      { id: "6.4",  code: "6.4",  title: "E.X: 6.4 (SMART)",  type: "chapter" },
      { id: "6.5",  code: "6.5",  title: "E.X: 6.5 (SMART)",  type: "chapter" },
      { id: "6.6",  code: "6.6",  title: "E.X: 6.6 (SMART)",  type: "chapter" },
      { id: "6.7",  code: "6.7",  title: "E.X: 6.7 (SMART)",  type: "chapter" },
      { id: "6.9",  code: "6.9",  title: "E.X: 6.9 (SMART)",  type: "chapter" },
      { id: "6.10", code: "6.10", title: "E.X: 6.10 (SMART)", type: "chapter" },
    ],
  },
  {
    id: "unit-7",
    title: "UNIT 7: Permutations and Combinations",
    type: "unit",
    chapters: [
      { id: "7.1", code: "7.1", title: "E.X: 7.1 (SMART)", type: "chapter" },
      { id: "7.2", code: "7.2", title: "E.X: 7.2 (SMART)", type: "chapter" },
      { id: "7.3", code: "7.3", title: "E.X: 7.3 (SMART)", type: "chapter" },
      { id: "7.4", code: "7.4", title: "E.X: 7.4 (SMART)", type: "chapter" },
    ],
  },
  {
    id: "unit-9",
    title: "UNIT 9: Division of Polynomials",
    type: "unit",
    chapters: [
      { id: "9.1", code: "9.1", title: "E.X: 9.1 (SMART)", type: "chapter" },
      { id: "9.2", code: "9.2", title: "E.X: 9.2 (SMART)", type: "chapter" },
    ],
  },
  {
    id: "unit-10",
    title: "UNIT 10: Trigonometric Identities",
    type: "unit",
    chapters: [
      { id: "10.1", code: "10.1", title: "E.X: 10.1 (SMART)", type: "chapter" },
      { id: "10.2", code: "10.2", title: "E.X: 10.2 (SMART)", type: "chapter" },
      { id: "10.3", code: "10.3", title: "E.X: 10.3 (SMART)", type: "chapter" },
      { id: "10.4", code: "10.4", title: "E.X: 10.4 (SMART)", type: "chapter" },
    ],
  },
  {
    id: "unit-11",
    title: "UNIT 11: Trigonometric Functions and their Graphs",
    type: "unit",
    chapters: [
      { id: "11.1", code: "11.1", title: "E.X: 11.1 (SMART)", type: "chapter" },
      { id: "11.3", code: "11.3", title: "E.X: 11.3 (SMART)", type: "chapter" },
    ],
  },
  {
    id: "unit-12",
    title: "UNIT 12: Limit and Continuity",
    type: "unit",
    chapters: [
      { id: "12.1", code: "12.1", title: "E.X: 12.1 (SMART)", type: "chapter" },
      { id: "12.2", code: "12.2", title: "E.X: 12.2 (SMART)", type: "chapter" },
    ],
  },
  {
    id: "unit-13",
    title: "UNIT 13: Differentiation",
    type: "unit",
    chapters: [
      { id: "13.1", code: "13.1", title: "E.X: 13.1 (SMART)", type: "chapter" },
      { id: "13.2", code: "13.2", title: "E.X: 13.2 (SMART)", type: "chapter" },
    ],
  },
  {
    id: "unit-14",
    title: "UNIT 14: Vectors in space",
    type: "unit",
    chapters: [
      { id: "14.1", code: "14.1", title: "E.X: 14.1 (SMART)", type: "chapter" },
      { id: "14.2", code: "14.2", title: "E.X: 14.2 (SMART)", type: "chapter" },
      { id: "14.3", code: "14.3", title: "E.X: 14.3 (SMART)", type: "chapter" },
    ],
  },
];

export function getAllChapters(): Chapter[] { return PTB_INTER1_MATHEMATICS.flatMap((u) => u.chapters); }
export function getChaptersByUnit(unitId: string): Chapter[] { return PTB_INTER1_MATHEMATICS.find((u) => u.id === unitId)?.chapters || []; }
export function getUnitByChapterId(chapterId: string): Unit | undefined { return PTB_INTER1_MATHEMATICS.find((u) => u.chapters.some((ch) => ch.id === chapterId)); }
