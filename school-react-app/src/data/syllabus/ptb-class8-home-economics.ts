/**
 * PTB Class 8 - ہوم اکنامکس (Home Economics) - Complete Syllabus
 * Source: Punjab Textbook Board
 * 
 * Subject: ہوم اکنامکس (Home Economics)
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

export const PTB_CLASS8_HOME_ECONOMICS: Unit[] = [
  {
    id: "bab-1",
    title: "باب نمبر 1: ہوم اکنامکس کا تعارف",
    type: "unit",
    chapters: [
      {
        id: "1.1",
        code: "1.1",
        title: "ہوم اکنامکس کی تعرف",
        type: "unit"
      },
      {
        id: "1.2",
        code: "1.2",
        title: "ہوم اکنامکس کے اغراض و مقاصد",
        type: "unit"
      },
      {
        id: "1.3",
        code: "1.3",
        title: "ہوم اکنامکس کا دوسرے مضامین کے ساتھ تعلق",
        type: "unit"
      }
    ]
  },
  {
    id: "bab-2",
    title: "باب نمبر 2: غذا اور غذائیت",
    type: "unit",
    chapters: [
      {
        id: "2.1",
        code: "2.1",
        title: "غذا اور غذائیت بطور سائنس",
        type: "unit"
      },
      {
        id: "2.2",
        code: "2.2",
        title: "غذائی عادات",
        type: "unit"
      },
      {
        id: "2.3",
        code: "2.3",
        title: "غذائی حفظان صحت",
        type: "unit"
      }
    ]
  },
  {
    id: "bab-3",
    title: "باب نمبر 3: کھانا پکانا اور تحفظ غذا",
    type: "unit",
    chapters: [
      {
        id: "3.1",
        code: "3.1",
        title: "خوراک کو پکانے کے مقاصد",
        type: "unit"
      },
      {
        id: "3.2",
        code: "3.2",
        title: "غذا کو محفوظ کرنے کے طریقے",
        type: "unit"
      },
      {
        id: "3.3",
        code: "3.3",
        title: "غذا کے خراب ہونے کی وجوہات",
        type: "unit"
      }
    ]
  },
  {
    id: "bab-4",
    title: "باب نمبر 4: تصّور ذات",
    type: "unit",
    chapters: [
      {
        id: "4.1",
        code: "4.1",
        title: "تصور ذات کی تعریف",
        type: "unit"
      },
      {
        id: "4.2",
        code: "4.2",
        title: "تصور ذات کی اہمیت",
        type: "unit"
      },
      {
        id: "4.3",
        code: "4.3",
        title: "تصور ذات پر اثر انداز ہونے والے عوامل",
        type: "unit"
      },
      {
        id: "4.4",
        code: "4.4",
        title: "مثبت تصور ذات کوفروغ دینے کے طریقے",
        type: "unit"
      }
    ]
  },
  {
    id: "bab-5",
    title: "باب نمبر 5: شخصیت کی نشوونما اور تعمیر کردار",
    type: "unit",
    chapters: [
      {
        id: "5.1",
        code: "5.1",
        title: "شخصیت کی تعریف",
        type: "unit"
      },
      {
        id: "5.2",
        code: "5.2",
        title: "شخصیت کی نشوونما میں معاون عوامل اور ان کی اہمیت",
        type: "unit"
      },
      {
        id: "5.3",
        code: "5.3",
        title: "تعمیر کردار کے عناصر",
        type: "unit"
      },
      {
        id: "5.4",
        code: "5.4",
        title: "تعمیر کردار کی اہمیت",
        type: "unit"
      }
    ]
  },
  {
    id: "bab-6",
    title: "باب نمبر 6: پارچہ بافی اور لباس",
    type: "unit",
    chapters: [
      {
        id: "6.1",
        code: "6.1",
        title: "پارچہ بافی اور لباس کی تعریف",
        type: "unit"
      },
      {
        id: "6.2",
        code: "6.2",
        title: "پارچہ بافی اور لباس کی اہمیت",
        type: "unit"
      },
      {
        id: "6.3",
        code: "6.3",
        title: "پارچہ بافی کے ریشوں کی پہچان",
        type: "unit"
      },
      {
        id: "6.4",
        code: "6.4",
        title: "داغ دھبے دور کرنا",
        type: "unit"
      }
    ]
  },
  {
    id: "bab-7",
    title: "باب نمبر 7: سلائی کے طریقے",
    type: "unit",
    chapters: [
      {
        id: "7.1",
        code: "7.1",
        title: "سلائی مشین کے اہم پرزہ جات",
        type: "unit"
      },
      {
        id: "7.2",
        code: "7.2",
        title: "سلائی مشین کی دیکھ بھال اور حفاظت",
        type: "unit"
      },
      {
        id: "7.3",
        code: "7.3",
        title: "سلائی اور کڑھائی کے اصول",
        type: "unit"
      }
    ]
  },
  {
    id: "bab-8",
    title: "باب نمبر 8: رنگ",
    type: "unit",
    chapters: [
      {
        id: "8.1",
        code: "8.1",
        title: "روزمرہ زندگی میں رنگوں کی افادیت",
        type: "unit"
      },
      {
        id: "8.2",
        code: "8.2",
        title: "رنگوں کا دائرہ",
        type: "unit"
      },
      {
        id: "8.3",
        code: "8.3",
        title: "رنگوں کے اثرات",
        type: "unit"
      },
      {
        id: "8.4",
        code: "8.4",
        title: "رنگوں میں ہم آہنگیاں",
        type: "unit"
      }
    ]
  },
  {
    id: "bab-9",
    title: "باب نمبر 9: آرٹ اینڈ کرافٹ",
    type: "unit",
    chapters: [
      {
        id: "9.1",
        code: "9.1",
        title: "ڈیزائن کی تعرف اوراقسام",
        type: "unit"
      },
      {
        id: "9.2",
        code: "9.2",
        title: "بناوٹی ڈیزائن کی اہمیت",
        type: "unit"
      },
      {
        id: "9.3",
        code: "9.3",
        title: "آرائشی ڈیزائن کی اہمیت",
        type: "unit"
      }
    ]
  },
  {
    id: "bab-10",
    title: "باب نمبر 10: ذرائع ووسائل کا انتظام",
    type: "unit",
    chapters: [
      {
        id: "10.1",
        code: "10.1",
        title: "وقت کا انتظام",
        type: "unit"
      },
      {
        id: "10.2",
        code: "10.2",
        title: "قوت کا انتظام",
        type: "unit"
      },
      {
        id: "10.3",
        code: "10.3",
        title: "آمدنی کا انتظام",
        type: "unit"
      }
    ]
  },
  {
    id: "bab-11",
    title: "باب نمبر 11: آسان کام",
    type: "unit",
    chapters: [
      {
        id: "11.1",
        code: "11.1",
        title: "کام کی تعریف اور اہمیت",
        type: "unit"
      },
      {
        id: "11.2",
        code: "11.2",
        title: "کام کو آسانی کرنے کی تعریف اور اہمیت",
        type: "unit"
      },
      {
        id: "11.3",
        code: "11.3",
        title: "کام کو آسان کرنے کے طریقے",
        type: "unit"
      }
    ]
  }
];

/**
 * Get all chapters as a flat array
 */
export function getAllChapters(): Chapter[] {
  return PTB_CLASS8_HOME_ECONOMICS.flatMap(unit => unit.chapters);
}

/**
 * Get chapters by unit ID
 */
export function getChaptersByUnit(unitId: string): Chapter[] {
  const unit = PTB_CLASS8_HOME_ECONOMICS.find(u => u.id === unitId);
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
  class: "8th",
  board: "PTB",
  totalUnits: 11,
  totalChapters: getTotalChapterCount(),
  language: "Urdu"
};
