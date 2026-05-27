/**
 * PTB Class 4 Mathematics Syllabus
 * Complete unit structure with exercises and review exercises
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

export const PTB_CLASS4_MATHEMATICS: Unit[] = [
  {
    id: "unit-1",
    title: "UNIT 1: Whole Numbers",
    type: "unit",
    chapters: [
      { id: "1.1",  code: "1.1",  title: "Whole Numbers Exercise 1",                      type: "chapter" },
      { id: "1.2",  code: "1.2",  title: "Whole Numbers Exercise 2",                      type: "chapter" },
      { id: "1.3",  code: "1.3",  title: "Whole Numbers (Review Exercise)",                type: "chapter" },
      { id: "1.4",  code: "1.4",  title: "Addition and Subtraction Exercise 1",           type: "chapter" },
      { id: "1.5",  code: "1.5",  title: "Addition and Subtraction Exercise 2",           type: "chapter" },
      { id: "1.6",  code: "1.6",  title: "Addition and Subtraction (Review Exercise)",    type: "chapter" },
      { id: "1.7",  code: "1.7",  title: "Multiplication and Division Exercise 1",        type: "chapter" },
      { id: "1.8",  code: "1.8",  title: "Multiplication and Division Exercise 2",        type: "chapter" },
      { id: "1.9",  code: "1.9",  title: "Multiplication and Division Exercise 3",        type: "chapter" },
      { id: "1.10", code: "1.10", title: "Multiplication and Division (Review Exercise)", type: "chapter" },
    ],
  },
  {
    id: "unit-2",
    title: "UNIT 2: Factors and Multiples",
    type: "unit",
    chapters: [
      { id: "2.1", code: "2.1", title: "Exercise 1",       type: "chapter" },
      { id: "2.2", code: "2.2", title: "Exercise 2",       type: "chapter" },
      { id: "2.3", code: "2.3", title: "Exercise 3",       type: "chapter" },
      { id: "2.r", code: "2",   title: "Review Exercise",  type: "chapter" },
    ],
  },
  {
    id: "unit-3",
    title: "UNIT 3: Fractions",
    type: "unit",
    chapters: [
      { id: "3.1", code: "3.1", title: "Exercise 1",       type: "chapter" },
      { id: "3.2", code: "3.2", title: "Exercise 2",       type: "chapter" },
      { id: "3.3", code: "3.3", title: "Exercise 3",       type: "chapter" },
      { id: "3.r", code: "3",   title: "Review Exercise",  type: "chapter" },
    ],
  },
  {
    id: "unit-4",
    title: "UNIT 4: Decimals",
    type: "unit",
    chapters: [
      { id: "4.1", code: "4.1", title: "Exercise 1",       type: "chapter" },
      { id: "4.2", code: "4.2", title: "Exercise 2",       type: "chapter" },
      { id: "4.3", code: "4.3", title: "Exercise 3",       type: "chapter" },
      { id: "4.4", code: "4.4", title: "Exercise 4",       type: "chapter" },
      { id: "4.5", code: "4.5", title: "Exercise 5",       type: "chapter" },
      { id: "4.r", code: "4",   title: "Review Exercise",  type: "chapter" },
    ],
  },
  {
    id: "unit-5",
    title: "UNIT 5: Measurements",
    type: "unit",
    chapters: [
      { id: "5.1",  code: "5.1",  title: "Measurement Exercise 1",          type: "chapter" },
      { id: "5.2",  code: "5.2",  title: "Measurement Exercise 2",          type: "chapter" },
      { id: "5.3",  code: "5.3",  title: "Measurement Exercise 3",          type: "chapter" },
      { id: "5.4",  code: "5.4",  title: "Measurement Exercise 4",          type: "chapter" },
      { id: "5.5",  code: "5.5",  title: "Measurement Exercise 5",          type: "chapter" },
      { id: "5.6",  code: "5.6",  title: "Measurement (Review Exercise)",   type: "chapter" },
      { id: "5.7",  code: "5.7",  title: "Time Exercise 1",                 type: "chapter" },
      { id: "5.8",  code: "5.8",  title: "Time Exercise 2",                 type: "chapter" },
      { id: "5.9",  code: "5.9",  title: "Time Exercise 3",                 type: "chapter" },
      { id: "5.10", code: "5.10", title: "Time Exercise 4",                 type: "chapter" },
      { id: "5.11", code: "5.11", title: "Time (Review Exercise)",          type: "chapter" },
    ],
  },
  {
    id: "unit-6",
    title: "UNIT 6: Geometry",
    type: "unit",
    chapters: [
      { id: "6.1", code: "6.1", title: "Exercise 1",       type: "chapter" },
      { id: "6.2", code: "6.2", title: "Exercise 2",       type: "chapter" },
      { id: "6.3", code: "6.3", title: "Exercise 3",       type: "chapter" },
      { id: "6.4", code: "6.4", title: "Exercise 4",       type: "chapter" },
      { id: "6.5", code: "6.5", title: "Exercise 5",       type: "chapter" },
      { id: "6.6", code: "6.6", title: "Exercise 6",       type: "chapter" },
      { id: "6.r", code: "6",   title: "Review Exercise",  type: "chapter" },
    ],
  },
  {
    id: "unit-7",
    title: "UNIT 7: Data Handling",
    type: "unit",
    chapters: [
      { id: "7.1", code: "7.1", title: "Exercise 1",       type: "chapter" },
      { id: "7.2", code: "7.2", title: "Exercise 2",       type: "chapter" },
      { id: "7.3", code: "7.3", title: "Exercise 3",       type: "chapter" },
      { id: "7.r", code: "7",   title: "Review Exercise",  type: "chapter" },
    ],
  },
];

// Helper function to get all chapters as flat list
export function getAllChapters(): Chapter[] {
  return PTB_CLASS4_MATHEMATICS.flatMap((unit) => unit.chapters);
}

// Helper function to get chapters by unit
export function getChaptersByUnit(unitId: string): Chapter[] {
  const unit = PTB_CLASS4_MATHEMATICS.find((u) => u.id === unitId);
  return unit?.chapters || [];
}

// Helper function to get unit by chapter ID
export function getUnitByChapterId(chapterId: string): Unit | undefined {
  return PTB_CLASS4_MATHEMATICS.find((unit) =>
    unit.chapters.some((ch) => ch.id === chapterId)
  );
}
