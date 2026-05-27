/**
 * PTB Class 6 History Syllabus
 * 4 chapters
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

export const PTB_CLASS6_HISTORY: Unit[] = [
  {
    id: "chap-1",
    title: "CHAP 1: Ancient Civilizations",
    type: "unit",
    chapters: [
      { id: "1", code: "1", title: "Ancient civilizations", type: "chapter" },
    ],
  },
  {
    id: "chap-2",
    title: "CHAP 2: Persian, Greek and Roman civilizations",
    type: "unit",
    chapters: [
      { id: "2", code: "2", title: "Persian, Greek and Roman civilizations", type: "chapter" },
    ],
  },
  {
    id: "chap-3",
    title: "CHAP 3: Aryans, Kushans and Guptas",
    type: "unit",
    chapters: [
      { id: "3", code: "3", title: "Aryans, Kushans and Guptas", type: "chapter" },
    ],
  },
  {
    id: "chap-4",
    title: "CHAP 4: Rise of Islamic civilization",
    type: "unit",
    chapters: [
      { id: "4", code: "4", title: "Rise of Islamic civilization", type: "chapter" },
    ],
  },
];

export function getAllChapters(): Chapter[] {
  return PTB_CLASS6_HISTORY.flatMap((u) => u.chapters);
}
export function getChaptersByUnit(unitId: string): Chapter[] {
  return PTB_CLASS6_HISTORY.find((u) => u.id === unitId)?.chapters || [];
}
export function getUnitByChapterId(chapterId: string): Unit | undefined {
  return PTB_CLASS6_HISTORY.find((u) => u.chapters.some((ch) => ch.id === chapterId));
}
