/**
 * PTB Class 5 General Science Syllabus
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

export const PTB_CLASS5_GENERAL_SCIENCE: Unit[] = [
  {
    id: "chap-1",
    title: "CHAP 1: Classification of Living Organisms",
    type: "unit",
    chapters: [
      { id: "1.1", code: "1.1", title: "Classification of Living Organisms", type: "chapter" },
    ],
  },
  {
    id: "chap-2",
    title: "CHAP 2: Microorganisms",
    type: "unit",
    chapters: [
      { id: "2.1", code: "2.1", title: "Microorganisms", type: "chapter" },
    ],
  },
  {
    id: "chap-3",
    title: "CHAP 3: Flowers and Seeds",
    type: "unit",
    chapters: [
      { id: "3.1", code: "3.1", title: "Flowers and Seeds", type: "chapter" },
    ],
  },
  {
    id: "chap-4",
    title: "CHAP 4: Environmental Pollution",
    type: "unit",
    chapters: [
      { id: "4.1", code: "4.1", title: "Environmental Pollution", type: "chapter" },
    ],
  },
  {
    id: "chap-5",
    title: "CHAP 5: Physical and Chemical Changes of Matter",
    type: "unit",
    chapters: [
      { id: "5.1", code: "5.1", title: "Physical and Chemical Changes of Matter", type: "chapter" },
    ],
  },
  {
    id: "chap-6",
    title: "CHAP 6: Light and Sound",
    type: "unit",
    chapters: [
      { id: "6.1", code: "6.1", title: "Light and Sound", type: "chapter" },
    ],
  },
  {
    id: "chap-7",
    title: "CHAP 7: Electricity and Magnetism",
    type: "unit",
    chapters: [
      { id: "7.1", code: "7.1", title: "Electricity and Magnetism", type: "chapter" },
    ],
  },
  {
    id: "chap-8",
    title: "CHAP 8: Structure of the Earth",
    type: "unit",
    chapters: [
      { id: "8.1", code: "8.1", title: "Structure of the Earth", type: "chapter" },
    ],
  },
  {
    id: "chap-9",
    title: "CHAP 9: Space and Satellites",
    type: "unit",
    chapters: [
      { id: "9.1", code: "9.1", title: "Space and Satellites", type: "chapter" },
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
  return PTB_CLASS5_GENERAL_SCIENCE.flatMap((unit) => unit.chapters);
}

// Helper function to get chapters by unit
export function getChaptersByUnit(unitId: string): Chapter[] {
  const unit = PTB_CLASS5_GENERAL_SCIENCE.find((u) => u.id === unitId);
  return unit?.chapters || [];
}

// Helper function to get unit by chapter ID
export function getUnitByChapterId(chapterId: string): Unit | undefined {
  return PTB_CLASS5_GENERAL_SCIENCE.find((unit) =>
    unit.chapters.some((ch) => ch.id === chapterId)
  );
}
