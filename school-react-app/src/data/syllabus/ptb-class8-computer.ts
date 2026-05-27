/**
 * PTB Class 8 Computer Syllabus
 * 8 chapters
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

export const PTB_CLASS8_COMPUTER: Unit[] = [
  {
    id: "chap-1",
    title: "CHAP 1: Emerging Technologies",
    type: "unit",
    chapters: [
      { id: "1", code: "1", title: "Emerging Technologies", type: "chapter" },
    ],
  },
  {
    id: "chap-2",
    title: "CHAP 2: Data Communication and Computer Networks",
    type: "unit",
    chapters: [
      { id: "2", code: "2", title: "Data Communication and Computer Networks", type: "chapter" },
    ],
  },
  {
    id: "chap-3",
    title: "CHAP 3: Microsoft Excel",
    type: "unit",
    chapters: [
      { id: "3", code: "3", title: "Microsoft Excel", type: "chapter" },
    ],
  },
  {
    id: "chap-4",
    title: "CHAP 4: Google Sheets",
    type: "unit",
    chapters: [
      { id: "4", code: "4", title: "Google Sheets", type: "chapter" },
    ],
  },
  {
    id: "chap-5",
    title: "CHAP 5: Computational Thinking",
    type: "unit",
    chapters: [
      { id: "5", code: "5", title: "Computational Thinking", type: "chapter" },
    ],
  },
  {
    id: "chap-6",
    title: "CHAP 6: Programming",
    type: "unit",
    chapters: [
      { id: "6", code: "6", title: "Programming", type: "chapter" },
    ],
  },
  {
    id: "chap-7",
    title: "CHAP 7: Digital Citizenship",
    type: "unit",
    chapters: [
      { id: "7", code: "7", title: "Digital Citizenship", type: "chapter" },
    ],
  },
  {
    id: "chap-8",
    title: "CHAP 8: Entrepreneurship",
    type: "unit",
    chapters: [
      { id: "8", code: "8", title: "Entrepreneurship", type: "chapter" },
    ],
  },
];

export function getAllChapters(): Chapter[] {
  return PTB_CLASS8_COMPUTER.flatMap((u) => u.chapters);
}
export function getChaptersByUnit(unitId: string): Chapter[] {
  return PTB_CLASS8_COMPUTER.find((u) => u.id === unitId)?.chapters || [];
}
export function getUnitByChapterId(chapterId: string): Unit | undefined {
  return PTB_CLASS8_COMPUTER.find((u) => u.chapters.some((ch) => ch.id === chapterId));
}
