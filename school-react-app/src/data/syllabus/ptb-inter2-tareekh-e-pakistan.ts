/**
 * PTB Inter Part-II تاریخِ پاکستان (History of Pakistan) Syllabus
 * 8 chapters — Urdu text preserved exactly with RTL support
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

export const PTB_INTER2_TAREEKH_E_PAKISTAN: Unit[] = [
  {
    id: "chap-1",
    title: "Chapter 1: Establishment of Pakistan and its Early Difficulties",
    titleUrdu: "باب نمبر 1: قیام پاکستان اور اس کی ابتدائی مشکلات",
    type: "unit",
    chapters: [
      { id: "1", code: "1", title: "Establishment of Pakistan and its Early Difficulties", titleUrdu: "قیام پاکستان اور اس کی ابتدائی مشکلات", type: "chapter" },
    ],
  },
  {
    id: "chap-2",
    title: "Chapter 2: Political and Constitutional Development (1947-58)",
    titleUrdu: "باب نمبر 2: سیاسی اور دستوری ارتقاء(1947-58ء)",
    type: "unit",
    chapters: [
      { id: "2", code: "2", title: "Political and Constitutional Development (1947-58)", titleUrdu: "سیاسی اور دستوری ارتقاء(1947-58ء)", type: "chapter" },
    ],
  },
  {
    id: "chap-3",
    title: "Chapter 3: Era of Ayub Khan",
    titleUrdu: "باب نمبر 3: ایوب خان کا دور",
    type: "unit",
    chapters: [
      { id: "3", code: "3", title: "Era of Ayub Khan", titleUrdu: "ایوب خان کا دور", type: "chapter" },
    ],
  },
  {
    id: "chap-4",
    title: "Chapter 4: Martial Law of Yahya Khan",
    titleUrdu: "باب نمبر 4: یحییٰ خان کا مارشل لاء",
    type: "unit",
    chapters: [
      { id: "4", code: "4", title: "Martial Law of Yahya Khan", titleUrdu: "یحییٰ خان کا مارشل لاء", type: "chapter" },
    ],
  },
  {
    id: "chap-5",
    title: "Chapter 5: Constitutional Crisis of 1971 and Separation of East Pakistan",
    titleUrdu: "باب نمبر 5: 1971ء کا دستوری بحران اور مشرقی پاکستان کی علیحدگی",
    type: "unit",
    chapters: [
      { id: "5", code: "5", title: "Constitutional Crisis of 1971 and Separation of East Pakistan", titleUrdu: "1971ء کا دستوری بحران اور مشرقی پاکستان کی علیحدگی", type: "chapter" },
    ],
  },
  {
    id: "chap-6",
    title: "Chapter 6: Era of People's Party Government",
    titleUrdu: "باب نمبر 6: پیپلز پارٹی کا دور حکومت",
    type: "unit",
    chapters: [
      { id: "6", code: "6", title: "Era of People's Party Government", titleUrdu: "پیپلز پارٹی کا دور حکومت", type: "chapter" },
    ],
  },
  {
    id: "chap-7",
    title: "Chapter 7: Foreign Policy of Pakistan",
    titleUrdu: "باب نمبر 7: پاکستان کی خارجہ پالیسی",
    type: "unit",
    chapters: [
      { id: "7", code: "7", title: "Foreign Policy of Pakistan", titleUrdu: "پاکستان کی خارجہ پالیسی", type: "chapter" },
    ],
  },
  {
    id: "chap-8",
    title: "Chapter 8: Era of Zia-ul-Haq's Government",
    titleUrdu: "باب نمبر 8: ضیاءالحق کا دور حکومت",
    type: "unit",
    chapters: [
      { id: "8", code: "8", title: "Era of Zia-ul-Haq's Government", titleUrdu: "ضیاءالحق کا دور حکومت", type: "chapter" },
    ],
  },
];

export function getAllChapters(): Chapter[] {
  return PTB_INTER2_TAREEKH_E_PAKISTAN.flatMap((u) => u.chapters);
}
export function getChaptersByUnit(unitId: string): Chapter[] {
  return PTB_INTER2_TAREEKH_E_PAKISTAN.find((u) => u.id === unitId)?.chapters || [];
}
export function getUnitByChapterId(chapterId: string): Unit | undefined {
  return PTB_INTER2_TAREEKH_E_PAKISTAN.find((u) => u.chapters.some((ch) => ch.id === chapterId));
}
