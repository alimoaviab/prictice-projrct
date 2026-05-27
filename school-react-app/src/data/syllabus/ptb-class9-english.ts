/**
 * PTB Class 9 English Syllabus
 * 11 lessons/poems + English B + Tenses sections
 * "(SMART)" preserved exactly where written
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

export const PTB_CLASS9_ENGLISH: Unit[] = [
  {
    id: "lesson-1",
    title: "LESSON 1: The Saviour of Mankind",
    type: "unit",
    chapters: [
      { id: "1", code: "1", title: "THE SAVIOUR OF MANKIND (SMART)", type: "chapter" },
    ],
  },
  {
    id: "lesson-2",
    title: "LESSON 2: Patriotism",
    type: "unit",
    chapters: [
      { id: "2", code: "2", title: "PATRIOTISM (SMART)", type: "chapter" },
    ],
  },
  {
    id: "poem-3",
    title: "Poem 3: Daffodils",
    type: "unit",
    chapters: [
      { id: "3", code: "3", title: "DAFFODILS (SMART)", type: "chapter" },
    ],
  },
  {
    id: "lesson-4",
    title: "LESSON 4: Hazrat Asma (R.A)",
    type: "unit",
    chapters: [
      { id: "4", code: "4", title: "HAZRAT ASMA (R.A) (SMART)", type: "chapter" },
    ],
  },
  {
    id: "lesson-5",
    title: "LESSON 5: Women Empowerment through Entrepreneurship",
    type: "unit",
    chapters: [
      { id: "5", code: "5", title: "WOMEN EMPOWERMENT THROUGH ENTERPRENEUSHIP", type: "chapter" },
    ],
  },
  {
    id: "lesson-6",
    title: "LESSON 6: The Value of Time",
    type: "unit",
    chapters: [
      { id: "6", code: "6", title: "THE VALUE OF TIME (SMART)", type: "chapter" },
    ],
  },
  {
    id: "poem-7",
    title: "Poem 7: If",
    type: "unit",
    chapters: [
      { id: "7", code: "7", title: "IF (SMART)", type: "chapter" },
    ],
  },
  {
    id: "lesson-8",
    title: "LESSON 8: The Impact of Globalisation on Culture and Economy",
    type: "unit",
    chapters: [
      { id: "8", code: "8", title: "The Impact of Globalisation on Culture and Economy", type: "chapter" },
    ],
  },
  {
    id: "lesson-9",
    title: "LESSON 9: Quality Education: A key to Success",
    type: "unit",
    chapters: [
      { id: "9", code: "9", title: "QUALITY EDUCATION: A KEY TO SUCCESS (SMART)", type: "chapter" },
    ],
  },
  {
    id: "lesson-10",
    title: "LESSON 10: The Silent Predator and the Majestic Prey-Snow Leopard and Markhor",
    type: "unit",
    chapters: [
      { id: "10", code: "10", title: "THE SILENT PREDATOR AND THE MAJESTIC PREY-SNOW LEOPARD MARKHOR", type: "chapter" },
    ],
  },
  {
    id: "lesson-11",
    title: "LESSON 11: The Dear Departed (One-Act Play) Stanley Houghton",
    type: "unit",
    chapters: [
      { id: "11", code: "11", title: "THE DEAR DEPARTED (ONE-ACT PLAY) STANLEY HOUGHTON (SMART)", type: "chapter" },
    ],
  },
  {
    id: "english-b",
    title: "English B",
    type: "section",
    chapters: [
      { id: "eb-1", code: "1", title: "Letters",                   type: "chapter" },
      { id: "eb-2", code: "2", title: "Stories",                   type: "chapter" },
      { id: "eb-3", code: "3", title: "Dialogues",                 type: "chapter" },
      { id: "eb-4", code: "4", title: "Comprehension Paragraphs",  type: "chapter" },
      { id: "eb-5", code: "5", title: "Idioms",                    type: "chapter" },
    ],
  },
  {
    id: "tenses",
    title: "TENSES",
    type: "section",
    chapters: [
      { id: "t-1",  code: "1",  title: "Use of 'is', 'am', 'are' and 'was', were",  type: "chapter" },
      { id: "t-2",  code: "2",  title: "Use of 'has' and 'have'",                    type: "chapter" },
      { id: "t-3",  code: "3",  title: "Use of 'had'",                               type: "chapter" },
      { id: "t-4",  code: "4",  title: "Present Indefinite Tense",                   type: "chapter" },
      { id: "t-5",  code: "5",  title: "Present Continuous Tense",                   type: "chapter" },
      { id: "t-6",  code: "6",  title: "Present Perfect Tense",                      type: "chapter" },
      { id: "t-7",  code: "7",  title: "Present Perfect Continuous Tense",           type: "chapter" },
      { id: "t-8",  code: "8",  title: "Past Indefinite Tense",                      type: "chapter" },
      { id: "t-9",  code: "9",  title: "Past Continuous Tense",                      type: "chapter" },
      { id: "t-10", code: "10", title: "Past Perfect Tense",                         type: "chapter" },
      { id: "t-11", code: "11", title: "Past Perfect Continuous Tense",              type: "chapter" },
      { id: "t-12", code: "12", title: "Future Indefinite Tense",                    type: "chapter" },
      { id: "t-13", code: "13", title: "Future Continuous Tense",                    type: "chapter" },
      { id: "t-14", code: "14", title: "Future Perfect Tense",                       type: "chapter" },
      { id: "t-15", code: "15", title: "Future Perfect Continuous Tense",            type: "chapter" },
    ],
  },
];

export function getAllChapters(): Chapter[] {
  return PTB_CLASS9_ENGLISH.flatMap((u) => u.chapters);
}
export function getChaptersByUnit(unitId: string): Chapter[] {
  return PTB_CLASS9_ENGLISH.find((u) => u.id === unitId)?.chapters || [];
}
export function getUnitByChapterId(chapterId: string): Unit | undefined {
  return PTB_CLASS9_ENGLISH.find((u) => u.chapters.some((ch) => ch.id === chapterId));
}
