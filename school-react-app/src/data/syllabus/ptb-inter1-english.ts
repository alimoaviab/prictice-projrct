/**
 * PTB Inter Part-I English Syllabus
 * Units (some numbers skipped as per source), Correct Form Of Verb, English B
 * "(SMART)" preserved exactly
 */

export interface Chapter { id: string; code: string; title: string; type: "chapter"; }
export interface Unit { id: string; title: string; type: "unit" | "section"; chapters: Chapter[]; }

export const PTB_INTER1_ENGLISH: Unit[] = [
  {
    id: "unit-1",
    title: "UNIT 1: Khatam-un-Nabiyeen Hazrat Muhammad (SAW)",
    type: "unit",
    chapters: [
      { id: "1", code: "1", title: "KHATAM-UN-NABIYEEN HAZRAT MUHAMMAD (SAW) (SMART)", type: "chapter" },
    ],
  },
  {
    id: "unit-2",
    title: "UNIT 2: Responsibility of the Youth in Nation-Building",
    type: "unit",
    chapters: [
      { id: "2", code: "2", title: "RESPONSIBILITY OF THE YOUTH IN NATION-BUILDING (SMART)", type: "chapter" },
    ],
  },
  {
    id: "unit-3",
    title: "UNIT 3: A Bird Came Down the Walk (Poem)",
    type: "unit",
    chapters: [
      { id: "3", code: "3", title: "A BIRD CAME DOWN THE WALK (SMART)", type: "chapter" },
    ],
  },
  {
    id: "unit-5",
    title: "UNIT 5: Impact of Global Warming on Pakistan",
    type: "unit",
    chapters: [
      { id: "5", code: "5", title: "IMPACT OF GLOBAL WARMING ON PAKISTAN (SMART)", type: "chapter" },
    ],
  },
  {
    id: "unit-6",
    title: "UNIT 6: The Echoing Green (Poem)",
    type: "unit",
    chapters: [
      { id: "6", code: "6", title: "THE ECHOING GREEN (SMART)", type: "chapter" },
    ],
  },
  {
    id: "unit-8",
    title: "UNIT 8: Clean Water",
    type: "unit",
    chapters: [
      { id: "8", code: "8", title: "CLEAN WATER (SMART)", type: "chapter" },
    ],
  },
  {
    id: "unit-10",
    title: "UNIT 10: The Punishment of Shahpesh, the Persian, on Khipil, the Builder",
    type: "unit",
    chapters: [
      { id: "10", code: "10", title: "THE PUNISHMENT OF SHAHPESH, THE PERSIAN, ON KHIPIL, THE BUILDER (SMART)", type: "chapter" },
    ],
  },
  {
    id: "unit-11",
    title: "UNIT 11: Those Winter Sundays (Poem)",
    type: "unit",
    chapters: [
      { id: "11", code: "11", title: "THOSE WINTER SUNDAYS (SMART)", type: "chapter" },
    ],
  },
  {
    id: "unit-13",
    title: "UNIT 13: Rubai'yat (Poem)",
    type: "unit",
    chapters: [
      { id: "13", code: "13", title: "RUBAI'YAT (SMART)", type: "chapter" },
    ],
  },
  {
    id: "unit-14",
    title: "UNIT 14: The End of the Beginning",
    type: "unit",
    chapters: [
      { id: "14", code: "14", title: "THE END OF THE BEGINNING (SMART)", type: "chapter" },
    ],
  },
  {
    id: "correct-form-verb",
    title: "Correct Form Of Verb",
    type: "section",
    chapters: [
      { id: "v-1",  code: "1",  title: "Present Indefinite Tense",           type: "chapter" },
      { id: "v-2",  code: "2",  title: "Present Continuous Tense",           type: "chapter" },
      { id: "v-3",  code: "3",  title: "Present Perfect Tense",              type: "chapter" },
      { id: "v-4",  code: "4",  title: "Present Perfect Continuous Tense",   type: "chapter" },
      { id: "v-5",  code: "5",  title: "Past Indefinite Tense",              type: "chapter" },
      { id: "v-6",  code: "6",  title: "Past Continuous Tense",              type: "chapter" },
      { id: "v-7",  code: "7",  title: "Past Perfect Tense",                 type: "chapter" },
      { id: "v-8",  code: "8",  title: "Past Perfect Continuous Tense",      type: "chapter" },
      { id: "v-9",  code: "9",  title: "Future Indefinite Tense",            type: "chapter" },
      { id: "v-10", code: "10", title: "Future Continuous Tense",            type: "chapter" },
      { id: "v-11", code: "11", title: "Future Perfect Tense",               type: "chapter" },
      { id: "v-12", code: "12", title: "Future Perfect Continuous Tense",    type: "chapter" },
    ],
  },
  {
    id: "english-b",
    title: "English (B)",
    type: "section",
    chapters: [
      { id: "eb-1", code: "1", title: "Letters",           type: "chapter" },
      { id: "eb-2", code: "2", title: "Applications",      type: "chapter" },
      { id: "eb-3", code: "3", title: "Stories",           type: "chapter" },
      { id: "eb-4", code: "4", title: "Pair Of Words",     type: "chapter" },
    ],
  },
];

export function getAllChapters(): Chapter[] { return PTB_INTER1_ENGLISH.flatMap((u) => u.chapters); }
export function getChaptersByUnit(unitId: string): Chapter[] { return PTB_INTER1_ENGLISH.find((u) => u.id === unitId)?.chapters || []; }
export function getUnitByChapterId(chapterId: string): Unit | undefined { return PTB_INTER1_ENGLISH.find((u) => u.chapters.some((ch) => ch.id === chapterId)); }
