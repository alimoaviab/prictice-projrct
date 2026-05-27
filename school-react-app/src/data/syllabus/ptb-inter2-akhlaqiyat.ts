/**
 * PTB Inter Part-II اخلاقیات (Ethics) Syllabus
 * 5 chapters with Urdu text preserved exactly with RTL support
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

export const PTB_INTER2_AKHLAQIYAT: Unit[] = [
  {
    id: "chap-1",
    title: "Chapter 1: Introduction to Religions",
    titleUrdu: "باب نمبر 1: مذاہب کا تعارف",
    type: "unit",
    chapters: [
      { id: "1.1", code: "1.1", title: "Introduction to Religions",         titleUrdu: "مذاہب کا تعارف",             type: "chapter" },
    ],
  },
  {
    id: "chap-2",
    title: "Chapter 2: Different Religions in Pakistan",
    titleUrdu: "باب نمبر 2: پاکستان میں مختلف مذاہب",
    type: "unit",
    chapters: [
      { id: "2.1", code: "2.1", title: "Different Religions in Pakistan",   titleUrdu: "پاکستان میں مختلف مذاہب",    type: "chapter" },
    ],
  },
  {
    id: "chap-3",
    title: "Chapter 3: Moral Values",
    titleUrdu: "باب نمبر 3: اخلاقی اقدار",
    type: "unit",
    chapters: [
      { id: "3.1", code: "3.1", title: "Moral Values",                      titleUrdu: "اخلاقی اقدار",               type: "chapter" },
    ],
  },
  {
    id: "chap-4",
    title: "Chapter 4: Etiquettes",
    titleUrdu: "باب نمبر 4: آداب",
    type: "unit",
    chapters: [
      { id: "4.1", code: "4.1", title: "Etiquettes",                        titleUrdu: "آداب",                       type: "chapter" },
    ],
  },
  {
    id: "chap-5",
    title: "Chapter 5: Notable Personalities",
    titleUrdu: "باب نمبر 5: مشاہیر",
    type: "unit",
    chapters: [
      { id: "5.1", code: "5.1", title: "Notable Personalities",             titleUrdu: "مشاہیر",                     type: "chapter" },
    ],
  },
];

export function getAllChapters(): Chapter[] {
  return PTB_INTER2_AKHLAQIYAT.flatMap((u) => u.chapters);
}
export function getChaptersByUnit(unitId: string): Chapter[] {
  return PTB_INTER2_AKHLAQIYAT.find((u) => u.id === unitId)?.chapters || [];
}
export function getUnitByChapterId(chapterId: string): Unit | undefined {
  return PTB_INTER2_AKHLAQIYAT.find((u) => u.chapters.some((ch) => ch.id === chapterId));
}
