/**
 * PTB Class 9 - سوکس (Civics) - Complete Syllabus
 * Source: Punjab Textbook Board
 * 
 * Subject: سوکس (Civics)
 * Class: 9th
 * Board: PTB (Punjab Textbook Board)
 */

export interface Chapter {
  id: string;
  code: string;
  title: string;
  type: "unit" | "review" | "section";
}

export interface Unit {
  id: string;
  title: string;
  type: "unit" | "review" | "section";
  chapters: Chapter[];
}

export const PTB_CLASS9_CIVICS: Unit[] = [
  {
    id: "bab-1",
    title: "باب نمبر: 1 علم شہریت کا تعارف",
    type: "unit",
    chapters: [
      {
        id: "1.1",
        code: "1",
        title: "علم شہریت کا تعارف",
        type: "unit"
      }
    ]
  },
  {
    id: "bab-2",
    title: "باب نمبر: 2 افراد کے روابط",
    type: "unit",
    chapters: [
      {
        id: "2.1",
        code: "2",
        title: "افراد کے روابط",
        type: "unit"
      }
    ]
  },
  {
    id: "bab-3",
    title: "باب نمبر: 3 ریاست",
    type: "unit",
    chapters: [
      {
        id: "3.1",
        code: "3",
        title: "ریاست",
        type: "unit"
      }
    ]
  },
  {
    id: "bab-4",
    title: "باب نمبر: 4 حکومت",
    type: "unit",
    chapters: [
      {
        id: "4.1",
        code: "4",
        title: "حکومت",
        type: "unit"
      }
    ]
  },
  {
    id: "bab-5",
    title: "باب نمبر: 5 شہری اور ریاست",
    type: "unit",
    chapters: [
      {
        id: "5.1",
        code: "5",
        title: "شہری اور ریاست",
        type: "unit"
      }
    ]
  }
];

/**
 * Get all chapters as a flat array
 */
export function getAllChapters(): Chapter[] {
  return PTB_CLASS9_CIVICS.flatMap(unit => unit.chapters);
}

/**
 * Get chapters by unit ID
 */
export function getChaptersByUnit(unitId: string): Chapter[] {
  const unit = PTB_CLASS9_CIVICS.find(u => u.id === unitId);
  return unit ? unit.chapters : [];
}

/**
 * Get chapter by ID
 */
export function getChapterById(chapterId: string): Chapter | undefined {
  return getAllChapters().find(ch => ch.id === chapterId);
}

/**
 * Get total chapter count
 */
export function getTotalChapterCount(): number {
  return getAllChapters().length;
}

/**
 * Syllabus metadata
 */
export const SYLLABUS_METADATA = {
  subject: "سوکس (Civics)",
  class: "9th",
  board: "PTB",
  totalUnits: 5,
  totalChapters: getTotalChapterCount(),
  language: "Urdu"
};
