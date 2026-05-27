/**
 * PTB INTER-II - Economics (معاشیات) - Complete Syllabus
 * Source: Punjab Textbook Board
 */

export interface Chapter {
  id: string;
  code: string;
  title: string;
  type: "chapter";
}

export interface Unit {
  id: string;
  title: string;
  type: "unit";
  chapters: Chapter[];
}

export const PTB_INTER2_ECONOMICS: Unit[] = [
  {
    id: "bab-1",
    title: "باب نمبر 1: قومی آمدنی",
    type: "unit",
    chapters: [
      { id: "1", code: "1", title: "قومی آمدمنی", type: "chapter" },
    ],
  },
  {
    id: "bab-2",
    title: "باب نمبر 2: زر",
    type: "unit",
    chapters: [
      { id: "2", code: "2", title: "زر", type: "chapter" },
    ],
  },
  {
    id: "bab-3",
    title: "باب نمبر 3: بینک",
    type: "unit",
    chapters: [
      { id: "3", code: "3", title: "بینک", type: "chapter" },
    ],
  },
  {
    id: "bab-4",
    title: "باب نمبر 4: سرکاری مالیات",
    type: "unit",
    chapters: [
      { id: "4", code: "4", title: "سرکاری مالیات", type: "chapter" },
    ],
  },
  {
    id: "bab-5",
    title: "باب نمبر 5: بین الاقوامی تجارت",
    type: "unit",
    chapters: [
      { id: "5", code: "5", title: "بین الاقوامی تجارت", type: "chapter" },
    ],
  },
  {
    id: "bab-6",
    title: "باب نمبر 6: پاکستان کی معیشت کا تعارف",
    type: "unit",
    chapters: [
      { id: "6", code: "6", title: "پاکستان کی معیشت کا تعارف", type: "chapter" },
    ],
  },
  {
    id: "bab-7",
    title: "باب نمبر 7: پاکستان کی قومی آمدنی",
    type: "unit",
    chapters: [
      { id: "7", code: "7", title: "پاکستان کی قومی آمدنی", type: "chapter" },
    ],
  },
  {
    id: "bab-8",
    title: "باب نمبر 8: معاشی ترقی و منصوبہ بندی",
    type: "unit",
    chapters: [
      { id: "8", code: "8", title: "معاشی ترقی و منصوبہ بندی", type: "chapter" },
    ],
  },
  {
    id: "bab-9",
    title: "باب نمبر 9: مواصلات، ذرائع آمد و رفت اور انسانی ذرائع کی ترقی",
    type: "unit",
    chapters: [
      { id: "9", code: "9", title: "مواصلات، ذرائع آمد و رفت اور انسانی ذرائع کی ترقی", type: "chapter" },
    ],
  },
  {
    id: "bab-10",
    title: "باب نمبر 10: پاکستان کا بنکاری کا نظام",
    type: "unit",
    chapters: [
      { id: "10", code: "10", title: "پاکستان کا بنکاری کا نظام", type: "chapter" },
    ],
  },
  {
    id: "bab-11",
    title: "باب نمبر 11: حکومت پاکستان کے مالیات",
    type: "unit",
    chapters: [
      { id: "11", code: "11", title: "حکومت پاکستان کے مالیات", type: "chapter" },
    ],
  },
  {
    id: "bab-12",
    title: "باب نمبر 12: پاکستان کی تجارتِ خارجہ",
    type: "unit",
    chapters: [
      { id: "12", code: "12", title: "پاکستان کی تجارتِ خارجہ", type: "chapter" },
    ],
  },
  {
    id: "bab-13",
    title: "باب نمبر 13: اسلام کا معاشی نظام",
    type: "unit",
    chapters: [
      { id: "13", code: "13", title: "اسلام کا معاشی نظام", type: "chapter" },
    ],
  },
];

export const SYLLABUS_METADATA = {
  subject: "Economics (معاشیات)",
  class: "INTER-II",
  board: "PTB",
  totalUnits: 13,
  totalChapters: 13,
  language: "Urdu",
};

export function getAllChapters(): Chapter[] {
  return PTB_INTER2_ECONOMICS.flatMap((u) => u.chapters);
}

export function getTotalChapterCount(): number {
  return getAllChapters().length;
}

export function getChaptersByUnit(unitId: string): Chapter[] {
  return PTB_INTER2_ECONOMICS.find((u) => u.id === unitId)?.chapters || [];
}

export function getUnitByChapterId(chapterId: string): Unit | undefined {
  return PTB_INTER2_ECONOMICS.find((u) => 
    u.chapters.some((ch) => ch.id === chapterId)
  );
}
