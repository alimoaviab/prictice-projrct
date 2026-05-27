/**
 * PTB Inter Part-I ایجوکیشن (Education) Syllabus
 * 8 chapters — Urdu text preserved exactly with RTL support
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

export const PTB_INTER1_EDUCATION: Unit[] = [
  { id: "chap-1", title: "Chapter 1: Education",                                   titleUrdu: "باب نمبر 1: تعلیم",                                  type: "unit", chapters: [{ id: "1", code: "1", title: "Education",                                    titleUrdu: "تعلیم",                                 type: "chapter" }] },
  { id: "chap-2", title: "Chapter 2: Objectives of Education",                     titleUrdu: "باب نمبر 2: مقاصد تعلیم",                            type: "unit", chapters: [{ id: "2", code: "2", title: "Objectives of Education",                     titleUrdu: "مقاصد تعلیم",                          type: "chapter" }] },
  { id: "chap-3", title: "Chapter 3: Foundations of Education",                    titleUrdu: "باب نمبر 3: تعلیم کی بنیادیں",                      type: "unit", chapters: [{ id: "3", code: "3", title: "Foundations of Education",                    titleUrdu: "تعلیم کی بنیادیں",                     type: "chapter" }] },
  { id: "chap-4", title: "Chapter 4: Human Development",                           titleUrdu: "باب نمبر 4: انسانی نشوونما",                         type: "unit", chapters: [{ id: "4", code: "4", title: "Human Development",                           titleUrdu: "انسانی نشوونما",                        type: "chapter" }] },
  { id: "chap-5", title: "Chapter 5: Learning",                                    titleUrdu: "باب نمبر 5: تعلّم",                                  type: "unit", chapters: [{ id: "5", code: "5", title: "Learning",                                    titleUrdu: "تعلّم",                                 type: "chapter" }] },
  { id: "chap-6", title: "Chapter 6: Society, Community and Education",            titleUrdu: "باب نمبر 6: معاشرہ، کمیونٹی اور تعلیم",             type: "unit", chapters: [{ id: "6", code: "6", title: "Society, Community and Education",            titleUrdu: "معاشرہ، کمیونٹی اور تعلیم",            type: "chapter" }] },
  { id: "chap-7", title: "Chapter 7: Guidance and Counselling",                    titleUrdu: "باب نمبر 7: رہنمائی اور مشاورت",                     type: "unit", chapters: [{ id: "7", code: "7", title: "Guidance and Counselling",                    titleUrdu: "رہنمائی اور مشاورت",                   type: "chapter" }] },
  { id: "chap-8", title: "Chapter 8: Curriculum, Syllabus and Textbooks",          titleUrdu: "باب نمبر 8: نصاب، سلیبس اور درسی کتب",              type: "unit", chapters: [{ id: "8", code: "8", title: "Curriculum, Syllabus and Textbooks",          titleUrdu: "نصاب، سلیبس اور درسی کتب",             type: "chapter" }] },
];

export function getAllChapters(): Chapter[] { return PTB_INTER1_EDUCATION.flatMap((u) => u.chapters); }
export function getChaptersByUnit(unitId: string): Chapter[] { return PTB_INTER1_EDUCATION.find((u) => u.id === unitId)?.chapters || []; }
export function getUnitByChapterId(chapterId: string): Unit | undefined { return PTB_INTER1_EDUCATION.find((u) => u.chapters.some((ch) => ch.id === chapterId)); }
