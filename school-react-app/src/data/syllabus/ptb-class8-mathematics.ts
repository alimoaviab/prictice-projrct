/**
 * PTB Class 8 Mathematics Syllabus
 * Chapters grouped by parent (Numbers & Operations, Algebra, Mensuration, Geometry, Statistics & Probability)
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

export const PTB_CLASS8_MATHEMATICS: Unit[] = [
  {
    id: "chap-1-real",
    title: "CHAP 1: Numbers and Operations: Real Numbers",
    type: "unit",
    chapters: [
      { id: "1.1", code: "1.1", title: "E.X 1.1", type: "chapter" },
      { id: "1.2", code: "1.2", title: "E.X 1.2", type: "chapter" },
    ],
  },
  {
    id: "chap-1-estimation",
    title: "CHAP 1: Numbers and Operations: Estimation and Approximation",
    type: "unit",
    chapters: [
      { id: "1.3", code: "1.3", title: "E.X 1.3", type: "chapter" },
    ],
  },
  {
    id: "chap-1-square-roots",
    title: "CHAP 1: Numbers and Operations: Square Roots and Cube Roots",
    type: "unit",
    chapters: [
      { id: "1.4",  code: "1.4",  title: "E.X 1.4",            type: "chapter" },
      { id: "1.5",  code: "1.5",  title: "E.X 1.5",            type: "chapter" },
      { id: "1.6",  code: "1.6",  title: "E.X 1.6",            type: "chapter" },
      { id: "1.7",  code: "1.7",  title: "E.X 1.7",            type: "chapter" },
      { id: "1.8",  code: "1.8",  title: "E.X 1.8",            type: "chapter" },
      { id: "1.9",  code: "1.9",  title: "E.X 1.9",            type: "chapter" },
      { id: "1.10", code: "1.10", title: "E.X 1.10",           type: "chapter" },
      { id: "1.11", code: "1.11", title: "E.X 1.11",           type: "chapter" },
      { id: "1.1r", code: "1.1",  title: "Review Exercise (a)", type: "chapter" },
    ],
  },
  {
    id: "chap-1-sets",
    title: "CHAP 1: Numbers and Operations: Sets",
    type: "unit",
    chapters: [
      { id: "1.12", code: "1.12", title: "E.X 1.12", type: "chapter" },
      { id: "1.13", code: "1.13", title: "E.X 1.13", type: "chapter" },
      { id: "1.14", code: "1.14", title: "E.X 1.14", type: "chapter" },
      { id: "1.15", code: "1.15", title: "E.X 1.15", type: "chapter" },
      { id: "1.16", code: "1.16", title: "E.X 1.16", type: "chapter" },
    ],
  },
  {
    id: "chap-1-ratio",
    title: "CHAP 1: Numbers and Operations: Ratio, Rate and Proportion",
    type: "unit",
    chapters: [
      { id: "1.17", code: "1.17", title: "E.X 1.17", type: "chapter" },
      { id: "1.18", code: "1.18", title: "E.X 1.18", type: "chapter" },
    ],
  },
  {
    id: "chap-1-percentage",
    title: "CHAP 1: Numbers and Operations: Percentage and Financial Arithmetic",
    type: "unit",
    chapters: [
      { id: "1.19", code: "1.19", title: "E.X 1.19",            type: "chapter" },
      { id: "1.20", code: "1.20", title: "E.X 1.20",            type: "chapter" },
      { id: "1.21", code: "1.21", title: "E.X 1.21",            type: "chapter" },
      { id: "1.22", code: "1.22", title: "E.X 1.22",            type: "chapter" },
      { id: "1.23", code: "1.23", title: "E.X 1.23",            type: "chapter" },
      { id: "1.24", code: "1.24", title: "E.X 1.24",            type: "chapter" },
      { id: "1.2r", code: "1.2",  title: "Review Exercise (b)", type: "chapter" },
    ],
  },
  {
    id: "chap-2-sequence",
    title: "CHAP 2: Algebra: Number Sequence and Patterns",
    type: "unit",
    chapters: [
      { id: "2.1", code: "2.1", title: "E.X 2.1", type: "chapter" },
      { id: "2.2", code: "2.2", title: "E.X 2.2", type: "chapter" },
      { id: "2.3", code: "2.3", title: "E.X 2.3", type: "chapter" },
    ],
  },
  {
    id: "chap-2-expansion",
    title: "CHAP 2: Algebra: Expansion and Factorization",
    type: "unit",
    chapters: [
      { id: "2.4",  code: "2.4",  title: "E.X 2.4",  type: "chapter" },
      { id: "2.5",  code: "2.5",  title: "E.X 2.5",  type: "chapter" },
      { id: "2.6",  code: "2.6",  title: "E.X 2.6",  type: "chapter" },
      { id: "2.7",  code: "2.7",  title: "E.X 2.7",  type: "chapter" },
      { id: "2.8",  code: "2.8",  title: "E.X 2.8",  type: "chapter" },
      { id: "2.9",  code: "2.9",  title: "E.X 2.9",  type: "chapter" },
      { id: "2.10", code: "2.10", title: "E.X 2.10", type: "chapter" },
      { id: "2.11", code: "2.11", title: "E.X 2.11", type: "chapter" },
      { id: "2.12", code: "2.12", title: "E.X 2.12", type: "chapter" },
      { id: "2.13", code: "2.13", title: "E.X 2.13", type: "chapter" },
      { id: "2.14", code: "2.14", title: "E.X 2.14", type: "chapter" },
      { id: "2.15", code: "2.15", title: "E.X 2.15", type: "chapter" },
      { id: "2.16", code: "2.16", title: "E.X 2.16", type: "chapter" },
    ],
  },
  {
    id: "chap-2-linear",
    title: "CHAP 2: Algebra: Linear Equations and Inequalities",
    type: "unit",
    chapters: [
      { id: "2.17", code: "2.17", title: "E.X 2.17",          type: "chapter" },
      { id: "2.18", code: "2.18", title: "E.X 2.18",          type: "chapter" },
      { id: "2.19", code: "2.19", title: "E.X 2.19",          type: "chapter" },
      { id: "2.20", code: "2.20", title: "E.X 2.20",          type: "chapter" },
      { id: "2.21", code: "2.21", title: "E.X 2.21",          type: "chapter" },
      { id: "2.22", code: "2.22", title: "E.X 2.22",          type: "chapter" },
      { id: "2.1r", code: "2.1",  title: "Review Exercise",   type: "chapter" },
    ],
  },
  {
    id: "chap-3-mensuration",
    title: "CHAP 3: Mensuration",
    type: "unit",
    chapters: [
      { id: "3.1",  code: "3.1",  title: "E.X 3.1",          type: "chapter" },
      { id: "3.2",  code: "3.2",  title: "E.X 3.2",          type: "chapter" },
      { id: "3.3",  code: "3.3",  title: "E.X 3.3",          type: "chapter" },
      { id: "3.4",  code: "3.4",  title: "E.X 3.4",          type: "chapter" },
      { id: "3.5",  code: "3.5",  title: "E.X 3.5",          type: "chapter" },
      { id: "3.6",  code: "3.6",  title: "E.X 3.6",          type: "chapter" },
      { id: "3.7",  code: "3.7",  title: "E.X 3.7",          type: "chapter" },
      { id: "3.1r", code: "3.1",  title: "Review Exercise",  type: "chapter" },
    ],
  },
  {
    id: "chap-4-geometry",
    title: "CHAP 4: Congruency and Similarity, Construction of Triangles and Transformation",
    type: "unit",
    chapters: [
      { id: "4.1",  code: "4.1",  title: "E.X 4.1",          type: "chapter" },
      { id: "4.2",  code: "4.2",  title: "E.X 4.2",          type: "chapter" },
      { id: "4.3",  code: "4.3",  title: "E.X 4.3",          type: "chapter" },
      { id: "4.4",  code: "4.4",  title: "E.X 4.4",          type: "chapter" },
      { id: "4.5",  code: "4.5",  title: "E.X 4.5",          type: "chapter" },
      { id: "4.6",  code: "4.6",  title: "E.X 4.6",          type: "chapter" },
      { id: "4.1r", code: "4.1",  title: "Review Exercise",  type: "chapter" },
    ],
  },
  {
    id: "chap-5-information",
    title: "CHAP 5: Statistics and Probability: Information Handling",
    type: "unit",
    chapters: [
      { id: "5.1", code: "5.1", title: "E.X 5.1", type: "chapter" },
      { id: "5.2", code: "5.2", title: "E.X 5.2", type: "chapter" },
      { id: "5.3", code: "5.3", title: "E.X 5.3", type: "chapter" },
      { id: "5.4", code: "5.4", title: "E.X 5.4", type: "chapter" },
    ],
  },
  {
    id: "chap-5-probability",
    title: "CHAP 5: Statistics and Probability: Probability",
    type: "unit",
    chapters: [
      { id: "5.5",  code: "5.5",  title: "E.X 5.5",          type: "chapter" },
      { id: "5.1r", code: "5.1",  title: "Review Exercise",  type: "chapter" },
    ],
  },
];

export function getAllChapters(): Chapter[] {
  return PTB_CLASS8_MATHEMATICS.flatMap((u) => u.chapters);
}
export function getChaptersByUnit(unitId: string): Chapter[] {
  return PTB_CLASS8_MATHEMATICS.find((u) => u.id === unitId)?.chapters || [];
}
export function getUnitByChapterId(chapterId: string): Unit | undefined {
  return PTB_CLASS8_MATHEMATICS.find((u) => u.chapters.some((ch) => ch.id === chapterId));
}
