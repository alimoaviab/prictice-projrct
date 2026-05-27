/**
 * PTB Class 8 - ترجمۃ القرآن (Translation of Holy Quran) - Complete Syllabus
 * Source: Punjab Textbook Board
 * 
 * Subject: ترجمۃ القرآن (Translation of Holy Quran)
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

export const PTB_CLASS8_TARJUMA_QURAN: Unit[] = [
  {
    id: "surah-1",
    title: "سورۃ نمبر 1: سُورَۃُ الزُّخرُفِ",
    type: "unit",
    chapters: [
      {
        id: "3.1",
        code: "3.1",
        title: "سُورَۃُ الزُّخرُفِ",
        type: "unit"
      }
    ]
  },
  {
    id: "surah-2",
    title: "سورۃ نمبر 2: سُورَۃُ الدُّخَانِ",
    type: "unit",
    chapters: [
      {
        id: "4.1",
        code: "4.1",
        title: "سُورَۃُ الدُّ خَانِ",
        type: "unit"
      }
    ]
  },
  {
    id: "surah-3",
    title: "سورۃ نمبر 3: سُورَۃُ الجَاثِیَۃِ",
    type: "unit",
    chapters: [
      {
        id: "5.1",
        code: "5.1",
        title: "سُورَۃُ الجَاثِیَۃِ",
        type: "unit"
      }
    ]
  },
  {
    id: "surah-4",
    title: "سورۃ نمبر 4: سُورۃ قٓ",
    type: "unit",
    chapters: [
      {
        id: "6.1",
        code: "6.1",
        title: "سُورَۃُ قٓ",
        type: "unit"
      }
    ]
  },
  {
    id: "surah-5",
    title: "سورۃ نمبر 5: سُورۃُ الزّٰرِیٰتِ",
    type: "unit",
    chapters: [
      {
        id: "7.1",
        code: "7.1",
        title: "سُورَۃُ الزّٰرِیٰتِ",
        type: "unit"
      }
    ]
  },
  {
    id: "surah-6",
    title: "سورۃ نمبر 6: سُورۃ الطُّورِ",
    type: "unit",
    chapters: [
      {
        id: "8.1",
        code: "8.1",
        title: "سُورَۃُ الطُّورِ",
        type: "unit"
      }
    ]
  },
  {
    id: "surah-7",
    title: "سورۃ نمبر 7: سُورَۃُ النَّجمِ",
    type: "unit",
    chapters: [
      {
        id: "9.1",
        code: "9.1",
        title: "سُورَۃُ النَّجمِ",
        type: "unit"
      }
    ]
  },
  {
    id: "surah-8",
    title: "سورۃ نمبر 8: سُورَۃُ القَمَرِ",
    type: "unit",
    chapters: [
      {
        id: "10.1",
        code: "10.1",
        title: "سُورَۃُ القَمُرِ",
        type: "unit"
      }
    ]
  },
  {
    id: "surah-9",
    title: "سورۃ نمبر 9: سُورَۃُ الرَّحمٰنِ",
    type: "unit",
    chapters: [
      {
        id: "11.1",
        code: "11.1",
        title: "سُورَۃُ الرَّحمٰنِ",
        type: "unit"
      }
    ]
  },
  {
    id: "surah-10",
    title: "سورۃ نمبر 10: سُورَۃُ الوَاقِعَۃِ",
    type: "unit",
    chapters: [
      {
        id: "12.1",
        code: "12.1",
        title: "سُورَۃُ الواقِعَۃِ",
        type: "unit"
      }
    ]
  },
  {
    id: "surah-11",
    title: "سورۃ نمبر 11: سُورَۃُ المُلکِ",
    type: "unit",
    chapters: [
      {
        id: "13.1",
        code: "13.1",
        title: "سُورَۃُ المُلکِ",
        type: "unit"
      }
    ]
  },
  {
    id: "surah-12",
    title: "سورۃ نمبر 12: سُورَۃُ القَلَمِ",
    type: "unit",
    chapters: [
      {
        id: "14.1",
        code: "14.1",
        title: "سُورَۃُ القَلَمِ",
        type: "unit"
      }
    ]
  },
  {
    id: "surah-13",
    title: "سورۃ نمبر 13: سُورَۃُ الحَآقَّۃِ",
    type: "unit",
    chapters: [
      {
        id: "15.1",
        code: "15.1",
        title: "سُورَۃُ الحَآقَّۃِ",
        type: "unit"
      }
    ]
  },
  {
    id: "surah-14",
    title: "سورۃ نمبر 14: سُورَۃُ المَعَارِجِ",
    type: "unit",
    chapters: [
      {
        id: "16.1",
        code: "16.1",
        title: "سُورَۃُ المَعَارِجِ",
        type: "unit"
      }
    ]
  },
  {
    id: "surah-15",
    title: "سورۃ نمبر 15: سُورَۃُ نُوحٍ",
    type: "unit",
    chapters: [
      {
        id: "17.1",
        code: "17.1",
        title: "سُورَۃُ نوحِ",
        type: "unit"
      }
    ]
  },
  {
    id: "surah-16",
    title: "سورۃ نمبر 16: سُورَۃُ الجِنِّ",
    type: "unit",
    chapters: [
      {
        id: "18.1",
        code: "18.1",
        title: "سُورَۃُ الجِنِّ",
        type: "unit"
      }
    ]
  },
  {
    id: "surah-17",
    title: "سورۃ نمبر 17: سُورِۃُ المُزَّمِّلِ",
    type: "unit",
    chapters: [
      {
        id: "19.1",
        code: "19.1",
        title: "سُورَۃُ المُزَّمِّلِ",
        type: "unit"
      }
    ]
  },
  {
    id: "surah-18",
    title: "سورۃ نمبر 18: سُورَۃُ المُدَّثِّرِ",
    type: "unit",
    chapters: [
      {
        id: "20.1",
        code: "20.1",
        title: "سُورَۃَ المُدَّثِّرِ",
        type: "unit"
      }
    ]
  },
  {
    id: "surah-19",
    title: "سورۃ نمبر 19: سُورَۃُ القِیَامَۃِ",
    type: "unit",
    chapters: [
      {
        id: "21.1",
        code: "21.1",
        title: "سُورَۃُ القِیَامَۃِ",
        type: "unit"
      }
    ]
  },
  {
    id: "surah-20",
    title: "سورۃ نمبر 20: سُورَۃُ الدَّھرِ",
    type: "unit",
    chapters: [
      {
        id: "22.1",
        code: "22.1",
        title: "سُورَۃُ الدَّھرِ",
        type: "unit"
      }
    ]
  },
  {
    id: "surah-21",
    title: "سورۃ نمبر 21: سُورَۃُ المُرسَلٰتِ",
    type: "unit",
    chapters: [
      {
        id: "23.1",
        code: "23.1",
        title: "سُورَۃُ المُرسَلٰتِ",
        type: "unit"
      }
    ]
  },
  {
    id: "surah-22",
    title: "سورۃ نمبر 22: سُورَۃُ یُوسُفَ",
    type: "unit",
    chapters: [
      {
        id: "24.1",
        code: "24.1",
        title: "سُورَۃُ یُوسُفَ",
        type: "unit"
      }
    ]
  },
  {
    id: "surah-22-hazrat-yusuf",
    title: "حضرت یُوسُف علیہ السّلام",
    type: "unit",
    chapters: [
      {
        id: "25.1",
        code: "25.1",
        title: "حضرت یوسف علیہ السلام کی زندگی کا تکلیف دہ دَور",
        type: "unit"
      },
      {
        id: "25.2",
        code: "25.2",
        title: "حضرت یوسف علیہ السلام کا عروج",
        type: "unit"
      }
    ]
  },
  {
    id: "surah-23",
    title: "سورۃ نمبر 23: سُورۃُ مَریَمَ",
    type: "unit",
    chapters: [
      {
        id: "27.1",
        code: "27.1",
        title: "سُورَۃُ مَریَمَ",
        type: "unit"
      }
    ]
  }
];

/**
 * Get all chapters as a flat array
 */
export function getAllChapters(): Chapter[] {
  return PTB_CLASS8_TARJUMA_QURAN.flatMap(unit => unit.chapters);
}

/**
 * Get chapters by unit ID
 */
export function getChaptersByUnit(unitId: string): Chapter[] {
  const unit = PTB_CLASS8_TARJUMA_QURAN.find(u => u.id === unitId);
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
  subject: "ترجمۃ القرآن (Translation of Holy Quran)",
  class: "8th",
  board: "PTB",
  totalSurahs: 24,
  totalChapters: getTotalChapterCount(),
  language: "Arabic/Urdu"
};
