/**
 * PTB Class 9 Mathematics Syllabus
 * 13 units with exercises and review exercises
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

export const PTB_CLASS9_MATHEMATICS: Unit[] = [
  {
    id: "unit-1",
    title: "UNIT 1: Real Number",
    type: "unit",
    chapters: [
      { id: "1.1",  code: "1.1", title: "E.X: 1.1 (SMART)",          type: "chapter" },
      { id: "1.2",  code: "1.2", title: "E.X: 1.2 (SMART)",          type: "chapter" },
      { id: "1.3",  code: "1.3", title: "E.X: 1.3",                  type: "chapter" },
      { id: "1.r",  code: "RE1", title: "REVIEW EXERCISE 1 (SMART)", type: "chapter" },
    ],
  },
  {
    id: "unit-2",
    title: "UNIT 2: Logarithms",
    type: "unit",
    chapters: [
      { id: "2.1",  code: "2.1", title: "E.X: 2.1 (SMART)",          type: "chapter" },
      { id: "2.2",  code: "2.2", title: "E.X: 2.2 (SMART)",          type: "chapter" },
      { id: "2.3",  code: "2.3", title: "E.X: 2.3 (SMART)",          type: "chapter" },
      { id: "2.4",  code: "2.4", title: "E.X: 2.4",                  type: "chapter" },
      { id: "2.r",  code: "RE2", title: "REVIEW EXERCISE 2 (SMART)", type: "chapter" },
    ],
  },
  {
    id: "unit-3",
    title: "UNIT 3: Set and Functions",
    type: "unit",
    chapters: [
      { id: "3.1",  code: "3.1", title: "E.X: 3.1 (SMART)",          type: "chapter" },
      { id: "3.2",  code: "3.2", title: "E.X: 3.2 (SMART)",          type: "chapter" },
      { id: "3.3",  code: "3.3", title: "E.X: 3.3",                  type: "chapter" },
      { id: "3.r",  code: "RE3", title: "REVIEW EXERCISE 3 (SMART)", type: "chapter" },
    ],
  },
  {
    id: "unit-4",
    title: "UNIT 4: Factorization and Algebraic Manipulation",
    type: "unit",
    chapters: [
      { id: "4.1",  code: "4.1", title: "E.X: 4.1 (SMART)",          type: "chapter" },
      { id: "4.2",  code: "4.2", title: "E.X: 4.2 (SMART)",          type: "chapter" },
      { id: "4.3",  code: "4.3", title: "E.X: 4.3 (SMART)",          type: "chapter" },
      { id: "4.4",  code: "4.4", title: "E.X: 4.4",                  type: "chapter" },
      { id: "4.r",  code: "RE4", title: "REVIEW EXERCISE 4 (SMART)", type: "chapter" },
    ],
  },
  {
    id: "unit-5",
    title: "UNIT 5: Linear Equations and Inequalities",
    type: "unit",
    chapters: [
      { id: "5.1",  code: "5.1", title: "E.X: 5.1 (SMART)",          type: "chapter" },
      { id: "5.2",  code: "5.2", title: "E.X: 5.2",                  type: "chapter" },
      { id: "5.r",  code: "RE5", title: "REVIEW EXERCISE 5 (SMART)", type: "chapter" },
    ],
  },
  {
    id: "unit-6",
    title: "UNIT 6: Trigonometry",
    type: "unit",
    chapters: [
      { id: "6.1",  code: "6.1", title: "E.X: 6.1 (SMART)",          type: "chapter" },
      { id: "6.2",  code: "6.2", title: "E.X: 6.2 (SMART)",          type: "chapter" },
      { id: "6.3",  code: "6.3", title: "E.X: 6.3 (SMART)",          type: "chapter" },
      { id: "6.4",  code: "6.4", title: "E.X: 6.4 (SMART)",          type: "chapter" },
      { id: "6.5",  code: "6.5", title: "E.X: 6.5 (SMART)",          type: "chapter" },
      { id: "6.6",  code: "6.6", title: "E.X: 6.6",                  type: "chapter" },
      { id: "6.r",  code: "RE6", title: "REVIEW EXERCISE 6 (SMART)", type: "chapter" },
    ],
  },
  {
    id: "unit-7",
    title: "UNIT 7: Coordinate Geometry",
    type: "unit",
    chapters: [
      { id: "7.1",  code: "7.1", title: "E.X: 7.1 (SMART)",          type: "chapter" },
      { id: "7.2",  code: "7.2", title: "E.X: 7.2 (SMART)",          type: "chapter" },
      { id: "7.3",  code: "7.3", title: "E.X: 7.3",                  type: "chapter" },
      { id: "7.r",  code: "RE7", title: "REVIEW EXERCISE 7 (SMART)", type: "chapter" },
    ],
  },
  {
    id: "unit-8",
    title: "UNIT 8: Logic",
    type: "unit",
    chapters: [
      { id: "8.1",  code: "8.1", title: "E.X: 8.1", type: "chapter" },
    ],
  },
  {
    id: "unit-9",
    title: "UNIT 9: Similar Figures",
    type: "unit",
    chapters: [
      { id: "9.1",  code: "9.1", title: "E.X: 9.1 (SMART)",          type: "chapter" },
      { id: "9.2",  code: "9.2", title: "E.X: 9.2 (SMART)",          type: "chapter" },
      { id: "9.3",  code: "9.3", title: "E.X: 9.3 (SMART)",          type: "chapter" },
      { id: "9.4",  code: "9.4", title: "E.X: 9.4",                  type: "chapter" },
      { id: "9.r",  code: "RE9", title: "REVIEW EXERCISE 9 (SMART)", type: "chapter" },
    ],
  },
  {
    id: "unit-10",
    title: "UNIT 10: Graphs of Functions",
    type: "unit",
    chapters: [
      { id: "10.1",  code: "10.1", title: "E.X: 10.1 (SMART)",          type: "chapter" },
      { id: "10.2",  code: "10.2", title: "E.X: 10.2",                  type: "chapter" },
      { id: "10.r",  code: "RE10", title: "REVIEW EXERCISE 10 (SMART)", type: "chapter" },
    ],
  },
  {
    id: "unit-11",
    title: "UNIT 11: Loci and Construction",
    type: "unit",
    chapters: [
      { id: "11.1",  code: "11.1", title: "E.X: 11.1 (SMART)",          type: "chapter" },
      { id: "11.2",  code: "11.2", title: "E.X: 11.2",                  type: "chapter" },
      { id: "11.r",  code: "RE11", title: "REVIEW EXERCISE 11 (SMART)", type: "chapter" },
    ],
  },
  {
    id: "unit-12",
    title: "UNIT 12: Information Handling",
    type: "unit",
    chapters: [
      { id: "12.1",  code: "12.1", title: "E.X: 12.1 (SMART)",          type: "chapter" },
      { id: "12.2",  code: "12.2", title: "E.X: 12.2 (SMART)",          type: "chapter" },
      { id: "12.r",  code: "RE12", title: "REVIEW EXERCISE 12 (SMART)", type: "chapter" },
    ],
  },
  {
    id: "unit-13",
    title: "UNIT 13: Probability",
    type: "unit",
    chapters: [
      { id: "13.1",  code: "13.1", title: "E.X: 13.1 (SMART)",          type: "chapter" },
      { id: "13.2",  code: "13.2", title: "E.X: 13.2 (SMART)",          type: "chapter" },
      { id: "13.r",  code: "RE13", title: "REVIEW EXERCISE 13 (SMART)", type: "chapter" },
    ],
  },
];

export function getAllChapters(): Chapter[] {
  return PTB_CLASS9_MATHEMATICS.flatMap((u) => u.chapters);
}
export function getChaptersByUnit(unitId: string): Chapter[] {
  return PTB_CLASS9_MATHEMATICS.find((u) => u.id === unitId)?.chapters || [];
}
export function getUnitByChapterId(chapterId: string): Unit | undefined {
  return PTB_CLASS9_MATHEMATICS.find((u) => u.chapters.some((ch) => ch.id === chapterId));
}
