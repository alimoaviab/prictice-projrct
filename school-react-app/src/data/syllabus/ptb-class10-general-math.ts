/**
 * PTB Class 10 جنرل ریاضی (General Mathematics) Syllabus
 * 10 units with exercises
 */

export interface Chapter { id: string; code: string; title: string; type: "chapter"; }
export interface Unit { id: string; title: string; type: "unit"; chapters: Chapter[]; }

export const PTB_CLASS10_GENERAL_MATH: Unit[] = [
  {
    id: "unit-1",
    title: "UNIT 1: Algebraic Formulas and Applications",
    type: "unit",
    chapters: [
      { id: "1.1", code: "1.1", title: "EX: 1.1", type: "chapter" },
      { id: "1.2", code: "1.2", title: "EX: 1.2", type: "chapter" },
      { id: "1.3", code: "1.3", title: "EX: 1.3", type: "chapter" },
    ],
  },
  {
    id: "unit-2",
    title: "UNIT 2: Factorization",
    type: "unit",
    chapters: [
      { id: "2.1", code: "2.1", title: "EX: 2.1", type: "chapter" },
      { id: "2.2", code: "2.2", title: "EX: 2.2", type: "chapter" },
      { id: "2.3", code: "2.3", title: "EX: 2.3", type: "chapter" },
      { id: "2.4", code: "2.4", title: "EX: 2.4", type: "chapter" },
      { id: "2.5", code: "2.5", title: "EX: 2.5", type: "chapter" },
    ],
  },
  {
    id: "unit-3",
    title: "UNIT 3: Algebraic Manipulation",
    type: "unit",
    chapters: [
      { id: "3.1", code: "3.1", title: "EX: 3.1", type: "chapter" },
      { id: "3.2", code: "3.2", title: "EX: 3.2", type: "chapter" },
      { id: "3.3", code: "3.3", title: "EX: 3.3", type: "chapter" },
      { id: "3.4", code: "3.4", title: "EX: 3.4", type: "chapter" },
      { id: "3.5", code: "3.5", title: "EX: 3.5", type: "chapter" },
      { id: "3.6", code: "3.6", title: "EX: 3.6", type: "chapter" },
    ],
  },
  {
    id: "unit-4",
    title: "UNIT 4: Linear Equations and Inequalities",
    type: "unit",
    chapters: [
      { id: "4.1", code: "4.1", title: "EX: 4.1", type: "chapter" },
      { id: "4.2", code: "4.2", title: "EX: 4.2", type: "chapter" },
    ],
  },
  {
    id: "unit-5",
    title: "UNIT 5: Quadratic Equations",
    type: "unit",
    chapters: [
      { id: "5.1", code: "5.1", title: "EX: 5.1", type: "chapter" },
      { id: "5.2", code: "5.2", title: "EX: 5.2", type: "chapter" },
      { id: "5.3", code: "5.3", title: "EX: 5.3", type: "chapter" },
    ],
  },
  {
    id: "unit-6",
    title: "UNIT 6: Matrices and Determinants",
    type: "unit",
    chapters: [
      { id: "6.1", code: "6.1", title: "EX: 6.1", type: "chapter" },
      { id: "6.2", code: "6.2", title: "EX: 6.2", type: "chapter" },
      { id: "6.3", code: "6.3", title: "EX: 6.3", type: "chapter" },
      { id: "6.4", code: "6.4", title: "EX: 6.4", type: "chapter" },
      { id: "6.5", code: "6.5", title: "EX: 6.5", type: "chapter" },
      { id: "6.6", code: "6.6", title: "EX: 6.6", type: "chapter" },
    ],
  },
  {
    id: "unit-7",
    title: "UNIT 7: Fundamentals of Geometry",
    type: "unit",
    chapters: [
      { id: "7.1", code: "7.1", title: "EX: 7.1", type: "chapter" },
      { id: "7.2", code: "7.2", title: "EX: 7.2", type: "chapter" },
      { id: "7.3", code: "7.3", title: "EX: 7.3", type: "chapter" },
      { id: "7.4", code: "7.4", title: "EX: 7.4", type: "chapter" },
      { id: "7.5", code: "7.5", title: "EX: 7.5", type: "chapter" },
      { id: "7.6", code: "7.6", title: "EX: 7.6", type: "chapter" },
    ],
  },
  {
    id: "unit-8",
    title: "UNIT 8: Practical Geometry",
    type: "unit",
    chapters: [
      { id: "8.1", code: "8.1", title: "EX: 8.1", type: "chapter" },
    ],
  },
  {
    id: "unit-9",
    title: "UNIT 9: Areas and Volumes",
    type: "unit",
    chapters: [
      { id: "9.1", code: "9.1", title: "EX: 9.1", type: "chapter" },
      { id: "9.2", code: "9.2", title: "EX: 9.2", type: "chapter" },
      { id: "9.3", code: "9.3", title: "EX: 9.3", type: "chapter" },
    ],
  },
  {
    id: "unit-10",
    title: "UNIT 10: Introduction to Coordinate Geometry",
    type: "unit",
    chapters: [
      { id: "10.1", code: "10.1", title: "EX: 10.1", type: "chapter" },
    ],
  },
];

export function getAllChapters(): Chapter[] { return PTB_CLASS10_GENERAL_MATH.flatMap((u) => u.chapters); }
export function getChaptersByUnit(unitId: string): Chapter[] { return PTB_CLASS10_GENERAL_MATH.find((u) => u.id === unitId)?.chapters || []; }
export function getUnitByChapterId(chapterId: string): Unit | undefined { return PTB_CLASS10_GENERAL_MATH.find((u) => u.chapters.some((ch) => ch.id === chapterId)); }
