/**
 * PTB Class 7 - ہوم اکنامکس (Home Economics) - Complete Syllabus
 * Source: Punjab Textbook Board
 * 
 * Subject: ہوم اکنامکس (Home Economics)
 * Class: 7th
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

export const PTB_CLASS7_HOME_ECONOMICS: Unit[] = [
  {
    id: "bab-1",
    title: "باب نمبر 1: ہوم اکنامکس کو سمجھنا",
    type: "unit",
    chapters: [
      {
        id: "1.1",
        code: "1.1",
        title: "ہوم اکنامکس کو سمجھنا",
        type: "unit"
      }
    ]
  },
  {
    id: "bab-2",
    title: "باب نمبر 2: غذائی انتظام و انصرام",
    type: "unit",
    chapters: [
      {
        id: "2.1",
        code: "2.1",
        title: "غذائی انتظام و انصرام",
        type: "unit"
      }
    ]
  },
  {
    id: "bab-3",
    title: "باب نمبر 3: اشیائے خوردنی کی تیاری",
    type: "unit",
    chapters: [
      {
        id: "3.1",
        code: "3.1",
        title: "اشیائے خوردنی کی تیاری",
        type: "unit"
      }
    ]
  },
  {
    id: "bab-4",
    title: "باب نمبر 4: خاندان اور بچے کی نشوونما",
    type: "unit",
    chapters: [
      {
        id: "4.1",
        code: "4.1",
        title: "خاندان اور بچے کی نشوونما",
        type: "unit"
      }
    ]
  },
  {
    id: "bab-5",
    title: "باب نمبر 5: خاندانی تعلقات",
    type: "unit",
    chapters: [
      {
        id: "5.1",
        code: "5.1",
        title: "خاندانی تعلقات",
        type: "unit"
      }
    ]
  },
  {
    id: "bab-6",
    title: "باب نمبر 6: کپڑوں کی منصوبہ بندی",
    type: "unit",
    chapters: [
      {
        id: "6.1",
        code: "6.1",
        title: "کپڑوں کی منصوبہ بندی",
        type: "unit"
      }
    ]
  },
  {
    id: "bab-7",
    title: "باب نمبر 7: کپڑوں کی دیکھ بھال اور حفاظت",
    type: "unit",
    chapters: [
      {
        id: "7.1",
        code: "7.1",
        title: "کپڑوں کی دیکھ بھال اور حفاظت",
        type: "unit"
      }
    ]
  },
  {
    id: "bab-8",
    title: "باب نمبر 8: آرٹ اور ڈیزائن",
    type: "unit",
    chapters: [
      {
        id: "8.1",
        code: "8.1",
        title: "آرٹ اور ڈیزائن",
        type: "unit"
      }
    ]
  },
  {
    id: "bab-9",
    title: "باب نمبر 9: اقدار اور مقاصد",
    type: "unit",
    chapters: [
      {
        id: "9.1",
        code: "9.1",
        title: "اقدار اور مقاصد",
        type: "unit"
      }
    ]
  },
  {
    id: "bab-10",
    title: "باب نمبر 10: فیصلہ سازی",
    type: "unit",
    chapters: [
      {
        id: "10.1",
        code: "10.1",
        title: "فیصلہ سازی",
        type: "unit"
      }
    ]
  }
];

/**
 * Get all chapters as a flat array
 */
export function getAllChapters(): Chapter[] {
  return PTB_CLASS7_HOME_ECONOMICS.flatMap(unit => unit.chapters);
}

/**
 * Get chapters by unit ID
 */
export function getChaptersByUnit(unitId: string): Chapter[] {
  const unit = PTB_CLASS7_HOME_ECONOMICS.find(u => u.id === unitId);
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
  subject: "ہوم اکنامکس (Home Economics)",
  class: "7th",
  board: "PTB",
  totalUnits: 10,
  totalChapters: getTotalChapterCount(),
  language: "Urdu"
};
