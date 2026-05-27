/**
 * PTB Inter Part-I Principles of Accounting Syllabus
 * 15 chapters — text preserved exactly as provided
 */

export interface Chapter { id: string; code: string; title: string; type: "chapter"; }
export interface Unit { id: string; title: string; type: "unit"; chapters: Chapter[]; }

export const PTB_INTER1_PRINCIPLES_OF_ACCOUNTING: Unit[] = [
  { id: "chap-1",  title: "CHAP 1: Introduction",                                          type: "unit", chapters: [{ id: "1",  code: "1",  title: "Introduction",                                                type: "chapter" }] },
  { id: "chap-2",  title: "CHAP 2: Transactions And Accounting Equation",                  type: "unit", chapters: [{ id: "2",  code: "2",  title: "Transactions And Accounting Equation",                        type: "chapter" }] },
  { id: "chap-3",  title: "CHAP 3: Analysis Of Business Transactions And Double Entry System", type: "unit", chapters: [{ id: "3",  code: "3",  title: "Analysis Of Business Transactions And Double Entry System",  type: "chapter" }] },
  { id: "chap-4",  title: "CHAP 4: Journal: The original Book Of Entry",                   type: "unit", chapters: [{ id: "4",  code: "4",  title: "Journal: The Original Book Of Entry",                         type: "chapter" }] },
  { id: "chap-5",  title: "CHAP 5: Ledger: The Main Book Of Accounts",                     type: "unit", chapters: [{ id: "5",  code: "5",  title: "Ledger: The Main Book OF Accounts",                          type: "chapter" }] },
  { id: "chap-6",  title: "CHAP 6: Accounting For Bills Of Exchange",                      type: "unit", chapters: [{ id: "6",  code: "6",  title: "Accounting For Bills Of Exchange",                           type: "chapter" }] },
  { id: "chap-7",  title: "CHAP 7: Special Journals",                                      type: "unit", chapters: [{ id: "7",  code: "7",  title: "Special Journals",                                           type: "chapter" }] },
  { id: "chap-8",  title: "CHAP 8: Cash Book And Bank Reconciliation Statement",           type: "unit", chapters: [{ id: "8",  code: "8",  title: "Cash Book And Bank Reconciliation Statement",                type: "chapter" }] },
  { id: "chap-9",  title: "CHAP 9: Journal Proper And Summery Of Book Keeping To The Trial Balance", type: "unit", chapters: [{ id: "9",  code: "9",  title: "Journal: Proper And Summery Of Book Keeping To Trial Balance", type: "chapter" }] },
  { id: "chap-10", title: "CHAP 10: Final Accounts: The Completion Of Accounting Cycle",   type: "unit", chapters: [{ id: "10", code: "10", title: "Final Accounts: The Completion Of Accounting Cycle",         type: "chapter" }] },
  { id: "chap-11", title: "CHAP 11: Adjustments And Their Effects On Final Accounts",      type: "unit", chapters: [{ id: "11", code: "11", title: "Adjustment And Their Effects On Final Accounts",             type: "chapter" }] },
  { id: "chap-12", title: "CHAP 12: Work Sheet",                                           type: "unit", chapters: [{ id: "12", code: "12", title: "Work Sheet",                                                 type: "chapter" }] },
  { id: "chap-13", title: "CHAP 13: Financial Statements",                                 type: "unit", chapters: [{ id: "13", code: "13", title: "Financial Statements",                                       type: "chapter" }] },
  { id: "chap-14", title: "CHAP 14: Capital And Revenue",                                  type: "unit", chapters: [{ id: "14", code: "14", title: "Capital And Revenue",                                        type: "chapter" }] },
  { id: "chap-15", title: "CHAP 15: Rectification Of Errors",                              type: "unit", chapters: [{ id: "15", code: "15", title: "Rectification Of Errors",                                    type: "chapter" }] },
];

export function getAllChapters(): Chapter[] { return PTB_INTER1_PRINCIPLES_OF_ACCOUNTING.flatMap((u) => u.chapters); }
export function getChaptersByUnit(unitId: string): Chapter[] { return PTB_INTER1_PRINCIPLES_OF_ACCOUNTING.find((u) => u.id === unitId)?.chapters || []; }
export function getUnitByChapterId(chapterId: string): Unit | undefined { return PTB_INTER1_PRINCIPLES_OF_ACCOUNTING.find((u) => u.chapters.some((ch) => ch.id === chapterId)); }
