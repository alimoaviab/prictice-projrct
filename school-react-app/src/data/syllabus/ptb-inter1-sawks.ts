/**
 * PTB Inter Part-I سوکس (Civics) Syllabus
 * 9 chapters — Urdu text preserved exactly
 * Note: Chapter 8 heading "آئین" vs topic "دستور" — both preserved exactly as written
 */

export interface Chapter {
  id: string;
  code: string;
  title: string;
  titleUrdu: string;
  type: "chapter";
}

export interface Unit {
  id: string;
  title: string;
  titleUrdu: string;
  type: "unit";
  chapters: Chapter[];
}

export const PTB_INTER1_SAWKS: Unit[] = [
  { id: "chap-1", title: "Chapter 1: Introduction to Civics",                 titleUrdu: "باب نمبر 1: علم شہریت کا تعارف",            type: "unit", chapters: [{ id: "1", code: "1", title: "Introduction to Civics",                 titleUrdu: "علم شہریت کا تعارف",          type: "chapter" }] },
  { id: "chap-2", title: "Chapter 2: Basic Concepts of Civics",               titleUrdu: "باب نمبر 2: علم شہریت کے بنیادی تصورات",    type: "unit", chapters: [{ id: "2", code: "2", title: "Basic Concepts of Civics",               titleUrdu: "علم شہریت کے بنیادی تصورات", type: "chapter" }] },
  { id: "chap-3", title: "Chapter 3: State",                                  titleUrdu: "باب نمبر 3: ریاست",                         type: "unit", chapters: [{ id: "3", code: "3", title: "State",                                  titleUrdu: "ریاست",                       type: "chapter" }] },
  { id: "chap-4", title: "Chapter 4: Sovereignty",                            titleUrdu: "باب نمبر 4: اقتداراعلیٰ",                   type: "unit", chapters: [{ id: "4", code: "4", title: "Sovereignty",                            titleUrdu: "اقتداراعلیٰ",                 type: "chapter" }] },
  { id: "chap-5", title: "Chapter 5: Government",                             titleUrdu: "باب نمبر 5: حکومت",                         type: "unit", chapters: [{ id: "5", code: "5", title: "Government",                             titleUrdu: "حکومت",                       type: "chapter" }] },
  { id: "chap-6", title: "Chapter 6: Law",                                    titleUrdu: "باب نمبر 6: قانون",                         type: "unit", chapters: [{ id: "6", code: "6", title: "Law",                                    titleUrdu: "قانون",                       type: "chapter" }] },
  { id: "chap-7", title: "Chapter 7: Citizen and Citizenship",                titleUrdu: "باب نمبر 7: شہری اور شہریت",                type: "unit", chapters: [{ id: "7", code: "7", title: "Citizen and Citizenship",                titleUrdu: "شہری اور شہریت",              type: "chapter" }] },
  {
    id: "chap-8",
    title: "Chapter 8: Constitution",
    titleUrdu: "باب نمبر 8: آئین",
    type: "unit",
    // topic text in source: "دستور" — preserved exactly (different from heading "آئین")
    chapters: [{ id: "8", code: "8", title: "Constitution",                            titleUrdu: "دستور",                       type: "chapter" }],
  },
  { id: "chap-9", title: "Chapter 9: Political Dynamics",                     titleUrdu: "باب نمبر 9: سیاسی حرکیات",                 type: "unit", chapters: [{ id: "9", code: "9", title: "Political Dynamics",                     titleUrdu: "سیاسی حرکیات",               type: "chapter" }] },
];

export function getAllChapters(): Chapter[] { return PTB_INTER1_SAWKS.flatMap((u) => u.chapters); }
export function getChaptersByUnit(unitId: string): Chapter[] { return PTB_INTER1_SAWKS.find((u) => u.id === unitId)?.chapters || []; }
export function getUnitByChapterId(chapterId: string): Unit | undefined { return PTB_INTER1_SAWKS.find((u) => u.chapters.some((ch) => ch.id === chapterId)); }
