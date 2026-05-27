/**
 * PTB Class 5 Mathematics Syllabus
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

export const PTB_CLASS5_MATHEMATICS: Unit[] = [
  {
    id: "unit-1",
    title: "UNIT 1: Whole Number and Operations",
    type: "unit",
    chapters: [
      { id: "1.1", code: "1.1", title: "Exercise 1",      type: "chapter" },
      { id: "1.2", code: "1.2", title: "Exercise 2",      type: "chapter" },
      { id: "1.3", code: "1.3", title: "Exercise 3",      type: "chapter" },
      { id: "1.4", code: "1.4", title: "Exercise 4",      type: "chapter" },
      { id: "1.r", code: "1",   title: "Review Exercise", type: "chapter" },
    ],
  },
  {
    id: "unit-2",
    title: "UNIT 2: HCF and LCM",
    type: "unit",
    chapters: [
      { id: "2.1", code: "2.1", title: "Exercise 1",      type: "chapter" },
      { id: "2.2", code: "2.2", title: "Exercise 2",      type: "chapter" },
      { id: "2.r", code: "2",   title: "Review Exercise", type: "chapter" },
    ],
  },
  {
    id: "unit-3",
    title: "UNIT 3: Fractions",
    type: "unit",
    chapters: [
      { id: "3.1", code: "3.1", title: "Exercise 1",      type: "chapter" },
      { id: "3.2", code: "3.2", title: "Exercise 2",      type: "chapter" },
      { id: "3.r", code: "3",   title: "Review Exercise", type: "chapter" },
    ],
  },
  {
    id: "unit-4",
    title: "UNIT 4: Decimals and Percentages",
    type: "unit",
    chapters: [
      { id: "4.1", code: "4.1", title: "Exercise 1",      type: "chapter" },
      { id: "4.2", code: "4.2", title: "Exercise 2",      type: "chapter" },
      { id: "4.3", code: "4.3", title: "Exercise 3",      type: "chapter" },
      { id: "4.4", code: "4.4", title: "Exercise 4",      type: "chapter" },
      { id: "4.5", code: "4.5", title: "Exercise 5",      type: "chapter" },
      { id: "4.6", code: "4.6", title: "Exercise 6",      type: "chapter" },
      { id: "4.7", code: "4.7", title: "Exercise 7",      type: "chapter" },
      { id: "4.r", code: "4",   title: "Review Exercise", type: "chapter" },
    ],
  },
  {
    id: "unit-5",
    title: "UNIT 5: Distance and Time",
    type: "unit",
    chapters: [
      { id: "5.1", code: "5.1", title: "Exercise 1",      type: "chapter" },
      { id: "5.2", code: "5.2", title: "Exercise 2",      type: "chapter" },
      { id: "5.3", code: "5.3", title: "Exercise 3",      type: "chapter" },
      { id: "5.r", code: "5",   title: "Review Exercise", type: "chapter" },
    ],
  },
  {
    id: "unit-6",
    title: "UNIT 6: Unitary Method",
    type: "unit",
    chapters: [
      { id: "6.1", code: "6.1", title: "Exercise 1",      type: "chapter" },
      { id: "6.2", code: "6.2", title: "Exercise 2",      type: "chapter" },
      { id: "6.r", code: "6",   title: "Review Exercise", type: "chapter" },
    ],
  },
  {
    id: "unit-7",
    title: "UNIT 7: Geometry",
    type: "unit",
    chapters: [
      { id: "7.1", code: "7.1", title: "Exercise 1",      type: "chapter" },
      { id: "7.2", code: "7.2", title: "Exercise 2",      type: "chapter" },
      { id: "7.3", code: "7.3", title: "Exercise 3",      type: "chapter" },
      { id: "7.4", code: "7.4", title: "Exercise 4",      type: "chapter" },
      { id: "7.5", code: "7.5", title: "Exercise 5",      type: "chapter" },
      { id: "7.r", code: "7",   title: "Review Exercise", type: "chapter" },
    ],
  },
  {
    id: "unit-8",
    title: "UNIT 8: Perimeter and Area",
    type: "unit",
    chapters: [
      { id: "8.1", code: "8.1", title: "Exercise 1",      type: "chapter" },
      { id: "8.2", code: "8.2", title: "Exercise 2",      type: "chapter" },
      { id: "8.r", code: "8",   title: "Review Exercise", type: "chapter" },
    ],
  },
  {
    id: "unit-9",
    title: "UNIT 9: Data Handling",
    type: "unit",
    chapters: [
      { id: "9.1", code: "9.1", title: "Exercise 1",      type: "chapter" },
      { id: "9.2", code: "9.2", title: "Exercise 2",      type: "chapter" },
      { id: "9.r", code: "9",   title: "Review Exercise", type: "chapter" },
    ],
  },
];

// Helper function to get all chapters as flat list
export function getAllChapters(): Chapter[] {
  return PTB_CLASS5_MATHEMATICS.flatMap((unit) => unit.chapters);
}

// Helper function to get chapters by unit
export function getChaptersByUnit(unitId: string): Chapter[] {
  const unit = PTB_CLASS5_MATHEMATICS.find((u) => u.id === unitId);
  return unit?.chapters || [];
}

// Helper function to get unit by chapter ID
export function getUnitByChapterId(chapterId: string): Unit | undefined {
  return PTB_CLASS5_MATHEMATICS.find((unit) =>
    unit.chapters.some((ch) => ch.id === chapterId)
  );
}
