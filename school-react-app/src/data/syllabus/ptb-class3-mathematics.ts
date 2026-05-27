/**
 * PTB Class 3 (THREE) - Mathematics - Complete Syllabus
 * Source: Punjab Textbook Board
 */
export interface Chapter { id: string; code: string; title: string; type: "unit" | "review" | "section"; }
export interface Unit { id: string; title: string; type: "unit" | "review" | "section"; chapters: Chapter[]; }

export const PTB_CLASS3_MATHEMATICS: Unit[] = [
  {
    id: "unit-1",
    title: "UNIT 1: Whole Numbers",
    type: "unit",
    chapters: [
      { id: "1.1", code: "1.1", title: "Exercise 1", type: "unit" },
      { id: "1.2", code: "1.2", title: "Exercise 2", type: "unit" },
      { id: "1.3", code: "1.3", title: "Exercise 3", type: "unit" },
      { id: "1.4", code: "1.4", title: "Exercise 4", type: "unit" },
      { id: "1.5", code: "1.5", title: "Exercise 5", type: "unit" },
      { id: "1.6", code: "1.6", title: "Exercise 6", type: "unit" },
      { id: "1r", code: "1R", title: "Review Exercise", type: "review" }
    ]
  },
  {
    id: "unit-2",
    title: "UNIT 2: Number Operations",
    type: "unit",
    chapters: [
      { id: "2.1", code: "2.1", title: "Exercise 1", type: "unit" },
      { id: "2.2", code: "2.2", title: "Exercise 2", type: "unit" },
      { id: "2.3", code: "2.3", title: "Exercise 3", type: "unit" },
      { id: "2.4", code: "2.4", title: "Exercise 4", type: "unit" },
      { id: "2.5", code: "2.5", title: "Exercise 5", type: "unit" },
      { id: "2r", code: "2R", title: "Review Exercise", type: "review" }
    ]
  },
  {
    id: "unit-3",
    title: "UNIT 3: Fractions",
    type: "unit",
    chapters: [
      { id: "3.1", code: "3.1", title: "Exercise 1", type: "unit" },
      { id: "3.2", code: "3.2", title: "Exercise 2", type: "unit" },
      { id: "3.3", code: "3.3", title: "Exercise 3", type: "unit" },
      { id: "3.4", code: "3.4", title: "Exercise 4", type: "unit" },
      { id: "3.5", code: "3.5", title: "Exercise 5", type: "unit" },
      { id: "3.6", code: "3.6", title: "Exercise 6", type: "unit" },
      { id: "3r", code: "3R", title: "Review Exercise", type: "review" }
    ]
  },
  {
    id: "unit-4",
    title: "UNIT 4: Measurement (Length, Mass and capacity)",
    type: "unit",
    chapters: [
      { id: "4.1", code: "4.1", title: "Exercise 1", type: "unit" },
      { id: "4.2", code: "4.2", title: "Exercise 2", type: "unit" },
      { id: "4.3", code: "4.3", title: "Exercise 3", type: "unit" },
      { id: "4.4", code: "4.4", title: "Exercise 4", type: "unit" },
      { id: "4.5", code: "4.5", title: "Exercise 5", type: "unit" },
      { id: "4.6", code: "4.6", title: "Exercise 6", type: "unit" },
      { id: "4r", code: "4R", title: "Review Exercise", type: "review" }
    ]
  },
  {
    id: "unit-5",
    title: "UNIT 5: Measurement (Time)",
    type: "unit",
    chapters: [
      { id: "5.1", code: "5.1", title: "Exercise 1", type: "unit" },
      { id: "5.2", code: "5.2", title: "Exercise 2", type: "unit" },
      { id: "5.3", code: "5.3", title: "Exercise 3", type: "unit" },
      { id: "5.4", code: "5.4", title: "Exercise 4", type: "unit" },
      { id: "5r", code: "5R", title: "Review Exercise", type: "review" }
    ]
  },
  {
    id: "unit-6",
    title: "UNIT 6: Geometry",
    type: "unit",
    chapters: [
      { id: "6.1", code: "6.1", title: "Exercise 1", type: "unit" },
      { id: "6.2", code: "6.2", title: "Exercise 2", type: "unit" },
      { id: "6.3", code: "6.3", title: "Exercise 3", type: "unit" },
      { id: "6.4", code: "6.4", title: "Exercise 4", type: "unit" },
      { id: "6r", code: "6R", title: "Review Exercise", type: "review" }
    ]
  },
  {
    id: "unit-7",
    title: "UNIT 7: Data handling",
    type: "unit",
    chapters: [
      { id: "7.1", code: "7.1", title: "Exercise 1", type: "unit" },
      { id: "7.2", code: "7.2", title: "Exercise 2", type: "unit" },
      { id: "7r", code: "7R", title: "Review Exercise", type: "review" }
    ]
  }
];

export function getAllChapters(): Chapter[] { return PTB_CLASS3_MATHEMATICS.flatMap(u => u.chapters); }
export function getChaptersByUnit(unitId: string): Chapter[] { const u = PTB_CLASS3_MATHEMATICS.find(x => x.id === unitId); return u ? u.chapters : []; }
export function getChapterById(chapterId: string): Chapter | undefined { return getAllChapters().find(ch => ch.id === chapterId); }
export function getTotalChapterCount(): number { return getAllChapters().length; }
export const SYLLABUS_METADATA = { subject: "Mathematics", class: "3rd", board: "PTB", totalUnits: 7, totalChapters: getTotalChapterCount(), language: "English" };
