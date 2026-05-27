/**
 * PTB INTER-I - Economics (معاشیات) - Complete Syllabus
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

export const PTB_INTER1_ECONOMICS: Unit[] = [
  {
    id: "bab-1",
    title: "باب نمبر 1: معاشیات کی نوعیت اور وسعت",
    type: "unit",
    chapters: [
      { id: "1", code: "1", title: "معاشیات کی نوعیت اور وسعت", type: "chapter" },
    ],
  },
  {
    id: "bab-2",
    title: "باب نمبر 2: رؤیہ صارف کا تجزیہ",
    type: "unit",
    chapters: [
      { id: "2", code: "2", title: "رؤیہ صارف کا تجزیہ", type: "chapter" },
    ],
  },
  {
    id: "bab-3",
    title: "باب نمبر 3: معاشیات میں شماریات اور ریاضی کے بنیادی آلات",
    type: "unit",
    chapters: [
      { id: "3", code: "3", title: "معاشیات میں شماریات اور ریاضی کے بنیادی آلات", type: "chapter" },
    ],
  },
  {
    id: "bab-4",
    title: "باب نمبر 4: طلب",
    type: "unit",
    chapters: [
      { id: "4", code: "4", title: "طلب", type: "chapter" },
    ],
  },
  {
    id: "bab-5",
    title: "باب نمبر 5: رسد",
    type: "unit",
    chapters: [
      { id: "5", code: "5", title: "رسد", type: "chapter" },
    ],
  },
  {
    id: "bab-6",
    title: "باب نمبر 6: منڈی کا توازن",
    type: "unit",
    chapters: [
      { id: "6", code: "6", title: "منڈی کا توازن", type: "chapter" },
    ],
  },
  {
    id: "bab-7",
    title: "باب نمبر 7: نظریہ پیدائشِ دولت",
    type: "unit",
    chapters: [
      { id: "7", code: "7", title: "نظریہ پیدائشِ دولت", type: "chapter" },
    ],
  },
  {
    id: "bab-8",
    title: "باب نمبر 8: پیمانہ پیدائش اور قوانین حاصل",
    type: "unit",
    chapters: [
      { id: "8", code: "8", title: "پیمانہ پیدائش اور قوانین حاصل", type: "chapter" },
    ],
  },
  {
    id: "bab-9",
    title: "باب نمبر 9: مصارف پیدائش",
    type: "unit",
    chapters: [
      { id: "9", code: "9", title: "مصارف پیدائش", type: "chapter" },
    ],
  },
  {
    id: "bab-10",
    title: "باب نمبر 10: وصولیوں کا تجزیہ",
    type: "unit",
    chapters: [
      { id: "10", code: "10", title: "وصولیوں کا تجزیہ", type: "chapter" },
    ],
  },
  {
    id: "bab-11",
    title: "باب نمبر 11: منڈی",
    type: "unit",
    chapters: [
      { id: "11", code: "11", title: "منڈی", type: "chapter" },
    ],
  },
  {
    id: "bab-12",
    title: "باب نمبر 12: تقسیم۔ عاملین پیدائش کے معاوضوں کا تعین",
    type: "unit",
    chapters: [
      { id: "12", code: "12", title: "تقسیم۔ عاملین پیدائش کے معاوضوں کا تعین", type: "chapter" },
    ],
  },
];

export const SYLLABUS_METADATA = {
  subject: "Economics (معاشیات)",
  class: "INTER-I",
  board: "PTB",
  totalUnits: 12,
  totalChapters: 12,
  language: "Urdu",
};

export function getAllChapters(): Chapter[] {
  return PTB_INTER1_ECONOMICS.flatMap((u) => u.chapters);
}

export function getTotalChapterCount(): number {
  return getAllChapters().length;
}

export function getChaptersByUnit(unitId: string): Chapter[] {
  return PTB_INTER1_ECONOMICS.find((u) => u.id === unitId)?.chapters || [];
}

export function getUnitByChapterId(chapterId: string): Unit | undefined {
  return PTB_INTER1_ECONOMICS.find((u) => 
    u.chapters.some((ch) => ch.id === chapterId)
  );
}
