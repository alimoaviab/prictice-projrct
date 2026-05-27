/**
 * PTB Class 10 English Syllabus
 * 10 units + 2 reviews
 * ﷺ symbol preserved exactly
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
  type: "unit" | "review";
  chapters: Chapter[];
}

export const PTB_CLASS10_ENGLISH: Unit[] = [
  {
    id: "unit-1",
    title: "UNIT 1: HAZRAT MUHAMMAD'S ﷺ SOCIAL REFORMS FOR THE RIGHTS OF WOMEN, ORPHANS AND SLAVES.",
    type: "unit",
    chapters: [
      { id: "1", code: "1", title: "HAZRAT MUHAMMAD'S ﷺ SOCIAL REFORMS FOR THE RIGHTS OF WOMEN, ORPHANS AND SLAVES", type: "chapter" },
    ],
  },
  {
    id: "unit-2",
    title: "UNIT 2: MY BELOVED PAKISTAN (POEM).",
    type: "unit",
    chapters: [
      { id: "2", code: "2", title: "MY BELOVED PAKISTAN (POEM)", type: "chapter" },
    ],
  },
  {
    id: "unit-3",
    title: "UNIT 3: DIGITAL GLOBALISATION TRANSFORMING THE ENGLISH LANGUAGE.",
    type: "unit",
    chapters: [
      { id: "3", code: "3", title: "DIGITAL GLOBALISATION TRANSFORMING THE ENGLISH LANGUAGE", type: "chapter" },
    ],
  },
  {
    id: "unit-4",
    title: "UNIT 4: THE EARTH: ACT NOW FOR TOMORROW.",
    type: "unit",
    chapters: [
      { id: "4", code: "4", title: "THE EARTH: ACT NOW FOR TOMORROW", type: "chapter" },
    ],
  },
  {
    id: "unit-5",
    title: "UNIT 5: THE HAPPY PRINCE.",
    type: "unit",
    chapters: [
      { id: "5", code: "5", title: "THE HAPPY PRINCE", type: "chapter" },
    ],
  },
  {
    id: "review-1",
    title: "REVIEW 1",
    type: "review",
    chapters: [
      { id: "r1", code: "R1", title: "REVIEW 1", type: "chapter" },
    ],
  },
  {
    id: "unit-6",
    title: "UNIT 6: DRUG ABUSE.",
    type: "unit",
    chapters: [
      { id: "6", code: "6", title: "DRUG ABUSE", type: "chapter" },
    ],
  },
  {
    id: "unit-7",
    title: "UNIT 7: TIME (POEM).",
    type: "unit",
    chapters: [
      { id: "7", code: "7", title: "TIME (POEM)", type: "chapter" },
    ],
  },
  {
    id: "unit-8",
    title: "UNIT 8: POLLUTION-FREE PAKISTAN WITH GREENERY ALL AROUND.",
    type: "unit",
    chapters: [
      { id: "8", code: "8", title: "POLLUTION-FREE PAKISTAN WITH GREENERY ALL AROUND", type: "chapter" },
    ],
  },
  {
    id: "unit-9",
    title: "UNIT 9: THE ROAD NOT TAKEN (POEM).",
    type: "unit",
    chapters: [
      { id: "9", code: "9", title: "THE ROAD NOT TAKEN (POEM)", type: "chapter" },
    ],
  },
  {
    id: "unit-10",
    title: "UNIT 10: THE THREE QUESTIONS.",
    type: "unit",
    chapters: [
      { id: "10", code: "10", title: "THE THREE QUESTIONS", type: "chapter" },
    ],
  },
  {
    id: "review-2",
    title: "REVIEW 2",
    type: "review",
    chapters: [
      { id: "r2", code: "R2", title: "REVIEW 2", type: "chapter" },
    ],
  },
];

export function getAllChapters(): Chapter[] {
  return PTB_CLASS10_ENGLISH.flatMap((u) => u.chapters);
}
export function getChaptersByUnit(unitId: string): Chapter[] {
  return PTB_CLASS10_ENGLISH.find((u) => u.id === unitId)?.chapters || [];
}
export function getUnitByChapterId(chapterId: string): Unit | undefined {
  return PTB_CLASS10_ENGLISH.find((u) => u.chapters.some((ch) => ch.id === chapterId));
}
