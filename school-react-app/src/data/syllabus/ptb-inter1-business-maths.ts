/**
 * PTB Inter Part-I Business Maths Syllabus
 * 6 units — topic numbers only (no titles provided in source)
 */

export interface Chapter { id: string; code: string; title: string; type: "chapter"; }
export interface Unit { id: string; title: string; type: "unit"; chapters: Chapter[]; }

export const PTB_INTER1_BUSINESS_MATHS: Unit[] = [
  {
    id: "unit-1",
    title: "UNIT 1: Business Arithmetic",
    type: "unit",
    chapters: [
      { id: "1.1", code: "1.1", title: "1.1", type: "chapter" },
      { id: "1.2", code: "1.2", title: "1.2", type: "chapter" },
      { id: "1.3", code: "1.3", title: "1.3", type: "chapter" },
      { id: "1.4", code: "1.4", title: "1.4", type: "chapter" },
      { id: "1.5", code: "1.5", title: "1.5", type: "chapter" },
      { id: "1.6", code: "1.6", title: "1.6", type: "chapter" },
    ],
  },
  {
    id: "unit-2",
    title: "UNIT 2: Mathematics of Finance",
    type: "unit",
    chapters: [
      { id: "2.1", code: "2.1", title: "2.1", type: "chapter" },
      { id: "2.2", code: "2.2", title: "2.2", type: "chapter" },
      { id: "2.3", code: "2.3", title: "2.3", type: "chapter" },
    ],
  },
  {
    id: "unit-3",
    title: "UNIT 3: Linear, Quadratic & Simultaneous Equations",
    type: "unit",
    chapters: [
      { id: "3.1", code: "3.1", title: "3.1", type: "chapter" },
      { id: "3.2", code: "3.2", title: "3.2", type: "chapter" },
      { id: "3.3", code: "3.3", title: "3.3", type: "chapter" },
      { id: "3.4", code: "3.4", title: "3.4", type: "chapter" },
    ],
  },
  {
    id: "unit-4",
    title: "UNIT 4: Functions & their Graphs",
    type: "unit",
    chapters: [
      { id: "4.1", code: "4.1", title: "4.1", type: "chapter" },
      { id: "4.2", code: "4.2", title: "4.2", type: "chapter" },
    ],
  },
  {
    id: "unit-5",
    title: "UNIT 5: Elements of Matrix Algebra",
    type: "unit",
    chapters: [
      { id: "5.1", code: "5.1", title: "5.1", type: "chapter" },
      { id: "5.2", code: "5.2", title: "5.2", type: "chapter" },
    ],
  },
  {
    id: "unit-6",
    title: "UNIT 6: Binary Number System and its Operations",
    type: "unit",
    chapters: [
      { id: "6.1", code: "6.1", title: "6.1", type: "chapter" },
      { id: "6.2", code: "6.2", title: "6.2", type: "chapter" },
    ],
  },
];

export function getAllChapters(): Chapter[] { return PTB_INTER1_BUSINESS_MATHS.flatMap((u) => u.chapters); }
export function getChaptersByUnit(unitId: string): Chapter[] { return PTB_INTER1_BUSINESS_MATHS.find((u) => u.id === unitId)?.chapters || []; }
export function getUnitByChapterId(chapterId: string): Unit | undefined { return PTB_INTER1_BUSINESS_MATHS.find((u) => u.chapters.some((ch) => ch.id === chapterId)); }
