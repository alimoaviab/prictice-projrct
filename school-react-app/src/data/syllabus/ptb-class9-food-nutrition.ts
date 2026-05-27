/**
 * PTB Class 9 - غذا اور غذائیت (Food and Nutrition) - Complete Syllabus
 * Source: Punjab Textbook Board
 * 
 * Subject: غذا اور غذائیت (Food and Nutrition)
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

export const PTB_CLASS9_FOOD_NUTRITION: Unit[] = [
  {
    id: "bab-1",
    title: "باب نمبر 1: غذا اور غذائیت کا تعارف",
    type: "unit",
    chapters: [
      {
        id: "1.1",
        code: "1.1",
        title: "غذا اور غذائیت کی تعریف اور ان سے متعلقہ اصطلاحات",
        type: "unit"
      },
      {
        id: "1.2",
        code: "1.2",
        title: "غذائیت کا صحت میں کردار",
        type: "unit"
      },
      {
        id: "1.3",
        code: "1.3",
        title: "غذا کے کام",
        type: "unit"
      },
      {
        id: "1.4",
        code: "1.4",
        title: "اچھی اور بُری غذائیت کی علامات",
        type: "unit"
      }
    ]
  },
  {
    id: "bab-2",
    title: "باب نمبر 2: توانائی اور غذائی اجزا",
    type: "unit",
    chapters: [
      {
        id: "2.1",
        code: "2.1",
        title: "غذائی اجزا",
        type: "unit"
      },
      {
        id: "2.2",
        code: "2.2",
        title: "غذاؤں کی تواناتی قدر",
        type: "unit"
      }
    ]
  },
  {
    id: "bab-3",
    title: "باب نمبر 3: متوازن غذا",
    type: "unit",
    chapters: [
      {
        id: "3.1",
        code: "3.1",
        title: "متوازن غذا کی اہمیت",
        type: "unit"
      },
      {
        id: "3.2",
        code: "3.2",
        title: "صحت اور غذائی عادات",
        type: "unit"
      },
      {
        id: "3.3",
        code: "3.3",
        title: "متوازن غذا کی ترتیب میں تجویز کردہ مقدار",
        type: "unit"
      },
      {
        id: "3.4",
        code: "3.4",
        title: "غذائی گوشوارے",
        type: "unit"
      }
    ]
  },
  {
    id: "bab-4",
    title: "باب نمبر 4: غذاؤں کی اجزائے ترکیبی",
    type: "unit",
    chapters: [
      {
        id: "4.1",
        code: "4.1",
        title: "مختلف غذاؤں کی اجزائے ترکیبی",
        type: "unit"
      },
      {
        id: "4.2",
        code: "4.2",
        title: "غذاؤں کی اجزائے ترکیبی جاننے کی وجوہات",
        type: "unit"
      }
    ]
  },
  {
    id: "bab-5",
    title: "باب نمبر 5: اشیائے خوردنی کی خریداری اور سٹور کرنا",
    type: "unit",
    chapters: [
      {
        id: "5.1",
        code: "5.1",
        title: "اشیائے خوردنی کی خریداری",
        type: "unit"
      },
      {
        id: "5.2",
        code: "5.2",
        title: "اشیائے خوردنی کو سٹور کرنا",
        type: "unit"
      }
    ]
  }
];

/**
 * Get all chapters as a flat array
 */
export function getAllChapters(): Chapter[] {
  return PTB_CLASS9_FOOD_NUTRITION.flatMap(unit => unit.chapters);
}

/**
 * Get chapters by unit ID
 */
export function getChaptersByUnit(unitId: string): Chapter[] {
  const unit = PTB_CLASS9_FOOD_NUTRITION.find(u => u.id === unitId);
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
  subject: "غذا اور غذائیت (Food and Nutrition)",
  class: "9th",
  board: "PTB",
  totalUnits: 5,
  totalChapters: getTotalChapterCount(),
  language: "Urdu"
};
