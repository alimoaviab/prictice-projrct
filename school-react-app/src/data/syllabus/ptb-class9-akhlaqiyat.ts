/**
 * PTB Class 9 - اخلاقیات (Ethics) - Complete Syllabus
 * Source: Punjab Textbook Board
 * 
 * Subject: اخلاقیات (Ethics)
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

export const PTB_CLASS9_AKHLAQIYAT: Unit[] = [
  {
    id: "bab-1",
    title: "باب اول: مذاہب کا تعارف",
    type: "unit",
    chapters: [
      {
        id: "1.1",
        code: "1.1",
        title: "مذاہب کی ذاتی اور نفسیاتی اہمیت",
        type: "unit"
      },
      {
        id: "1.2",
        code: "1.2",
        title: "مذہب،سماج اور اخلاق",
        type: "unit"
      }
    ]
  },
  {
    id: "bab-2",
    title: "باب دوم: عالمی مذاہب",
    type: "unit",
    chapters: [
      {
        id: "2.1",
        code: "2.1",
        title: "جین مت- تعارف اور ارتقا",
        type: "unit"
      }
    ]
  },
  {
    id: "bab-3",
    title: "باب سوم: اخلاق و اقدار",
    type: "unit",
    chapters: [
      {
        id: "3.1",
        code: "3.1",
        title: "خدا کی عظمت",
        type: "unit"
      },
      {
        id: "3.2",
        code: "3.2",
        title: "عبادت گاہ اور نظام ہائے عبادت کا انسانی رویوں پر اثر",
        type: "unit"
      }
    ]
  },
  {
    id: "bab-4",
    title: "باب چہارم: آداب",
    type: "unit",
    chapters: [
      {
        id: "4.1",
        code: "4.1",
        title: "عبادت گاہوں کے آداب",
        type: "unit"
      },
      {
        id: "4.2",
        code: "4.2",
        title: "عوامی مقامات کے آداب",
        type: "unit"
      }
    ]
  },
  {
    id: "bab-5",
    title: "باب پنجم: مشاہیر",
    type: "unit",
    chapters: [
      {
        id: "5.1",
        code: "5.1",
        title: "امام غزالیؒ",
        type: "unit"
      },
      {
        id: "5.2",
        code: "5.2",
        title: "فلورنس نائیٹ انگیل",
        type: "unit"
      }
    ]
  },
  {
    id: "bab-1-part2",
    title: "باب اول: مذاہب کا تعارف",
    type: "unit",
    chapters: [
      {
        id: "1.3",
        code: "1.1",
        title: "مشکلات کے حل میں مذاہب کی رہنمائی",
        type: "unit"
      },
      {
        id: "1.4",
        code: "1.2",
        title: "گناہ اور جرم کا تصور",
        type: "unit"
      }
    ]
  },
  {
    id: "bab-2-part2",
    title: "باب دوم: عالمی مذاہب",
    type: "unit",
    chapters: [
      {
        id: "2.2",
        code: "2.1",
        title: "مہاویر- تعارف اور بنیادی تعلیمات",
        type: "unit"
      }
    ]
  },
  {
    id: "bab-3-part2",
    title: "باب سوم: اخلاق و اقدار",
    type: "unit",
    chapters: [
      {
        id: "3.3",
        code: "3.1",
        title: "(مذاہب عالمی کی روشنی میں)عبادت کے انسانی زندگی پر اثرات",
        type: "unit"
      },
      {
        id: "3.4",
        code: "3.2",
        title: "عالمی مذاہب میں اخلاقی اقدار",
        type: "unit"
      },
      {
        id: "3.5",
        code: "3.3",
        title: "انسانی کردار سازی پر احتساب کے اثرات",
        type: "unit"
      },
      {
        id: "3.6",
        code: "3.4",
        title: "مذہبی تعلیمات میں پابندی وقت",
        type: "unit"
      }
    ]
  },
  {
    id: "bab-4-part2",
    title: "باب چہارم: آداب",
    type: "unit",
    chapters: [
      {
        id: "4.3",
        code: "4.1",
        title: "ریلوے اسٹیشن، بس اسٹینڈ، ہوائی اڈا، بازار",
        type: "unit"
      }
    ]
  },
  {
    id: "bab-5-part2",
    title: "باب پنجم: مشاہیر",
    type: "unit",
    chapters: [
      {
        id: "5.3",
        code: "5.1",
        title: "ارسطو",
        type: "unit"
      },
      {
        id: "5.4",
        code: "5.2",
        title: "کانٹ",
        type: "unit"
      },
      {
        id: "5.5",
        code: "5.3",
        title: "سری اربندو",
        type: "unit"
      }
    ]
  }
];

/**
 * Get all chapters as a flat array
 */
export function getAllChapters(): Chapter[] {
  return PTB_CLASS9_AKHLAQIYAT.flatMap(unit => unit.chapters);
}

/**
 * Get chapters by unit ID
 */
export function getChaptersByUnit(unitId: string): Chapter[] {
  const unit = PTB_CLASS9_AKHLAQIYAT.find(u => u.id === unitId);
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
  class: "9th",
  board: "PTB",
  totalUnits: 10,
  totalChapters: getTotalChapterCount(),
  language: "Urdu"
};
