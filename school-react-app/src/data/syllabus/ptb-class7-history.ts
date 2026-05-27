/**
 * PTB Class 7 History Syllabus
 * 5 chapters — text preserved exactly as provided
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

export const PTB_CLASS7_HISTORY: Unit[] = [
  {
    id: "chap-1",
    title: "CHAP 1: Middle Ages In Europe (500-1500 CE)",
    type: "unit",
    chapters: [
      { id: "1", code: "1", title: "Middle Ages In Europe (500-1500 CE)", type: "chapter" },
    ],
  },
  {
    id: "chap-2",
    title: "CHAP 2: Spread of Islam In Europe And Asia",
    type: "unit",
    chapters: [
      { id: "2", code: "2", title: "Spread of Islam in Europe And Asia", type: "chapter" },
    ],
  },
  {
    id: "chap-3",
    title: "CHAP 3: Muslim Dynasties and Crusades",
    type: "unit",
    chapters: [
      { id: "3", code: "3", title: "Muslim Dynasties and Crusades", type: "chapter" },
    ],
  },
  {
    id: "chap-4",
    title: "CHAP 4: Muslims in South Asia",
    type: "unit",
    chapters: [
      { id: "4", code: "4", title: "Muslims in South Asia", type: "chapter" },
    ],
  },
  {
    id: "chap-5",
    title: "CHAP 5: Modern Period in Europe",
    type: "unit",
    chapters: [
      { id: "5", code: "5", title: "Modern Period in Europe", type: "chapter" },
    ],
  },
];

export function getAllChapters(): Chapter[] {
  return PTB_CLASS7_HISTORY.flatMap((u) => u.chapters);
}
export function getChaptersByUnit(unitId: string): Chapter[] {
  return PTB_CLASS7_HISTORY.find((u) => u.id === unitId)?.chapters || [];
}
export function getUnitByChapterId(chapterId: string): Unit | undefined {
  return PTB_CLASS7_HISTORY.find((u) => u.chapters.some((ch) => ch.id === chapterId));
}
