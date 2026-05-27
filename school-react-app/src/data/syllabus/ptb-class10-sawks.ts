/**
 * PTB Class 10 سوکس (Civics) Syllabus
 * Chapters 6–10 (continuation) — Urdu text preserved exactly with RTL support
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

export const PTB_CLASS10_SAWKS: Unit[] = [
  { id: "chap-6",  title: "Chapter 6: Rights and Duties",                              titleUrdu: "باب نمبر 6: حقوق و فرائض",                        type: "unit", chapters: [{ id: "6",  code: "6",  title: "Rights and Duties",                              titleUrdu: "حقوق و فرائض",                       type: "chapter" }] },
  { id: "chap-7",  title: "Chapter 7: Ideology of Pakistan and Pakistan Movement",     titleUrdu: "باب نمبر 7: نظریہ پاکستان اور تحریک پاکستان",   type: "unit", chapters: [{ id: "7",  code: "7",  title: "Ideology of Pakistan and Pakistan Movement",     titleUrdu: "نظریہ پاکستان اور تحریک پاکستان",  type: "chapter" }] },
  { id: "chap-8",  title: "Chapter 8: Constitutional Development in Pakistan",         titleUrdu: "باب نمبر 8: پاکستان میں آئینی ارتقاء",           type: "unit", chapters: [{ id: "8",  code: "8",  title: "Constitutional Development in Pakistan",         titleUrdu: "پاکستان میں آئینی ارتقاء",           type: "chapter" }] },
  { id: "chap-9",  title: "Chapter 9: Local Governments in Pakistan",                  titleUrdu: "باب نمبر 9: پاکستان میں مقامی حکومتیں",          type: "unit", chapters: [{ id: "9",  code: "9",  title: "Local Governments in Pakistan",                  titleUrdu: "پاکستان میں مقامی حکومتیں",          type: "chapter" }] },
  { id: "chap-10", title: "Chapter 10: Pakistan and Its Neighbouring Countries",       titleUrdu: "باب نمبر 10: پاکستان اور اس کے ہمسایہ ممالک",   type: "unit", chapters: [{ id: "10", code: "10", title: "Pakistan and Its Neighbouring Countries",       titleUrdu: "پاکستان اور اس کے ہمسایہ ممالک",   type: "chapter" }] },
];

export function getAllChapters(): Chapter[] { return PTB_CLASS10_SAWKS.flatMap((u) => u.chapters); }
export function getChaptersByUnit(unitId: string): Chapter[] { return PTB_CLASS10_SAWKS.find((u) => u.id === unitId)?.chapters || []; }
export function getUnitByChapterId(chapterId: string): Unit | undefined { return PTB_CLASS10_SAWKS.find((u) => u.chapters.some((ch) => ch.id === chapterId)); }
