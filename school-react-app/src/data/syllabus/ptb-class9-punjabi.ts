/**
 * PTB Class 9 - پنجابی (Punjabi) - Complete Syllabus
 * Source: Punjab Textbook Board
 * 
 * Subject: پنجابی (Punjabi)
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

export const PTB_CLASS9_PUNJABI: Unit[] = [
  // حصہ نثر (Prose Section)
  {
    id: "nasar-section",
    title: "حصہ نثر",
    type: "section",
    chapters: [
      {
        id: "nasar-1",
        code: "1",
        title: "ذات نبیﷺدی رحمت جھڑیاں",
        type: "section"
      },
      {
        id: "nasar-2",
        code: "2",
        title: "لمیاں اُڈیکاں",
        type: "section"
      },
      {
        id: "nasar-3",
        code: "3",
        title: "قائداعظم بارے کجھ یاد گار واقعے",
        type: "section"
      },
      {
        id: "nasar-4",
        code: "4",
        title: "آسرا",
        type: "section"
      },
      {
        id: "nasar-5",
        code: "5",
        title: "حضرت نوشہ گنج بخش",
        type: "section"
      },
      {
        id: "nasar-6",
        code: "6",
        title: "ہن کوئی دیوا نہیں بلدا",
        type: "section"
      }
    ]
  },
  // حصہ نظم (Poetry Section)
  {
    id: "nazam-section",
    title: "حصہ نظم",
    type: "section",
    chapters: [
      {
        id: "nazam-1",
        code: "1",
        title: "حمد",
        type: "section"
      },
      {
        id: "nazam-2",
        code: "2",
        title: "نعت",
        type: "section"
      },
      {
        id: "nazam-3",
        code: "3",
        title: "کافی",
        type: "section"
      },
      {
        id: "nazam-4",
        code: "4",
        title: "ابیات باہو",
        type: "section"
      },
      {
        id: "nazam-5",
        code: "5",
        title: "کر کتن ول دھیان کڑے",
        type: "section"
      },
      {
        id: "nazam-6",
        code: "6",
        title: "غفلت نامہ",
        type: "section"
      },
      {
        id: "nazam-7",
        code: "7",
        title: "کلام وارث شاہ",
        type: "section"
      },
      {
        id: "nazam-8",
        code: "8",
        title: "دوہڑے",
        type: "section"
      },
      {
        id: "nazam-9",
        code: "9",
        title: "استغفار",
        type: "section"
      },
      {
        id: "nazam-10",
        code: "10",
        title: "حضرت یوسف دا خواب",
        type: "section"
      },
      {
        id: "nazam-11",
        code: "11",
        title: "عید",
        type: "section"
      }
    ]
  },
  // حصہ غزل (Ghazal Section)
  {
    id: "ghazal-section",
    title: "حصہ غزل",
    type: "section",
    chapters: [
      {
        id: "ghazal-1",
        code: "1",
        title: "مولا بخش کشتہ",
        type: "section"
      },
      {
        id: "ghazal-2",
        code: "2",
        title: "پیر فضل گجراتی",
        type: "section"
      },
      {
        id: "ghazal-3",
        code: "3",
        title: "حکیم شیر محمد ناصر",
        type: "section"
      },
      {
        id: "ghazal-4",
        code: "4",
        title: "شریف کنجاہی",
        type: "section"
      }
    ]
  },
  // گرائمر (Grammar Section)
  {
    id: "grammar-section",
    title: "گرائمر",
    type: "section",
    chapters: [
      {
        id: "grammar-1",
        code: "1",
        title: "خطوط",
        type: "section"
      },
      {
        id: "grammar-2",
        code: "2",
        title: "کہانیاں",
        type: "section"
      },
      {
        id: "grammar-3",
        code: "3",
        title: "مذکر مونث",
        type: "section"
      },
      {
        id: "grammar-4",
        code: "4",
        title: "واحد جمع",
        type: "section"
      }
    ]
  }
];

/**
 * Get all chapters as a flat array
 */
export function getAllChapters(): Chapter[] {
  return PTB_CLASS9_PUNJABI.flatMap(unit => unit.chapters);
}

/**
 * Get chapters by unit ID
 */
export function getChaptersByUnit(unitId: string): Chapter[] {
  const unit = PTB_CLASS9_PUNJABI.find(u => u.id === unitId);
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
  subject: "پنجابی (Punjabi)",
  class: "9th",
  board: "PTB",
  totalSections: 4,
  totalChapters: getTotalChapterCount(),
  language: "Punjabi/Urdu",
  sections: {
    prose: 6,
    poetry: 11,
    ghazal: 4,
    grammar: 4
  }
};
