/**
 * PTB Inter Part-II اِنسانی جغرافیہ (Human Geography) Syllabus
 * 6 chapters — Urdu text preserved exactly with RTL support
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

export const PTB_INTER2_INSANI_GEOGRAPHY: Unit[] = [
  {
    id: "chap-1",
    title: "Chapter 1: Human Geography",
    titleUrdu: "باب نمبر 1: انسانی جغرافیہ",
    type: "unit",
    chapters: [
      { id: "1", code: "1", title: "Human Geography", titleUrdu: "انسانی جغرافیہ", type: "chapter" },
    ],
  },
  {
    id: "chap-2",
    title: "Chapter 2: World Population",
    titleUrdu: "باب نمبر 2: دنیا کی آبادی",
    type: "unit",
    chapters: [
      { id: "2", code: "2", title: "World Population", titleUrdu: "دنیا کی آبادی", type: "chapter" },
    ],
  },
  {
    id: "chap-3",
    title: "Chapter 3: Human Settlements",
    titleUrdu: "باب نمبر 3: انسانی بستیاں",
    type: "unit",
    chapters: [
      { id: "3", code: "3", title: "Human Settlements", titleUrdu: "انسانی بستیاں", type: "chapter" },
    ],
  },
  {
    id: "chap-4",
    title: "Chapter 4: Economic Activities",
    titleUrdu: "باب نمبر 4: معاشی سرگرمیاں",
    type: "unit",
    chapters: [
      { id: "4", code: "4", title: "Economic Activities", titleUrdu: "معاشی سرگرمیاں", type: "chapter" },
    ],
  },
  {
    id: "chap-5",
    title: "Chapter 5: Political Geography",
    titleUrdu: "باب نمبر 5: سیاسی جغرافیہ",
    type: "unit",
    chapters: [
      { id: "5", code: "5", title: "Political Geography", titleUrdu: "سیاسی جغرافیہ", type: "chapter" },
    ],
  },
  {
    id: "chap-6",
    title: "Chapter 6: Natural Disasters",
    titleUrdu: "باب نمبر 6: قدرتی آفات",
    type: "unit",
    chapters: [
      { id: "6", code: "6", title: "Natural Disasters", titleUrdu: "قدرتی آفات", type: "chapter" },
    ],
  },
];

export function getAllChapters(): Chapter[] {
  return PTB_INTER2_INSANI_GEOGRAPHY.flatMap((u) => u.chapters);
}
export function getChaptersByUnit(unitId: string): Chapter[] {
  return PTB_INTER2_INSANI_GEOGRAPHY.find((u) => u.id === unitId)?.chapters || [];
}
export function getUnitByChapterId(chapterId: string): Unit | undefined {
  return PTB_INTER2_INSANI_GEOGRAPHY.find((u) => u.chapters.some((ch) => ch.id === chapterId));
}
