/**
 * PTB Inter Part-II Business Statistics Syllabus
 * 6 chapters
 */

export interface Chapter { id: string; code: string; title: string; type: "chapter"; }
export interface Unit { id: string; title: string; type: "unit"; chapters: Chapter[]; }

export const PTB_INTER2_BUSINESS_STATISTICS: Unit[] = [
  { id: "chap-1", title: "CHAP 1: What is Statistics?",                              type: "unit", chapters: [{ id: "1", code: "1", title: "What is Statistics?",                             type: "chapter" }] },
  { id: "chap-2", title: "CHAP 2: Presentation of Data",                             type: "unit", chapters: [{ id: "2", code: "2", title: "Presentation of Data",                            type: "chapter" }] },
  { id: "chap-3", title: "CHAP 3: Averages of First Order",                          type: "unit", chapters: [{ id: "3", code: "3", title: "Averages of First Order",                         type: "chapter" }] },
  { id: "chap-4", title: "CHAP 4: Index Numbers",                                    type: "unit", chapters: [{ id: "4", code: "4", title: "Index Numbers",                                   type: "chapter" }] },
  { id: "chap-5", title: "CHAP 5: Basic Set Theory and Counting Techniques",         type: "unit", chapters: [{ id: "5", code: "5", title: "Basic Set Theory and Counting Techniques",        type: "chapter" }] },
  { id: "chap-6", title: "CHAP 6: Probability Theory",                               type: "unit", chapters: [{ id: "6", code: "6", title: "Probability Theory",                              type: "chapter" }] },
];

export function getAllChapters(): Chapter[] { return PTB_INTER2_BUSINESS_STATISTICS.flatMap((u) => u.chapters); }
export function getChaptersByUnit(unitId: string): Chapter[] { return PTB_INTER2_BUSINESS_STATISTICS.find((u) => u.id === unitId)?.chapters || []; }
export function getUnitByChapterId(chapterId: string): Unit | undefined { return PTB_INTER2_BUSINESS_STATISTICS.find((u) => u.chapters.some((ch) => ch.id === chapterId)); }
