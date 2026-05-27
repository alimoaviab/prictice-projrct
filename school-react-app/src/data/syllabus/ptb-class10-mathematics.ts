/**
 * PTB Class 10 Mathematics Syllabus
 * 12 units. Units 1-2 have visible exercises; Units 3-12 exercise details not visible in source.
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

export const PTB_CLASS10_MATHEMATICS: Unit[] = [
  {
    id: "unit-1",
    title: "UNIT 1: COMPLEX NUMBERS",
    type: "unit",
    chapters: [
      { id: "1.1",  code: "1.1",  title: "E.X: 1.1",          type: "chapter" },
      { id: "1.2",  code: "1.2",  title: "E.X: 1.2",          type: "chapter" },
      { id: "1.3",  code: "1.3",  title: "E.X: 1.3",          type: "chapter" },
      { id: "1.4",  code: "1.4",  title: "E.X: 1.4",          type: "chapter" },
      { id: "1.r",  code: "RE1",  title: "REVIEW EXERCISE 1", type: "chapter" },
    ],
  },
  {
    id: "unit-2",
    title: "UNIT 2: QUADRATIC EQUATIONS AND INEQUALITIES",
    type: "unit",
    chapters: [
      { id: "2.1",  code: "2.1",  title: "E.X: 2.1",          type: "chapter" },
      { id: "2.2",  code: "2.2",  title: "E.X: 2.2",          type: "chapter" },
      { id: "2.3",  code: "2.3",  title: "E.X: 2.3",          type: "chapter" },
      { id: "2.4",  code: "2.4",  title: "E.X: 2.4",          type: "chapter" },
      { id: "2.5",  code: "2.5",  title: "E.X: 2.5",          type: "chapter" },
      { id: "2.6",  code: "2.6",  title: "E.X: 2.6",          type: "chapter" },
      { id: "2.7",  code: "2.7",  title: "E.X: 2.7",          type: "chapter" },
      { id: "2.r",  code: "RE2",  title: "REVIEW EXERCISE 2", type: "chapter" },
    ],
  },
  {
    id: "unit-3",
    title: "UNIT 3: MATRICES AND DETERMINANTS",
    type: "unit",
    chapters: [
      { id: "3.1", code: "3.1", title: "MATRICES AND DETERMINANTS", type: "chapter" },
    ],
  },
  {
    id: "unit-4",
    title: "UNIT 4: FUNCTIONS AND GRAPHS",
    type: "unit",
    chapters: [
      { id: "4.1", code: "4.1", title: "FUNCTIONS AND GRAPHS", type: "chapter" },
    ],
  },
  {
    id: "unit-5",
    title: "UNIT 5: ALGEBRAIC FRACTIONS",
    type: "unit",
    chapters: [
      { id: "5.1", code: "5.1", title: "ALGEBRAIC FRACTIONS", type: "chapter" },
    ],
  },
  {
    id: "unit-6",
    title: "UNIT 6: VECTORS IN PLANE",
    type: "unit",
    chapters: [
      { id: "6.1", code: "6.1", title: "VECTORS IN PLANE", type: "chapter" },
    ],
  },
  {
    id: "unit-7",
    title: "UNIT 7: TRIGONOMETRY",
    type: "unit",
    chapters: [
      { id: "7.1", code: "7.1", title: "TRIGONOMETRY", type: "chapter" },
    ],
  },
  {
    id: "unit-8",
    title: "UNIT 8: CHORDS AND ARCS OF A CIRCLE",
    type: "unit",
    chapters: [
      { id: "8.1", code: "8.1", title: "CHORDS AND ARCS OF A CIRCLE", type: "chapter" },
    ],
  },
  {
    id: "unit-9",
    title: "UNIT 9: TANGENT AND ANGLES OF A CIRCLE",
    type: "unit",
    chapters: [
      { id: "9.1", code: "9.1", title: "TANGENT AND ANGLES OF A CIRCLE", type: "chapter" },
    ],
  },
  {
    id: "unit-10",
    title: "UNIT 10: PRACTICAL GEOMETRY OF CIRCLES",
    type: "unit",
    chapters: [
      { id: "10.1", code: "10.1", title: "PRACTICAL GEOMETRY OF CIRCLES", type: "chapter" },
    ],
  },
  {
    id: "unit-11",
    title: "UNIT 11: INFORMATION HANDLING",
    type: "unit",
    chapters: [
      { id: "11.1", code: "11.1", title: "INFORMATION HANDLING", type: "chapter" },
    ],
  },
  {
    id: "unit-12",
    title: "UNIT 12: PROBABILITY",
    type: "unit",
    chapters: [
      { id: "12.1", code: "12.1", title: "PROBABILITY", type: "chapter" },
    ],
  },
];

export function getAllChapters(): Chapter[] {
  return PTB_CLASS10_MATHEMATICS.flatMap((u) => u.chapters);
}
export function getChaptersByUnit(unitId: string): Chapter[] {
  return PTB_CLASS10_MATHEMATICS.find((u) => u.id === unitId)?.chapters || [];
}
export function getUnitByChapterId(chapterId: string): Unit | undefined {
  return PTB_CLASS10_MATHEMATICS.find((u) => u.chapters.some((ch) => ch.id === chapterId));
}
