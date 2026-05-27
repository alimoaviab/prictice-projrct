/**
 * PTB Class 9 - ہوم اکنامکس (Home Economics) - Complete Syllabus
 * Source: Punjab Textbook Board
 * 
 * Subject: ہوم اکنامکس (Home Economics)
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

export const PTB_CLASS9_HOME_ECONOMICS: Unit[] = [
  {
    id: "bab-1",
    title: "باب نمبر 1: ہوم اکنامکس کا تعارف",
    type: "unit",
    chapters: [
      {
        id: "1.1",
        code: "1.1",
        title: "ہوم اکنامکس کی تعریف",
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
        title: "ہوم اکنامکس کی افادیت اور اہمیت",
        type: "unit"
      },
      {
        id: "1.4",
        code: "1.4",
        title: "ہوم اکنامکس کا دیگر مضامین سے تعلق",
        type: "unit"
      },
      {
        id: "1.5",
        code: "1.5",
        title: "خاندان اور معاشرے میں ہوم اکنامکس کا کردار اور ذمہ داریاں",
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
        title: "غذا اور غذائیت کی تعریف",
        type: "unit"
      },
      {
        id: "2.2",
        code: "2.2",
        title: "نقص غذائیت کے اثرات",
        type: "unit"
      },
      {
        id: "2.3",
        code: "2.3",
        title: "غذا کے کام",
        type: "unit"
      },
      {
        id: "2.4",
        code: "2.4",
        title: "بنیادی غذائی اجزا کامطالعہ",
        type: "unit"
      },
      {
        id: "2.5",
        code: "2.5",
        title: "خوراک اور صحت",
        type: "unit"
      }
    ]
  },
  {
    id: "bab-3",
    title: "باب نمبر 3: غذا اور خوراک کو سجھنا",
    type: "unit",
    chapters: [
      {
        id: "3.1",
        code: "3.1",
        title: "متوازن غذا کی تعریف",
        type: "unit"
      },
      {
        id: "3.2",
        code: "3.2",
        title: "بنیا دی غذائی گروہ",
        type: "unit"
      },
      {
        id: "3.3",
        code: "3.3",
        title: "افراد کی غذائی ضروریات",
        type: "unit"
      }
    ]
  },
  {
    id: "bab-4",
    title: "باب نمبر 4: کھانوں کی تیاری",
    type: "unit",
    chapters: [
      {
        id: "4.1",
        code: "4.1",
        title: "کھانا پکانا",
        type: "unit"
      },
      {
        id: "4.2",
        code: "4.2",
        title: "کھانا پیش کرنا",
        type: "unit"
      },
      {
        id: "4.3",
        code: "4.3",
        title: "خوراک سٹور کرنا",
        type: "unit"
      },
      {
        id: "4.4",
        code: "4.4",
        title: "باورچی خانے میں حفاظتی تدابیر اور اقدامات",
        type: "unit"
      }
    ]
  },
  {
    id: "bab-5",
    title: "باب نمبر 5: بچوں کی نگہداشت اور نشوونما کا تعارف",
    type: "unit",
    chapters: [
      {
        id: "5.1",
        code: "5.1",
        title: "انسانی نشوونما کے معنی اور تعریف",
        type: "unit"
      },
      {
        id: "5.2",
        code: "5.2",
        title: "انسانی نشوونما کے مطالعہ کی اہمیت",
        type: "unit"
      },
      {
        id: "5.3",
        code: "5.3",
        title: "انسانی نشوونما کے اصول",
        type: "unit"
      }
    ]
  },
  {
    id: "bab-6",
    title: "باب نمبر 6: نشوونمائی خصوصیات",
    type: "unit",
    chapters: [
      {
        id: "6.1",
        code: "6.1",
        title: "نوزائیدگی کا دور",
        type: "unit"
      },
      {
        id: "6.2",
        code: "6.2",
        title: "شیر خوارگی",
        type: "unit"
      },
      {
        id: "6.3",
        code: "6.3",
        title: "ابتدائی بچپن",
        type: "unit"
      },
      {
        id: "6.4",
        code: "6.4",
        title: "درمیانی بچپن",
        type: "unit"
      },
      {
        id: "6.5",
        code: "6.5",
        title: "نو بلوغت",
        type: "unit"
      }
    ]
  },
  {
    id: "bab-7",
    title: "باب نمبر 7: بچوں کے رویوں کے مسائل",
    type: "unit",
    chapters: [
      {
        id: "7.1",
        code: "7.1",
        title: "رویوں کے مسائل کی تعریف اور اقسام",
        type: "unit"
      },
      {
        id: "7.2",
        code: "7.2",
        title: "رویوں کے مسائل کی وجوہات",
        type: "unit"
      },
      {
        id: "7.3",
        code: "7.3",
        title: "رویوں کے مسائل کی روک تھام اور ان کا حل",
        type: "unit"
      }
    ]
  },
  {
    id: "bab-8",
    title: "باب نمبر 8: انسانی نشوونما میں خاندان اور معاشرے کا کردار",
    type: "unit",
    chapters: [
      {
        id: "8.1",
        code: "8.1",
        title: "والدین اور بچوں کے تعلقات",
        type: "unit"
      },
      {
        id: "8.2",
        code: "8.2",
        title: "ہم عمروں سے تعلقات",
        type: "unit"
      },
      {
        id: "8.3",
        code: "8.3",
        title: "بہن بھائیوں سے تعلقات",
        type: "unit"
      },
      {
        id: "8.4",
        code: "8.4",
        title: "نگران کا کردار",
        type: "unit"
      }
    ]
  }
];

/**
 * Get all chapters as a flat array
 */
export function getAllChapters(): Chapter[] {
  return PTB_CLASS9_HOME_ECONOMICS.flatMap(unit => unit.chapters);
}

/**
 * Get chapters by unit ID
 */
export function getChaptersByUnit(unitId: string): Chapter[] {
  const unit = PTB_CLASS9_HOME_ECONOMICS.find(u => u.id === unitId);
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
  class: "9th",
  board: "PTB",
  totalUnits: 8,
  totalChapters: getTotalChapterCount(),
  language: "Urdu"
};
