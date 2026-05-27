/**
 * PTB Class 10 Biology Syllabus
 * Chapters 12–22 (continuation from Class 9)
 * 
 * NOTE: This is a placeholder structure.
 * Please update with actual PTB Class 10 Biology syllabus data.
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

export const PTB_CLASS10_BIOLOGY: Unit[] = [
  {
    id: "chap-12",
    title: "CHAP 12: [PLACEHOLDER - Update with actual chapter title]",
    type: "unit",
    chapters: [
      { id: "12.1", code: "12.1", title: "[PLACEHOLDER - Update with actual topics]", type: "chapter" },
    ],
  },
  {
    id: "chap-13",
    title: "CHAP 13: [PLACEHOLDER - Update with actual chapter title]",
    type: "unit",
    chapters: [
      { id: "13.1", code: "13.1", title: "[PLACEHOLDER - Update with actual topics]", type: "chapter" },
    ],
  },
  {
    id: "chap-14",
    title: "CHAP 14: [PLACEHOLDER - Update with actual chapter title]",
    type: "unit",
    chapters: [
      { id: "14.1", code: "14.1", title: "[PLACEHOLDER - Update with actual topics]", type: "chapter" },
    ],
  },
  {
    id: "chap-15",
    title: "CHAP 15: [PLACEHOLDER - Update with actual chapter title]",
    type: "unit",
    chapters: [
      { id: "15.1", code: "15.1", title: "[PLACEHOLDER - Update with actual topics]", type: "chapter" },
    ],
  },
  {
    id: "chap-16",
    title: "CHAP 16: [PLACEHOLDER - Update with actual chapter title]",
    type: "unit",
    chapters: [
      { id: "16.1", code: "16.1", title: "[PLACEHOLDER - Update with actual topics]", type: "chapter" },
    ],
  },
  {
    id: "chap-17",
    title: "CHAP 17: [PLACEHOLDER - Update with actual chapter title]",
    type: "unit",
    chapters: [
      { id: "17.1", code: "17.1", title: "[PLACEHOLDER - Update with actual topics]", type: "chapter" },
    ],
  },
  {
    id: "chap-18",
    title: "CHAP 18: [PLACEHOLDER - Update with actual chapter title]",
    type: "unit",
    chapters: [
      { id: "18.1", code: "18.1", title: "[PLACEHOLDER - Update with actual topics]", type: "chapter" },
    ],
  },
  {
    id: "chap-19",
    title: "CHAP 19: [PLACEHOLDER - Update with actual chapter title]",
    type: "unit",
    chapters: [
      { id: "19.1", code: "19.1", title: "[PLACEHOLDER - Update with actual topics]", type: "chapter" },
    ],
  },
  {
    id: "chap-20",
    title: "CHAP 20: [PLACEHOLDER - Update with actual chapter title]",
    type: "unit",
    chapters: [
      { id: "20.1", code: "20.1", title: "[PLACEHOLDER - Update with actual topics]", type: "chapter" },
    ],
  },
  {
    id: "chap-21",
    title: "CHAP 21: [PLACEHOLDER - Update with actual chapter title]",
    type: "unit",
    chapters: [
      { id: "21.1", code: "21.1", title: "[PLACEHOLDER - Update with actual topics]", type: "chapter" },
    ],
  },
  {
    id: "chap-22",
    title: "CHAP 22: [PLACEHOLDER - Update with actual chapter title]",
    type: "unit",
    chapters: [
      { id: "22.1", code: "22.1", title: "[PLACEHOLDER - Update with actual topics]", type: "chapter" },
    ],
  },
];

export const SYLLABUS_METADATA = {
  subject: "Biology",
  class: "10th",
  board: "PTB",
  totalUnits: 11,
  totalChapters: 11,
  language: "English",
  status: "PLACEHOLDER - Needs actual syllabus data",
};

export function getAllChapters(): Chapter[] {
  return PTB_CLASS10_BIOLOGY.flatMap((u) => u.chapters);
}

export function getTotalChapterCount(): number {
  return getAllChapters().length;
}

export function getChaptersByUnit(unitId: string): Chapter[] {
  return PTB_CLASS10_BIOLOGY.find((u) => u.id === unitId)?.chapters || [];
}

export function getUnitByChapterId(chapterId: string): Unit | undefined {
  return PTB_CLASS10_BIOLOGY.find((u) => 
    u.chapters.some((ch) => ch.id === chapterId)
  );
}
