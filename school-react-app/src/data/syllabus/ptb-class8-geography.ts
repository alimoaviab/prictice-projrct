/**
 * PTB Class 8 Geography Syllabus
 * 6 chapters — text preserved exactly as provided
 * Note: CHAP 6 has no chapter number in source data
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

export const PTB_CLASS8_GEOGRAPHY: Unit[] = [
  {
    id: "chap-1",
    title: "CHAP 1: Oceans and seas",
    type: "unit",
    chapters: [
      { id: "1", code: "1", title: "Oceans and Seas", type: "chapter" },
    ],
  },
  {
    id: "chap-2",
    title: "CHAP 2: Living with Climate",
    type: "unit",
    chapters: [
      { id: "2", code: "2", title: "Living with Climate", type: "chapter" },
    ],
  },
  {
    id: "chap-3",
    title: "CHAP 3: Environmental Pollution",
    type: "unit",
    chapters: [
      { id: "3", code: "3", title: "Environmental Pollution", type: "chapter" },
    ],
  },
  {
    id: "chap-4",
    title: "CHAP 4: Industrialization and International Trade",
    type: "unit",
    chapters: [
      { id: "4", code: "4", title: "Industrialization and International Trade", type: "chapter" },
    ],
  },
  {
    id: "chap-5",
    title: "CHAP 5: Transport and Its Importance",
    type: "unit",
    chapters: [
      { id: "5", code: "5", title: "Transport and Its Importance", type: "chapter" },
    ],
  },
  {
    id: "chap-6",
    title: "CHAP 6: Social and Economic Development",
    type: "unit",
    chapters: [
      { id: "6", code: "6", title: "Social and Economic Development", type: "chapter" },
    ],
  },
];

export function getAllChapters(): Chapter[] {
  return PTB_CLASS8_GEOGRAPHY.flatMap((u) => u.chapters);
}
export function getChaptersByUnit(unitId: string): Chapter[] {
  return PTB_CLASS8_GEOGRAPHY.find((u) => u.id === unitId)?.chapters || [];
}
export function getUnitByChapterId(chapterId: string): Unit | undefined {
  return PTB_CLASS8_GEOGRAPHY.find((u) => u.chapters.some((ch) => ch.id === chapterId));
}
