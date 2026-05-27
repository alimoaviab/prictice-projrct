/**
 * PTB Inter Part-I لائبریری سائنس (Library Science) Syllabus
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

export const PTB_INTER1_LIBRARY_SCIENCE: Unit[] = [
  { id: "chap-1", title: "Chapter 1: Library",                    titleUrdu: "باب نمبر 1: کتب خانہ",               type: "unit", chapters: [{ id: "1", code: "1", title: "Library",                    titleUrdu: "کتب خانہ",               type: "chapter" }] },
  { id: "chap-2", title: "Chapter 2: Art of Writing",             titleUrdu: "باب نمبر 2: فن تحریر",              type: "unit", chapters: [{ id: "2", code: "2", title: "Art of Writing",             titleUrdu: "فن تحریر",              type: "chapter" }] },
  { id: "chap-3", title: "Chapter 3: Library Material",           titleUrdu: "باب نمبر 3: لائبریری مواد",         type: "unit", chapters: [{ id: "3", code: "3", title: "Library Material",           titleUrdu: "لائبریری مواد",         type: "chapter" }] },
  { id: "chap-4", title: "Chapter 4: Writing of Libraries",       titleUrdu: "باب نمبر 4: کتب خانوں کی تحریر",   type: "unit", chapters: [{ id: "4", code: "4", title: "Writing of Libraries",       titleUrdu: "کتب خانوں کی تحریر",   type: "chapter" }] },
  { id: "chap-5", title: "Chapter 5: Information",                titleUrdu: "باب نمبر 5: انفارمیشن",             type: "unit", chapters: [{ id: "5", code: "5", title: "Information",                titleUrdu: "انفارمیشن",             type: "chapter" }] },
];

export function getAllChapters(): Chapter[] { return PTB_INTER1_LIBRARY_SCIENCE.flatMap((u) => u.chapters); }
export function getChaptersByUnit(unitId: string): Chapter[] { return PTB_INTER1_LIBRARY_SCIENCE.find((u) => u.id === unitId)?.chapters || []; }
export function getUnitByChapterId(chapterId: string): Unit | undefined { return PTB_INTER1_LIBRARY_SCIENCE.find((u) => u.chapters.some((ch) => ch.id === chapterId)); }
