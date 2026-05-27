/**
 * PTB Class 9 - معاشیات (Economics) - Complete Syllabus
 * Source: Punjab Textbook Board
 * 
 * Subject: معاشیات (Economics)
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

export const PTB_CLASS9_ECONOMICS: Unit[] = [
  {
    id: "bab-1",
    title: "باب نمبر 1: معاشیات کا تعارف",
    type: "unit",
    chapters: [
      {
        id: "1.1",
        code: "1",
        title: "معاشیات کا تعارف",
        type: "unit"
      }
    ]
  },
  {
    id: "bab-2",
    title: "باب نمبر 2: معاشیات کا نفسِ مضمون",
    type: "unit",
    chapters: [
      {
        id: "2.1",
        code: "2",
        title: "معاشیات کا نفسِ مضمون",
        type: "unit"
      }
    ]
  },
  {
    id: "bab-3",
    title: "باب نمبر 3: طلب",
    type: "unit",
    chapters: [
      {
        id: "3.1",
        code: "3",
        title: "طلب",
        type: "unit"
      }
    ]
  },
  {
    id: "bab-4",
    title: "باب نمبر 4: رسد",
    type: "unit",
    chapters: [
      {
        id: "4.1",
        code: "4",
        title: "رسد",
        type: "unit"
      }
    ]
  },
  {
    id: "bab-5",
    title: "باب نمبر 5: توازن اور قیمت کا تعین",
    type: "unit",
    chapters: [
      {
        id: "5.1",
        code: "5",
        title: "توازن اور قیمت کا تعین",
        type: "unit"
      }
    ]
  },
  {
    id: "bab-6",
    title: "باب نمبر 6: منڈی اور پیدائشِ دولت",
    type: "unit",
    chapters: [
      {
        id: "6.1",
        code: "6",
        title: "منڈی اور پیدائشِ دولت",
        type: "unit"
      }
    ]
  },
  {
    id: "bab-7",
    title: "باب نمبر 7: پاکستان کے معاشی مسائل اور ان کا حل",
    type: "unit",
    chapters: [
      {
        id: "7.1",
        code: "7",
        title: "پاکستان کے معاشی مسائل اور ان کا حل",
        type: "unit"
      }
    ]
  }
];

/**
 * Get all chapters as a flat array
 */
export function getAllChapters(): Chapter[] {
  return PTB_CLASS9_ECONOMICS.flatMap(unit => unit.chapters);
}

/**
 * Get chapters by unit ID
 */
export function getChaptersByUnit(unitId: string): Chapter[] {
  const unit = PTB_CLASS9_ECONOMICS.find(u => u.id === unitId);
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
  subject: "معاشیات (Economics)",
  class: "9th",
  board: "PTB",
  totalUnits: 7,
  totalChapters: getTotalChapterCount(),
  language: "Urdu"
};
