/**
 * PTB Class 3 (THREE) - English - Complete Syllabus
 * Source: Punjab Textbook Board
 */
export interface Chapter { id: string; code: string; title: string; type: "unit" | "review" | "section"; }
export interface Unit { id: string; title: string; type: "unit" | "review" | "section"; chapters: Chapter[]; }

export const PTB_CLASS3_ENGLISH: Unit[] = [
  {
    id: "unit-1",
    title: "UNIT 1: All are Welcome",
    type: "unit",
    chapters: [{ id: "1.1", code: "1.1", title: "All are Welcome", type: "unit" }]
  },
  {
    id: "unit-2",
    title: "UNIT 2: Gifts of Nature",
    type: "unit",
    chapters: [{ id: "2.1", code: "2.1", title: "Gifts of Nature", type: "unit" }]
  },
  {
    id: "unit-3",
    title: "UNIT 3: The People I Love",
    type: "unit",
    chapters: [{ id: "3.1", code: "3.1", title: "The People I Love", type: "unit" }]
  },
  {
    id: "unit-4",
    title: "UNIT 4: Kindness to Children",
    type: "unit",
    chapters: [{ id: "4.1", code: "4.1", title: "Kindness to Children", type: "unit" }]
  },
  {
    id: "review-1",
    title: "Review-1",
    type: "review",
    chapters: [{ id: "r1", code: "R1", title: "Review", type: "review" }]
  },
  {
    id: "unit-5",
    title: "UNIT 5: Road Safety",
    type: "unit",
    chapters: [{ id: "5.1", code: "5.1", title: "Road Safety", type: "unit" }]
  },
  {
    id: "unit-6",
    title: "UNIT 6: The Day of Silence",
    type: "unit",
    chapters: [{ id: "6.1", code: "6.1", title: "The Day of Silence", type: "unit" }]
  },
  {
    id: "unit-7",
    title: "UNIT 7: I Like to Play",
    type: "unit",
    chapters: [{ id: "7.1", code: "7.1", title: "I Like to Play", type: "unit" }]
  },
  {
    id: "unit-8",
    title: "UNIT 8: Saving Resources",
    type: "unit",
    chapters: [{ id: "8.1", code: "8.1", title: "Saving Resources", type: "unit" }]
  },
  {
    id: "review-2",
    title: "Review-2",
    type: "review",
    chapters: [{ id: "r2", code: "R2", title: "Review", type: "review" }]
  },
  {
    id: "unit-9",
    title: "UNIT 9: My Culture - My Pride",
    type: "unit",
    chapters: [{ id: "9.1", code: "9.1", title: "My Culture - My Pride", type: "unit" }]
  },
  {
    id: "unit-10",
    title: "UNIT 10: Our Family Picnic",
    type: "unit",
    chapters: [{ id: "10.1", code: "10.1", title: "Our Family Picnic", type: "unit" }]
  },
  {
    id: "unit-11",
    title: "UNIT 11: Healthy Habits",
    type: "unit",
    chapters: [{ id: "11.1", code: "11.1", title: "Healthy Habits", type: "unit" }]
  },
  {
    id: "review-3",
    title: "Review-3",
    type: "review",
    chapters: [{ id: "r3", code: "R3", title: "Review", type: "review" }]
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
      { id: "eb-7", code: "EB7", title: "Essays", type: "section" }
    ]
  }
];

export function getAllChapters(): Chapter[] { return PTB_CLASS3_ENGLISH.flatMap(u => u.chapters); }
export function getChaptersByUnit(unitId: string): Chapter[] { const u = PTB_CLASS3_ENGLISH.find(x => x.id === unitId); return u ? u.chapters : []; }
export function getChapterById(chapterId: string): Chapter | undefined { return getAllChapters().find(ch => ch.id === chapterId); }
export function getTotalChapterCount(): number { return getAllChapters().length; }
export const SYLLABUS_METADATA = { subject: "English", class: "3rd", board: "PTB", totalChapters: getTotalChapterCount(), language: "English" };
