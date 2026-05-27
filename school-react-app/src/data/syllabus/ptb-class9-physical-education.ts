/**
 * PTB Class 9 - فزیکل ایجوکیشن (Physical Education) - Complete Syllabus
 * Source: Punjab Textbook Board
 * 
 * Subject: فزیکل ایجوکیشن (Physical Education)
 * Class: 9th
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

export const PTB_CLASS9_PHYSICAL_EDUCATION: Unit[] = [
  {
    id: "bab-1",
    title: "باب نمبر 1: تعلیم جسمانی کی تعریف",
    type: "unit",
    chapters: [
      {
        id: "1.1",
        code: "1",
        title: "تعلیم جسمانی کی تعریف",
        type: "unit"
      }
    ]
  },
  {
    id: "bab-2",
    title: "باب نمبر 2: حرکات",
    type: "unit",
    chapters: [
      {
        id: "2.1",
        code: "2",
        title: "حرکات",
        type: "unit"
      }
    ]
  },
  {
    id: "bab-3",
    title: "باب نمبر 3: تعلیمی جمناسٹک",
    type: "unit",
    chapters: [
      {
        id: "3.1",
        code: "3",
        title: "تعلیمی جمناسٹک",
        type: "unit"
      }
    ]
  },
  {
    id: "bab-4",
    title: "باب نمبر 4: قامت",
    type: "unit",
    chapters: [
      {
        id: "4.1",
        code: "4",
        title: "قامت",
        type: "unit"
      }
    ]
  },
  {
    id: "bab-5",
    title: "باب نمبر 5: منظم کھیلیں",
    type: "unit",
    chapters: [
      {
        id: "5.1",
        code: "5",
        title: "منظم کھیل",
        type: "unit"
      }
    ]
  },
  {
    id: "bab-6",
    title: "باب نمبر 6: اتھلیٹکس کے قوانین اور بنیادی مہارتیں",
    type: "unit",
    chapters: [
      {
        id: "6.1",
        code: "6",
        title: "اتھلیٹکس کے قوانین اور بنیادی مہارتیں",
        type: "unit"
      }
    ]
  },
  {
    id: "bab-7",
    title: "باب نمبر 7: علم الصحت اور اس کی وسعت",
    type: "unit",
    chapters: [
      {
        id: "7.1",
        code: "7",
        title: "علم الصحت اور اس کی وسعت",
        type: "unit"
      }
    ]
  },
  {
    id: "bab-8",
    title: "باب نمبر 8: شخصی حفظان صحت",
    type: "unit",
    chapters: [
      {
        id: "8.1",
        code: "8",
        title: "شخصی حفظان صحت",
        type: "unit"
      }
    ]
  },
  {
    id: "bab-9",
    title: "باب نمبر 9: جسم کے حرکاتی کل پرزے",
    type: "unit",
    chapters: [
      {
        id: "9.1",
        code: "9",
        title: "جسم کے حرکاتی کل پرزے",
        type: "unit"
      }
    ]
  }
];

/**
 * Get all chapters as a flat array
 */
export function getAllChapters(): Chapter[] {
  return PTB_CLASS9_PHYSICAL_EDUCATION.flatMap(unit => unit.chapters);
}

/**
 * Get chapters by unit ID
 */
export function getChaptersByUnit(unitId: string): Chapter[] {
  const unit = PTB_CLASS9_PHYSICAL_EDUCATION.find(u => u.id === unitId);
  return unit ? unit.chapters : [];
}

/**
 * Get chapter by ID
 */
export function getChapterById(chapterId: string): Chapter | undefined {
  return getAllChapters().find(ch => ch.id === chapterId);
}

/**
 * Get total chapter count
 */
export function getTotalChapterCount(): number {
  return getAllChapters().length;
}

/**
 * Syllabus metadata
 */
export const SYLLABUS_METADATA = {
  subject: "فزیکل ایجوکیشن (Physical Education)",
  class: "9th",
  board: "PTB",
  totalUnits: 9,
  totalChapters: getTotalChapterCount(),
  language: "Urdu"
};
