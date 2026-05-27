/**
 * PTB Class 9 - ترجمۃ القرآن المجید (Translation of Holy Quran) - Complete Syllabus
 * Source: Punjab Textbook Board
 * 
 * Subject: ترجمۃ القرآن المجید (Translation of Holy Quran)
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

export const PTB_CLASS9_TARJUMA_QURAN: Unit[] = [
  {
    id: "surah-4",
    title: "سورۃ نمبر 4: سُورَۃُ مَریَمِ",
    type: "unit",
    chapters: [
      {
        id: "4.1",
        code: "4",
        title: "سُورَۃُ مَریَمِ",
        type: "unit"
      }
    ]
  },
  {
    id: "surah-5",
    title: "سورۃ نمبر 5: سُورَۃُ طٰہٰ",
    type: "unit",
    chapters: [
      {
        id: "5.1",
        code: "5",
        title: "سُورَۃُ طٰہٰ",
        type: "unit"
      }
    ]
  },
  {
    id: "surah-6",
    title: "سورۃ نمبر 6: سُورَۃُ الاَنبِیَاءِ",
    type: "unit",
    chapters: [
      {
        id: "6.1",
        code: "6",
        title: "سُورَۃُ الاَنبِیَاءِ",
        type: "unit"
      }
    ]
  },
  {
    id: "surah-7",
    title: "سورۃ نمبر 7: سُورَۃُ الَحَجّ",
    type: "unit",
    chapters: [
      {
        id: "7.1",
        code: "7",
        title: "سُورَۃُ الَحَجّ",
        type: "unit"
      }
    ]
  },
  {
    id: "surah-8",
    title: "سورۃ نمبر 8: سُورَۃُ الفُرقَانَ",
    type: "unit",
    chapters: [
      {
        id: "8.1",
        code: "8",
        title: "سُورَۃُ الفُرقَانَ",
        type: "unit"
      }
    ]
  },
  {
    id: "surah-9",
    title: "سورۃ نمبر 9: سُورَۃُ الشّعَرَآءِ",
    type: "unit",
    chapters: [
      {
        id: "9.1",
        code: "9",
        title: "سُورَۃُ الشّعَرَآءِ",
        type: "unit"
      }
    ]
  },
  {
    id: "surah-10",
    title: "سورۃ نمبر 10: سُورَۃُ النُّملِ",
    type: "unit",
    chapters: [
      {
        id: "10.1",
        code: "10",
        title: "سُورَۃُ النُّملِ",
        type: "unit"
      }
    ]
  },
  {
    id: "surah-11",
    title: "سورۃ نمبر 11: سُورَۃُ القَصَصِ",
    type: "unit",
    chapters: [
      {
        id: "11.1",
        code: "11",
        title: "سُورَۃُ القَصَصِ",
        type: "unit"
      }
    ]
  },
  {
    id: "surah-12",
    title: "سورۃ نمبر 12: سُورَۃُ العَنکَبُوتَ",
    type: "unit",
    chapters: [
      {
        id: "12.1",
        code: "12",
        title: "سُورَۃُ العَنکَبُوتَ",
        type: "unit"
      }
    ]
  },
  {
    id: "surah-13",
    title: "سورۃ نمبر 13: سُورَۃُ الرُّومہِ",
    type: "unit",
    chapters: [
      {
        id: "13.1",
        code: "13",
        title: "سُورَۃُ الرُّومہِ",
        type: "unit"
      }
    ]
  },
  {
    id: "surah-14",
    title: "سورۃ نمبر 14: سُورَۃُ لُقمنَ",
    type: "unit",
    chapters: [
      {
        id: "14.1",
        code: "14",
        title: "سُورَۃُ لُقمنَ",
        type: "unit"
      }
    ]
  },
  {
    id: "surah-15",
    title: "سورۃ نمبر 15: سُورَۃُ السَّجدَۃِ",
    type: "unit",
    chapters: [
      {
        id: "15.1",
        code: "15",
        title: "سُورَۃُ السَّجدَۃِ",
        type: "unit"
      }
    ]
  },
  {
    id: "surah-16",
    title: "سورۃ نمبر 16: سُورَۃُ سَبَاِِ",
    type: "unit",
    chapters: [
      {
        id: "16.1",
        code: "16",
        title: "سُورَۃُ سَبَاِِ",
        type: "unit"
      }
    ]
  },
  {
    id: "surah-17",
    title: "سورۃ نمبر 17: سُورَۃُ فَاطِرِِ",
    type: "unit",
    chapters: [
      {
        id: "17.1",
        code: "17",
        title: "سُورَۃُ فَاطِرِِ",
        type: "unit"
      }
    ]
  },
  {
    id: "surah-18",
    title: "سورۃ نمبر 18: سُورَۃُ یَس",
    type: "unit",
    chapters: [
      {
        id: "18.1",
        code: "18",
        title: "سُورَۃُ یَس",
        type: "unit"
      }
    ]
  },
  {
    id: "surah-19",
    title: "سورۃ نمبر 19: سُورَۃُ الصّٰفّٰتِ",
    type: "unit",
    chapters: [
      {
        id: "19.1",
        code: "19",
        title: "سُورَۃُ الصّٰفّٰتِ",
        type: "unit"
      }
    ]
  },
  {
    id: "surah-20",
    title: "سورۃ نمبر 20: سُورَۃُ صٓ",
    type: "unit",
    chapters: [
      {
        id: "20.1",
        code: "20",
        title: "سُورَۃُ صٓ",
        type: "unit"
      }
    ]
  },
  {
    id: "surah-21",
    title: "سورۃ نمبر 21: سُورَۃُ الاَحقَافِ",
    type: "unit",
    chapters: [
      {
        id: "21.1",
        code: "21",
        title: "سُورَۃُ الاَحقَافِ",
        type: "unit"
      }
    ]
  }
];

/**
 * Get all chapters as a flat array
 */
export function getAllChapters(): Chapter[] {
  return PTB_CLASS9_TARJUMA_QURAN.flatMap(unit => unit.chapters);
}

/**
 * Get chapters by unit ID
 */
export function getChaptersByUnit(unitId: string): Chapter[] {
  const unit = PTB_CLASS9_TARJUMA_QURAN.find(u => u.id === unitId);
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
  subject: "ترجمۃ القرآن المجید (Translation of Holy Quran)",
  class: "9th",
  board: "PTB",
  totalSurahs: 18,
  totalChapters: getTotalChapterCount(),
  language: "Arabic/Urdu"
};
