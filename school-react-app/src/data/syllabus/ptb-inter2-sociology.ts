/**
 * PTB Inter Part-II سوشیالوجی (Sociology) Syllabus
 * 14 chapters with Urdu text preserved exactly with RTL support
 * Note: Chapter 5 title vs topic text differ slightly — both preserved as written
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

export const PTB_INTER2_SOCIOLOGY: Unit[] = [
  {
    id: "chap-1",
    title: "Chapter 1: Ethnic and Cultural Heritage of Pakistan",
    titleUrdu: "باب نمبر 1: پاکستان کا نسلی وثقافتی ورثہ",
    type: "unit",
    chapters: [{ id: "1",  code: "1",  title: "Ethnic and Cultural Heritage of Pakistan",     titleUrdu: "پاکستان کا نسلی وثقافتی ورثہ",      type: "chapter" }],
  },
  {
    id: "chap-2",
    title: "Chapter 2: Ideological Foundations of Pakistan",
    titleUrdu: "باب نمبر 2: پاکستان کی نظریاتی بنیادیں",
    type: "unit",
    chapters: [{ id: "2",  code: "2",  title: "Ideological Foundations of Pakistan",          titleUrdu: "پاکستان کی نظریاتی بنیادیں",         type: "chapter" }],
  },
  {
    id: "chap-3",
    title: "Chapter 3: Sub-cultures of Pakistan",
    titleUrdu: "باب نمبر 3: پاکستان کی ذیلی ثقافتیں",
    type: "unit",
    chapters: [{ id: "3",  code: "3",  title: "Sub-cultures of Pakistan",                     titleUrdu: "پاکستان کی ذیلی ثقافتیں",           type: "chapter" }],
  },
  {
    id: "chap-4",
    title: "Chapter 4: Cultural Unity",
    titleUrdu: "باب نمبر 4: ثقافتی یکجہتی",
    type: "unit",
    chapters: [{ id: "4",  code: "4",  title: "Cultural Unity",                               titleUrdu: "ثقافتی یکجہتی",                      type: "chapter" }],
  },
  {
    id: "chap-5",
    title: "Chapter 5: Rural Settlement of Punjab",
    titleUrdu: "باب نمبر 5: پنجاب کی دیہی آباد کاری",
    type: "unit",
    // topic text differs slightly from chapter title — preserved exactly as in source
    chapters: [{ id: "5",  code: "5",  title: "Rural Settlement of Punjab",                   titleUrdu: "پنجاب کی دیہی آبادی کاری",           type: "chapter" }],
  },
  {
    id: "chap-6",
    title: "Chapter 6: Family and Brotherhood",
    titleUrdu: "باب نمبر 6: خاندان اور برادری",
    type: "unit",
    chapters: [{ id: "6",  code: "6",  title: "Family and Brotherhood",                       titleUrdu: "خاندان اور برادری",                  type: "chapter" }],
  },
  {
    id: "chap-7",
    title: "Chapter 7: Religious Institutions",
    titleUrdu: "باب نمبر 7: مذہبی ادارے",
    type: "unit",
    chapters: [{ id: "7",  code: "7",  title: "Religious Institutions",                       titleUrdu: "مذہبی ادارے",                        type: "chapter" }],
  },
  {
    id: "chap-8",
    title: "Chapter 8: Economic Institutions",
    titleUrdu: "باب نمبر 8: معاشی ادارے",
    type: "unit",
    chapters: [{ id: "8",  code: "8",  title: "Economic Institutions",                        titleUrdu: "معاشی ادارے",                        type: "chapter" }],
  },
  {
    id: "chap-9",
    title: "Chapter 9: Education and Educational Institutions",
    titleUrdu: "باب نمبر 9: تعلیم اور تعلیمی ادارے",
    type: "unit",
    chapters: [{ id: "9",  code: "9",  title: "Education and Educational Institutions",       titleUrdu: "تعلیم اور تعلیمی ادارے",             type: "chapter" }],
  },
  {
    id: "chap-10",
    title: "Chapter 10: Political Institutions",
    titleUrdu: "باب نمبر 10: سیاسی ادارے",
    type: "unit",
    chapters: [{ id: "10", code: "10", title: "Political Institutions",                       titleUrdu: "سیاسی ادارے",                        type: "chapter" }],
  },
  {
    id: "chap-11",
    title: "Chapter 11: Demographics of Pakistan",
    titleUrdu: "باب نمبر 11: آبادیات پاکستان",
    type: "unit",
    chapters: [{ id: "11", code: "11", title: "Demographics of Pakistan",                     titleUrdu: "آبادیات پاکستان",                    type: "chapter" }],
  },
  {
    id: "chap-12",
    title: "Chapter 12: Population Problems",
    titleUrdu: "باب نمبر 12: آبادی کے مسائل",
    type: "unit",
    chapters: [{ id: "12", code: "12", title: "Population Problems",                          titleUrdu: "آبادی کے مسائل",                     type: "chapter" }],
  },
  {
    id: "chap-13",
    title: "Chapter 13: Illiteracy",
    titleUrdu: "باب نمبر 13: ناخواندگی",
    type: "unit",
    chapters: [{ id: "13", code: "13", title: "Illiteracy",                                   titleUrdu: "ناخواندگی",                          type: "chapter" }],
  },
  {
    id: "chap-14",
    title: "Chapter 14: Poverty",
    titleUrdu: "باب نمبر 14: غربت",
    type: "unit",
    chapters: [{ id: "14", code: "14", title: "Poverty",                                      titleUrdu: "غربت",                               type: "chapter" }],
  },
];

export function getAllChapters(): Chapter[] {
  return PTB_INTER2_SOCIOLOGY.flatMap((u) => u.chapters);
}
export function getChaptersByUnit(unitId: string): Chapter[] {
  return PTB_INTER2_SOCIOLOGY.find((u) => u.id === unitId)?.chapters || [];
}
export function getUnitByChapterId(chapterId: string): Unit | undefined {
  return PTB_INTER2_SOCIOLOGY.find((u) => u.chapters.some((ch) => ch.id === chapterId));
}
