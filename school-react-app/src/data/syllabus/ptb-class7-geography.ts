/**
 * PTB Class 7 Geography Syllabus
 * 6 chapters — spellings preserved exactly as provided
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

export const PTB_CLASS7_GEOGRAPHY: Unit[] = [
  {
    id: "chap-1",
    title: "CHAP 1: Plains and Rivers",
    type: "unit",
    chapters: [
      { id: "1", code: "1", title: "Plains and Rivers", type: "chapter" },
    ],
  },
  {
    id: "chap-2",
    title: "CHAP 2: Water Sources and Management",
    type: "unit",
    chapters: [
      { id: "2", code: "2", title: "Water Sources and management", type: "chapter" },
    ],
  },
  {
    id: "chap-3",
    title: "CHAP 3: Sattlements and Land use",
    type: "unit",
    chapters: [
      { id: "3", code: "3", title: "Sattlements and Land Use", type: "chapter" },
    ],
  },
  {
    id: "chap-4",
    title: "CHAP 4: Agriculture",
    type: "unit",
    chapters: [
      { id: "4", code: "4", title: "Agriculture", type: "chapter" },
    ],
  },
  {
    id: "chap-5",
    title: "CHAP 5: Climate Change",
    type: "unit",
    chapters: [
      { id: "5", code: "5", title: "Climate Change", type: "chapter" },
    ],
  },
  {
    id: "chap-6",
    title: "CHAP 6: Minerals and Powers",
    type: "unit",
    chapters: [
      { id: "6", code: "6", title: "Minerals and Powers", type: "chapter" },
    ],
  },
];

export function getAllChapters(): Chapter[] {
  return PTB_CLASS7_GEOGRAPHY.flatMap((u) => u.chapters);
}
export function getChaptersByUnit(unitId: string): Chapter[] {
  return PTB_CLASS7_GEOGRAPHY.find((u) => u.id === unitId)?.chapters || [];
}
export function getUnitByChapterId(chapterId: string): Unit | undefined {
  return PTB_CLASS7_GEOGRAPHY.find((u) => u.chapters.some((ch) => ch.id === chapterId));
}
