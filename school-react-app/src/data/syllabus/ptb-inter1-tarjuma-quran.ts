/**
 * PTB Inter Part-I ترجمۃ القرآن مجید Syllabus
 * Surahs 4, 8, 12, 16 — Arabic text preserved exactly
 * Note: heading and topic text differ slightly per surah — both preserved exactly as written
 */

export interface Chapter {
  id: string;
  code: string;
  title: string;
  titleUrdu: string;
  type: "chapter";
}

export interface Unit {
  id: string;
  title: string;
  titleUrdu: string;
  type: "unit";
  chapters: Chapter[];
}

export const PTB_INTER1_TARJUMA_QURAN: Unit[] = [
  {
    id: "surah-4",
    title: "Surah 4: Surah Al-Baqarah",
    titleUrdu: "سورۃ نمبر 4: سُورۃُ اَلبَقرَۃِ",
    type: "unit",
    // topic text differs slightly from heading — preserved exactly
    chapters: [{ id: "4",  code: "4",  title: "Surah Al-Baqarah",  titleUrdu: "سُورَۃُ البَقَرَۃِ",    type: "chapter" }],
  },
  {
    id: "surah-8",
    title: "Surah 8: Surah Aal-e-Imran",
    titleUrdu: "سورۃ نمبر 8: سُورۃُ آلِ عِمرٰان",
    type: "unit",
    // topic text differs slightly — preserved exactly
    chapters: [{ id: "8",  code: "8",  title: "Surah Aal-e-Imran",  titleUrdu: "سُورَۃُ الِ عِمرٰنَ",   type: "chapter" }],
  },
  {
    id: "surah-12",
    title: "Surah 12: Surah Al-Anfal",
    titleUrdu: "سورۃ نمبر 12: سُورۃُ آلِ الانفال",
    type: "unit",
    // topic text differs from heading — preserved exactly
    chapters: [{ id: "12", code: "12", title: "Surah Al-Anfal",     titleUrdu: "سُورَۃُ الاَنَفَالِ",   type: "chapter" }],
  },
  {
    id: "surah-16",
    title: "Surah 16: Surah Al-Tawbah",
    titleUrdu: "سورۃ نمبر 16: سُورۃُ التوبہ",
    type: "unit",
    // topic text differs slightly — preserved exactly
    chapters: [{ id: "16", code: "16", title: "Surah Al-Tawbah",    titleUrdu: "سُورَۃُ التَّوبَۃِ",   type: "chapter" }],
  },
];

export function getAllChapters(): Chapter[] { return PTB_INTER1_TARJUMA_QURAN.flatMap((u) => u.chapters); }
export function getChaptersByUnit(unitId: string): Chapter[] { return PTB_INTER1_TARJUMA_QURAN.find((u) => u.id === unitId)?.chapters || []; }
export function getUnitByChapterId(chapterId: string): Unit | undefined { return PTB_INTER1_TARJUMA_QURAN.find((u) => u.chapters.some((ch) => ch.id === chapterId)); }
