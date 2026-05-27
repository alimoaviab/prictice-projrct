/**
 * PTB Class 7 Computer Syllabus
 * 6 units with topics in uppercase as provided
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

export const PTB_CLASS7_COMPUTER: Unit[] = [
  {
    id: "unit-1",
    title: "UNIT 1: Emerging Technologies",
    type: "unit",
    chapters: [
      { id: "1.1", code: "1.1", title: "EMERGING TECHNOLOGY", type: "chapter" },
    ],
  },
  {
    id: "unit-2",
    title: "UNIT 2: Digital Skills",
    type: "unit",
    chapters: [
      { id: "2.1", code: "2.1", title: "THE PURPOSE OF A WORD PROCESSOR",         type: "chapter" },
      { id: "2.2", code: "2.2", title: "CREATE A MULTIMEDIA PRESENTATION",        type: "chapter" },
      { id: "2.3", code: "2.3", title: "THE USES OF ELECTRONIC MAIL (E-MAIL)",    type: "chapter" },
    ],
  },
  {
    id: "unit-3",
    title: "UNIT 3: Computational Thinking",
    type: "unit",
    chapters: [
      { id: "3.1", code: "3.1", title: "Computational Thinking", type: "chapter" },
    ],
  },
  {
    id: "unit-4",
    title: "UNIT 4: Programming",
    type: "unit",
    chapters: [
      { id: "4.1", code: "4.1", title: "COMPUTER STORE INFORMATION USING BINARY CODES", type: "chapter" },
      { id: "4.2", code: "4.2", title: "BINARY AND DECIMAL NUMBER SYSTEMS",             type: "chapter" },
      { id: "4.3", code: "4.3", title: "NUMBER SYSTEM CONVERSION",                      type: "chapter" },
      { id: "4.4", code: "4.4", title: "SCRATCH",                                       type: "chapter" },
    ],
  },
  {
    id: "unit-5",
    title: "UNIT 5: Digital Citizenship",
    type: "unit",
    chapters: [
      { id: "5.1",  code: "5.1",  title: "ETHICS",                                                    type: "chapter" },
      { id: "5.2",  code: "5.2",  title: "ETHICS IN DIGITAL ENVIRONMENT",                             type: "chapter" },
      { id: "5.3",  code: "5.3",  title: "USES OF INTERNET",                                          type: "chapter" },
      { id: "5.4",  code: "5.4",  title: "COPYRIGHT",                                                 type: "chapter" },
      { id: "5.5",  code: "5.5",  title: "PLAGIARISM",                                                type: "chapter" },
      { id: "5.6",  code: "5.6",  title: "PIRACY",                                                    type: "chapter" },
      { id: "5.7",  code: "5.7",  title: "DIGITAL MEDIA BIAS",                                        type: "chapter" },
      { id: "5.8",  code: "5.8",  title: "IMPORTANCE OF UNBIASED MEDIA",                              type: "chapter" },
      { id: "5.9",  code: "5.9",  title: "MISUSE OF COMPUTER RESOURCES",                              type: "chapter" },
      { id: "5.10", code: "5.10", title: "HOW TO SECURE INFORMATION PRIVACY AND CONFIDENTIALITY",     type: "chapter" },
      { id: "5.11", code: "5.11", title: "POSSIBLE DANGERS OF THE INTERNET",                          type: "chapter" },
    ],
  },
  {
    id: "unit-6",
    title: "UNIT 6: Entrepreneurship in Digital Age",
    type: "unit",
    chapters: [
      { id: "6.1",  code: "6.1",  title: "BUSINESS PLAN",                                             type: "chapter" },
      { id: "6.2",  code: "6.2",  title: "PROMOTION",                                                 type: "chapter" },
      { id: "6.3",  code: "6.3",  title: "VALUE PROPOSITION",                                         type: "chapter" },
      { id: "6.4",  code: "6.4",  title: "QUALITY ASSURANCE",                                         type: "chapter" },
      { id: "6.5",  code: "6.5",  title: "IMPORTANCE OF PROJECT MANAGEMENT AND MEDIA LITERACY",       type: "chapter" },
      { id: "6.6",  code: "6.6",  title: "PAYMENTS",                                                  type: "chapter" },
      { id: "6.7",  code: "6.7",  title: "TRANSACTIONS",                                              type: "chapter" },
      { id: "6.8",  code: "6.8",  title: "TOOLS AND TECHNIQUES USED IN DIGITAL MARKETING",            type: "chapter" },
      { id: "6.9",  code: "6.9",  title: "SEARCH ENGINE OPTIMIZATION",                                type: "chapter" },
      { id: "6.10", code: "6.10", title: "TECHNOLOGY AS AN ENABLER IN ENTREPRENEURSHIP",              type: "chapter" },
      { id: "6.11", code: "6.11", title: "DIGITAL PLATFORMS USED FOR ENTREPRENEURSHIP",               type: "chapter" },
    ],
  },
];

export function getAllChapters(): Chapter[] {
  return PTB_CLASS7_COMPUTER.flatMap((u) => u.chapters);
}
export function getChaptersByUnit(unitId: string): Chapter[] {
  return PTB_CLASS7_COMPUTER.find((u) => u.id === unitId)?.chapters || [];
}
export function getUnitByChapterId(chapterId: string): Unit | undefined {
  return PTB_CLASS7_COMPUTER.find((u) => u.chapters.some((ch) => ch.id === chapterId));
}
