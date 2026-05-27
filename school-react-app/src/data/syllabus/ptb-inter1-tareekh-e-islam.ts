/**
 * PTB Inter Part-I تاریخِ اسلام (History of Islam) Syllabus
 * 24 chapters — ﷺ and ؒ preserved exactly
 * Note: Bab 4 heading "مکہ میں اشاعت اسلام (I)" but topic same; Bab 5 heading "مدینہ" but topic "مکہ" — preserved exactly
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

export const PTB_INTER1_TAREEKH_E_ISLAM: Unit[] = [
  { id: "chap-1",  title: "Chapter 1: Arabia Before Islam and Its People",                     titleUrdu: "باب نمبر 1: عرب قبل از اسلام اور باشندے",             type: "unit", chapters: [{ id: "1",  code: "1",  title: "Arabia Before Islam and Its People",                    titleUrdu: "عرب قبل از اسلام اور باشندے",        type: "chapter" }] },
  { id: "chap-2",  title: "Chapter 2: Early Life of the Messenger of Allahﷺ",                  titleUrdu: "باب نمبر 2: رسول اللہ ﷺ کی ابتدائی زندگی",            type: "unit", chapters: [{ id: "2",  code: "2",  title: "Early Life of the Messenger of Allahﷺ",               titleUrdu: "رسول اللہ ﷺ کی ابتدائی زندگی",      type: "chapter" }] },
  { id: "chap-3",  title: "Chapter 3: Spread of Islam in Makkah",                              titleUrdu: "باب نمبر 3: مکہ میں اشاعت اسلام",                     type: "unit", chapters: [{ id: "3",  code: "3",  title: "Spread of Islam in Makkah",                           titleUrdu: "مکہ میں اشاعت اسلام",                type: "chapter" }] },
  { id: "chap-4",  title: "Chapter 4: Spread of Islam in Makkah (I)",                         titleUrdu: "باب نمبر 4: مکہ میں اشاعت اسلام (I)",                 type: "unit", chapters: [{ id: "4",  code: "4",  title: "Spread of Islam in Makkah (I)",                       titleUrdu: "مکہ میں اشاعت اسلام (I)",            type: "chapter" }] },
  {
    id: "chap-5",
    title: "Chapter 5: Spread of Islam in Madinah (II)",
    titleUrdu: "باب نمبر 5: مدینہ میں اشاعت اسلام (II)",
    type: "unit",
    // topic text "مکہ میں اشاعت اسلام (II)" differs from heading — preserved exactly
    chapters: [{ id: "5",  code: "5",  title: "Spread of Islam (II)",                           titleUrdu: "مکہ میں اشاعت اسلام (II)",            type: "chapter" }],
  },
  { id: "chap-6",  title: "Chapter 6: Spread of Islam in Madinah (III)",                       titleUrdu: "باب نمبر 6: مدینہ میں اشاعت اسلام (III)",             type: "unit", chapters: [{ id: "6",  code: "6",  title: "Spread of Islam in Madinah (III)",                    titleUrdu: "مدینہ میں اشاعت اسلام (III)",        type: "chapter" }] },
  { id: "chap-7",  title: "Chapter 7: Seerah of the Prophetﷺ",                                 titleUrdu: "باب نمبر 7: نبیﷺ کی سیرت",                            type: "unit", chapters: [{ id: "7",  code: "7",  title: "Seerah of the Prophetﷺ",                              titleUrdu: "نبیﷺ کی سیرت",                        type: "chapter" }] },
  { id: "chap-8",  title: "Chapter 8: Rightly-Guided Caliphate (I)",                           titleUrdu: "باب نمبر 8: خلافت راشدہ (I)",                          type: "unit", chapters: [{ id: "8",  code: "8",  title: "Rightly-Guided Caliphate (I)",                        titleUrdu: "خلافت راشدہ (I)",                     type: "chapter" }] },
  { id: "chap-9",  title: "Chapter 9: Rightly-Guided Caliphate (II)",                          titleUrdu: "باب نمبر 9: خلافت راشدہ (II)",                         type: "unit", chapters: [{ id: "9",  code: "9",  title: "Rightly-Guided Caliphate (II)",                       titleUrdu: "خلافت راشدہ (II)",                    type: "chapter" }] },
  { id: "chap-10", title: "Chapter 10: Rightly-Guided Caliphate (III)",                        titleUrdu: "باب نمبر 10: خلافت راشدہ (III)",                       type: "unit", chapters: [{ id: "10", code: "10", title: "Rightly-Guided Caliphate (III)",                      titleUrdu: "خلافت راشدہ (III)",                   type: "chapter" }] },
  { id: "chap-11", title: "Chapter 11: Rightly-Guided Caliphate (IV)",                         titleUrdu: "باب نمبر 11: خلافت راشدہ (IV)",                        type: "unit", chapters: [{ id: "11", code: "11", title: "Rightly-Guided Caliphate (IV)",                       titleUrdu: "خلافت راشدہ (IV)",                    type: "chapter" }] },
  { id: "chap-12", title: "Chapter 12: Rightly-Guided Caliphate (V)",                          titleUrdu: "باب نمبر 12: خلافت راشدہ (V)",                         type: "unit", chapters: [{ id: "12", code: "12", title: "Rightly-Guided Caliphate (V)",                        titleUrdu: "خلافت راشدہ (V)",                     type: "chapter" }] },
  { id: "chap-13", title: "Chapter 13: Hazrat Amir Mu'awiyah",                                  titleUrdu: "باب نمبر 13: حضرت امیر معاویہ",                        type: "unit", chapters: [{ id: "13", code: "13", title: "Hazrat Amir Mu'awiyah",                                titleUrdu: "حضرت امیر معاویہ",                    type: "chapter" }] },
  { id: "chap-14", title: "Chapter 14: Yazid I, Tragedy of Karbala",                           titleUrdu: "باب نمبر 14: یزید اول، سانحہ کربلا",                   type: "unit", chapters: [{ id: "14", code: "14", title: "Yazid I, Tragedy of Karbala",                           titleUrdu: "یزید اول، سانحہ کربلا",               type: "chapter" }] },
  { id: "chap-15", title: "Chapter 15: Mu'awiyah II and Marwan ibn Hakam",                      titleUrdu: "باب نمبر 15: معاویہ ثانی اور مروان بن حکم",            type: "unit", chapters: [{ id: "15", code: "15", title: "Mu'awiyah II and Marwan ibn Hakam",                      titleUrdu: "معاویہ ثانی اور مروان بن حکم",        type: "chapter" }] },
  { id: "chap-16", title: "Chapter 16: Hazrat Abdullah ibn Zubayr",                             titleUrdu: "باب نمبر 16: حضرت عبداللہ بن زبیر",                    type: "unit", chapters: [{ id: "16", code: "16", title: "Hazrat Abdullah ibn Zubayr",                             titleUrdu: "حضرت عبداللہ بن زبیر",                type: "chapter" }] },
  { id: "chap-17", title: "Chapter 17: Abd al-Malik ibn Marwan",                                titleUrdu: "باب نمبر 17: عبدالملک بن مروان",                       type: "unit", chapters: [{ id: "17", code: "17", title: "Abd al-Malik ibn Marwan",                                titleUrdu: "عبدالملک بن مروان",                   type: "chapter" }] },
  { id: "chap-18", title: "Chapter 18: Walid ibn Abd al-Malik",                                 titleUrdu: "باب نمبر 18: ولید بن عبدالملک",                        type: "unit", chapters: [{ id: "18", code: "18", title: "Walid ibn Abd al-Malik",                                 titleUrdu: "ولید بن عبدالملک",                    type: "chapter" }] },
  { id: "chap-19", title: "Chapter 19: Sulayman ibn Abd al-Malik",                              titleUrdu: "باب نمبر 19: سلیمان بن عبدالملک",                      type: "unit", chapters: [{ id: "19", code: "19", title: "Sulayman ibn Abd al-Malik",                              titleUrdu: "سلیمان بن عبدالملک",                  type: "chapter" }] },
  { id: "chap-20", title: "Chapter 20: Hazrat Umar ibn Abd al-Azizؒ",                           titleUrdu: "باب نمبر 20: حضرت عمر بن عبدالعزیزؒ",                  type: "unit", chapters: [{ id: "20", code: "20", title: "Hazrat Umar ibn Abd al-Azizؒ",                           titleUrdu: "حضرت عمر بن عبدالعزیزؒ",              type: "chapter" }] },
  { id: "chap-21", title: "Chapter 21: Yazid II",                                               titleUrdu: "باب نمبر 21: یزید ثانی",                                type: "unit", chapters: [{ id: "21", code: "21", title: "Yazid II",                                               titleUrdu: "یزید ثانی",                           type: "chapter" }] },
  { id: "chap-22", title: "Chapter 22: Hisham ibn Abd al-Malik",                                titleUrdu: "باب نمبر 22: ہشام بن عبدالملک",                        type: "unit", chapters: [{ id: "22", code: "22", title: "Hisham ibn Abd al-Malik",                                titleUrdu: "ہشام بن عبدالملک",                    type: "chapter" }] },
  { id: "chap-23", title: "Chapter 23: Marwan II — Abbasid Movement",                           titleUrdu: "باب نمبر 23: مروان ثانی - عباسی تحریک",                type: "unit", chapters: [{ id: "23", code: "23", title: "Marwan II — Abbasid Movement",                           titleUrdu: "مروان ثانی - عباسی تحریک",            type: "chapter" }] },
  { id: "chap-24", title: "Chapter 24: A Glance at the Umayyad Era",                            titleUrdu: "باب نمبر 24: عہد بنو امیہ پر ایک نظر",                 type: "unit", chapters: [{ id: "24", code: "24", title: "A Glance at the Umayyad Era",                            titleUrdu: "عہد بنو امیہ پر ایک نظر",             type: "chapter" }] },
];

export function getAllChapters(): Chapter[] { return PTB_INTER1_TAREEKH_E_ISLAM.flatMap((u) => u.chapters); }
export function getChaptersByUnit(unitId: string): Chapter[] { return PTB_INTER1_TAREEKH_E_ISLAM.find((u) => u.id === unitId)?.chapters || []; }
export function getUnitByChapterId(chapterId: string): Unit | undefined { return PTB_INTER1_TAREEKH_E_ISLAM.find((u) => u.chapters.some((ch) => ch.id === chapterId)); }
