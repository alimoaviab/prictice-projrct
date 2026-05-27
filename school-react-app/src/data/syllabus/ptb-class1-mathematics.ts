/**
 * PTB Class 1 Mathematics Syllabus
 * Complete chapter structure with review exercises
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

export const PTB_CLASS1_MATHEMATICS: Unit[] = [
  {
    id: "chap-1",
    title: "CHAP 1: Whole Numbers",
    type: "unit",
    chapters: [
      { id: "1.1", code: "1.1", title: "Whole Numbers", type: "chapter" },
      { id: "1.2", code: "1.2", title: "Review Exercise", type: "chapter" },
    ],
  },
  {
    id: "chap-2",
    title: "CHAP 2: Number Operations",
    type: "unit",
    chapters: [
      { id: "2.1", code: "2.1", title: "Addition", type: "chapter" },
      { id: "2.2", code: "2.2", title: "Subtraction", type: "chapter" },
      { id: "2.3", code: "2.3", title: "Review Exercise", type: "chapter" },
    ],
  },
  {
    id: "chap-3",
    title: "CHAP 3: Measurement",
    type: "unit",
    chapters: [
      { id: "3.1", code: "3.1", title: "Length", type: "chapter" },
      { id: "3.2", code: "3.2", title: "Mass", type: "chapter" },
      { id: "3.3", code: "3.3", title: "Review Exercise", type: "chapter" },
    ],
  },
  {
    id: "chap-4",
    title: "CHAP 4: Money",
    type: "unit",
    chapters: [
      { id: "4.1", code: "4.1", title: "Money", type: "chapter" },
      { id: "4.2", code: "4.2", title: "Review Exercise", type: "chapter" },
    ],
  },
  {
    id: "chap-5",
    title: "CHAP 5: Time",
    type: "unit",
    chapters: [
      { id: "5.1", code: "5.1", title: "Time", type: "chapter" },
      { id: "5.2", code: "5.2", title: "Review Exercise", type: "chapter" },
    ],
  },
  {
    id: "chap-6",
    title: "CHAP 6: Geometry",
    type: "unit",
    chapters: [
      { id: "6.1", code: "6.1", title: "Shapes", type: "chapter" },
      { id: "6.2", code: "6.2", title: "Position", type: "chapter" },
      { id: "6.3", code: "6.3", title: "Review Exercise", type: "chapter" },
    ],
  },
];

// Helper function to get all chapters as flat list
export function getAllChapters(): Chapter[] {
  return PTB_CLASS1_MATHEMATICS.flatMap((unit) => unit.chapters);
}

// Helper function to get chapters by unit
export function getChaptersByUnit(unitId: string): Chapter[] {
  const unit = PTB_CLASS1_MATHEMATICS.find((u) => u.id === unitId);
  return unit?.chapters || [];
}

// Helper function to get unit by chapter ID
export function getUnitByChapterId(chapterId: string): Unit | undefined {
  return PTB_CLASS1_MATHEMATICS.find((unit) =>
    unit.chapters.some((ch) => ch.id === chapterId)
  );
}
