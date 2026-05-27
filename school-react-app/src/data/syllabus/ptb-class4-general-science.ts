/**
 * PTB Class 4 General Science Syllabus
 * Complete chapter structure
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

export const PTB_CLASS4_GENERAL_SCIENCE: Unit[] = [
  {
    id: "chap-1",
    title: "CHAP 1: Characteristics and Life Process of Organisms",
    type: "unit",
    chapters: [
      { id: "1.1", code: "1.1", title: "Characteristics and Life Process of Organisms", type: "chapter" },
    ],
  },
  {
    id: "chap-2",
    title: "CHAP 2: Ecosystem",
    type: "unit",
    chapters: [
      { id: "2.1", code: "2.1", title: "Ecosystem", type: "chapter" },
    ],
  },
  {
    id: "chap-3",
    title: "CHAP 3: Human Health",
    type: "unit",
    chapters: [
      { id: "3.1", code: "3.1", title: "Human Health", type: "chapter" },
    ],
  },
  {
    id: "chap-4",
    title: "CHAP 4: Matter and its Characteristics",
    type: "unit",
    chapters: [
      { id: "4.1", code: "4.1", title: "Matter and its Characteristics", type: "chapter" },
    ],
  },
  {
    id: "chap-5",
    title: "CHAP 5: Forms of Energy and Energy Transfer",
    type: "unit",
    chapters: [
      { id: "5.1", code: "5.1", title: "Forms of Energy and Energy Transfer", type: "chapter" },
    ],
  },
  {
    id: "chap-6",
    title: "CHAP 6: Force and Motion",
    type: "unit",
    chapters: [
      { id: "6.1", code: "6.1", title: "Force and Motion", type: "chapter" },
    ],
  },
  {
    id: "chap-7",
    title: "CHAP 7: Earth and its Resources",
    type: "unit",
    chapters: [
      { id: "7.1", code: "7.1", title: "Earth and its Resources", type: "chapter" },
    ],
  },
  {
    id: "chap-8",
    title: "CHAP 8: Earth's Weather and its Climate",
    type: "unit",
    chapters: [
      { id: "8.1", code: "8.1", title: "Earth's Weather and its Climate", type: "chapter" },
    ],
  },
  {
    id: "chap-9",
    title: "CHAP 9: Solar System and our Earth",
    type: "unit",
    chapters: [
      { id: "9.1", code: "9.1", title: "Solar System and our Earth", type: "chapter" },
    ],
  },
  {
    id: "chap-10",
    title: "CHAP 10: Technology in Everyday Life",
    type: "unit",
    chapters: [
      { id: "10.1", code: "10.1", title: "Technology in Everyday Life", type: "chapter" },
    ],
  },
];

// Helper function to get all chapters as flat list
export function getAllChapters(): Chapter[] {
  return PTB_CLASS4_GENERAL_SCIENCE.flatMap((unit) => unit.chapters);
}

// Helper function to get chapters by unit
export function getChaptersByUnit(unitId: string): Chapter[] {
  const unit = PTB_CLASS4_GENERAL_SCIENCE.find((u) => u.id === unitId);
  return unit?.chapters || [];
}

// Helper function to get unit by chapter ID
export function getUnitByChapterId(chapterId: string): Unit | undefined {
  return PTB_CLASS4_GENERAL_SCIENCE.find((unit) =>
    unit.chapters.some((ch) => ch.id === chapterId)
  );
}
