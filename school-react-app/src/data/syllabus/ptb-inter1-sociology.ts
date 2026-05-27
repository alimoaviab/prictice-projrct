/**
 * PTB Inter Part-I سوشیالوجی (Sociology) Syllabus
 * 15 chapters — Urdu text preserved exactly
 * Note: Chapter 6 heading "منصب اور منصب کار" vs topic "منصب اور کار منصب" — both preserved exactly
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

export const PTB_INTER1_SOCIOLOGY: Unit[] = [
  { id: "chap-1",  title: "Chapter 1: Introduction to Sociology",          titleUrdu: "باب نمبر 1: عمرانیات کا تعارف",          type: "unit", chapters: [{ id: "1",  code: "1",  title: "Introduction to Sociology",          titleUrdu: "عمرانیات کا تعارف",         type: "chapter" }] },
  { id: "chap-2",  title: "Chapter 2: Sociology as a Science",             titleUrdu: "باب نمبر 2: عمرانیات بطور سائنس",        type: "unit", chapters: [{ id: "2",  code: "2",  title: "Sociology as a Science",             titleUrdu: "عمرانیات بطور سائنس",       type: "chapter" }] },
  { id: "chap-3",  title: "Chapter 3: Sociology and Our Life",             titleUrdu: "باب نمبر 3: عمرانیات اور ہماری زندگی",   type: "unit", chapters: [{ id: "3",  code: "3",  title: "Sociology and Our Life",             titleUrdu: "عمرانیات اور ہماری زندگی",  type: "chapter" }] },
  { id: "chap-4",  title: "Chapter 4: Social Interaction",                 titleUrdu: "باب نمبر 4: معاشرتی تفاعل",              type: "unit", chapters: [{ id: "4",  code: "4",  title: "Social Interaction",                 titleUrdu: "معاشرتی تفاعل",             type: "chapter" }] },
  { id: "chap-5",  title: "Chapter 5: Social Groups",                      titleUrdu: "باب نمبر 5: معاشرتی گروہ",               type: "unit", chapters: [{ id: "5",  code: "5",  title: "Social Groups",                      titleUrdu: "معاشرتی گروہ",              type: "chapter" }] },
  {
    id: "chap-6",
    title: "Chapter 6: Status and Role",
    titleUrdu: "باب نمبر 6: منصب اور منصب کار",
    type: "unit",
    // topic text differs from heading — preserved exactly as in source
    chapters: [{ id: "6",  code: "6",  title: "Status and Role",                      titleUrdu: "منصب اور کار منصب",             type: "chapter" }],
  },
  { id: "chap-7",  title: "Chapter 7: Social Norms",                       titleUrdu: "باب نمبر 7: معاشرتی معمولات",            type: "unit", chapters: [{ id: "7",  code: "7",  title: "Social Norms",                       titleUrdu: "معاشرتی معمولات",           type: "chapter" }] },
  { id: "chap-8",  title: "Chapter 8: Deviance and Social Control",        titleUrdu: "باب نمبر 8: انحراف و معاشرتی ضبط",      type: "unit", chapters: [{ id: "8",  code: "8",  title: "Deviance and Social Control",        titleUrdu: "انحراف و معاشرتی ضبط",      type: "chapter" }] },
  { id: "chap-9",  title: "Chapter 9: Conflict of Values",                 titleUrdu: "باب نمبر 9: تصادم اقدار",                type: "unit", chapters: [{ id: "9",  code: "9",  title: "Conflict of Values",                 titleUrdu: "تصادم اقدار",               type: "chapter" }] },
  { id: "chap-10", title: "Chapter 10: Society",                           titleUrdu: "باب نمبر 10: معاشرہ",                   type: "unit", chapters: [{ id: "10", code: "10", title: "Society",                             titleUrdu: "معاشرہ",                    type: "chapter" }] },
  { id: "chap-11", title: "Chapter 11: Culture",                           titleUrdu: "باب نمبر 11: ثقافت",                    type: "unit", chapters: [{ id: "11", code: "11", title: "Culture",                             titleUrdu: "ثقافت",                     type: "chapter" }] },
  { id: "chap-12", title: "Chapter 12: Tribalism / Partisanship",          titleUrdu: "باب نمبر 12: عصبیت",                    type: "unit", chapters: [{ id: "12", code: "12", title: "Tribalism / Partisanship",             titleUrdu: "عصبیت",                     type: "chapter" }] },
  { id: "chap-13", title: "Chapter 13: Social Institutions",               titleUrdu: "باب نمبر 13: معاشرتی ادارے",            type: "unit", chapters: [{ id: "13", code: "13", title: "Social Institutions",                 titleUrdu: "معاشرتی ادارے",             type: "chapter" }] },
  { id: "chap-14", title: "Chapter 14: Social Stratification",             titleUrdu: "باب نمبر 14: معاشرتی درجہ بندی",        type: "unit", chapters: [{ id: "14", code: "14", title: "Social Stratification",                titleUrdu: "معاشرتی درجہ بندی",         type: "chapter" }] },
  { id: "chap-15", title: "Chapter 15: Social Change",                     titleUrdu: "باب نمبر 15: معاشرتی تغیر / تبدیلی",   type: "unit", chapters: [{ id: "15", code: "15", title: "Social Change",                        titleUrdu: "معاشرتی تغیر / تبدیلی",    type: "chapter" }] },
];

export function getAllChapters(): Chapter[] { return PTB_INTER1_SOCIOLOGY.flatMap((u) => u.chapters); }
export function getChaptersByUnit(unitId: string): Chapter[] { return PTB_INTER1_SOCIOLOGY.find((u) => u.id === unitId)?.chapters || []; }
export function getUnitByChapterId(chapterId: string): Unit | undefined { return PTB_INTER1_SOCIOLOGY.find((u) => u.chapters.some((ch) => ch.id === chapterId)); }
