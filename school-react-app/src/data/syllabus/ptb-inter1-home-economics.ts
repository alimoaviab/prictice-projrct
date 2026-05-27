/**
 * PTB Inter Part-I ہوم اکنامکس (Home Economics) Syllabus
 * 11 chapters — Urdu text preserved exactly with RTL support
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

export const PTB_INTER1_HOME_ECONOMICS: Unit[] = [
  { id: "chap-1",  title: "Chapter 1: Child Development",                                   titleUrdu: "باب نمبر 1: بچوں کی نشوونما",                                  type: "unit", chapters: [{ id: "1",  code: "1",  title: "Child Development",                                   titleUrdu: "بچوں کی نشوونما",                                 type: "chapter" }] },
  { id: "chap-2",  title: "Chapter 2: Self-Concept and Personality Development",            titleUrdu: "باب نمبر 2: ذات کا تصور اور شخصیت کی نشوونما",               type: "unit", chapters: [{ id: "2",  code: "2",  title: "Self-Concept and Personality Development",            titleUrdu: "ذات کا تصور اور شخصیت کی نشوونما",              type: "chapter" }] },
  { id: "chap-3",  title: "Chapter 3: Family and Mutual Relations of Family Members",       titleUrdu: "باب نمبر 3: خاندان اور افراد خانہ کے باہمی تعلقات",          type: "unit", chapters: [{ id: "3",  code: "3",  title: "Family and Mutual Relations of Family Members",       titleUrdu: "خاندان اور افراد خانہ کے باہمی تعلقات",         type: "chapter" }] },
  { id: "chap-4",  title: "Chapter 4: Understanding and Guiding Children",                 titleUrdu: "باب نمبر 4: بچوں کو سمجھنا اور ان کی رہنمائی کرنا",          type: "unit", chapters: [{ id: "4",  code: "4",  title: "Understanding and Guiding Children",                 titleUrdu: "بچوں کو سمجھنا اور ان کی رہنمائی کرنا",         type: "chapter" }] },
  { id: "chap-5",  title: "Chapter 5: Introduction and Objectives of Home Management",     titleUrdu: "باب نمبر 5: انتظام خانہ داری کا تعارف و مقاصد",               type: "unit", chapters: [{ id: "5",  code: "5",  title: "Introduction and Objectives of Home Management",     titleUrdu: "انتظام خانہ داری کا تعارف و مقاصد",              type: "chapter" }] },
  { id: "chap-6",  title: "Chapter 6: Resources and Means",                                titleUrdu: "باب نمبر 6: وسائل و ذرائع",                                   type: "unit", chapters: [{ id: "6",  code: "6",  title: "Resources and Means",                                titleUrdu: "وسائل و ذرائع",                                  type: "chapter" }] },
  { id: "chap-7",  title: "Chapter 7: Fatigue and Its Effects",                            titleUrdu: "باب نمبر 7: تھکن اور اس کے اثرات",                            type: "unit", chapters: [{ id: "7",  code: "7",  title: "Fatigue and Its Effects",                            titleUrdu: "تھکن اور اس کے اثرات",                           type: "chapter" }] },
  { id: "chap-8",  title: "Chapter 8: Income and Expenditure Estimate",                    titleUrdu: "باب نمبر 8: تخمینہ آمدنی اور خرچ",                           type: "unit", chapters: [{ id: "8",  code: "8",  title: "Income and Expenditure Estimate",                    titleUrdu: "تخمینہ آمدنی اور خرچ",                           type: "chapter" }] },
  { id: "chap-9",  title: "Chapter 9: Protection of Health",                               titleUrdu: "باب نمبر 9: صحت کی حفاظت",                                   type: "unit", chapters: [{ id: "9",  code: "9",  title: "Protection of Health",                               titleUrdu: "صحت کی حفاظت",                                   type: "chapter" }] },
  { id: "chap-10", title: "Chapter 10: First Aid at Home",                                 titleUrdu: "باب نمبر 10: گھر میں فوری طبی امداد",                        type: "unit", chapters: [{ id: "10", code: "10", title: "First Aid at Home",                                 titleUrdu: "گھر میں فوری طبی امداد",                         type: "chapter" }] },
  { id: "chap-11", title: "Chapter 11: Use of Principles of Art in the Home",              titleUrdu: "باب نمبر 11: گھر میں آرٹ کے اصولوں کا استعمال",              type: "unit", chapters: [{ id: "11", code: "11", title: "Use of Principles of Art in the Home",              titleUrdu: "گھر میں آرٹ کے اصولوں کا استعمال",              type: "chapter" }] },
];

export function getAllChapters(): Chapter[] { return PTB_INTER1_HOME_ECONOMICS.flatMap((u) => u.chapters); }
export function getChaptersByUnit(unitId: string): Chapter[] { return PTB_INTER1_HOME_ECONOMICS.find((u) => u.id === unitId)?.chapters || []; }
export function getUnitByChapterId(chapterId: string): Unit | undefined { return PTB_INTER1_HOME_ECONOMICS.find((u) => u.chapters.some((ch) => ch.id === chapterId)); }
