/**
 * PTB Class 6 - اخلاقیات (Ethics) - Complete Syllabus
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

export const PTB_CLASS6_AKHLAQIYAT: Unit[] = [
  {
    id: "bab-1",
    title: "باب نمبر 1: مذاہب کا تعارف",
    type: "unit",
    chapters: [
      { id: "1.1", code: "1.1", title: "انسانیت کی تعمیر", type: "unit" },
      { id: "1.2", code: "1.2", title: "اخلاقی کہانیاں (ادھوری خواہش، شکر گزاری)", type: "unit" },
      { id: "1.3", code: "1.3", title: "اخلاقی کہانیاں (ہیں لوگ وہی جہاں میں اچھے، ظلم کا بدلہ، دوسروں کے لیے جینا)", type: "unit" },
      { id: "1.4", code: "1.4", title: "نظمیں", type: "unit" }
    ]
  },
  {
    id: "bab-2",
    title: "باب نمبر 2: سکھ مذہب",
    type: "unit",
    chapters: [
      { id: "2.1", code: "2.1", title: "سکھ مذہب کا تعارف", type: "unit" },
      { id: "2.2", code: "2.2", title: "سکھ مذہب کیسے پھیلا", type: "unit" },
      { id: "2.3", code: "2.3", title: "گورونانک صاحب دیوجی اور ان کی تعلیمات", type: "unit" },
      { id: "2.4", code: "2.4", title: "سکھ مذہب کے گورو", type: "unit" }
    ]
  },
  {
    id: "bab-3",
    title: "باب نمبر 3: پاکستان میں مذہبی تہوار",
    type: "unit",
    chapters: [
      { id: "3.1", code: "3.1", title: "پاکستان میں مذہبی تہوار", type: "unit" }
    ]
  },
  {
    id: "bab-4",
    title: "باب نمبر 4: اخلاقی اقدار",
    type: "unit",
    chapters: [
      { id: "4.1", code: "4.1", title: "بچہ ۔۔۔۔۔۔ خاندان کی آنکھوں کا تارا", type: "unit" },
      { id: "4.2", code: "4.2", title: "گھر کی سانجھ", type: "unit" },
      { id: "4.3", code: "4.3", title: "برابری", type: "unit" },
      { id: "4.4", code: "4.4", title: "احترامِ آدمیت", type: "unit" },
      { id: "4.5", code: "4.5", title: "قاعدے قانون کی بات", type: "unit" },
      { id: "4.6", code: "4.6", title: "ٹریفک قوانین", type: "unit" }
    ]
  },
  {
    id: "bab-5",
    title: "باب نمبر 5: زندگی کے آداب",
    type: "unit",
    chapters: [
      { id: "5.1", code: "5.1", title: "کھانے پینے کے آداب", type: "unit" }
    ]
  },
  {
    id: "bab-6",
    title: "باب نمبر 6: مشاہیر",
    type: "unit",
    chapters: [
      { id: "6.1", code: "6.1", title: "مشاہیر", type: "unit" }
    ]
  }
];

export function getAllChapters(): Chapter[] {
  return PTB_CLASS6_AKHLAQIYAT.flatMap(unit => unit.chapters);
}
export function getChaptersByUnit(unitId: string): Chapter[] {
  const unit = PTB_CLASS6_AKHLAQIYAT.find(u => u.id === unitId);
  return unit ? unit.chapters : [];
}
export function getChapterById(chapterId: string): Chapter | undefined {
  return getAllChapters().find(ch => ch.id === chapterId);
}
export function getTotalChapterCount(): number {
  return getAllChapters().length;
}
export const SYLLABUS_METADATA = {
  subject: "اخلاقیات (Ethics)",
  class: "6th",
  board: "PTB",
  totalUnits: 6,
  totalChapters: getTotalChapterCount(),
  language: "Urdu"
};
