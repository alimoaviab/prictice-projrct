/**
 * PTB Class 5 English Syllabus
 * Complete unit structure with reviews, English B section, and Tenses
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

export const PTB_CLASS5_ENGLISH: Unit[] = [
  {
    id: "unit-1",
    title: "UNIT 1: Patience",
    type: "unit",
    chapters: [
      { id: "1.1", code: "1.1", title: "Patience", type: "chapter" },
    ],
  },
  {
    id: "unit-2",
    title: "UNIT 2: Be Grateful",
    type: "unit",
    chapters: [
      { id: "2.1", code: "2.1", title: "Be Grateful", type: "chapter" },
    ],
  },
  {
    id: "unit-3",
    title: "UNIT 3: Women as Role Models",
    type: "unit",
    chapters: [
      { id: "3.1", code: "3.1", title: "Women as Role Models", type: "chapter" },
    ],
  },
  {
    id: "review-1",
    title: "Review-1",
    type: "review",
    chapters: [
      { id: "r1", code: "1", title: "Review", type: "chapter" },
    ],
  },
  {
    id: "unit-4",
    title: "UNIT 4: Unforgettable Moments of My Life",
    type: "unit",
    chapters: [
      { id: "4.1", code: "4.1", title: "Unforgettable Moments of My Life", type: "chapter" },
    ],
  },
  {
    id: "unit-5",
    title: "UNIT 5: Amazing Planet",
    type: "unit",
    chapters: [
      { id: "5.1", code: "5.1", title: "Amazing Planet", type: "chapter" },
    ],
  },
  {
    id: "unit-6",
    title: "UNIT 6: A Fit and Healthy Life",
    type: "unit",
    chapters: [
      { id: "6.1", code: "6.1", title: "A Fit and Healthy Life", type: "chapter" },
    ],
  },
  {
    id: "review-2",
    title: "Review-2",
    type: "review",
    chapters: [
      { id: "r2", code: "2", title: "Review", type: "chapter" },
    ],
  },
  {
    id: "unit-7",
    title: "UNIT 7: What Goes Around, Comes Around",
    type: "unit",
    chapters: [
      { id: "7.1", code: "7.1", title: "What Goes Around, Comes Around", type: "chapter" },
    ],
  },
  {
    id: "unit-8",
    title: "UNIT 8: Do What's Right",
    type: "unit",
    chapters: [
      { id: "8.1", code: "8.1", title: "Do What's Right", type: "chapter" },
    ],
  },
  {
    id: "unit-9",
    title: "UNIT 9: Patriotism",
    type: "unit",
    chapters: [
      { id: "9.1", code: "9.1", title: "Patriotism", type: "chapter" },
    ],
  },
  {
    id: "unit-10",
    title: "UNIT 10: Eid-ul-Azha",
    type: "unit",
    chapters: [
      { id: "10.1", code: "10.1", title: "Eid-ul-Azha", type: "chapter" },
    ],
  },
  {
    id: "review-3",
    title: "Review-3",
    type: "review",
    chapters: [
      { id: "r3", code: "3", title: "Review", type: "chapter" },
    ],
  },
  {
    id: "unit-11",
    title: "UNIT 11: Let's Be Helpful",
    type: "unit",
    chapters: [
      { id: "11.1", code: "11.1", title: "Let's Be Helpful", type: "chapter" },
    ],
  },
  {
    id: "unit-12",
    title: "UNIT 12: Our National Animal",
    type: "unit",
    chapters: [
      { id: "12.1", code: "12.1", title: "Our National Animal", type: "chapter" },
    ],
  },
  {
    id: "unit-13",
    title: "UNIT 13: When Something Went Wrong",
    type: "unit",
    chapters: [
      { id: "13.1", code: "13.1", title: "When Something Went Wrong", type: "chapter" },
    ],
  },
  {
    id: "unit-14",
    title: "UNIT 14: Together We Live",
    type: "unit",
    chapters: [
      { id: "14.1", code: "14.1", title: "Together We Live", type: "chapter" },
    ],
  },
  {
    id: "review-4",
    title: "Review-4",
    type: "review",
    chapters: [
      { id: "r4", code: "4", title: "Review", type: "chapter" },
    ],
  },
  {
    id: "english-b",
    title: "English B",
    type: "section",
    chapters: [
      { id: "eb-1", code: "1", title: "Singular/Plural",  type: "chapter" },
      { id: "eb-2", code: "2", title: "Gender",           type: "chapter" },
      { id: "eb-3", code: "3", title: "Form of Verbs",    type: "chapter" },
      { id: "eb-4", code: "4", title: "Applications",     type: "chapter" },
      { id: "eb-5", code: "5", title: "Letters",          type: "chapter" },
      { id: "eb-6", code: "6", title: "Stories",          type: "chapter" },
      { id: "eb-7", code: "7", title: "Essays",           type: "chapter" },
    ],
  },
  {
    id: "tenses",
    title: "TENSES",
    type: "section",
    chapters: [
      { id: "t-1",  code: "T1",  title: "Use of Is, Am, Are",                       type: "chapter" },
      { id: "t-2",  code: "T2",  title: "Use of Was, Were",                          type: "chapter" },
      { id: "t-3",  code: "T3",  title: "Use Has, Have, Had",                        type: "chapter" },
      { id: "t-4",  code: "T4",  title: "Use of It and There",                       type: "chapter" },
      { id: "t-5",  code: "T5",  title: "Imperative Sentences",                      type: "chapter" },
      { id: "t-6",  code: "T6",  title: "Use of Some Helping Verbs",                 type: "chapter" },
      { id: "t-7",  code: "T7",  title: "Use of Why, Where, When, What, Who",        type: "chapter" },
      { id: "t-8",  code: "T8",  title: "Present Indefinite Tense",                  type: "chapter" },
      { id: "t-9",  code: "T9",  title: "Present Continuous Tense",                  type: "chapter" },
      { id: "t-10", code: "T10", title: "Past Indefinite Tense",                     type: "chapter" },
      { id: "t-11", code: "T11", title: "Past Continuous Tense",                     type: "chapter" },
      { id: "t-12", code: "T12", title: "Future Indefinite Tense",                   type: "chapter" },
      { id: "t-13", code: "T13", title: "Future Continuous Tense",                   type: "chapter" },
    ],
  },
];

// Helper function to get all chapters as flat list
export function getAllChapters(): Chapter[] {
  return PTB_CLASS5_ENGLISH.flatMap((unit) => unit.chapters);
}

// Helper function to get chapters by unit
export function getChaptersByUnit(unitId: string): Chapter[] {
  const unit = PTB_CLASS5_ENGLISH.find((u) => u.id === unitId);
  return unit?.chapters || [];
}

// Helper function to get unit by chapter ID
export function getUnitByChapterId(chapterId: string): Unit | undefined {
  return PTB_CLASS5_ENGLISH.find((unit) =>
    unit.chapters.some((ch) => ch.id === chapterId)
  );
}
