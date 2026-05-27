/**
 * PTB Class 10 معاشیات (Economics) Syllabus
 * Chapters 8–14 (continuation) — Urdu text preserved exactly with RTL support
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

export const PTB_CLASS10_ECONOMICS: Unit[] = [
  { id: "chap-8",  title: "Chapter 8: Basic Concepts of National Income",      titleUrdu: "باب نمبر 8: قومی آمدنی کے بنیادی تصورات",  type: "unit", chapters: [{ id: "8",  code: "8",  title: "Basic Concepts of National Income",     titleUrdu: "قومی آمدنی کے بنیادی تصورات",  type: "chapter" }] },
  { id: "chap-9",  title: "Chapter 9: Money",                                   titleUrdu: "باب نمبر 9: زر",                            type: "unit", chapters: [{ id: "9",  code: "9",  title: "Money",                                titleUrdu: "زر",                             type: "chapter" }] },
  { id: "chap-10", title: "Chapter 10: Bank",                                   titleUrdu: "باب نمبر 10: بنک",                          type: "unit", chapters: [{ id: "10", code: "10", title: "Bank",                                 titleUrdu: "بنک",                            type: "chapter" }] },
  { id: "chap-11", title: "Chapter 11: Trade",                                  titleUrdu: "باب نمبر 11: تجارت",                        type: "unit", chapters: [{ id: "11", code: "11", title: "Trade",                                titleUrdu: "تجارت",                          type: "chapter" }] },
  { id: "chap-12", title: "Chapter 12: Public Finance",                         titleUrdu: "باب نمبر 12: سرکاری مالیات",                type: "unit", chapters: [{ id: "12", code: "12", title: "Public Finance",                        titleUrdu: "سرکاری مالیات",                  type: "chapter" }] },
  { id: "chap-13", title: "Chapter 13: Economic Development",                   titleUrdu: "باب نمبر 13: معاشی ترقی",                   type: "unit", chapters: [{ id: "13", code: "13", title: "Economic Development",                   titleUrdu: "معاشی ترقی",                     type: "chapter" }] },
  { id: "chap-14", title: "Chapter 14: Economic System of Islam",               titleUrdu: "باب نمبر 14: اسلام کا معاشی نظام",         type: "unit", chapters: [{ id: "14", code: "14", title: "Economic System of Islam",               titleUrdu: "اسلام کا معاشی نظام",            type: "chapter" }] },
];

export function getAllChapters(): Chapter[] { return PTB_CLASS10_ECONOMICS.flatMap((u) => u.chapters); }
export function getChaptersByUnit(unitId: string): Chapter[] { return PTB_CLASS10_ECONOMICS.find((u) => u.id === unitId)?.chapters || []; }
export function getUnitByChapterId(chapterId: string): Unit | undefined { return PTB_CLASS10_ECONOMICS.find((u) => u.chapters.some((ch) => ch.id === chapterId)); }
