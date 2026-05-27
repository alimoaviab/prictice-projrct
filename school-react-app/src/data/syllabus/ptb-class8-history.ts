/**
 * PTB Class 8 History Syllabus
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

export const PTB_CLASS8_HISTORY: Unit[] = [
  {
    id: "chap-1",
    title: "CHAP 1: Arrival of The British In the Subcontinent",
    type: "unit",
    chapters: [
      { id: "1", code: "1", title: "Arrival of the British In the Subcontinent", type: "chapter" },
    ],
  },
  {
    id: "chap-2",
    title: "CHAP 2: Reform Movement In The Subcontinent",
    type: "unit",
    chapters: [
      { id: "2", code: "2", title: "Reform Movement In The Subcontinent", type: "chapter" },
    ],
  },
  {
    id: "chap-3",
    title: "CHAP 3: world Wars I and II",
    type: "unit",
    chapters: [
      { id: "3", code: "3", title: "World Wars I and II", type: "chapter" },
    ],
  },
  {
    id: "chap-4",
    title: "CHAP 4: Political Awakening In Subcontinent",
    type: "unit",
    chapters: [
      { id: "4", code: "4", title: "Political Awakening In Subcontinent", type: "chapter" },
    ],
  },
  {
    id: "chap-5",
    title: "CHAP 5: Pakistan A New Country: 1947 Till Today",
    type: "unit",
    chapters: [
      { id: "5", code: "5", title: "Pakistan A New Country: 1947 Till Today", type: "chapter" },
    ],
  },
];

export function getAllChapters(): Chapter[] {
  return PTB_CLASS8_HISTORY.flatMap((u) => u.chapters);
}
export function getChaptersByUnit(unitId: string): Chapter[] {
  return PTB_CLASS8_HISTORY.find((u) => u.id === unitId)?.chapters || [];
}
export function getUnitByChapterId(chapterId: string): Unit | undefined {
  return PTB_CLASS8_HISTORY.find((u) => u.chapters.some((ch) => ch.id === chapterId));
}
