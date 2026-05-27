/**
 * PTB Inter Part-I Principles of Commerce Syllabus
 * 26 chapters — text preserved exactly as provided
 */

export interface Chapter { id: string; code: string; title: string; type: "chapter"; }
export interface Unit { id: string; title: string; type: "unit"; chapters: Chapter[]; }

export const PTB_INTER1_PRINCIPLES_OF_COMMERCE: Unit[] = [
  { id: "chap-1",  title: "CHAP 1: Concept of Business",              type: "unit", chapters: [{ id: "1",  code: "1",  title: "Concept of Business",             type: "chapter" }] },
  { id: "chap-2",  title: "CHAP 2: Nature and Scope of Commerce",     type: "unit", chapters: [{ id: "2",  code: "2",  title: "Nature and Scope of Commerce",    type: "chapter" }] },
  { id: "chap-3",  title: "CHAP 3: Sole Tradership",                  type: "unit", chapters: [{ id: "3",  code: "3",  title: "Sole Tradership",                 type: "chapter" }] },
  { id: "chap-4",  title: "CHAP 4: Partnership",                      type: "unit", chapters: [{ id: "4",  code: "4",  title: "Partnership",                     type: "chapter" }] },
  { id: "chap-5",  title: "CHAP 5: Joint Stock Company-I",            type: "unit", chapters: [{ id: "5",  code: "5",  title: "Joint Stock Company-I",           type: "chapter" }] },
  { id: "chap-6",  title: "CHAP 6: Joint Stock Company-II",           type: "unit", chapters: [{ id: "6",  code: "6",  title: "Joint Stock Company-II",          type: "chapter" }] },
  { id: "chap-7",  title: "CHAP 7: Joint Stock Company-III",          type: "unit", chapters: [{ id: "7",  code: "7",  title: "Joint Stock Company-III",         type: "chapter" }] },
  { id: "chap-8",  title: "CHAP 8: Cooperative Society",              type: "unit", chapters: [{ id: "8",  code: "8",  title: "Cooperative Society",             type: "chapter" }] },
  { id: "chap-9",  title: "CHAP 9: Home Trade",                       type: "unit", chapters: [{ id: "9",  code: "9",  title: "Home Trade",                      type: "chapter" }] },
  { id: "chap-10", title: "CHAP 10: Wholesale Trade",                 type: "unit", chapters: [{ id: "10", code: "10", title: "Wholesale Trade",                 type: "chapter" }] },
  { id: "chap-11", title: "CHAP 11: Retail Trade",                    type: "unit", chapters: [{ id: "11", code: "11", title: "Retail Trade",                    type: "chapter" }] },
  { id: "chap-12", title: "CHAP 12: Foreign Trade",                   type: "unit", chapters: [{ id: "12", code: "12", title: "Foreign Trade",                   type: "chapter" }] },
  { id: "chap-13", title: "CHAP 13: Import Trade",                    type: "unit", chapters: [{ id: "13", code: "13", title: "Import Trade",                    type: "chapter" }] },
  { id: "chap-14", title: "CHAP 14: Export Trade",                    type: "unit", chapters: [{ id: "14", code: "14", title: "Export Trade",                    type: "chapter" }] },
  { id: "chap-15", title: "CHAP 15: Middlemen",                       type: "unit", chapters: [{ id: "15", code: "15", title: "Middlemen",                       type: "chapter" }] },
  { id: "chap-16", title: "CHAP 16: Sales Promotion",                 type: "unit", chapters: [{ id: "16", code: "16", title: "Sales Promotion",                 type: "chapter" }] },
  { id: "chap-17", title: "CHAP 17: Business Finance",                type: "unit", chapters: [{ id: "17", code: "17", title: "Business Finance",                type: "chapter" }] },
  { id: "chap-18", title: "CHAP 18: Insurance",                       type: "unit", chapters: [{ id: "18", code: "18", title: "Insurance",                       type: "chapter" }] },
  { id: "chap-19", title: "CHAP 19: Means of Transportation",         type: "unit", chapters: [{ id: "19", code: "19", title: "Means of Transportation",         type: "chapter" }] },
  { id: "chap-20", title: "CHAP 20: Warehousing",                     type: "unit", chapters: [{ id: "20", code: "20", title: "Warehousing",                     type: "chapter" }] },
  { id: "chap-21", title: "CHAP 21: Chamber of Commerce & Industry",  type: "unit", chapters: [{ id: "21", code: "21", title: "Chamber of Commerce & Industry",  type: "chapter" }] },
  { id: "chap-22", title: "CHAP 22: Office Organization",             type: "unit", chapters: [{ id: "22", code: "22", title: "Office Organization",             type: "chapter" }] },
  { id: "chap-23", title: "CHAP 23: Office Machines",                 type: "unit", chapters: [{ id: "23", code: "23", title: "Office Machines",                 type: "chapter" }] },
  { id: "chap-24", title: "CHAP 24: Filing & Indexing",               type: "unit", chapters: [{ id: "24", code: "24", title: "Filing & Indexing",               type: "chapter" }] },
  { id: "chap-25", title: "CHAP 25: Business Correspondence",         type: "unit", chapters: [{ id: "25", code: "25", title: "Business Correspondence",         type: "chapter" }] },
  { id: "chap-26", title: "CHAP 26: Official Correspondence",         type: "unit", chapters: [{ id: "26", code: "26", title: "Official Correspondence",         type: "chapter" }] },
];

export function getAllChapters(): Chapter[] { return PTB_INTER1_PRINCIPLES_OF_COMMERCE.flatMap((u) => u.chapters); }
export function getChaptersByUnit(unitId: string): Chapter[] { return PTB_INTER1_PRINCIPLES_OF_COMMERCE.find((u) => u.id === unitId)?.chapters || []; }
export function getUnitByChapterId(chapterId: string): Unit | undefined { return PTB_INTER1_PRINCIPLES_OF_COMMERCE.find((u) => u.chapters.some((ch) => ch.id === chapterId)); }
