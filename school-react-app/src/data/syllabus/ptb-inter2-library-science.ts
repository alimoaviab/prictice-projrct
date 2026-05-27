/**
 * PTB Inter Part-II لائبریری سائنس (Library Science) Syllabus
 * 4 chapters — Urdu text preserved exactly with RTL support
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

export const PTB_INTER2_LIBRARY_SCIENCE: Unit[] = [
  {
    id: "chap-1",
    title: "Chapter 1: Classification",
    titleUrdu: "باب نمبر 1: درجہ بندی",
    type: "unit",
    chapters: [
      { id: "1", code: "1", title: "Classification", titleUrdu: "درجہ بندی", type: "chapter" },
    ],
  },
  {
    id: "chap-2",
    title: "Chapter 2: Cataloguing",
    titleUrdu: "باب نمبر 2: کیٹلاگ سازی",
    type: "unit",
    chapters: [
      { id: "2", code: "2", title: "Cataloguing", titleUrdu: "کیٹلاگ سازی", type: "chapter" },
    ],
  },
  {
    id: "chap-3",
    title: "Chapter 3: Use of Reference Books",
    titleUrdu: "باب نمبر 3: حوالہ جاتی کتب کا استعمال",
    type: "unit",
    chapters: [
      { id: "3", code: "3", title: "Use of Reference Books", titleUrdu: "حوالہ جاتی کتب کا استعمال", type: "chapter" },
    ],
  },
  {
    id: "chap-4",
    title: "Chapter 4: Issue of Library Material",
    titleUrdu: "باب نمبر 4: لائبریری مواد کا اجرا",
    type: "unit",
    chapters: [
      { id: "4", code: "4", title: "Issue of Library Material", titleUrdu: "لائبریری مواد کا اجرا", type: "chapter" },
    ],
  },
];

export function getAllChapters(): Chapter[] {
  return PTB_INTER2_LIBRARY_SCIENCE.flatMap((u) => u.chapters);
}
export function getChaptersByUnit(unitId: string): Chapter[] {
  return PTB_INTER2_LIBRARY_SCIENCE.find((u) => u.id === unitId)?.chapters || [];
}
export function getUnitByChapterId(chapterId: string): Unit | undefined {
  return PTB_INTER2_LIBRARY_SCIENCE.find((u) => u.chapters.some((ch) => ch.id === chapterId));
}
