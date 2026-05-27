/**
 * PTB Inter Part-II ترجمۃ القرآن مجید Syllabus
 * Surahs 4–20 — Arabic text preserved exactly with RTL support
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

export const PTB_INTER2_TARJUMA_QURAN: Unit[] = [
  {
    id: "surah-4",
    title: "Surah 4: Surah Al-Nisa",
    titleUrdu: "سورۃ نمبر 4: سُورَۃُ النِسَآءِ",
    type: "unit",
    chapters: [{ id: "4",  code: "4",  title: "Surah Al-Nisa",        titleUrdu: "سُورَۃُ النِسَآءِ",      type: "chapter" }],
  },
  {
    id: "surah-5",
    title: "Surah 5: Surah Al-Ma'idah",
    titleUrdu: "سورۃ نمبر 5: سُورَۃُ المَآئِدَۃِ",
    type: "unit",
    chapters: [{ id: "5",  code: "5",  title: "Surah Al-Ma'idah",     titleUrdu: "سُورَۃُ المَآئِدَۃِ",    type: "chapter" }],
  },
  {
    id: "surah-6",
    title: "Surah 6: Surah Al-Nur",
    titleUrdu: "سورۃ نمبر 6: سُورَۃُ النُّورِ",
    type: "unit",
    chapters: [{ id: "6",  code: "6",  title: "Surah Al-Nur",         titleUrdu: "سُورَۃُ النُّورِ",       type: "chapter" }],
  },
  {
    id: "surah-7",
    title: "Surah 7: Surah Al-Ahzab",
    titleUrdu: "سورۃ نمبر 7: سُورَۃُ الاَحزَابِ",
    type: "unit",
    chapters: [{ id: "7",  code: "7",  title: "Surah Al-Ahzab",       titleUrdu: "سُورَۃُ الاَحزَابِ",     type: "chapter" }],
  },
  {
    id: "surah-8",
    title: "Surah 8: Surah Muhammad",
    titleUrdu: "سورۃ نمبر 8: سُورَۃُ مُحَمَّدِِ",
    type: "unit",
    chapters: [{ id: "8",  code: "8",  title: "Surah Muhammad",       titleUrdu: "سُورَۃُ مُحَمَّدِِ",     type: "chapter" }],
  },
  {
    id: "surah-9",
    title: "Surah 9: Surah Al-Fath",
    titleUrdu: "سورۃ نمبر 9: سُورَۃُ الفَتحِ",
    type: "unit",
    chapters: [{ id: "9",  code: "9",  title: "Surah Al-Fath",        titleUrdu: "سُورَۃُ الفَتحِ",        type: "chapter" }],
  },
  {
    id: "surah-10",
    title: "Surah 10: Surah Al-Hujurat",
    titleUrdu: "سورۃ نمبر 10: سُورَۃُ الحُجُرٰتِ",
    type: "unit",
    chapters: [{ id: "10", code: "10", title: "Surah Al-Hujurat",     titleUrdu: "سُورَۃُ الحُجُرٰتِ",    type: "chapter" }],
  },
  {
    id: "surah-11",
    title: "Surah 11: Surah Al-Hadid",
    titleUrdu: "سورۃ نمبر 11: سُورَۃُ الحَدِیدِ",
    type: "unit",
    chapters: [{ id: "11", code: "11", title: "Surah Al-Hadid",       titleUrdu: "سُورَۃُ الحَدِیدِ",     type: "chapter" }],
  },
  {
    id: "surah-12",
    title: "Surah 12: Surah Al-Mujadilah",
    titleUrdu: "سورۃ نمبر 12: سُورَۃُ المُجَادَلَۃِ",
    type: "unit",
    chapters: [{ id: "12", code: "12", title: "Surah Al-Mujadilah",   titleUrdu: "سُورَۃُ المُجَادَلَۃِ",  type: "chapter" }],
  },
  {
    id: "surah-13",
    title: "Surah 13: Surah Al-Hashr",
    titleUrdu: "سورۃ نمبر 13: سُورَۃُ الحَشرِ",
    type: "unit",
    chapters: [{ id: "13", code: "13", title: "Surah Al-Hashr",       titleUrdu: "سُورَۃُ الحَشرِ",       type: "chapter" }],
  },
  {
    id: "surah-14",
    title: "Surah 14: Surah Al-Mumtahanah",
    titleUrdu: "سورۃ نمبر 14: سُورَۃُ المُمتَحِنَۃِ",
    type: "unit",
    chapters: [{ id: "14", code: "14", title: "Surah Al-Mumtahanah",  titleUrdu: "سُورَۃُ المُمتَحِنَۃِ", type: "chapter" }],
  },
  {
    id: "surah-15",
    title: "Surah 15: Surah Al-Saff",
    titleUrdu: "سورۃ نمبر 15: سُورَۃُ الصَّفِّ",
    type: "unit",
    chapters: [{ id: "15", code: "15", title: "Surah Al-Saff",        titleUrdu: "سُورَۃُ الصَّفِّ",      type: "chapter" }],
  },
  {
    id: "surah-16",
    title: "Surah 16: Surah Al-Jumu'ah",
    titleUrdu: "سورۃ نمبر 16: سُورَۃُ الجُمُعَۃِ",
    type: "unit",
    chapters: [{ id: "16", code: "16", title: "Surah Al-Jumu'ah",     titleUrdu: "سُورَۃُ الجُمُعَۃِ",    type: "chapter" }],
  },
  {
    id: "surah-17",
    title: "Surah 17: Surah Al-Munafiqun",
    titleUrdu: "سورۃ نمبر 17: سُورَۃُ المُنٰفِقُونَ",
    type: "unit",
    chapters: [{ id: "17", code: "17", title: "Surah Al-Munafiqun",   titleUrdu: "سُورَۃُ المُنٰفِقُونَ", type: "chapter" }],
  },
  {
    id: "surah-18",
    title: "Surah 18: Surah Al-Taghabun",
    titleUrdu: "سورۃ نمبر 18: سُورَۃُ التَغَابُنِ",
    type: "unit",
    chapters: [{ id: "18", code: "18", title: "Surah Al-Taghabun",    titleUrdu: "سُورَۃُ التَغَابُنِ",   type: "chapter" }],
  },
  {
    id: "surah-19",
    title: "Surah 19: Surah Al-Talaq",
    titleUrdu: "سورۃ نمبر 19: سُورَۃُ الطَّلَاقِ",
    type: "unit",
    chapters: [{ id: "19", code: "19", title: "Surah Al-Talaq",       titleUrdu: "سُورَۃُ الطَّلَاقِ",    type: "chapter" }],
  },
  {
    id: "surah-20",
    title: "Surah 20: Surah Al-Tahrim",
    titleUrdu: "سورۃ نمبر 20: سُورَۃُ التَّحرِیمِ",
    type: "unit",
    chapters: [{ id: "20", code: "20", title: "Surah Al-Tahrim",      titleUrdu: "سُورَۃُ التَّحرِیمِ",   type: "chapter" }],
  },
];

export function getAllChapters(): Chapter[] {
  return PTB_INTER2_TARJUMA_QURAN.flatMap((u) => u.chapters);
}
export function getChaptersByUnit(unitId: string): Chapter[] {
  return PTB_INTER2_TARJUMA_QURAN.find((u) => u.id === unitId)?.chapters || [];
}
export function getUnitByChapterId(chapterId: string): Unit | undefined {
  return PTB_INTER2_TARJUMA_QURAN.find((u) => u.chapters.some((ch) => ch.id === chapterId));
}
