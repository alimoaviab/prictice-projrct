/**
 * PTB Class 10 (TEN) - فزیکل ایجوکیشن (Physical Education) - Complete Syllabus
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

export const PTB_CLASS10_PHYSICAL_EDUCATION: Unit[] = [
  {
    id: "bab-1",
    title: "باب نمبر 1: فزیکل فٹنس",
    type: "unit",
    chapters: [
      { id: "1", code: "1", title: "فزیکل فٹنس", type: "chapter" },
    ],
  },
  {
    id: "bab-2",
    title: "باب نمبر 2: تفریحی اور چھوٹے رقبے کے کھیل",
    type: "unit",
    chapters: [
      { id: "2", code: "2", title: "تفریحی اور چھوٹے رقبے کے کھیل", type: "chapter" },
    ],
  },
  {
    id: "bab-3",
    title: "باب نمبر 3: قامتی نقائص کی اصلاحی ورزشیں",
    type: "unit",
    chapters: [
      { id: "3", code: "3", title: "قامتی نقائص کی اصلاحی ورزشیں", type: "chapter" },
    ],
  },
  {
    id: "bab-4",
    title: "باب نمبر 4: کھیلیں",
    type: "unit",
    chapters: [
      { id: "4", code: "4", title: "کھیلیں", type: "chapter" },
    ],
  },
  {
    id: "bab-5",
    title: "باب نمبر 5: اتھلیٹکس",
    type: "unit",
    chapters: [
      { id: "5", code: "5", title: "اتھلیٹکس", type: "chapter" },
    ],
  },
  {
    id: "bab-6",
    title: "باب نمبر 6: تفریحی مشاغل",
    type: "unit",
    chapters: [
      { id: "6", code: "6", title: "تفریحی کے مشاغل", type: "chapter" },
    ],
  },
  {
    id: "bab-7",
    title: "باب نمبر 7: معاشرے کی صحت",
    type: "unit",
    chapters: [
      { id: "7", code: "7", title: "معاشرے کی صحت", type: "chapter" },
    ],
  },
  {
    id: "bab-8",
    title: "باب نمبر 8: غذائیت",
    type: "unit",
    chapters: [
      { id: "8", code: "8", title: "غذائیت", type: "chapter" },
    ],
  },
];

export const SYLLABUS_METADATA = {
  subject: "فزیکل ایجوکیشن (Physical Education)",
  class: "10th",
  board: "PTB",
  totalUnits: 8,
  totalChapters: 8,
  language: "Urdu",
};

export function getAllChapters(): Chapter[] {
  return PTB_CLASS10_PHYSICAL_EDUCATION.flatMap((u) => u.chapters);
}

export function getTotalChapterCount(): number {
  return getAllChapters().length;
}

export function getChaptersByUnit(unitId: string): Chapter[] {
  return PTB_CLASS10_PHYSICAL_EDUCATION.find((u) => u.id === unitId)?.chapters || [];
}

export function getUnitByChapterId(chapterId: string): Unit | undefined {
  return PTB_CLASS10_PHYSICAL_EDUCATION.find((u) => 
    u.chapters.some((ch) => ch.id === chapterId)
  );
}
