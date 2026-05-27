/**
 * PTB Class 6 - زرعی تعلیم (Agriculture Education) - Complete Syllabus
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

export const PTB_CLASS6_AGRICULTURE: Unit[] = [
  {
    id: "bab-1",
    title: "باب نمبر 1: زیبائشی پودوں کی افزائش",
    type: "unit",
    chapters: [{ id: "1.1", code: "1", title: "زیبائشی پودوں کی افزائش", type: "unit" }]
  },
  {
    id: "bab-2",
    title: "باب نمبر 2: مختلف ماحول میں پودوں کی نشوونما کا مطالعہ",
    type: "unit",
    chapters: [{ id: "2.1", code: "2", title: "مختلف ماحول میں پودوں کی نشوونما کا مطالعہ", type: "unit" }]
  },
  {
    id: "bab-3",
    title: "باب نمبر 3: فصلوں اور سبزیوں سے جڑی بوٹیوں کی تلفی",
    type: "unit",
    chapters: [{ id: "3.1", code: "3", title: "فصلوں اور سبزیوں سے جڑی بوٹیوں کی تلفی", type: "unit" }]
  },
  {
    id: "bab-4",
    title: "باب نمبر 4: مٹی کا مطالعہ",
    type: "unit",
    chapters: [{ id: "4.1", code: "4", title: "مٹی کا مطالعہ", type: "unit" }]
  },
  {
    id: "bab-5",
    title: "باب نمبر 5: مفید جانوروں اور پرندوں کی پرورش",
    type: "unit",
    chapters: [{ id: "5.1", code: "5", title: "مفید جانوروں اور پرندوں کی پرورش", type: "unit" }]
  }
];

export function getAllChapters(): Chapter[] {
  return PTB_CLASS6_AGRICULTURE.flatMap(unit => unit.chapters);
}
export function getChaptersByUnit(unitId: string): Chapter[] {
  const unit = PTB_CLASS6_AGRICULTURE.find(u => u.id === unitId);
  return unit ? unit.chapters : [];
}
export function getChapterById(chapterId: string): Chapter | undefined {
  return getAllChapters().find(ch => ch.id === chapterId);
}
export function getTotalChapterCount(): number {
  return getAllChapters().length;
}
export const SYLLABUS_METADATA = {
  subject: "زرعی تعلیم (Agriculture Education)",
  class: "6th",
  board: "PTB",
  totalUnits: 5,
  totalChapters: getTotalChapterCount(),
  language: "Urdu"
};
