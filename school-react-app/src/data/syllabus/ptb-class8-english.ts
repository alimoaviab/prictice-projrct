/**
 * PTB Class 8 English Syllabus
 * 12 units + English B + Tenses sections
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
  type: "unit" | "section";
  chapters: Chapter[];
}

export const PTB_CLASS8_ENGLISH: Unit[] = [
  {
    id: "unit-1",
    title: "UNIT 1: Tolerance of The Rasoolullah (SAW)",
    type: "unit",
    chapters: [
      { id: "1.1", code: "1.1", title: "Tolerance of The Rasoolullah (SAW)", type: "chapter" },
    ],
  },
  {
    id: "unit-2",
    title: "UNIT 2: A Great Virtue",
    type: "unit",
    chapters: [
      { id: "2.1", code: "2.1", title: "A Great Virtue", type: "chapter" },
    ],
  },
  {
    id: "unit-3",
    title: "UNIT 3: The Twins",
    type: "unit",
    chapters: [
      { id: "3.1", code: "3.1", title: "The Twins", type: "chapter" },
    ],
  },
  {
    id: "unit-4",
    title: "UNIT 4: Let's Make Our Roads Safer!",
    type: "unit",
    chapters: [
      { id: "4.1", code: "4.1", title: "Let's Make Our Road Safer!", type: "chapter" },
    ],
  },
  {
    id: "unit-5",
    title: "UNIT 5: Hazrat Umar (R.A)",
    type: "unit",
    chapters: [
      { id: "5.1", code: "5.1", title: "Hazrat Umar (R.A)", type: "chapter" },
    ],
  },
  {
    id: "unit-6",
    title: "UNIT 6: Sports and Sportsmanship",
    type: "unit",
    chapters: [
      { id: "6.1", code: "6.1", title: "Sports and Sportsmanship", type: "chapter" },
    ],
  },
  {
    id: "unit-7",
    title: "UNIT 7: The Earth Speaks",
    type: "unit",
    chapters: [
      { id: "7.1", code: "7.1", title: "The Earth Speaks", type: "chapter" },
    ],
  },
  {
    id: "unit-8",
    title: "UNIT 8: Settling the Quarrel",
    type: "unit",
    chapters: [
      { id: "8.1", code: "8.1", title: "Settling the Quarrel", type: "chapter" },
    ],
  },
  {
    id: "unit-9",
    title: "UNIT 9: Mountaineering",
    type: "unit",
    chapters: [
      { id: "9.1", code: "9.1", title: "Mountaineering", type: "chapter" },
    ],
  },
  {
    id: "unit-10",
    title: "UNIT 10: Dignity of Labour",
    type: "unit",
    chapters: [
      { id: "10.1", code: "10.1", title: "Dignity of Labour", type: "chapter" },
    ],
  },
  {
    id: "unit-11",
    title: "UNIT 11: Give to Your Country",
    type: "unit",
    chapters: [
      { id: "11.1", code: "11.1", title: "Give to Your Country", type: "chapter" },
    ],
  },
  {
    id: "unit-12",
    title: "UNIT 12: Trees Plantation",
    type: "unit",
    chapters: [
      { id: "12.1", code: "12.1", title: "Trees Plantation", type: "chapter" },
    ],
  },
  {
    id: "english-b",
    title: "English B",
    type: "section",
    chapters: [
      { id: "eb-1", code: "1", title: "Direct & Indirect",    type: "chapter" },
      { id: "eb-2", code: "2", title: "Idioms",               type: "chapter" },
      { id: "eb-3", code: "3", title: "Singular/Plural",      type: "chapter" },
      { id: "eb-4", code: "4", title: "Masculine/Feminine",   type: "chapter" },
      { id: "eb-5", code: "5", title: "Letters",              type: "chapter" },
      { id: "eb-6", code: "6", title: "Applications",         type: "chapter" },
      { id: "eb-7", code: "7", title: "Stories",              type: "chapter" },
      { id: "eb-8", code: "8", title: "Essays",               type: "chapter" },
      { id: "eb-9", code: "9", title: "Dialogues",            type: "chapter" },
    ],
  },
  {
    id: "tenses",
    title: "Tenses",
    type: "section",
    chapters: [
      { id: "t-1",  code: "T1",  title: "Use of 'it' and 'there'",                      type: "chapter" },
      { id: "t-2",  code: "T2",  title: "Use of 'is', 'am', 'are', 'was' and 'were'",   type: "chapter" },
      { id: "t-3",  code: "T3",  title: "Use of 'has', 'have' and 'had'",               type: "chapter" },
      { id: "t-4",  code: "T4",  title: "Present Indefinite Tense",                     type: "chapter" },
      { id: "t-5",  code: "T5",  title: "Present Continuous Tense",                     type: "chapter" },
      { id: "t-6",  code: "T6",  title: "Present Perfect Tense",                        type: "chapter" },
      { id: "t-7",  code: "T7",  title: "Present Perfect Continuous Tense",             type: "chapter" },
      { id: "t-8",  code: "T8",  title: "Past Indefinite Tense",                        type: "chapter" },
      { id: "t-9",  code: "T9",  title: "Past Continuous Tense",                        type: "chapter" },
      { id: "t-10", code: "T10", title: "Past Perfect Tense",                           type: "chapter" },
      { id: "t-11", code: "T11", title: "Past Perfect Continuous Tense",                type: "chapter" },
      { id: "t-12", code: "T12", title: "Future Indefinite Tense",                      type: "chapter" },
      { id: "t-13", code: "T13", title: "Future Continuous Tense",                      type: "chapter" },
      { id: "t-14", code: "T14", title: "Future Perfect Tense",                         type: "chapter" },
      { id: "t-15", code: "T15", title: "Future Perfect Continuous Tense",              type: "chapter" },
    ],
  },
];

export function getAllChapters(): Chapter[] {
  return PTB_CLASS8_ENGLISH.flatMap((u) => u.chapters);
}
export function getChaptersByUnit(unitId: string): Chapter[] {
  return PTB_CLASS8_ENGLISH.find((u) => u.id === unitId)?.chapters || [];
}
export function getUnitByChapterId(chapterId: string): Unit | undefined {
  return PTB_CLASS8_ENGLISH.find((u) => u.chapters.some((ch) => ch.id === chapterId));
}
