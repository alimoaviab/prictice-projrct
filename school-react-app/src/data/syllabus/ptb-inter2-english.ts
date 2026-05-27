/**
 * PTB Inter Part-II English Syllabus
 * 10 Lessons, 5 Heroes, 18 Mr.Chips chapters, English B
 * Text preserved exactly — "Sir Alexander Flaming" preserved as written in source
 */

export interface Chapter { id: string; code: string; title: string; type: "chapter"; }
export interface Unit { id: string; title: string; type: "unit" | "section"; chapters: Chapter[]; }

export const PTB_INTER2_ENGLISH: Unit[] = [
  { id: "lesson-1",  title: "LESSON 1: The Dying Sun",                   type: "unit",    chapters: [{ id: "l1",  code: "1",  title: "The Dying Sun",                   type: "chapter" }] },
  { id: "lesson-2",  title: "LESSON 2: Using The Scientific Method",     type: "unit",    chapters: [{ id: "l2",  code: "2",  title: "Using The Scientific Method",     type: "chapter" }] },
  { id: "lesson-3",  title: "LESSON 3: Why Boys Fail In College",        type: "unit",    chapters: [{ id: "l3",  code: "3",  title: "Why Boys Fail In College",        type: "chapter" }] },
  { id: "lesson-4",  title: "LESSON 4: End Of Term",                     type: "unit",    chapters: [{ id: "l4",  code: "4",  title: "End Of Term",                     type: "chapter" }] },
  { id: "lesson-5",  title: "LESSON 5: On Destroying Books",             type: "unit",    chapters: [{ id: "l5",  code: "5",  title: "On Destroying Books",             type: "chapter" }] },
  { id: "lesson-6",  title: "LESSON 6: The Man Who Was A Hospital",      type: "unit",    chapters: [{ id: "l6",  code: "6",  title: "The Man Who Was A Hospital",      type: "chapter" }] },
  { id: "lesson-7",  title: "LESSON 7: My Financial Career",             type: "unit",    chapters: [{ id: "l7",  code: "7",  title: "My Financial Career",             type: "chapter" }] },
  { id: "lesson-8",  title: "LESSON 8: China's Way To Progress",         type: "unit",    chapters: [{ id: "l8",  code: "8",  title: "China's Way To Progress",         type: "chapter" }] },
  { id: "lesson-9",  title: "LESSON 9: Hunger And Population Explosion", type: "unit",    chapters: [{ id: "l9",  code: "9",  title: "Hunger And Population Explosion", type: "chapter" }] },
  { id: "lesson-10", title: "LESSON 10: The Jewel Of The World",         type: "unit",    chapters: [{ id: "l10", code: "10", title: "The Jewel Of The World",          type: "chapter" }] },
  {
    id: "heroes",
    title: "Heroes",
    type: "section",
    chapters: [
      { id: "h1", code: "1", title: "First Year At Harrow",          type: "chapter" },
      { id: "h2", code: "2", title: "Hitch-Hiking Across The Sahara", type: "chapter" },
      { id: "h3", code: "3", title: "Sir Alexander Flaming",         type: "chapter" },
      { id: "h4", code: "4", title: "Louis Pasteur",                 type: "chapter" },
      { id: "h5", code: "5", title: "Mustafa Kamal",                 type: "chapter" },
    ],
  },
  {
    id: "mr-chips",
    title: "Mr. Chips",
    type: "section",
    chapters: [
      { id: "mc-1",  code: "1",  title: "Mr.Chips-1",  type: "chapter" },
      { id: "mc-2",  code: "2",  title: "Mr.Chips-2",  type: "chapter" },
      { id: "mc-3",  code: "3",  title: "Mr.Chips-3",  type: "chapter" },
      { id: "mc-4",  code: "4",  title: "Mr.chips-4",  type: "chapter" },
      { id: "mc-5",  code: "5",  title: "Mr.Chips-5",  type: "chapter" },
      { id: "mc-6",  code: "6",  title: "Mr.Chips-6",  type: "chapter" },
      { id: "mc-7",  code: "7",  title: "Mr.Chips-7",  type: "chapter" },
      { id: "mc-8",  code: "8",  title: "Mr.Chips-8",  type: "chapter" },
      { id: "mc-9",  code: "9",  title: "Mr.Chips-9",  type: "chapter" },
      { id: "mc-10", code: "10", title: "Mr.Chips-10", type: "chapter" },
      { id: "mc-11", code: "11", title: "Mr.Chips-11", type: "chapter" },
      { id: "mc-12", code: "12", title: "Mr.Chips-12", type: "chapter" },
      { id: "mc-13", code: "13", title: "Mr.Chips-13", type: "chapter" },
      { id: "mc-14", code: "14", title: "Mr.Chips-14", type: "chapter" },
      { id: "mc-15", code: "15", title: "Mr.Chips-15", type: "chapter" },
      { id: "mc-16", code: "16", title: "Mr.Chips-16", type: "chapter" },
      { id: "mc-17", code: "17", title: "Mr.Chips-17", type: "chapter" },
      { id: "mc-18", code: "18", title: "Mr.Chips-18", type: "chapter" },
    ],
  },
  {
    id: "english-b",
    title: "English (B)",
    type: "section",
    chapters: [
      { id: "eb-1", code: "1", title: "Essays",                              type: "chapter" },
      { id: "eb-2", code: "2", title: "Idioms",                              type: "chapter" },
      { id: "eb-3", code: "3", title: "Translate into English Paragraph's",  type: "chapter" },
      { id: "eb-4", code: "4", title: "Correct Sentences",                   type: "chapter" },
      { id: "eb-5", code: "5", title: "Correct Prepositions",                type: "chapter" },
    ],
  },
];

export function getAllChapters(): Chapter[] { return PTB_INTER2_ENGLISH.flatMap((u) => u.chapters); }
export function getChaptersByUnit(unitId: string): Chapter[] { return PTB_INTER2_ENGLISH.find((u) => u.id === unitId)?.chapters || []; }
export function getUnitByChapterId(chapterId: string): Unit | undefined { return PTB_INTER2_ENGLISH.find((u) => u.chapters.some((ch) => ch.id === chapterId)); }
