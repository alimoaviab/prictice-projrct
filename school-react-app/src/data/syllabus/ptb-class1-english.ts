/**
 * PTB Class 1 English Syllabus
 * Complete chapter structure for ERP system
 */

export interface Chapter {
  id: string;
  code: string;
  title: string;
  type: "unit" | "review" | "section";
}

export interface Unit {
  id: string;
  title: string;
  type: "unit" | "review" | "section";
  chapters: Chapter[];
}

export const PTB_CLASS1_ENGLISH: Unit[] = [
  {
    id: "unit-1",
    title: "UNIT 1: Time to Recall",
    type: "unit",
    chapters: [
      { id: "1.1", code: "1.1", title: "Time to Recall", type: "unit" },
    ],
  },
  {
    id: "unit-2",
    title: "UNIT 2: My Family and I",
    type: "unit",
    chapters: [
      { id: "2.1", code: "2.1", title: "My Father and I", type: "unit" },
    ],
  },
  {
    id: "unit-3",
    title: "UNIT 3: Cobbler, Cobbler",
    type: "unit",
    chapters: [
      { id: "3.1", code: "3.1", title: "Cobbler, Cobbler", type: "unit" },
    ],
  },
  {
    id: "review-1",
    title: "REVIEW 1",
    type: "review",
    chapters: [
      { id: "review-1", code: "R1", title: "Review", type: "review" },
    ],
  },
  {
    id: "unit-4",
    title: "UNIT 4: Let's Have Fun!",
    type: "unit",
    chapters: [
      { id: "4.1", code: "4.1", title: "Let's have Fun!", type: "unit" },
    ],
  },
  {
    id: "unit-5",
    title: "UNIT 5: Sharing is Caring",
    type: "unit",
    chapters: [
      { id: "5.1", code: "5.1", title: "Sharing is Caring", type: "unit" },
    ],
  },
  {
    id: "review-2",
    title: "REVIEW 2",
    type: "review",
    chapters: [
      { id: "review-2", code: "R2", title: "Review", type: "review" },
    ],
  },
  {
    id: "unit-6",
    title: "UNIT 6: Blessings of Allah سبحان تعالیٰ",
    type: "unit",
    chapters: [
      { id: "6.1", code: "6.1", title: "Blessing of Allah سبحان تعالیٰ", type: "unit" },
    ],
  },
  {
    id: "unit-7",
    title: "UNIT 7: Classroom Manners",
    type: "unit",
    chapters: [
      { id: "7.1", code: "7.1", title: "Classroom Manners", type: "unit" },
    ],
  },
  {
    id: "unit-8",
    title: "UNIT 8: Nature is Beautiful",
    type: "unit",
    chapters: [
      { id: "8.1", code: "8.1", title: "Nature is Beautiful", type: "unit" },
    ],
  },
  {
    id: "review-3",
    title: "REVIEW 3",
    type: "review",
    chapters: [
      { id: "review-3", code: "R3", title: "Review", type: "review" },
    ],
  },
  {
    id: "unit-9",
    title: "UNIT 9: A Greeting Card",
    type: "unit",
    chapters: [
      { id: "9.1", code: "9.1", title: "A Greeting Card", type: "unit" },
    ],
  },
  {
    id: "unit-10",
    title: "UNIT 10: The Hare and the Tortoise",
    type: "unit",
    chapters: [
      { id: "10.1", code: "10.1", title: "The Hare and the Tortoise", type: "unit" },
    ],
  },
  {
    id: "unit-11",
    title: "UNIT 11: Love Animals",
    type: "unit",
    chapters: [
      { id: "11.1", code: "11.1", title: "Love Animals", type: "unit" },
    ],
  },
  {
    id: "review-4",
    title: "REVIEW 4",
    type: "review",
    chapters: [
      { id: "review-4", code: "R4", title: "Review", type: "review" },
    ],
  },
  {
    id: "english-b",
    title: "English B",
    type: "section",
    chapters: [
      { id: "eb-1", code: "EB1", title: "Singular/Plural", type: "section" },
      { id: "eb-2", code: "EB2", title: "Gender", type: "section" },
      { id: "eb-3", code: "EB3", title: "Form of Verbs", type: "section" },
      { id: "eb-4", code: "EB4", title: "Applications", type: "section" },
      { id: "eb-5", code: "EB5", title: "Letters", type: "section" },
      { id: "eb-6", code: "EB6", title: "Stories", type: "section" },
      { id: "eb-7", code: "EB7", title: "Essays", type: "section" },
    ],
  },
];

// Helper function to get all chapters as flat list
export function getAllChapters(): Chapter[] {
  return PTB_CLASS1_ENGLISH.flatMap((unit) => unit.chapters);
}

// Helper function to get chapters by unit
export function getChaptersByUnit(unitId: string): Chapter[] {
  const unit = PTB_CLASS1_ENGLISH.find((u) => u.id === unitId);
  return unit?.chapters || [];
}

// Helper function to get unit by chapter ID
export function getUnitByChapterId(chapterId: string): Unit | undefined {
  return PTB_CLASS1_ENGLISH.find((unit) =>
    unit.chapters.some((ch) => ch.id === chapterId)
  );
}
