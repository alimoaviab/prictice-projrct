/**
 * PTB Inter Part-II فارسی (Persian) Syllabus
 * 29 lessons + Grammar section
 * Persian/Urdu text preserved exactly with RTL support
 * ؒ (ra symbol) preserved where present
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
  type: "unit" | "section";
  chapters: Chapter[];
}

export const PTB_INTER2_FARSI: Unit[] = [
  { id: "dars-1",  title: "Lesson 1: Hamd",                                       titleUrdu: "درس نمبر 1: حمد",                                              type: "unit",    chapters: [{ id: "1",  code: "1",  title: "Hamd",                                       titleUrdu: "حمد",                                              type: "chapter" }] },
  { id: "dars-2",  title: "Lesson 2: Na'at",                                       titleUrdu: "درس نمبر 2: نعت",                                              type: "unit",    chapters: [{ id: "2",  code: "2",  title: "Na'at",                                       titleUrdu: "نعت",                                              type: "chapter" }] },
  { id: "dars-3",  title: "Lesson 3: Ain al-Quzat Hamdaniؒ — Selected Letters",   titleUrdu: "درس نمبر 3: عین القضات ھمدانیؒ برگزیدہ نامہ ھا",              type: "unit",    chapters: [{ id: "3",  code: "3",  title: "Ain al-Quzat Hamdaniؒ — Selected Letters",   titleUrdu: "عین القضات ھمدانیؒ برگزیدہ نامہ ھا",              type: "chapter" }] },
  { id: "dars-4",  title: "Lesson 4: Ruba'iyat of Abu Said Abu al-Khayr",         titleUrdu: "درس نمبر 4: رباعیات ابو سعید ابوالخیر",                        type: "unit",    chapters: [{ id: "4",  code: "4",  title: "Ruba'iyat of Abu Said Abu al-Khayr",         titleUrdu: "رباعیات ابو سعید ابوالخیر",                        type: "chapter" }] },
  { id: "dars-5",  title: "Lesson 5: A Moment with Sheikh Abu Said Abu al-Khayrؒ",titleUrdu: "درس نمبر 5: دمی با شیخ ابو سعید ابو الخیرؒ",                  type: "unit",    chapters: [{ id: "5",  code: "5",  title: "A Moment with Sheikh Abu Said Abu al-Khayrؒ", titleUrdu: "دمی با شیخ ابو سعید ابو الخیرؒ",                  type: "chapter" }] },
  { id: "dars-6",  title: "Lesson 6: O Bukhara, Rejoice",                         titleUrdu: "درس نمبر 6: ای بخارا شادباش",                                  type: "unit",    chapters: [{ id: "6",  code: "6",  title: "O Bukhara, Rejoice",                         titleUrdu: "ای بخارا شادباش",                                  type: "chapter" }] },
  { id: "dars-7",  title: "Lesson 7: The Just Amir Sabuktigin and the Doe",       titleUrdu: "درس نمبر 7: امیر عادل سبکتگین و آھوی مادہ",                   type: "unit",    chapters: [{ id: "7",  code: "7",  title: "The Just Amir Sabuktigin and the Doe",       titleUrdu: "امیر عادل سبکتگین و آھوی مادہ",                   type: "chapter" }] },
  { id: "dars-8",  title: "Lesson 8: The Wise and the Ignorant",                  titleUrdu: "درس نمبر 8: دانا و نادان",                                     type: "unit",    chapters: [{ id: "8",  code: "8",  title: "The Wise and the Ignorant",                  titleUrdu: "دانا و نادان",                                     type: "chapter" }] },
  { id: "dars-9",  title: "Lesson 9: Advice of Qabus Namah",                      titleUrdu: "درس نمبر 9: پندھای قابوس نامہ",                                type: "unit",    chapters: [{ id: "9",  code: "9",  title: "Advice of Qabus Namah",                      titleUrdu: "پندھای قابوس نامہ",                                type: "chapter" }] },
  { id: "dars-10", title: "Lesson 10: Airport",                                   titleUrdu: "درس نمبر 10: فرودگاہ",                                         type: "unit",    chapters: [{ id: "10", code: "10", title: "Airport",                                      titleUrdu: "فرودگاہ",                                          type: "chapter" }] },
  { id: "dars-11", title: "Lesson 11: It is From Us That Falls Upon Us",          titleUrdu: "درس نمبر 11: ازماست کہ برماست",                               type: "unit",    chapters: [{ id: "11", code: "11", title: "It is From Us That Falls Upon Us",           titleUrdu: "ازماست کہ برماست",                                 type: "chapter" }] },
  { id: "dars-12", title: "Lesson 12: Rabi'ah al-Adawiyyah",                      titleUrdu: "درس نمبر 12: رابعہ عددیہ",                                    type: "unit",    chapters: [{ id: "12", code: "12", title: "Rabi'ah al-Adawiyyah",                         titleUrdu: "رابعہ عددیہ",                                      type: "chapter" }] },
  { id: "dars-13", title: "Lesson 13: Sultan Qutb al-Din Aybak",                  titleUrdu: "درس نمبر 13: سلطان قطب الدین ایبک",                           type: "unit",    chapters: [{ id: "13", code: "13", title: "Sultan Qutb al-Din Aybak",                    titleUrdu: "سلطان قطب الدین ایبک",                             type: "chapter" }] },
  { id: "dars-14", title: "Lesson 14: Mawlana Jalal al-Din Rumi",                 titleUrdu: "درس نمبر 14: مولانا جلال الدین رومی",                         type: "unit",    chapters: [{ id: "14", code: "14", title: "Mawlana Jalal al-Din Rumi",                   titleUrdu: "مولانا جلال الدین رومی",                           type: "chapter" }] },
  { id: "dars-15", title: "Lesson 15: Friendship of the Ignorant",                titleUrdu: "درس نمبر 15: دوستی نادان",                                    type: "unit",    chapters: [{ id: "15", code: "15", title: "Friendship of the Ignorant",                  titleUrdu: "دوستی نادان",                                      type: "chapter" }] },
  { id: "dars-16", title: "Lesson 16: Flowers of the Rose Garden of Sa'di",       titleUrdu: "درس نمبر 16: گلھاری گلستان سعدی",                             type: "unit",    chapters: [{ id: "16", code: "16", title: "Flowers of the Rose Garden of Sa'di",        titleUrdu: "گلھاری گلستان سعدی",                               type: "chapter" }] },
  { id: "dars-17", title: "Lesson 17: Role of Women in Cultural Progress of Islamic Society", titleUrdu: "درس نمبر 17: نقش بانوان در پیشرفت فرھنگی جامعہ اسلامی", type: "unit", chapters: [{ id: "17", code: "17", title: "Role of Women in Cultural Progress of Islamic Society", titleUrdu: "نقش بانوان در پیشرفت فرھنگی جامعہ اسلامی", type: "chapter" }] },
  { id: "dars-18", title: "Lesson 18: Ghazal",                                    titleUrdu: "درس نمبر 18: غزل",                                             type: "unit",    chapters: [{ id: "18", code: "18", title: "Ghazal",                                         titleUrdu: "غزل",                                              type: "chapter" }] },
  { id: "dars-19", title: "Lesson 19: Lata'if al-Tawa'if",                        titleUrdu: "درس نمبر 19: لطائف الطوائف",                                   type: "unit",    chapters: [{ id: "19", code: "19", title: "Lata'if al-Tawa'if",                           titleUrdu: "لطائف الطوائف",                                    type: "chapter" }] },
  { id: "dars-20", title: "Lesson 20: Air Pollution",                             titleUrdu: "درس نمبر 20: آلودگی ھوا",                                      type: "unit",    chapters: [{ id: "20", code: "20", title: "Air Pollution",                                  titleUrdu: "آلودگی ھوا",                                       type: "chapter" }] },
  { id: "dars-21", title: "Lesson 21: A Miser at the Station",                    titleUrdu: "درس نمبر 21: خسی درمیقات",                                    type: "unit",    chapters: [{ id: "21", code: "21", title: "A Miser at the Station",                        titleUrdu: "خسی درمیقات",                                      type: "chapter" }] },
  { id: "dars-22", title: "Lesson 22: In Praise of Punjab",                       titleUrdu: "درس نمبر 22: در تعریف پنجاب",                                  type: "unit",    chapters: [{ id: "22", code: "22", title: "In Praise of Punjab",                           titleUrdu: "در تعریف پنجاب",                                   type: "chapter" }] },
  { id: "dars-23", title: "Lesson 23: Snake Charmer",                             titleUrdu: "درس نمبر 23: مارگیر",                                          type: "unit",    chapters: [{ id: "23", code: "23", title: "Snake Charmer",                                  titleUrdu: "مارگیر",                                           type: "chapter" }] },
  { id: "dars-24", title: "Lesson 24: Allama Muhammad Iqbal",                     titleUrdu: "درس نمبر 24: علامہ محمد اقبال",                                type: "unit",    chapters: [{ id: "24", code: "24", title: "Allama Muhammad Iqbal",                         titleUrdu: "علامہ محمد اقبال",                                 type: "chapter" }] },
  { id: "dars-25", title: "Lesson 25: Arise From Deep Slumber",                   titleUrdu: "درس نمبر 25: ازخواب گران خیزا",                               type: "unit",    chapters: [{ id: "25", code: "25", title: "Arise From Deep Slumber",                       titleUrdu: "ازخواب گران خیزا",                                 type: "chapter" }] },
  { id: "dars-26", title: "Lesson 26: Kashmir and Pakistan",                      titleUrdu: "درس نمبر 26: کشمیر و پاکستان",                                type: "unit",    chapters: [{ id: "26", code: "26", title: "Kashmir and Pakistan",                          titleUrdu: "کشمیر و پاکستان",                                  type: "chapter" }] },
  { id: "dars-27", title: "Lesson 27: Sain Soheli Sarkarؒ",                       titleUrdu: "درس نمبر 27: سائیں سہیلی سرکارؒ",                            type: "unit",    chapters: [{ id: "27", code: "27", title: "Sain Soheli Sarkarؒ",                           titleUrdu: "سائیں سہیلی سرکارؒ",                              type: "chapter" }] },
  { id: "dars-28", title: "Lesson 28: At the Hospital",                           titleUrdu: "درس نمبر 28: دربیمارستان",                                     type: "unit",    chapters: [{ id: "28", code: "28", title: "At the Hospital",                               titleUrdu: "دربیمارستان",                                      type: "chapter" }] },
  { id: "dars-29", title: "Lesson 29: In the Crossroads of the World",            titleUrdu: "درس نمبر 29: درگذرگاہ جہان",                                   type: "unit",    chapters: [{ id: "29", code: "29", title: "In the Crossroads of the World",               titleUrdu: "درگذرگاہ جہان",                                    type: "chapter" }] },
  {
    id: "grammar",
    title: "Grammar",
    titleUrdu: "گرائمر",
    type: "section",
    chapters: [
      { id: "g-1", code: "G", title: "Grammar", titleUrdu: "گرائمر", type: "chapter" },
    ],
  },
];

export function getAllChapters(): Chapter[] {
  return PTB_INTER2_FARSI.flatMap((u) => u.chapters);
}
export function getChaptersByUnit(unitId: string): Chapter[] {
  return PTB_INTER2_FARSI.find((u) => u.id === unitId)?.chapters || [];
}
export function getUnitByChapterId(chapterId: string): Unit | undefined {
  return PTB_INTER2_FARSI.find((u) => u.chapters.some((ch) => ch.id === chapterId));
}
