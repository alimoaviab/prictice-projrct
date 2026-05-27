/**
 * PTB Class 7 - زرعی تعلیم (Agriculture Education) - Complete Syllabus
 * Source: Punjab Textbook Board
 * 
 * Subject: زرعی تعلیم (Agriculture Education)
 * Class: 7th
 * Board: PTB (Punjab Textbook Board)
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

export const PTB_CLASS7_AGRICULTURE: Unit[] = [
  {
    id: "bab-1",
    title: "باب نمبر 1: پودوں کی نباتاتی و نسلی افزائش",
    type: "unit",
    chapters: [
      {
        id: "1.1",
        code: "1",
        title: "پودوں کی نباتاتی و نسلی افزائش",
        type: "unit"
      }
    ]
  },
  {
    id: "bab-2",
    title: "باب نمبر 2: سبزیوں کی کاشت",
    type: "unit",
    chapters: [
      {
        id: "2.1",
        code: "2",
        title: "سبزیوں کی کاشت",
        type: "unit"
      }
    ]
  },
  {
    id: "bab-3",
    title: "باب نمبر 3: ریشم کے کیڑوں کی پرورش",
    type: "unit",
    chapters: [
      {
        id: "3.1",
        code: "3",
        title: "ریشم کے کیڑوں کی پرورش",
        type: "unit"
      }
    ]
  },
  {
    id: "bab-4",
    title: "باب نمبر 4: شہد کی مکھیوں کی پرورش",
    type: "unit",
    chapters: [
      {
        id: "4.1",
        code: "4",
        title: "شہد کی مکھیوں کی پرورش",
        type: "unit"
      }
    ]
  },
  {
    id: "bab-5",
    title: "باب نمبر 5: مرغیوں اور بطخوں کی پرورش",
    type: "unit",
    chapters: [
      {
        id: "5.1",
        code: "5",
        title: "مرغیوں اور بطخوں کی پرورش",
        type: "unit"
      }
    ]
  },
  {
    id: "bab-6",
    title: "باب نمبر 6: خرگوش کی پرورش",
    type: "unit",
    chapters: [
      {
        id: "6.1",
        code: "6",
        title: "خرگوش کی پرورش",
        type: "unit"
      }
    ]
  },
  {
    id: "bab-7",
    title: "باب نمبر 7: سکوائش کی تیاری",
    type: "unit",
    chapters: [
      {
        id: "7.1",
        code: "7",
        title: "سکوائش کی تیاری",
        type: "unit"
      }
    ]
  }
];

export function getAllChapters(): Chapter[] {
  return PTB_CLASS7_AGRICULTURE.flatMap(unit => unit.chapters);
}

export function getChaptersByUnit(unitId: string): Chapter[] {
  const unit = PTB_CLASS7_AGRICULTURE.find(u => u.id === unitId);
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
  class: "7th",
  board: "PTB",
  totalUnits: 7,
  totalChapters: getTotalChapterCount(),
  language: "Urdu"
};
