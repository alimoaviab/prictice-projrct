/**
 * PTB Class 9 - مرغبانی (Poultry Farming) - Complete Syllabus
 * Source: Punjab Textbook Board
 * 
 * Subject: مرغبانی (Poultry Farming)
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

export const PTB_CLASS9_MURGHBANI: Unit[] = [
  {
    id: "bab-1",
    title: "باب نمبر 1: مرغبانی کا تعارف و اہمیت",
    type: "unit",
    chapters: [
      {
        id: "1.1",
        code: "1",
        title: "مرغبانی کا تعارف و اہمیت",
        type: "unit"
      }
    ]
  },
  {
    id: "bab-2",
    title: "باب نمبر 2: مرغ کا جسم اور مختلف اعضاء",
    type: "unit",
    chapters: [
      {
        id: "2.1",
        code: "2",
        title: "مرغ کا جسم اور مختلف اعضاء",
        type: "unit"
      }
    ]
  },
  {
    id: "bab-3",
    title: "باب نمبر 3: مرغیوں کی نسلیں",
    type: "unit",
    chapters: [
      {
        id: "3.1",
        code: "3",
        title: "مرغیوں کی نسلیں",
        type: "unit"
      }
    ]
  },
  {
    id: "bab-4",
    title: "باب نمبر 4: ہیچری کے انتظامات",
    type: "unit",
    chapters: [
      {
        id: "4.1",
        code: "4",
        title: "ہیچری کے انتظامات",
        type: "unit"
      }
    ]
  },
  {
    id: "bab-5",
    title: "باب نمبر 5: مرغی خانے کی عمارت",
    type: "unit",
    chapters: [
      {
        id: "5.1",
        code: "5",
        title: "مرغی خانے کی عمارت",
        type: "unit"
      }
    ]
  },
  {
    id: "bab-6",
    title: "باب نمبر 6: مرغی خانے کا سامان",
    type: "unit",
    chapters: [
      {
        id: "6.1",
        code: "6",
        title: "مرغی خانے کا سامان",
        type: "unit"
      }
    ]
  }
];

/**
 * Get all chapters as a flat array
 */
export function getAllChapters(): Chapter[] {
  return PTB_CLASS9_MURGHBANI.flatMap(unit => unit.chapters);
}

/**
 * Get chapters by unit ID
 */
export function getChaptersByUnit(unitId: string): Chapter[] {
  const unit = PTB_CLASS9_MURGHBANI.find(u => u.id === unitId);
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
  subject: "مرغبانی (Poultry Farming)",
  class: "9th",
  board: "PTB",
  totalUnits: 6,
  totalChapters: getTotalChapterCount(),
  language: "Urdu"
};
