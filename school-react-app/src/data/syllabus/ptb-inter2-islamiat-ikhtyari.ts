/**
 * PTB Inter Part-II اسلامیات اختیاری (Islamiat Optional) Syllabus
 * Structure: Bab 1 (Intro + 10 Surah Al-Baqarah ruku sections),
 *            Bab 3 (Intro + 11 Ahadith groups), Bab 4 (Arabic Grammar)
 * Urdu/Arabic text preserved exactly with RTL support
 * Note: Bab 2 not present in source — preserved as provided
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

export const PTB_INTER2_ISLAMIAT_IKHTYARI: Unit[] = [
  {
    id: "chap-1",
    title: "Chapter 1: Introduction to Quranic Study, Revelation, Compilation and Protection of Quran",
    titleUrdu: "باب نمبر 1: تعارفِ مطالعہ قرآن، نزول وحی، تدوین قرآن مجید، حفاظت قرآن مجید",
    type: "unit",
    chapters: [
      { id: "1",  code: "1",  title: "Introduction — Quranic Study, Revelation, Compilation and Protection of Quran", titleUrdu: "تعارف مطالعہ قرآن، نزول وحی، تدوین قرآن مجید، حفاظت قرآن مجید", type: "chapter" },
      { id: "2",  code: "2",  title: "Surah Al-Baqarah Ruku: 1,2",   titleUrdu: "سورۃ بقرہ رکوع: 1,2",   type: "chapter" },
      { id: "3",  code: "3",  title: "Surah Al-Baqarah Ruku: 3,4",   titleUrdu: "سورۃ بقرہ رکوع: 3,4",   type: "chapter" },
      { id: "4",  code: "4",  title: "Surah Al-Baqarah Ruku: 5,6",   titleUrdu: "سورۃ بقرہ رکوع: 5,6",   type: "chapter" },
      { id: "5",  code: "5",  title: "Surah Al-Baqarah Ruku: 7,8",   titleUrdu: "سورۃ بقرہ رکوع: 7,8",   type: "chapter" },
      { id: "6",  code: "6",  title: "Surah Al-Baqarah Ruku: 9,10",  titleUrdu: "سورۃ بقرہ رکوع: 9,10",  type: "chapter" },
      { id: "7",  code: "7",  title: "Surah Al-Baqarah Ruku: 11,12", titleUrdu: "سورۃ بقرہ رکوع: 11,12", type: "chapter" },
      { id: "8",  code: "8",  title: "Surah Al-Baqarah Ruku: 13,14", titleUrdu: "سورۃ بقرہ رکوع: 13,14", type: "chapter" },
      { id: "9",  code: "9",  title: "Surah Al-Baqarah Ruku: 15,16", titleUrdu: "سورۃ بقرہ رکوع: 15,16", type: "chapter" },
      { id: "10", code: "10", title: "Surah Al-Baqarah Ruku: 17,18", titleUrdu: "سورۃ بقرہ رکوع: 17,18", type: "chapter" },
      { id: "11", code: "11", title: "Surah Al-Baqarah Ruku: 19,20", titleUrdu: "سورۃ بقرہ رکوع: 19,20", type: "chapter" },
    ],
  },
  {
    id: "chap-3",
    title: "Chapter 3: Introduction to Hadith, Necessity & Importance, Compilation of Books of Hadith",
    titleUrdu: "باب نمبر 3: تعارف حدیث، ضرورت و اہمیت، جمع وتدوین کتب حدیث",
    type: "unit",
    chapters: [
      { id: "3.1",  code: "3.1",  title: "Introduction to Hadith, Necessity & Importance, Compilation of Books of Hadith", titleUrdu: "تعارف حدیث، ضرورت واہمیت، جمع وتدوین کتب حدیث", type: "chapter" },
      { id: "3.2",  code: "3.2",  title: "Ahadith: 1,2,3,4",           titleUrdu: "احادیث: 1,2,3,4",           type: "chapter" },
      { id: "3.3",  code: "3.3",  title: "Ahadith: 5,6,7,8",           titleUrdu: "احادیث: 5,6,7,8",           type: "chapter" },
      { id: "3.4",  code: "3.4",  title: "Ahadith: 9,10,11,12",        titleUrdu: "احادیث: 9,10,11,12",        type: "chapter" },
      { id: "3.5",  code: "3.5",  title: "Ahadith: 13,14,15,16",       titleUrdu: "احادیث: 13,14,15,16",       type: "chapter" },
      { id: "3.6",  code: "3.6",  title: "Ahadith: 17,18,19,20",       titleUrdu: "احادیث: 17,18,19,20",       type: "chapter" },
      { id: "3.7",  code: "3.7",  title: "Ahadith: 21,22,23,24",       titleUrdu: "احادیث: 21,22,23,24",       type: "chapter" },
      { id: "3.8",  code: "3.8",  title: "Ahadith: 25,26,27,28",       titleUrdu: "احادیث: 25,26,27,28",       type: "chapter" },
      { id: "3.9",  code: "3.9",  title: "Ahadith: 29,30,31,32",       titleUrdu: "احادیث: 29,30,31,32",       type: "chapter" },
      { id: "3.10", code: "3.10", title: "Ahadith: 33,34,35,36",       titleUrdu: "احادیث: 33,34,35,36",       type: "chapter" },
      { id: "3.11", code: "3.11", title: "Ahadith: 37,38,39,40,41,42", titleUrdu: "احادیث: 37,38,39,40,41,42", type: "chapter" },
    ],
  },
  {
    id: "chap-4",
    title: "Chapter 4: Arabic Grammar",
    titleUrdu: "باب نمبر 4: عربی گرائمر",
    type: "unit",
    chapters: [
      { id: "4.1", code: "4.1", title: "Past, Present, Imperative, Negative, Singular-Plural, Masculine-Feminine", titleUrdu: "ماضی، مضارع، امر، نہی، واحد جمع اور مذکر مونث", type: "chapter" },
    ],
  },
];

export function getAllChapters(): Chapter[] { return PTB_INTER2_ISLAMIAT_IKHTYARI.flatMap((u) => u.chapters); }
export function getChaptersByUnit(unitId: string): Chapter[] { return PTB_INTER2_ISLAMIAT_IKHTYARI.find((u) => u.id === unitId)?.chapters || []; }
export function getUnitByChapterId(chapterId: string): Unit | undefined { return PTB_INTER2_ISLAMIAT_IKHTYARI.find((u) => u.chapters.some((ch) => ch.id === chapterId)); }
