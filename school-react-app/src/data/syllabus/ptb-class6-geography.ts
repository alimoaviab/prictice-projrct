/**
 * PTB Class 6 Geography Syllabus
 * 6 units
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

export const PTB_CLASS6_GEOGRAPHY: Unit[] = [
  {
    id: "unit-1",
    title: "UNIT 1: Structure of Earth and Types of Rocks",
    type: "unit",
    chapters: [
      { id: "1", code: "1", title: "Structure of Earth and Types of Rocks", type: "chapter" },
    ],
  },
  {
    id: "unit-2",
    title: "UNIT 2: Mountains, Plateaus and Valleys",
    type: "unit",
    chapters: [
      { id: "2", code: "2", title: "Mountains, Plateaus and Valleys", type: "chapter" },
    ],
  },
  {
    id: "unit-3",
    title: "UNIT 3: Climatic Regions of the World",
    type: "unit",
    chapters: [
      { id: "3", code: "3", title: "Climatic Regions of the World", type: "chapter" },
    ],
  },
  {
    id: "unit-4",
    title: "UNIT 4: Forests of The World",
    type: "unit",
    chapters: [
      { id: "4", code: "4", title: "Forest of the World", type: "chapter" },
    ],
  },
  {
    id: "unit-5",
    title: "UNIT 5: Natural Disasters",
    type: "unit",
    chapters: [
      { id: "5", code: "5", title: "Natural Disasters", type: "chapter" },
    ],
  },
  {
    id: "unit-6",
    title: "UNIT 6: Changing Earth And Human Activities",
    type: "unit",
    chapters: [
      { id: "6", code: "6", title: "Changing Earth And Human Activities", type: "chapter" },
    ],
  },
];

export function getAllChapters(): Chapter[] {
  return PTB_CLASS6_GEOGRAPHY.flatMap((u) => u.chapters);
}
export function getChaptersByUnit(unitId: string): Chapter[] {
  return PTB_CLASS6_GEOGRAPHY.find((u) => u.id === unitId)?.chapters || [];
}
export function getUnitByChapterId(chapterId: string): Unit | undefined {
  return PTB_CLASS6_GEOGRAPHY.find((u) => u.chapters.some((ch) => ch.id === chapterId));
}
