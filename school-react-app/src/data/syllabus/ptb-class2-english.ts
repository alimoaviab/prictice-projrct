/**
 * PTB Class 2 English Syllabus
 * Complete unit structure with reviews and English B section
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
  type: "unit" | "review" | "section";
  chapters: Chapter[];
}

export const PTB_CLASS2_ENGLISH: Unit[] = [
  {
    id: "unit-1",
    title: "UNIT 1: A Tiny Creature",
    type: "unit",
    chapters: [
      { id: "1.1", code: "1.1", title: "A Tiny Creature", type: "chapter" },
    ],
  },
  {
    id: "unit-2",
    title: "UNIT 2: My Home and City",
    type: "unit",
    chapters: [
      { id: "2.1", code: "2.1", title: "My Home and City", type: "chapter" },
    ],
  },
  {
    id: "unit-3",
    title: "UNIT 3: Let's Plant Trees",
    type: "unit",
    chapters: [
      { id: "3.1", code: "3.1", title: "Let's Plant Trees", type: "chapter" },
    ],
  },
  {
    id: "review-1",
    title: "Review 1",
    type: "review",
    chapters: [
      { id: "r1", code: "1", title: "Review 1", type: "chapter" },
    ],
  },
  {
    id: "unit-4",
    title: "UNIT 4: Bee on My Nose",
    type: "unit",
    chapters: [
      { id: "4.1", code: "4.1", title: "Bee on My Nose", type: "chapter" },
    ],
  },
  {
    id: "unit-5",
    title: "UNIT 5: Attention!",
    type: "unit",
    chapters: [
      { id: "5.1", code: "5.1", title: "Attention!", type: "chapter" },
    ],
  },
  {
    id: "unit-6",
    title: "UNIT 6: Be Honest",
    type: "unit",
    chapters: [
      { id: "6.1", code: "6.1", title: "Be Honest", type: "chapter" },
    ],
  },
  {
    id: "review-2",
    title: "Review 2",
    type: "review",
    chapters: [
      { id: "r2", code: "2", title: "Review 2", type: "chapter" },
    ],
  },
  {
    id: "unit-7",
    title: "UNIT 7: Sports Day",
    type: "unit",
    chapters: [
      { id: "7.1", code: "7.1", title: "Sports Day", type: "chapter" },
    ],
  },
  {
    id: "unit-8",
    title: "UNIT 8: My School",
    type: "unit",
    chapters: [
      { id: "8.1", code: "8.1", title: "My School", type: "chapter" },
    ],
  },
  {
    id: "unit-9",
    title: "UNIT 9: What a Good Deed",
    type: "unit",
    chapters: [
      { id: "9.1", code: "9.1", title: "What a Good Deed", type: "chapter" },
    ],
  },
  {
    id: "review-3",
    title: "Review 3",
    type: "review",
    chapters: [
      { id: "r3", code: "3", title: "Review 3", type: "chapter" },
    ],
  },
  {
    id: "unit-10",
    title: "UNIT 10: An Ant and a Dove",
    type: "unit",
    chapters: [
      { id: "10.1", code: "10.1", title: "An Ant and a Dove", type: "chapter" },
    ],
  },
  {
    id: "unit-11",
    title: "UNIT 11: Love for Parents",
    type: "unit",
    chapters: [
      { id: "11.1", code: "11.1", title: "Love for Parents", type: "chapter" },
    ],
  },
  {
    id: "unit-12",
    title: "UNIT 12: Seasons",
    type: "unit",
    chapters: [
      { id: "12.1", code: "12.1", title: "Seasons", type: "chapter" },
    ],
  },
  {
    id: "review-4",
    title: "Review 4",
    type: "review",
    chapters: [
      { id: "r4", code: "4", title: "Review 4", type: "chapter" },
    ],
  },
  {
    id: "english-b",
    title: "English B",
    type: "section",
    chapters: [
      { id: "eb-1", code: "1", title: "Singular/Plural", type: "chapter" },
      { id: "eb-2", code: "2", title: "Gender", type: "chapter" },
      { id: "eb-3", code: "3", title: "Form of Verbs", type: "chapter" },
      { id: "eb-4", code: "4", title: "Applications", type: "chapter" },
      { id: "eb-5", code: "5", title: "Letters", type: "chapter" },
      { id: "eb-6", code: "6", title: "Stories", type: "chapter" },
      { id: "eb-7", code: "7", title: "Essays", type: "chapter" },
    ],
  },
];

// Helper function to get all chapters as flat list
export function getAllChapters(): Chapter[] {
  return PTB_CLASS2_ENGLISH.flatMap((unit) => unit.chapters);
}

// Helper function to get chapters by unit
export function getChaptersByUnit(unitId: string): Chapter[] {
  const unit = PTB_CLASS2_ENGLISH.find((u) => u.id === unitId);
  return unit?.chapters || [];
}

// Helper function to get unit by chapter ID
export function getUnitByChapterId(chapterId: string): Unit | undefined {
  return PTB_CLASS2_ENGLISH.find((unit) =>
    unit.chapters.some((ch) => ch.id === chapterId)
  );
}
