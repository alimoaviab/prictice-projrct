/**
 * PTB Class 2 Mathematics Syllabus
 * Complete chapter structure with exercises and review exercises
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

export const PTB_CLASS2_MATHEMATICS: Unit[] = [
  {
    id: "chap-1",
    title: "CHAP 1: Whole Numbers",
    type: "unit",
    chapters: [
      { id: "1.1", code: "1.1", title: "Exercise 1", type: "chapter" },
      { id: "1.2", code: "1.2", title: "Exercise 2", type: "chapter" },
      { id: "1.3", code: "1.3", title: "Exercise 3", type: "chapter" },
      { id: "1.4", code: "1.4", title: "Exercise 4", type: "chapter" },
      { id: "1.r", code: "1", title: "Review Exercise", type: "chapter" },
    ],
  },
  {
    id: "chap-2-addition",
    title: "CHAP 2 Numbers Operations: Addition",
    type: "unit",
    chapters: [
      { id: "2.1", code: "2.1", title: "Exercise 1", type: "chapter" },
      { id: "2.2", code: "2.2", title: "Exercise 2", type: "chapter" },
      { id: "2.3", code: "2.3", title: "Exercise 3", type: "chapter" },
      { id: "2.1r", code: "2.1", title: "Review Exercise", type: "chapter" },
    ],
  },
  {
    id: "chap-2-subtraction",
    title: "CHAP 2 Numbers Operations: Subtraction",
    type: "unit",
    chapters: [
      { id: "2.4", code: "2.4", title: "Exercise 1", type: "chapter" },
      { id: "2.5", code: "2.5", title: "Exercise 2", type: "chapter" },
      { id: "2.6", code: "2.6", title: "Exercise 3", type: "chapter" },
      { id: "2.2r", code: "2.2", title: "Review Exercise", type: "chapter" },
    ],
  },
  {
    id: "chap-2-multiplication",
    title: "CHAP 2 Numbers Operations: Multiplication",
    type: "unit",
    chapters: [
      { id: "2.7", code: "2.7", title: "Exercise 1", type: "chapter" },
      { id: "2.8", code: "2.8", title: "Exercise 2", type: "chapter" },
      { id: "2.3r", code: "2.3", title: "Review Exercise", type: "chapter" },
    ],
  },
  {
    id: "chap-2-division",
    title: "CHAP 2 Numbers Operations: Division",
    type: "unit",
    chapters: [
      { id: "2.9", code: "2.9", title: "Exercise 1", type: "chapter" },
      { id: "2.4r", code: "2.4", title: "Review Exercise", type: "chapter" },
    ],
  },
  {
    id: "chap-3",
    title: "CHAP 3: Fractions",
    type: "unit",
    chapters: [
      { id: "3.1", code: "3.1", title: "Exercise 1", type: "chapter" },
      { id: "3.2", code: "3.2", title: "Exercise 2", type: "chapter" },
      { id: "3.r", code: "3", title: "Review Exercise", type: "chapter" },
    ],
  },
  {
    id: "chap-4",
    title: "CHAP 4: Measurement (Length, Mass, Capacity)",
    type: "unit",
    chapters: [
      { id: "4.1", code: "4.1", title: "Exercise 1", type: "chapter" },
      { id: "4.2", code: "4.2", title: "Exercise 2", type: "chapter" },
      { id: "4.3", code: "4.3", title: "Exercise 3", type: "chapter" },
      { id: "4.4", code: "4.4", title: "Exercise 4", type: "chapter" },
      { id: "4.5", code: "4.5", title: "Exercise 5", type: "chapter" },
      { id: "4.6", code: "4.6", title: "Exercise 6", type: "chapter" },
      { id: "4.r", code: "4", title: "Review Exercise", type: "chapter" },
    ],
  },
  {
    id: "chap-5",
    title: "CHAP 5: Time",
    type: "unit",
    chapters: [
      { id: "5.1", code: "5.1", title: "Reading and Writing the Time", type: "chapter" },
      { id: "5.2", code: "5.2", title: "Usage of a.m. and p.m. in Time", type: "chapter" },
      { id: "5.3", code: "5.3", title: "Drawing Hands of the Clock", type: "chapter" },
      { id: "5.4", code: "5.4", title: "Solar Calendar", type: "chapter" },
      { id: "5.5", code: "5.5", title: "Lunar Calendar", type: "chapter" },
      { id: "5.r", code: "5", title: "Review Exercise", type: "chapter" },
    ],
  },
  {
    id: "chap-6",
    title: "CHAP 6: Geometry",
    type: "unit",
    chapters: [
      { id: "6.1", code: "6.1", title: "Exercise 1", type: "chapter" },
      { id: "6.2", code: "6.2", title: "Exercise 2", type: "chapter" },
      { id: "6.3", code: "6.3", title: "Exercise 3", type: "chapter" },
      { id: "6.4", code: "6.4", title: "Exercise 4", type: "chapter" },
      { id: "6.5", code: "6.5", title: "Exercise 5", type: "chapter" },
      { id: "6.r", code: "6", title: "Review Exercise", type: "chapter" },
    ],
  },
];

// Helper function to get all chapters as flat list
export function getAllChapters(): Chapter[] {
  return PTB_CLASS2_MATHEMATICS.flatMap((unit) => unit.chapters);
}

// Helper function to get chapters by unit
export function getChaptersByUnit(unitId: string): Chapter[] {
  const unit = PTB_CLASS2_MATHEMATICS.find((u) => u.id === unitId);
  return unit?.chapters || [];
}

// Helper function to get unit by chapter ID
export function getUnitByChapterId(chapterId: string): Unit | undefined {
  return PTB_CLASS2_MATHEMATICS.find((unit) =>
    unit.chapters.some((ch) => ch.id === chapterId)
  );
}
