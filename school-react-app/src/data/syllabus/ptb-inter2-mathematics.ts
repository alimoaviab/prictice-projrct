/**
 * PTB Inter Part-II Mathematics Syllabus
 * 7 units with exercises
 */

export interface Chapter { id: string; code: string; title: string; type: "chapter"; }
export interface Unit { id: string; title: string; type: "unit"; chapters: Chapter[]; }

export const PTB_INTER2_MATHEMATICS: Unit[] = [
  {
    id: "unit-1",
    title: "UNIT 1: Functions and Limits",
    type: "unit",
    chapters: [
      { id: "1.1", code: "1.1", title: "EX : 1.1", type: "chapter" },
      { id: "1.2", code: "1.2", title: "EX : 1.2", type: "chapter" },
      { id: "1.3", code: "1.3", title: "EX : 1.3", type: "chapter" },
      { id: "1.4", code: "1.4", title: "EX : 1.4", type: "chapter" },
      { id: "1.5", code: "1.5", title: "EX : 1.5", type: "chapter" },
    ],
  },
  {
    id: "unit-2",
    title: "UNIT 2: Differentiation",
    type: "unit",
    chapters: [
      { id: "2.1",  code: "2.1",  title: "EX : 2.1",  type: "chapter" },
      { id: "2.2",  code: "2.2",  title: "EX : 2.2",  type: "chapter" },
      { id: "2.3",  code: "2.3",  title: "EX : 2.3",  type: "chapter" },
      { id: "2.4",  code: "2.4",  title: "EX : 2.4",  type: "chapter" },
      { id: "2.5",  code: "2.5",  title: "EX : 2.5",  type: "chapter" },
      { id: "2.6",  code: "2.6",  title: "EX : 2.6",  type: "chapter" },
      { id: "2.7",  code: "2.7",  title: "EX : 2.7",  type: "chapter" },
      { id: "2.8",  code: "2.8",  title: "EX : 2.8",  type: "chapter" },
      { id: "2.9",  code: "2.9",  title: "EX : 2.9",  type: "chapter" },
      { id: "2.10", code: "2.10", title: "EX : 2.10", type: "chapter" },
    ],
  },
  {
    id: "unit-3",
    title: "UNIT 3: Integration",
    type: "unit",
    chapters: [
      { id: "3.1", code: "3.1", title: "EX : 3.1", type: "chapter" },
      { id: "3.2", code: "3.2", title: "EX : 3.2", type: "chapter" },
      { id: "3.3", code: "3.3", title: "EX : 3.3", type: "chapter" },
      { id: "3.4", code: "3.4", title: "EX : 3.4", type: "chapter" },
      { id: "3.5", code: "3.5", title: "EX : 3.5", type: "chapter" },
      { id: "3.6", code: "3.6", title: "EX : 3.6", type: "chapter" },
      { id: "3.7", code: "3.7", title: "EX : 3.7", type: "chapter" },
      { id: "3.8", code: "3.8", title: "EX : 3.8", type: "chapter" },
    ],
  },
  {
    id: "unit-4",
    title: "UNIT 4: Introduction to Analytic Geometry",
    type: "unit",
    chapters: [
      { id: "4.1", code: "4.1", title: "EX : 4.1", type: "chapter" },
      { id: "4.2", code: "4.2", title: "EX : 4.2", type: "chapter" },
      { id: "4.3", code: "4.3", title: "EX : 4.3", type: "chapter" },
      { id: "4.4", code: "4.4", title: "EX : 4.4", type: "chapter" },
      { id: "4.5", code: "4.5", title: "EX : 4.5", type: "chapter" },
    ],
  },
  {
    id: "unit-5",
    title: "UNIT 5: Linear Inequalities and Linear Programming",
    type: "unit",
    chapters: [
      { id: "5.1", code: "5.1", title: "EX : 5.1", type: "chapter" },
      { id: "5.2", code: "5.2", title: "EX : 5.2", type: "chapter" },
      { id: "5.3", code: "5.3", title: "EX : 5.3", type: "chapter" },
    ],
  },
  {
    id: "unit-6",
    title: "UNIT 6: Conic Section",
    type: "unit",
    chapters: [
      { id: "6.1", code: "6.1", title: "EX : 6.1", type: "chapter" },
      { id: "6.2", code: "6.2", title: "EX : 6.2", type: "chapter" },
      { id: "6.3", code: "6.3", title: "EX : 6.3", type: "chapter" },
      { id: "6.4", code: "6.4", title: "EX : 6.4", type: "chapter" },
      { id: "6.5", code: "6.5", title: "EX : 6.5", type: "chapter" },
      { id: "6.6", code: "6.6", title: "EX : 6.6", type: "chapter" },
      { id: "6.7", code: "6.7", title: "EX : 6.7", type: "chapter" },
      { id: "6.8", code: "6.8", title: "EX : 6.8", type: "chapter" },
      { id: "6.9", code: "6.9", title: "EX : 6.9", type: "chapter" },
    ],
  },
  {
    id: "unit-7",
    title: "UNIT 7: Vectors",
    type: "unit",
    chapters: [
      { id: "7.1", code: "7.1", title: "EX : 7.1", type: "chapter" },
      { id: "7.2", code: "7.2", title: "EX : 7.2", type: "chapter" },
      { id: "7.3", code: "7.3", title: "EX : 7.3", type: "chapter" },
      { id: "7.4", code: "7.4", title: "EX : 7.4", type: "chapter" },
      { id: "7.5", code: "7.5", title: "EX : 7.5", type: "chapter" },
    ],
  },
];

export function getAllChapters(): Chapter[] { return PTB_INTER2_MATHEMATICS.flatMap((u) => u.chapters); }
export function getChaptersByUnit(unitId: string): Chapter[] { return PTB_INTER2_MATHEMATICS.find((u) => u.id === unitId)?.chapters || []; }
export function getUnitByChapterId(chapterId: string): Unit | undefined { return PTB_INTER2_MATHEMATICS.find((u) => u.chapters.some((ch) => ch.id === chapterId)); }
