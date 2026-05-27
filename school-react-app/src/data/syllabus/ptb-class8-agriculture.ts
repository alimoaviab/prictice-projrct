/**
 * PTB Class 8 - زرعی تعلیم (Agriculture Education) - Complete Syllabus
 * Source: Punjab Textbook Board
 * 
 * Subject: زرعی تعلیم (Agriculture Education)
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

export const PTB_CLASS8_AGRICULTURE: Unit[] = [
  {
    id: "bab-1",
    title: "باب نمبر 1: ربیع اور خریف کی فصلوں کی کاشت",
    type: "unit",
    chapters: [
      {
        id: "1.1",
        code: "1",
        title: "ربیع اور خریف کی فصلوں کی کاشت",
        type: "unit"
      }
    ]
  },
  {
    id: "bab-2",
    title: "باب نمبر 2: نباتات و حیوانات کا تحفظ",
    type: "unit",
    chapters: [
      {
        id: "2.1",
        code: "2",
        title: "نباتات و حیوانات کا تحفظ",
        type: "unit"
      }
    ]
  },
  {
    id: "bab-3",
    title: "باب نمبر 3: زمین کی زرخیزی بحال کرنا",
    type: "unit",
    chapters: [
      {
        id: "3.1",
        code: "3",
        title: "زمین کی زرخیزی بحال کرنا",
        type: "unit"
      }
    ]
  },
  {
    id: "bab-4",
    title: "باب نمبر 4: زرعی اراضی کا تحفظ",
    type: "unit",
    chapters: [
      {
        id: "4.1",
        code: "4",
        title: "زرعی اراضی کا تحفظ",
        type: "unit"
      }
    ]
  },
  {
    id: "bab-5",
    title: "باب نمبر 5: پانی کے وسائل کا تحفظ اور بہتر استعمال",
    type: "unit",
    chapters: [
      {
        id: "5.1",
        code: "5",
        title: "پانی کے وسائل کا تحفظ اور بہتر استعمال",
        type: "unit"
      }
    ]
  },
  {
    id: "bab-6",
    title: "باب نمبر 6: کھمبی کی کاشت",
    type: "unit",
    chapters: [
      {
        id: "6.1",
        code: "6",
        title: "کھمبی کی کاشت",
        type: "unit"
      }
    ]
  },
  {
    id: "bab-7",
    title: "باب نمبر 7: زرعی اجناس کا ذخیرہ و تحفظ",
    type: "unit",
    chapters: [
      {
        id: "7.1",
        code: "7",
        title: "زرعی اجناس کا ذخیرہ و تحفظ",
        type: "unit"
      }
    ]
  }
];

/**
 * Get all chapters as a flat array
 */
export function getAllChapters(): Chapter[] {
  return PTB_CLASS8_AGRICULTURE.flatMap(unit => unit.chapters);
}

/**
 * Get chapters by unit ID
 */
export function getChaptersByUnit(unitId: string): Chapter[] {
  const unit = PTB_CLASS8_AGRICULTURE.find(u => u.id === unitId);
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
  subject: "زرعی تعلیم (Agriculture Education)",
  class: "8th",
  board: "PTB",
  totalUnits: 7,
  totalChapters: getTotalChapterCount(),
  language: "Urdu"
};
