/**
 * PTB Class 10 ترجمۃ القرآن المجید Syllabus
 * Surahs 4–18 — Arabic text preserved exactly
 * All heading/topic spelling variations preserved exactly as written in source
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

export const PTB_CLASS10_TARJUMA_QURAN: Unit[] = [
  {
    id: "surah-4",
    title: "Surah 4: Surah Al-An'am",
    titleUrdu: "سورۃ نمبر 4: سُورَۃُ الاَنعَامِ",
    type: "unit",
    // topic text: "سُورَۃُ الاَ نعَامِ" (with space) — preserved exactly
    chapters: [{ id: "4",  code: "4",  title: "Surah Al-An'am",             titleUrdu: "سُورَۃُ الاَ نعَامِ",        type: "chapter" }],
  },
  {
    id: "surah-5",
    title: "Surah 5: Surah Al-A'raf",
    titleUrdu: "سورۃ نمبر 5: سُورَۃُ الاَعرَافِ",
    type: "unit",
    chapters: [{ id: "5",  code: "5",  title: "Surah Al-A'raf",             titleUrdu: "سُورَۃُ الاَعرَافِ",        type: "chapter" }],
  },
  {
    id: "surah-6",
    title: "Surah 6: Surah Yunus",
    titleUrdu: "سورۃ نمبر 6: سُورَۃُ یُونُسَ",
    type: "unit",
    chapters: [{ id: "6",  code: "6",  title: "Surah Yunus",                titleUrdu: "سُورَۃُ یُونُسَ",           type: "chapter" }],
  },
  {
    id: "surah-7",
    title: "Surah 7: Surah Hud",
    titleUrdu: "سورۃ نمبر 7: سُورَۃُ ھُودِِ",
    type: "unit",
    // Double kasrah preserved exactly
    chapters: [{ id: "7",  code: "7",  title: "Surah Hud",                  titleUrdu: "سُورَۃُ ھُودِِ",            type: "chapter" }],
  },
  {
    id: "surah-8",
    title: "Surah 8: Surah Al-Ra'd",
    titleUrdu: "سورۃ نمبر 8: سُورَۃُ الرَّعدِ",
    type: "unit",
    chapters: [{ id: "8",  code: "8",  title: "Surah Al-Ra'd",              titleUrdu: "سُورَۃُ الرَّعدِ",          type: "chapter" }],
  },
  {
    id: "surah-9",
    title: "Surah 9: Surah Ibrahim",
    titleUrdu: "سورۃ نمبر 9: سُورَۃُ اِبرٰھِیمَ",
    type: "unit",
    chapters: [{ id: "9",  code: "9",  title: "Surah Ibrahim",              titleUrdu: "سُورَۃُ اِبرٰھِیمَ",        type: "chapter" }],
  },
  {
    id: "surah-10",
    title: "Surah 10: Surah Al-Hijr",
    titleUrdu: "سورۃ نمبر 10: سُورَۃُ الحِجرِ",
    type: "unit",
    chapters: [{ id: "10", code: "10", title: "Surah Al-Hijr",              titleUrdu: "سُورَۃُ الحِجرِ",           type: "chapter" }],
  },
  {
    id: "surah-11",
    title: "Surah 11: Surah Al-Nahl",
    titleUrdu: "سورۃ نمبر 11: سُورَۃُ النَّحلِ",
    type: "unit",
    chapters: [{ id: "11", code: "11", title: "Surah Al-Nahl",              titleUrdu: "سُورَۃُ النَّحلِ",          type: "chapter" }],
  },
  {
    id: "surah-12",
    title: "Surah 12: Surah Bani Israel",
    titleUrdu: "سورۃ نمبر 12: سُورَۃُ بَنِیٓ اِسرَءِیلَ",
    type: "unit",
    chapters: [{ id: "12", code: "12", title: "Surah Bani Israel",          titleUrdu: "سُورَۃُ بَنِیٓ اِسرَءِیلَ", type: "chapter" }],
  },
  {
    id: "surah-13",
    title: "Surah 13: Surah Al-Kahf",
    titleUrdu: "سورۃ نمبر 13: سُورَۃُ الکَھفِ",
    type: "unit",
    chapters: [{ id: "13", code: "13", title: "Surah Al-Kahf",              titleUrdu: "سُورَۃُ الکَھفِ",           type: "chapter" }],
  },
  {
    id: "surah-14",
    title: "Surah 14: Surah Al-Mu'minun",
    titleUrdu: "سورۃ نمبر 14: سُورَۃُ المُومِنُونَ",
    type: "unit",
    chapters: [{ id: "14", code: "14", title: "Surah Al-Mu'minun",          titleUrdu: "سُورَۃُ المُومِنُونَ",      type: "chapter" }],
  },
  {
    id: "surah-15",
    title: "Surah 15: Surah Al-Zumar",
    titleUrdu: "سورۃ نمبر 15: سُورَۃُ الزُّمَرِ",
    type: "unit",
    // topic text: "سُورَۃُ الزَّمَرِ" differs — preserved exactly
    chapters: [{ id: "15", code: "15", title: "Surah Al-Zumar",             titleUrdu: "سُورَۃُ الزَّمَرِ",         type: "chapter" }],
  },
  {
    id: "surah-16",
    title: "Surah 16: Surah Al-Mu'min (Al-Ghafir)",
    titleUrdu: "سورۃ نمبر 16: سُورَۃُ المُومِنِ (اَلغَافِر)",
    type: "unit",
    // topic text: "سُورَۃُ المُومِنِ (لَغَا فِرِ)" — preserved exactly
    chapters: [{ id: "16", code: "16", title: "Surah Al-Mu'min (Al-Ghafir)", titleUrdu: "سُورَۃُ المُومِنِ (لَغَا فِرِ)", type: "chapter" }],
  },
  {
    id: "surah-17",
    title: "Surah 17: Surah Ha Mim Al-Sajdah",
    titleUrdu: "سورۃ نمبر 17: سُورَۃُ حٰمٓ اَلسَّجدَۃِ",
    type: "unit",
    chapters: [{ id: "17", code: "17", title: "Surah Ha Mim Al-Sajdah",     titleUrdu: "سُورَۃُ حٰمٓ اَلسَّجدَۃِ",  type: "chapter" }],
  },
  {
    id: "surah-18",
    title: "Surah 18: Surah Al-Shura",
    titleUrdu: "سورۃ نمبر 18: سُورَۃُ الشُّورٰی",
    type: "unit",
    chapters: [{ id: "18", code: "18", title: "Surah Al-Shura",             titleUrdu: "سُورَۃُ الشُّورٰی",         type: "chapter" }],
  },
];

export function getAllChapters(): Chapter[] { return PTB_CLASS10_TARJUMA_QURAN.flatMap((u) => u.chapters); }
export function getChaptersByUnit(unitId: string): Chapter[] { return PTB_CLASS10_TARJUMA_QURAN.find((u) => u.id === unitId)?.chapters || []; }
export function getUnitByChapterId(chapterId: string): Unit | undefined { return PTB_CLASS10_TARJUMA_QURAN.find((u) => u.chapters.some((ch) => ch.id === chapterId)); }
