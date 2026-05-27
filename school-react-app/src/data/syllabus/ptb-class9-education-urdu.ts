/**
 * PTB Class 9 - ایجوکیشن (Education) - Complete Syllabus
 * Source: Punjab Textbook Board
 * 
 * Subject: ایجوکیشن (Education)
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

export const PTB_CLASS9_EDUCATION_URDU: Unit[] = [
  {
    id: "bab-1",
    title: "باب نمبر 1: تعلیم کے تصورات",
    type: "unit",
    chapters: [
      {
        id: "1.1",
        code: "1.1",
        title: "تعلیم کا تعارف اور معانی",
        type: "unit"
      },
      {
        id: "1.2",
        code: "1.2",
        title: "تعلیم کا عمومی تصور",
        type: "unit"
      },
      {
        id: "1.3",
        code: "1.3",
        title: "تعلیم کا اسلامی تصور",
        type: "unit"
      }
    ]
  },
  {
    id: "bab-2",
    title: "باب نمبر 2: تعلیم کا دائرہ کار اور وظائف",
    type: "unit",
    chapters: [
      {
        id: "2.1",
        code: "2.1",
        title: "علم التعلیم کا دائرہ کار",
        type: "unit"
      },
      {
        id: "2.2",
        code: "2.2",
        title: "تعلیم کے وظائف",
        type: "unit"
      }
    ]
  },
  {
    id: "bab-3",
    title: "باب نمبر 3: انسانی نشوونما اور بالیدگی",
    type: "unit",
    chapters: [
      {
        id: "3.1",
        code: "3.1",
        title: "نشوونما کے معانی و تعریف",
        type: "unit"
      },
      {
        id: "3.2",
        code: "3.2",
        title: "شیرخوارگی",
        type: "unit"
      }
    ]
  },
  {
    id: "bab-4",
    title: "باب نمبر 4: تعلّم",
    type: "unit",
    chapters: [
      {
        id: "4.1",
        code: "4.1",
        title: "تعلم کے معانی اور تعریف",
        type: "unit"
      },
      {
        id: "4.2",
        code: "4.2",
        title: "تعلم میں انفرادی اختلافات",
        type: "unit"
      }
    ]
  },
  {
    id: "bab-5",
    title: "باب نمبر 5: گھر، سکول اور معاشرہ",
    type: "unit",
    chapters: [
      {
        id: "5.1",
        code: "5.1",
        title: "گھر،سکول اور معاشرہ کے معانی اور تعریف",
        type: "unit"
      },
      {
        id: "5.2",
        code: "5.2",
        title: "تعلیم کے متعلقہ ادارے",
        type: "unit"
      },
      {
        id: "5.3",
        code: "5.3",
        title: "معاشرے کی تشکیل میں تعلیم کا کردار",
        type: "unit"
      },
      {
        id: "5.4",
        code: "5.4",
        title: "سکول، کمیونٹی اور معاشرے میں تعلق",
        type: "unit"
      },
      {
        id: "5.5",
        code: "5.5",
        title: "گھر، سکول اور کمیونٹی کے تعلقات میں فروغ کے لئے اقدامات",
        type: "unit"
      }
    ]
  }
];

/**
 * Get all chapters as a flat array
 */
export function getAllChapters(): Chapter[] {
  return PTB_CLASS9_EDUCATION_URDU.flatMap(unit => unit.chapters);
}

/**
 * Get chapters by unit ID
 */
export function getChaptersByUnit(unitId: string): Chapter[] {
  const unit = PTB_CLASS9_EDUCATION_URDU.find(u => u.id === unitId);
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
  subject: "ایجوکیشن (Education)",
  class: "9th",
  board: "PTB",
  totalUnits: 5,
  totalChapters: getTotalChapterCount(),
  language: "Urdu"
};
