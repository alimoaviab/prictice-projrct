/**
 * PTB Inter Part-II Principles of Accounting Syllabus
 * 9 chapters — text preserved exactly as provided
 */

export interface Chapter { id: string; code: string; title: string; type: "chapter"; }
export interface Unit { id: string; title: string; type: "unit"; chapters: Chapter[]; }

export const PTB_INTER2_PRINCIPLES_OF_ACCOUNTING: Unit[] = [
  { id: "chap-1", title: "CHAP 1: Accounts from Incomplete Records",               type: "unit", chapters: [{ id: "1", code: "1", title: "Accounts from Incomplete Records",              type: "chapter" }] },
  { id: "chap-2", title: "CHAP 2: The Accounts of Non-Profit Making Organizations",type: "unit", chapters: [{ id: "2", code: "2", title: "The Accounts of Non-Profit Making Organizations", type: "chapter" }] },
  { id: "chap-3", title: "CHAP 3: Consignment Accounts",                           type: "unit", chapters: [{ id: "3", code: "3", title: "Consignment Accounts",                          type: "chapter" }] },
  { id: "chap-4", title: "CHAP 4: Accounts of Joint Stock Companies",              type: "unit", chapters: [{ id: "4", code: "4", title: "Accounts of Joint Stock Companies",             type: "chapter" }] },
  { id: "chap-5", title: "CHAP 5: Depreciation, Provisions and Reserves",         type: "unit", chapters: [{ id: "5", code: "5", title: "Depreciation, Provisions and Reserves",         type: "chapter" }] },
  { id: "chap-6", title: "CHAP 6: Partnership Accounts Profit Distribution",       type: "unit", chapters: [{ id: "6", code: "6", title: "Partnership Accounts Profit Distribution",      type: "chapter" }] },
  { id: "chap-7", title: "CHAP 7: Partnership Accounts Admission of a Partner",    type: "unit", chapters: [{ id: "7", code: "7", title: "Partnership Accounts Admission of a Partner",   type: "chapter" }] },
  { id: "chap-8", title: "CHAP 8: Partnership Accounts Retirement and Death",      type: "unit", chapters: [{ id: "8", code: "8", title: "Partnership Accounts Retirement and Death",     type: "chapter" }] },
  { id: "chap-9", title: "CHAP 9: Partnership Accounts Dissolution of the Firm",   type: "unit", chapters: [{ id: "9", code: "9", title: "Partnership Accounts Dissolution of the Firm",  type: "chapter" }] },
];

export function getAllChapters(): Chapter[] { return PTB_INTER2_PRINCIPLES_OF_ACCOUNTING.flatMap((u) => u.chapters); }
export function getChaptersByUnit(unitId: string): Chapter[] { return PTB_INTER2_PRINCIPLES_OF_ACCOUNTING.find((u) => u.id === unitId)?.chapters || []; }
export function getUnitByChapterId(chapterId: string): Unit | undefined { return PTB_INTER2_PRINCIPLES_OF_ACCOUNTING.find((u) => u.chapters.some((ch) => ch.id === chapterId)); }
