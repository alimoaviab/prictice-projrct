/**
 * PTB Inter Part-II Principles of Banking Syllabus
 * 15 chapters — text preserved exactly as provided
 */

export interface Chapter { id: string; code: string; title: string; type: "chapter"; }
export interface Unit { id: string; title: string; type: "unit"; chapters: Chapter[]; }

export const PTB_INTER2_PRINCIPLES_OF_BANKING: Unit[] = [
  { id: "chap-1",  title: "CHAP 1: Beginning and Evolution of Bank",     type: "unit", chapters: [{ id: "1",  code: "1",  title: "Beginning and Evolution of Bank",     type: "chapter" }] },
  { id: "chap-2",  title: "CHAP 2: Commercial Bank",                     type: "unit", chapters: [{ id: "2",  code: "2",  title: "Commercial Bank",                     type: "chapter" }] },
  { id: "chap-3",  title: "CHAP 3: Electronic Banking",                  type: "unit", chapters: [{ id: "3",  code: "3",  title: "Electronic Banking",                  type: "chapter" }] },
  { id: "chap-4",  title: "CHAP 4: Central Bank",                        type: "unit", chapters: [{ id: "4",  code: "4",  title: "Central Bank",                        type: "chapter" }] },
  { id: "chap-5",  title: "CHAP 5: Scheduled & Non-Scheduled Banks",     type: "unit", chapters: [{ id: "5",  code: "5",  title: "Scheduled & Non-Scheduled Banks",     type: "chapter" }] },
  { id: "chap-6",  title: "CHAP 6: Bank Accounts",                       type: "unit", chapters: [{ id: "6",  code: "6",  title: "Bank Accounts",                       type: "chapter" }] },
  { id: "chap-7",  title: "CHAP 7: Banker & Customer Relationship",      type: "unit", chapters: [{ id: "7",  code: "7",  title: "Banker & Customer Relationship",      type: "chapter" }] },
  { id: "chap-8",  title: "CHAP 8: Bank Funds and their Use",            type: "unit", chapters: [{ id: "8",  code: "8",  title: "Bank Funds and their Use",            type: "chapter" }] },
  { id: "chap-9",  title: "CHAP 9: Negotiable Instruments-I",            type: "unit", chapters: [{ id: "9",  code: "9",  title: "Negotiable Instruments-I",            type: "chapter" }] },
  { id: "chap-10", title: "CHAP 10: Negotiable Instruments-II",          type: "unit", chapters: [{ id: "10", code: "10", title: "Negotiable Instruments-II",           type: "chapter" }] },
  { id: "chap-11", title: "CHAP 11: Non-Negotiable Instruments",         type: "unit", chapters: [{ id: "11", code: "11", title: "Non-Negotiable Instruments",          type: "chapter" }] },
  { id: "chap-12", title: "CHAP 12: Foreign Exchange Transaction",       type: "unit", chapters: [{ id: "12", code: "12", title: "Foreign Exchange Transaction",       type: "chapter" }] },
  { id: "chap-13", title: "CHAP 13: Money Market",                       type: "unit", chapters: [{ id: "13", code: "13", title: "Money Market",                       type: "chapter" }] },
  { id: "chap-14", title: "CHAP 14: Banking System in Pakistan",         type: "unit", chapters: [{ id: "14", code: "14", title: "Banking System in Pakistan",         type: "chapter" }] },
  { id: "chap-15", title: "CHAP 15: Islamic Banking",                    type: "unit", chapters: [{ id: "15", code: "15", title: "Islamic Banking",                    type: "chapter" }] },
];

export function getAllChapters(): Chapter[] { return PTB_INTER2_PRINCIPLES_OF_BANKING.flatMap((u) => u.chapters); }
export function getChaptersByUnit(unitId: string): Chapter[] { return PTB_INTER2_PRINCIPLES_OF_BANKING.find((u) => u.id === unitId)?.chapters || []; }
export function getUnitByChapterId(chapterId: string): Unit | undefined { return PTB_INTER2_PRINCIPLES_OF_BANKING.find((u) => u.chapters.some((ch) => ch.id === chapterId)); }
