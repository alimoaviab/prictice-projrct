/**
 * PTB Inter Part-II Pakistan Studies Syllabus
 * 6 chapters — ﷺ symbol preserved exactly
 */

export interface Chapter { id: string; code: string; title: string; type: "chapter"; }
export interface Unit { id: string; title: string; type: "unit"; chapters: Chapter[]; }

export const PTB_INTER2_PAKISTAN_STUDIES: Unit[] = [
  {
    id: "chap-1",
    title: "CHAP 1: Islam and Pakistan",
    type: "unit",
    chapters: [
      { id: "1.1", code: "1.1", title: "Islam as the Ideological Base of Pakistan",                       type: "chapter" },
      { id: "1.2", code: "1.2", title: "The Sunnah of Prophet Muhammad Rasool Allah ﷺ",                  type: "chapter" },
      { id: "1.3", code: "1.3", title: "Basic Principles of Islam",                                      type: "chapter" },
      { id: "1.4", code: "1.4", title: "Definition and Functions of an Islamic Welfare State",           type: "chapter" },
      { id: "1.5", code: "1.5", title: "Basic Principles of An Islamic Welfare State",                   type: "chapter" },
      { id: "1.6", code: "1.6", title: "Objective Resolution",                                           type: "chapter" },
      { id: "1.7", code: "1.7", title: "Islam and Modernism",                                            type: "chapter" },
      { id: "1.8", code: "1.8", title: "Promotion of Peace, Tolerance and Co-Existence in Islam",       type: "chapter" },
    ],
  },
  {
    id: "chap-2",
    title: "CHAP 2: Political and Constitutional Development",
    type: "unit",
    chapters: [
      { id: "2.1",  code: "2.1",  title: "Progress and Problems of Democracy in Pakistan",           type: "chapter" },
      { id: "2.2",  code: "2.2",  title: "Role of Political Parties in Promoting Democracy in Pakistan", type: "chapter" },
      { id: "2.3",  code: "2.3",  title: "Salient Features of the Constitution 1956",                type: "chapter" },
      { id: "2.4",  code: "2.4",  title: "Salient Features of the Constitution 1962",                type: "chapter" },
      { id: "2.5",  code: "2.5",  title: "Reason and Impacts of Separation of East Pakistan",        type: "chapter" },
      { id: "2.6",  code: "2.6",  title: "Salient Features of the Constitution 1973",                type: "chapter" },
      { id: "2.7",  code: "2.7",  title: "Federal Structure under the Constitution of 1973",         type: "chapter" },
      { id: "2.8",  code: "2.8",  title: "Structure of Provincial Governments",                      type: "chapter" },
      { id: "2.9",  code: "2.9",  title: "Role of Judiciary under the Constitution of 1973",         type: "chapter" },
      { id: "2.10", code: "2.10", title: "Important Constitutional Amendments",                       type: "chapter" },
    ],
  },
  {
    id: "chap-3",
    title: "CHAP 3: Administrative System",
    type: "unit",
    chapters: [
      { id: "3.1", code: "3.1", title: "Functions of Federation and Provinces in the Light of the Constitution of 1973",  type: "chapter" },
      { id: "3.2", code: "3.2", title: "Difference between Functions of Central and Provincial Government",               type: "chapter" },
      { id: "3.3", code: "3.3", title: "Administrative Structure and Functions of Azad Jammu and Kashmir and Gilgit Baltistan", type: "chapter" },
      { id: "3.4", code: "3.4", title: "Nature of Relationship Between Federal and Provincial Government",                type: "chapter" },
      { id: "3.5", code: "3.5", title: "Relations Between the Federation and the Provinces",                             type: "chapter" },
      { id: "3.6", code: "3.6", title: "Mutual Relationship Between Provincial and Local Governments",                   type: "chapter" },
      { id: "3.7", code: "3.7", title: "Structure of Different Levels of Local Governments",                             type: "chapter" },
      { id: "3.8", code: "3.8", title: "Functions of Local Governments at Various Levels",                               type: "chapter" },
      { id: "3.9", code: "3.9", title: "Functions of the Metropolitan/ Municipal Corporation",                           type: "chapter" },
    ],
  },
  {
    id: "chap-4",
    title: "CHAP 4: Human Rights",
    type: "unit",
    chapters: [
      { id: "4.1", code: "4.1", title: "Concept of Human Rights",                                         type: "chapter" },
      { id: "4.2", code: "4.2", title: "Islamic Concept of Human Rights",                                 type: "chapter" },
      { id: "4.3", code: "4.3", title: "United Nations Universal Declaration of Human Rights (1948)",     type: "chapter" },
      { id: "4.4", code: "4.4", title: "Nature of Basic Human Rights in Pakistan",                        type: "chapter" },
      { id: "4.5", code: "4.5", title: "Human Rights at National and International Level",               type: "chapter" },
    ],
  },
  {
    id: "chap-5",
    title: "CHAP 5: Education System of Pakistan",
    type: "unit",
    chapters: [
      { id: "5.1", code: "5.1", title: "Concept of Education",                                           type: "chapter" },
      { id: "5.2", code: "5.2", title: "Goals of Education System Of Pakistan",                          type: "chapter" },
      { id: "5.3", code: "5.3", title: "Main Features of the Education System in Pakistan",              type: "chapter" },
      { id: "5.4", code: "5.4", title: "Professional, Technical and Vocational Education in Pakistan",   type: "chapter" },
      { id: "5.5", code: "5.5", title: "Suggestions for Resolving Educational Problems",                 type: "chapter" },
    ],
  },
  {
    id: "chap-6",
    title: "CHAP 6: Sports and Tourism",
    type: "unit",
    chapters: [
      { id: "6.1", code: "6.1", title: "Importance of Sports in a Society",                              type: "chapter" },
      { id: "6.2", code: "6.2", title: "Profile of Pakistan in world's Sports",                          type: "chapter" },
      { id: "6.3", code: "6.3", title: "Indoor Games",                                                   type: "chapter" },
      { id: "6.4", code: "6.4", title: "Indigenous Games of Pakistan and Other Games",                   type: "chapter" },
      { id: "6.5", code: "6.5", title: "Tourism as an Industry",                                         type: "chapter" },
    ],
  },
];

export function getAllChapters(): Chapter[] { return PTB_INTER2_PAKISTAN_STUDIES.flatMap((u) => u.chapters); }
export function getChaptersByUnit(unitId: string): Chapter[] { return PTB_INTER2_PAKISTAN_STUDIES.find((u) => u.id === unitId)?.chapters || []; }
export function getUnitByChapterId(chapterId: string): Unit | undefined { return PTB_INTER2_PAKISTAN_STUDIES.find((u) => u.chapters.some((ch) => ch.id === chapterId)); }
