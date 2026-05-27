/**
 * PTB Class 6 - ہوم اکنامکس (Home Economics) - Complete Syllabus
 * Source: Punjab Textbook Board
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

export const PTB_CLASS6_HOME_ECONOMICS: Unit[] = [
  {
    id: "bab-1",
    title: "باب نمبر 1: ہوم اکنامکس کا تعارف",
    type: "unit",
    chapters: [{ id: "1.1", code: "1.1", title: "ہوم اکنامکس کا تعارف", type: "unit" }]
  },
  {
    id: "bab-2",
    title: "باب نمبر 2: غذا اور غذائیت ۔ ایک تعارف",
    type: "unit",
    chapters: [{ id: "2.1", code: "2.1", title: "غذا اور غذائیت ۔ ایک تعارف", type: "unit" }]
  },
  {
    id: "bab-3",
    title: "باب نمبر 3: بنیادی غذائی اجزا",
    type: "unit",
    chapters: [{ id: "3.1", code: "3.1", title: "بنیادی غذائی اجزا", type: "unit" }]
  },
  {
    id: "bab-4",
    title: "باب نمبر 4: انسانی نشوونما",
    type: "unit",
    chapters: [{ id: "4.1", code: "4.1", title: "انسانی نشوونما", type: "unit" }]
  },
  {
    id: "bab-5",
    title: "باب نمبر 5: معاشرتی کھیل",
    type: "unit",
    chapters: [{ id: "5.1", code: "5.1", title: "معاشرتی کھیل", type: "unit" }]
  },
  {
    id: "bab-6",
    title: "باب نمبر 6: لباس",
    type: "unit",
    chapters: [{ id: "6.1", code: "6.1", title: "لباس", type: "unit" }]
  },
  {
    id: "bab-7",
    title: "باب نمبر 7: ذاتی زیبائش",
    type: "unit",
    chapters: [{ id: "7.1", code: "7.1", title: "ذاتی زیبائش", type: "unit" }]
  },
  {
    id: "bab-8",
    title: "باب نمبر 8: آرٹ اور ڈیزائن",
    type: "unit",
    chapters: [{ id: "8.1", code: "8.1", title: "آرٹ اور ڈیزائن", type: "unit" }]
  },
  {
    id: "bab-9",
    title: "باب نمبر 9: انتظام امور خانہ داری",
    type: "unit",
    chapters: [{ id: "9.1", code: "9.1", title: "انتظام امور خانہ داری", type: "unit" }]
  },
  {
    id: "bab-10",
    title: "باب نمبر 10: ذرائع ووسائل",
    type: "unit",
    chapters: [{ id: "10.1", code: "10.1", title: "ذرائع ووسائل", type: "unit" }]
  }
];

export function getAllChapters(): Chapter[] {
  return PTB_CLASS6_HOME_ECONOMICS.flatMap(unit => unit.chapters);
}
export function getChaptersByUnit(unitId: string): Chapter[] {
  const unit = PTB_CLASS6_HOME_ECONOMICS.find(u => u.id === unitId);
  return unit ? unit.chapters : [];
}
export function getChapterById(chapterId: string): Chapter | undefined {
  return getAllChapters().find(ch => ch.id === chapterId);
}
export function getTotalChapterCount(): number {
  return getAllChapters().length;
}
export const SYLLABUS_METADATA = {
  subject: "ہوم اکنامکس (Home Economics)",
  class: "6th",
  board: "PTB",
  totalUnits: 10,
  totalChapters: getTotalChapterCount(),
  language: "Urdu"
};
