/**
 * PTB Class 8 - اخلاقیات (Ethics) - Complete Syllabus
 * Source: Punjab Textbook Board
 * 
 * Subject: اخلاقیات (Ethics)
 * Class: 8th
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

export const PTB_CLASS8_AKHLAQIYAT: Unit[] = [
  {
    id: "bab-1",
    title: "باب نمبر 1: مذاہب کا تعارف",
    type: "unit",
    chapters: [
      {
        id: "1.1",
        code: "1",
        title: "مذاہب کا تعارف",
        type: "unit"
      }
    ]
  },
  {
    id: "bab-2",
    title: "باب نمبر 2: دنیا کے مذاہب",
    type: "unit",
    chapters: [
      {
        id: "2.1",
        code: "2",
        title: "دنیا کے مذاہب",
        type: "unit"
      }
    ]
  },
  {
    id: "bab-3",
    title: "باب نمبر 3: پاکستان میں مذہبی تہوار",
    type: "unit",
    chapters: [
      {
        id: "3.1",
        code: "3",
        title: "پاکستان میں مذہبی تہوار",
        type: "unit"
      }
    ]
  },
  {
    id: "bab-4",
    title: "باب نمبر 4: اخلاقی اقدار",
    type: "unit",
    chapters: [
      {
        id: "4.1",
        code: "4",
        title: "اخلاقی اقدار",
        type: "unit"
      }
    ]
  },
  {
    id: "bab-5",
    title: "باب نمبر 5: شخصیات",
    type: "unit",
    chapters: [
      {
        id: "5.1",
        code: "5",
        title: "شخصیات",
        type: "unit"
      }
    ]
  }
];

/**
 * Get all chapters as a flat array
 */
export function getAllChapters(): Chapter[] {
  return PTB_CLASS8_AKHLAQIYAT.flatMap(unit => unit.chapters);
}

/**
 * Get chapters by unit ID
 */
export function getChaptersByUnit(unitId: string): Chapter[] {
  const unit = PTB_CLASS8_AKHLAQIYAT.find(u => u.id === unitId);
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
  subject: "اخلاقیات (Ethics)",
  class: "8th",
  board: "PTB",
  totalUnits: 5,
  totalChapters: getTotalChapterCount(),
  language: "Urdu"
};
