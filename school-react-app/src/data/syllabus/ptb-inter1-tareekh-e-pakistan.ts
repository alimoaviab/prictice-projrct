/**
 * PTB Inter Part-I تاریخ پاکستان (History of Pakistan) Syllabus
 * 15 chapters — Urdu text preserved exactly with RTL support
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

export const PTB_INTER1_TAREEKH_E_PAKISTAN: Unit[] = [
  { id: "chap-1",  title: "Chapter 1: Evolution of the Two-Nation Theory",                  titleUrdu: "باب نمبر 1: دو قومی نظریہ کا ارتقا",                        type: "unit", chapters: [{ id: "1",  code: "1",  title: "Evolution of the Two-Nation Theory",                  titleUrdu: "دو قومی نظریہ کا ارتقا",                        type: "chapter" }] },
  { id: "chap-2",  title: "Chapter 2: War of Independence 1857",                            titleUrdu: "باب نمبر 2: جنگ آزادی 1857",                                 type: "unit", chapters: [{ id: "2",  code: "2",  title: "War of Independence 1857",                            titleUrdu: "جنگ آزادی 1857",                                 type: "chapter" }] },
  { id: "chap-3",  title: "Chapter 3: Sir Syed Ahmad Khan",                                 titleUrdu: "باب نمبر 3: سر سید احمد خان",                                type: "unit", chapters: [{ id: "3",  code: "3",  title: "Sir Syed Ahmad Khan",                                 titleUrdu: "سر سید احمد خان",                                type: "chapter" }] },
  { id: "chap-4",  title: "Chapter 4: Religious and Political Movements",                   titleUrdu: "باب نمبر 4: مذہبی اور سیاسی تحرکیں",                        type: "unit", chapters: [{ id: "4",  code: "4",  title: "Religious and Political Movements",                   titleUrdu: "مذہبی اور سیاسی تحرکیں",                        type: "chapter" }] },
  { id: "chap-5",  title: "Chapter 5: Partition of Bengal",                                 titleUrdu: "باب نمبر 5: تقسیم بنگال",                                    type: "unit", chapters: [{ id: "5",  code: "5",  title: "Partition of Bengal",                                 titleUrdu: "تقسیم بنگال",                                    type: "chapter" }] },
  { id: "chap-6",  title: "Chapter 6: Simla Delegation and All India Muslim League",        titleUrdu: "باب نمبر 6: شملہ وفد اور آل انڈیا مسلم لیگ",               type: "unit", chapters: [{ id: "6",  code: "6",  title: "Simla Delegation and All India Muslim League",        titleUrdu: "شملہ وفد اور آل انڈیا مسلم لیگ",               type: "chapter" }] },
  { id: "chap-7",  title: "Chapter 7: Political Struggle 1892 to 1929",                    titleUrdu: "باب نمبر 7: سیاسی جدوجہد 1892 تا 1929",                     type: "unit", chapters: [{ id: "7",  code: "7",  title: "Political Struggle 1892 to 1929",                    titleUrdu: "سیاسی جدوجہد 1892 تا 1929",                     type: "chapter" }] },
  { id: "chap-8",  title: "Chapter 8: Allama Iqbal — In Context of Personality and Poetry", titleUrdu: "باب نمبر 8: علامہ اقبال - شخصیت اور شاعری کے تناظر میں",  type: "unit", chapters: [{ id: "8",  code: "8",  title: "Allama Iqbal — In Context of Personality and Poetry", titleUrdu: "علامہ اقبال - شخصیت اور شاعری کے تناظر میں",  type: "chapter" }] },
  { id: "chap-9",  title: "Chapter 9: Chaudhry Rahmat Ali",                                 titleUrdu: "باب نمبر 9: چوھدری رحمت علی",                                type: "unit", chapters: [{ id: "9",  code: "9",  title: "Chaudhry Rahmat Ali",                                 titleUrdu: "چوھدری رحمت علی",                                type: "chapter" }] },
  { id: "chap-10", title: "Chapter 10: Round Table Conference, Government of India Act 1935", titleUrdu: "باب نمبر 10: گول میز کانفرنس، قانون حکومت ھند 1935",       type: "unit", chapters: [{ id: "10", code: "10", title: "Round Table Conference, Government of India Act 1935", titleUrdu: "گول میز کانفرنس، قانون حکومت ھند 1935",          type: "chapter" }] },
  { id: "chap-11", title: "Chapter 11: 1937 Elections and Congress Ministries",             titleUrdu: "باب نمبر 11: 1937 کے انتخابات اور کانگرس وزارتیں",         type: "unit", chapters: [{ id: "11", code: "11", title: "1937 Elections and Congress Ministries",             titleUrdu: "1937 کے انتخابات اور کانگرس وزارتیں",           type: "chapter" }] },
  { id: "chap-12", title: "Chapter 12: Quaid-e-Azam and Reorganization of Muslim League",  titleUrdu: "باب نمبر 12: قائداعظم اور مسلم لیگ کی تنظیم نو",            type: "unit", chapters: [{ id: "12", code: "12", title: "Quaid-e-Azam and Reorganization of Muslim League",  titleUrdu: "قائداعظم اور مسلم لیگ کی تنظیم نو",             type: "chapter" }] },
  { id: "chap-13", title: "Chapter 13: Lahore Resolution 1940",                             titleUrdu: "باب نمبر 13: قرار داد لاہور 1940",                           type: "unit", chapters: [{ id: "13", code: "13", title: "Lahore Resolution 1940",                             titleUrdu: "قرار داد لاہور 1940",                             type: "chapter" }] },
  { id: "chap-14", title: "Chapter 14: Attainment of Pakistan",                             titleUrdu: "باب نمبر 14: حصول پاکستان",                                  type: "unit", chapters: [{ id: "14", code: "14", title: "Attainment of Pakistan",                             titleUrdu: "حصول پاکستان",                                   type: "chapter" }] },
  { id: "chap-15", title: "Chapter 15: Notable Personalities of the Pakistan Movement",    titleUrdu: "باب نمبر 15: مشاہیر تحریک پاکستان",                         type: "unit", chapters: [{ id: "15", code: "15", title: "Notable Personalities of the Pakistan Movement",    titleUrdu: "مشاہیر تحریک پاکستان",                          type: "chapter" }] },
];

export function getAllChapters(): Chapter[] { return PTB_INTER1_TAREEKH_E_PAKISTAN.flatMap((u) => u.chapters); }
export function getChaptersByUnit(unitId: string): Chapter[] { return PTB_INTER1_TAREEKH_E_PAKISTAN.find((u) => u.id === unitId)?.chapters || []; }
export function getUnitByChapterId(chapterId: string): Unit | undefined { return PTB_INTER1_TAREEKH_E_PAKISTAN.find((u) => u.chapters.some((ch) => ch.id === chapterId)); }
