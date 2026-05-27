/**
 * PTB Class 6 Mathematics Syllabus
 * Chapters grouped by parent chapter (Numbers & Operations, Algebra, Measurement, Geometry, Statistics)
 * Numbering preserved exactly as provided
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

export const PTB_CLASS6_MATHEMATICS: Unit[] = [
  {
    id: "chap-1-factors",
    title: "CHAP 1 Numbers and Operation: Factors and Multiples",
    type: "unit",
    chapters: [
      { id: "1.1",  code: "1.1",  title: "E.X 1.1",          type: "chapter" },
      { id: "1.2",  code: "1.2",  title: "E.X 1.2",          type: "chapter" },
      { id: "1.3",  code: "1.3",  title: "E.X 1.3",          type: "chapter" },
      { id: "1.4",  code: "1.4",  title: "E.X 1.4",          type: "chapter" },
      { id: "1.5",  code: "1.5",  title: "E.X 1.5",          type: "chapter" },
      { id: "1.6",  code: "1.6",  title: "E.X 1.6",          type: "chapter" },
      { id: "1.1r", code: "1.1",  title: "Review Exercise",   type: "chapter" },
    ],
  },
  {
    id: "chap-1-integers",
    title: "CHAP 1 Number and Operations: Integers",
    type: "unit",
    chapters: [
      { id: "2.1",  code: "2.1",  title: "E.X 2.1",          type: "chapter" },
      { id: "2.2",  code: "2.2",  title: "E.X 2.2",          type: "chapter" },
      { id: "1.2r", code: "1.2",  title: "Review Exercise",   type: "chapter" },
    ],
  },
  {
    id: "chap-1-law-integers",
    title: "CHAP 1 Number and Operations: Law of Integers",
    type: "unit",
    chapters: [
      { id: "3.1",  code: "3.1",  title: "E.X 3.1",          type: "chapter" },
      { id: "3.2",  code: "3.2",  title: "E.X 3.2",          type: "chapter" },
      { id: "3.3",  code: "3.3",  title: "E.X 3.3",          type: "chapter" },
      { id: "1.3r", code: "1.3",  title: "Review Exercise",   type: "chapter" },
    ],
  },
  {
    id: "chap-1-ratio",
    title: "CHAP 1 Number and Operations: Rate, Ration and Percentage",
    type: "unit",
    chapters: [
      { id: "4.1",  code: "4.1",  title: "E.X 4.1",          type: "chapter" },
      { id: "4.2",  code: "4.2",  title: "E.X 4.2",          type: "chapter" },
      { id: "4.3",  code: "4.3",  title: "E.X 4.3",          type: "chapter" },
      { id: "4.4",  code: "4.4",  title: "E.X 4.4",          type: "chapter" },
      { id: "4.5",  code: "4.5",  title: "E.X 4.5",          type: "chapter" },
      { id: "1.4r", code: "1.4",  title: "Review Exercise",   type: "chapter" },
    ],
  },
  {
    id: "chap-1-sets",
    title: "CHAP 1 Number and Operations: Sets",
    type: "unit",
    chapters: [
      { id: "5.1",  code: "5.1",  title: "E.X 5.1",          type: "chapter" },
      { id: "5.2",  code: "5.2",  title: "E.X 5.2",          type: "chapter" },
      { id: "5.3",  code: "5.3",  title: "E.X 5.3",          type: "chapter" },
      { id: "1.5r", code: "1.5",  title: "Review Exercise",   type: "chapter" },
    ],
  },
  {
    id: "chap-2-algebraic",
    title: "CHAP 2 Algebra : Algebraic Expressions",
    type: "unit",
    chapters: [
      { id: "6.1",  code: "6.1",  title: "E.X 6.1",          type: "chapter" },
      { id: "6.2",  code: "6.2",  title: "E.X 6.2",          type: "chapter" },
      { id: "6.3",  code: "6.3",  title: "E.X 6.3",          type: "chapter" },
      { id: "6.4",  code: "6.4",  title: "E.X 6.4",          type: "chapter" },
      { id: "6.5",  code: "6.5",  title: "E.X 6.5",          type: "chapter" },
      { id: "2.1r", code: "2.1",  title: "Review Exercise",   type: "chapter" },
    ],
  },
  {
    id: "chap-2-linear",
    title: "CHAP 2 Algebra : Linear Equations",
    type: "unit",
    chapters: [
      { id: "7.1",  code: "7.1",  title: "E.X 7.1",          type: "chapter" },
      { id: "7.2",  code: "7.2",  title: "E.X 7.2",          type: "chapter" },
      { id: "2.2r", code: "2.2",  title: "Review Exercise",   type: "chapter" },
    ],
  },
  {
    id: "chap-3-surface",
    title: "CHAP 3 Measurement: Surface Area and Volume",
    type: "unit",
    chapters: [
      { id: "8.1",  code: "8.1",  title: "E.X 8.1",          type: "chapter" },
      { id: "8.2",  code: "8.2",  title: "E.X 8.2",          type: "chapter" },
      { id: "8.3",  code: "8.3",  title: "E.X 8.3",          type: "chapter" },
      { id: "3.1r", code: "3.1",  title: "Review Exercise",   type: "chapter" },
    ],
  },
  {
    id: "chap-4-symmetry",
    title: "CHAP 4 Geometry : Symmetry",
    type: "unit",
    chapters: [
      { id: "9.1",  code: "9.1",  title: "E.X 9.1",          type: "chapter" },
      { id: "9.2",  code: "9.2",  title: "E.X 9.2",          type: "chapter" },
      { id: "9.3",  code: "9.3",  title: "E.X 9.3",          type: "chapter" },
      { id: "4.1r", code: "4.1",  title: "Review Exercise",   type: "chapter" },
    ],
  },
  {
    id: "chap-4-constructions",
    title: "CHAP 4 Geometry : Geometrical Constructions",
    type: "unit",
    chapters: [
      { id: "10.1",  code: "10.1", title: "E.X 10.1",        type: "chapter" },
      { id: "10.2",  code: "10.2", title: "E.X 10.2",        type: "chapter" },
      { id: "10.3",  code: "10.3", title: "E.X 10.3",        type: "chapter" },
      { id: "4.2r",  code: "4.2",  title: "Review Exercise",  type: "chapter" },
    ],
  },
  {
    id: "chap-5-data",
    title: "CHAP 5 Statistics and Probability : Data Management",
    type: "unit",
    chapters: [
      { id: "11.1",  code: "11.1", title: "E.X 11.1",        type: "chapter" },
      { id: "11.2",  code: "11.2", title: "E.X 11.2",        type: "chapter" },
      { id: "11.3",  code: "11.3", title: "E.X 11.3",        type: "chapter" },
      { id: "11.4",  code: "11.4", title: "E.X 11.4",        type: "chapter" },
      { id: "5.1r",  code: "5.1",  title: "Review Exercise",  type: "chapter" },
    ],
  },
  {
    id: "chap-5-probability",
    title: "CHAP 5 Statistics and Probability : Probability",
    type: "unit",
    chapters: [
      { id: "12.1",  code: "12.1", title: "E.X 12.1",        type: "chapter" },
      { id: "5.2r",  code: "5.2",  title: "Review Exercise",  type: "chapter" },
    ],
  },
];

export function getAllChapters(): Chapter[] {
  return PTB_CLASS6_MATHEMATICS.flatMap((u) => u.chapters);
}
export function getChaptersByUnit(unitId: string): Chapter[] {
  return PTB_CLASS6_MATHEMATICS.find((u) => u.id === unitId)?.chapters || [];
}
export function getUnitByChapterId(chapterId: string): Unit | undefined {
  return PTB_CLASS6_MATHEMATICS.find((u) => u.chapters.some((ch) => ch.id === chapterId));
}
