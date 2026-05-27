/**
 * PTB Inter Part-II سوکس (Civics) Syllabus
 * 6 chapters — Urdu text preserved exactly with RTL support
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

export const PTB_INTER2_SAWKS: Unit[] = [
  {
    id: "chap-1",
    title: "Chapter 1: Pakistan Movement",
    titleUrdu: "باب نمبر 1: تحریکِ پاکستان",
    type: "unit",
    chapters: [{ id: "1", code: "1", title: "Pakistan Movement",                                      titleUrdu: "تحریکِ پاکستان",                         type: "chapter" }],
  },
  {
    id: "chap-2",
    title: "Chapter 2: Constitutional Development 1947-73",
    titleUrdu: "باب نمبر 2: آئینی ارتقا 73-1947ء",
    type: "unit",
    chapters: [{ id: "2", code: "2", title: "Constitutional Development 1947-73",                    titleUrdu: "آئینی ارتقا 73-1947ء",                   type: "chapter" }],
  },
  {
    id: "chap-3",
    title: "Chapter 3: Social Services in Pakistan",
    titleUrdu: "باب نمبر 3: پاکستان میں معاشرتی خدمات",
    type: "unit",
    chapters: [{ id: "3", code: "3", title: "Social Services in Pakistan",                           titleUrdu: "پاکستان میں معاشرتی خدمات",               type: "chapter" }],
  },
  {
    id: "chap-4",
    title: "Chapter 4: Social Discipline in Pakistan",
    titleUrdu: "باب نمبر 4: پاکستان میں معاشرتی نظم و ضبط",
    type: "unit",
    chapters: [{ id: "4", code: "4", title: "Social Discipline in Pakistan",                         titleUrdu: "پاکستان میں معاشرتی نظم و ضبط",          type: "chapter" }],
  },
  {
    id: "chap-5",
    title: "Chapter 5: National Unity and Integrity",
    titleUrdu: "باب نمبر 5: قومی یکجہتی و سالمیت",
    type: "unit",
    chapters: [{ id: "5", code: "5", title: "National Unity and Integrity",                          titleUrdu: "قومی یکجہتی و سالمیت",                   type: "chapter" }],
  },
  {
    id: "chap-6",
    title: "Chapter 6: Islamic Republic of Pakistan and the World",
    titleUrdu: "باب نمبر 6: اسلامی جمہوریہ پاکستان اور دنیا",
    type: "unit",
    chapters: [{ id: "6", code: "6", title: "Islamic Republic of Pakistan and the World",            titleUrdu: "اسلامی جمہوریہ پاکستان اور دنیا",        type: "chapter" }],
  },
];

export function getAllChapters(): Chapter[] { return PTB_INTER2_SAWKS.flatMap((u) => u.chapters); }
export function getChaptersByUnit(unitId: string): Chapter[] { return PTB_INTER2_SAWKS.find((u) => u.id === unitId)?.chapters || []; }
export function getUnitByChapterId(chapterId: string): Unit | undefined { return PTB_INTER2_SAWKS.find((u) => u.chapters.some((ch) => ch.id === chapterId)); }
