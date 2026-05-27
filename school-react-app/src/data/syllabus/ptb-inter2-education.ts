/**
 * PTB Inter Part-II ایجوکیشن (Education) Syllabus
 * 5 chapters — Urdu text preserved exactly with RTL support
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

export const PTB_INTER2_EDUCATION: Unit[] = [
  {
    id: "chap-1",
    title: "Chapter 1: Education of Muslims in the Subcontinent",
    titleUrdu: "باب نمبر 1: برصغیر میں مسلمانوں کی تعلیم",
    type: "unit",
    chapters: [{ id: "1", code: "1", title: "Education of Muslims in the Subcontinent",               titleUrdu: "برصغیر میں مسلمانوں کی تعلیم",                         type: "chapter" }],
  },
  {
    id: "chap-2",
    title: "Chapter 2: British Education System in South Asia",
    titleUrdu: "باب نمبر 2: جنوبی ایشیا میں برطانوی نظام تعلیم",
    type: "unit",
    chapters: [{ id: "2", code: "2", title: "British Education System in South Asia",                  titleUrdu: "جنوبی ایشیا میں برطانوی نظام تعلیم",                    type: "chapter" }],
  },
  {
    id: "chap-3",
    title: "Chapter 3: Educational Policies and Plans of Pakistan",
    titleUrdu: "باب نمبر 3: پاکستان کی تعلیمی پالیسیاں اور منصوبے",
    type: "unit",
    chapters: [{ id: "3", code: "3", title: "Educational Policies and Plans of Pakistan",              titleUrdu: "پاکستان کی تعلیمی پالیسیاں اور منصوبے",                type: "chapter" }],
  },
  {
    id: "chap-4",
    title: "Chapter 4: Educational Problems of Pakistan",
    titleUrdu: "باب نمبر 4: پاکستان کے تعلیمی مسائل",
    type: "unit",
    chapters: [{ id: "4", code: "4", title: "Educational Problems of Pakistan",                        titleUrdu: "پاکستان کے تعلیمی مسائل",                              type: "chapter" }],
  },
  {
    id: "chap-5",
    title: "Chapter 5: Role of Various Organizations in Promotion of Education",
    titleUrdu: "باب نمبر 5: تعلیم کے فروغ کے لئے مختلف تنظیموں کا کردار",
    type: "unit",
    chapters: [{ id: "5", code: "5", title: "Role of Various Organizations in Promotion of Education", titleUrdu: "تعلیم کے فروغ کے لئے مختلف تنظیموں کا کردار",         type: "chapter" }],
  },
];

export function getAllChapters(): Chapter[] { return PTB_INTER2_EDUCATION.flatMap((u) => u.chapters); }
export function getChaptersByUnit(unitId: string): Chapter[] { return PTB_INTER2_EDUCATION.find((u) => u.id === unitId)?.chapters || []; }
export function getUnitByChapterId(chapterId: string): Unit | undefined { return PTB_INTER2_EDUCATION.find((u) => u.chapters.some((ch) => ch.id === chapterId)); }
