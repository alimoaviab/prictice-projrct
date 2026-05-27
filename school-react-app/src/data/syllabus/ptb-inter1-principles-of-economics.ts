/**
 * PTB Inter Part-I Principles of Economics Syllabus
 * 13 chapters
 */

export interface Chapter { id: string; code: string; title: string; type: "chapter"; }
export interface Unit { id: string; title: string; type: "unit"; chapters: Chapter[]; }

export const PTB_INTER1_PRINCIPLES_OF_ECONOMICS: Unit[] = [
  { id: "chap-1",  title: "CHAP 1: Definition Of Economics",                  type: "unit", chapters: [{ id: "1.1",  code: "1.1",  title: "Definition Of Economics",             type: "chapter" }] },
  {
    id: "chap-2",
    title: "CHAP 2: Consumer's Demand Theory",
    type: "unit",
    chapters: [{ id: "2.1", code: "2.1", title: "Consumer's Demand Theory", type: "chapter" }],
  },
  {
    id: "chap-3",
    title: "CHAP 3: Demand And Supply",
    type: "unit",
    chapters: [
      { id: "3.1", code: "3.1", title: "Demand",                             type: "chapter" },
      { id: "3.2", code: "3.2", title: "Supply",                             type: "chapter" },
      { id: "3.3", code: "3.3", title: "Equilibrium of demand and supply",   type: "chapter" },
    ],
  },
  { id: "chap-4",  title: "CHAP 4: Factors Of Production",                   type: "unit", chapters: [{ id: "4.1",  code: "4.1",  title: "Factors of Production",                type: "chapter" }] },
  { id: "chap-5",  title: "CHAP 5: Laws Of Return",                          type: "unit", chapters: [{ id: "5.1",  code: "5.1",  title: "Laws of Return",                       type: "chapter" }] },
  { id: "chap-6",  title: "CHAP 6: Firm's Costs OF Production And Revenues", type: "unit", chapters: [{ id: "6.1",  code: "6.1",  title: "Firm's Costs Of Production And Revenue", type: "chapter" }] },
  { id: "chap-7",  title: "CHAP 7: Price And Output Determination",          type: "unit", chapters: [{ id: "7.1",  code: "7.1",  title: "Price And Output Determination",       type: "chapter" }] },
  { id: "chap-8",  title: "CHAP 8: Resource Pricing",                        type: "unit", chapters: [{ id: "8.1",  code: "8.1",  title: "Resource Pricing",                     type: "chapter" }] },
  { id: "chap-9",  title: "CHAP 9: National Income",                         type: "unit", chapters: [{ id: "9.1",  code: "9.1",  title: "National Income",                      type: "chapter" }] },
  { id: "chap-10", title: "CHAP 10: Money",                                  type: "unit", chapters: [{ id: "10.1", code: "10.1", title: "Money",                                type: "chapter" }] },
  { id: "chap-11", title: "CHAP 11: Business Cycle / Trade Cycle",           type: "unit", chapters: [{ id: "11.1", code: "11.1", title: "Business Cycle / Trade Cycle",          type: "chapter" }] },
  { id: "chap-12", title: "CHAP 12: International Trade",                    type: "unit", chapters: [{ id: "12.1", code: "12.1", title: "International Trade",                  type: "chapter" }] },
  { id: "chap-13", title: "CHAP 13: Public Finance And Zakat",               type: "unit", chapters: [{ id: "13.1", code: "13.1", title: "Public Finance And Zakat",              type: "chapter" }] },
];

export function getAllChapters(): Chapter[] { return PTB_INTER1_PRINCIPLES_OF_ECONOMICS.flatMap((u) => u.chapters); }
export function getChaptersByUnit(unitId: string): Chapter[] { return PTB_INTER1_PRINCIPLES_OF_ECONOMICS.find((u) => u.id === unitId)?.chapters || []; }
export function getUnitByChapterId(chapterId: string): Unit | undefined { return PTB_INTER1_PRINCIPLES_OF_ECONOMICS.find((u) => u.chapters.some((ch) => ch.id === chapterId)); }
