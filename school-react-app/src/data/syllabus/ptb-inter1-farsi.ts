/**
 * PTB Inter Part-I فارسی (Persian) Syllabus
 * 30 lessons + Grammar section
 * Persian/Urdu text preserved exactly — all spelling inconsistencies from source preserved
 * ؒ preserved where present
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

export const PTB_INTER1_FARSI: Unit[] = [
  // lesson titles use heading text; topic text preserved as-is in titleUrdu
  { id: "d1",  title: "Lesson 1: Translation of Surah Al-Hamd",               titleUrdu: "درس نمبر 1: ترجمہ سورہ الحمد",                     type: "unit", chapters: [{ id: "1",  code: "1",  title: "Translation of Surah Al-Hamd",               titleUrdu: "ترجمہ سورہ الحمد",                    type: "chapter" }] },
  { id: "d2",  title: "Lesson 2: Na'at",                                        titleUrdu: "درس نمبر 2: نعت",                                   type: "unit", chapters: [{ id: "2",  code: "2",  title: "Na'at",                                        titleUrdu: "نعت",                                  type: "chapter" }] },
  { id: "d3",  title: "Lesson 3: Word of God",                                  titleUrdu: "درس نمبر 3: کلام خدا",                              type: "unit", chapters: [{ id: "3",  code: "3",  title: "Word of God",                                  titleUrdu: "کلام خدا",                             type: "chapter" }] },
  { id: "d4",  title: "Lesson 4: Book",                                         titleUrdu: "درس نمبر 4: کتاب",                                  type: "unit", chapters: [{ id: "4",  code: "4",  title: "Book",                                         titleUrdu: "کتاب",                                 type: "chapter" }] },
  { id: "d5",  title: "Lesson 5: Syed Ali Hujwiriؒ (Rightly-Guided Caliphs)",  titleUrdu: "درس نمبر 5: سید علی ہجویریؒ (خلفای راشدین)",       type: "unit", chapters: [{ id: "5",  code: "5",  title: "Syed Ali Hujwiriؒ (Rightly-Guided Caliphs)", titleUrdu: "سید علی ہجویریؒ (خلفای رشدین)",       type: "chapter" }] },
  { id: "d6",  title: "Lesson 6: Pain of the Row of the Branded",               titleUrdu: "درس نمبر 6: درد صفِ داغگاہ",                       type: "unit", chapters: [{ id: "6",  code: "6",  title: "Pain of the Row of the Branded",               titleUrdu: "درد صفِ داغگاہ",                      type: "chapter" }] },
  { id: "d7",  title: "Lesson 7: Imam Ghazali (Letter of Imam to Sultan Sanjar Seljuqi)", titleUrdu: "درس نمبر 7: امام غزالی (نامہ امام بہ سلطان سنجر سلجوقی)", type: "unit", chapters: [{ id: "7",  code: "7",  title: "Imam Ghazali (Letter of Imam to Sultan Sanjar Seljuqi)", titleUrdu: "امام غزالی (نامہ امام بہ سلطان سنجر سلجوقی)", type: "chapter" }] },
  { id: "d8",  title: "Lesson 8: Mas'ud Sa'd Sultan Lahori",                    titleUrdu: "درس نمبر 8: مسعود سعد سلطان لاھوری",               type: "unit", chapters: [{ id: "8",  code: "8",  title: "Mas'ud Sa'd Sultan Lahori",                    titleUrdu: "مسعود سعد سلطان لاھوری",              type: "chapter" }] },
  { id: "d9",  title: "Lesson 9: Jawami' al-Hikayat",                           titleUrdu: "درس نمبر 9: جوامع الحکایات",                        type: "unit", chapters: [{ id: "9",  code: "9",  title: "Jawami' al-Hikayat",                           titleUrdu: "جوامع الحکایات",                       type: "chapter" }] },
  { id: "d10", title: "Lesson 10: Pandha (Poem)",                               titleUrdu: "درس نمبر 10: پندھا(نظم)",                           type: "unit", chapters: [{ id: "10", code: "10", title: "Pandha (Poem)",                               titleUrdu: "پندھا(نظم)",                           type: "chapter" }] },
  { id: "d11", title: "Lesson 11: Musa and the Shepherd (Poem)",                titleUrdu: "درس نمبر 11: موسی و شبان(نظم)",                     type: "unit", chapters: [{ id: "11", code: "11", title: "Musa and the Shepherd (Poem)",                titleUrdu: "موسی و شبان( نظم)",                   type: "chapter" }] },
  { id: "d12", title: "Lesson 12: Sayings of Khawaja Nizam al-Din Auliyaؒ",    titleUrdu: "درس نمبر 12: سخنان خواجہ نظام الدین اولیاءؒ",      type: "unit", chapters: [{ id: "12", code: "12", title: "Sayings of Khawaja Nizam al-Din Auliyaؒ",    titleUrdu: "سخنان خواجہ نظام الدین اولیاءؒ",      type: "chapter" }] },
  { id: "d13", title: "Lesson 13: Ghazals of Khusrow",                          titleUrdu: "درس نمبر 13: غزلھای خسرو",                          type: "unit", chapters: [{ id: "13", code: "13", title: "Ghazals of Khusrow",                          titleUrdu: "غزالھای خسرو",                         type: "chapter" }] },
  { id: "d14", title: "Lesson 14: Pearls from Suluk al-Suluk",                  titleUrdu: "درس نمبر 14: مرواریدھایی ازسلک السلوک",             type: "unit", chapters: [{ id: "14", code: "14", title: "Pearls from Suluk al-Suluk",                  titleUrdu: "مرواریدھایی ازسلک السلوک",             type: "chapter" }] },
  { id: "d15", title: "Lesson 15: Ghazals of Hafiz",                            titleUrdu: "درس نمبر 15: غزلھای حافظ",                          type: "unit", chapters: [{ id: "15", code: "15", title: "Ghazals of Hafiz",                            titleUrdu: "غزلھای حافظ",                          type: "chapter" }] },
  { id: "d16", title: "Lesson 16: Selection from Baharestan",                   titleUrdu: "درس نمبر 16: گزیدہ ای ازبھارستان",                  type: "unit", chapters: [{ id: "16", code: "16", title: "Selection from Baharestan",                   titleUrdu: "گزیدہ ای ازبھارستان",                  type: "chapter" }] },
  { id: "d17", title: "Lesson 17: Selection from Tuzk-e-Jahangiri",             titleUrdu: "درس نمبر 17: گزیدہ ای ازتوزک جھانگیری",            type: "unit", chapters: [{ id: "17", code: "17", title: "Selection from Tuzk-e-Jahangiri",             titleUrdu: "گزیدہ ای ازتوزک جھانگیری",            type: "chapter" }] },
  { id: "d18", title: "Lesson 18: Hazrat Sachal Sarmasतؒ",                      titleUrdu: "درس نمبر 18: حضرت سچل سر مستؒ",                    type: "unit", chapters: [{ id: "18", code: "18", title: "Hazrat Sachal Sarmastؒ",                      titleUrdu: "حضرت سچل سر مستؒ",                    type: "chapter" }] },
  { id: "d19", title: "Lesson 19: Ode to Pakistan",                             titleUrdu: "درس نمبر 19: درودبہ پاکستان",                       type: "unit", chapters: [{ id: "19", code: "19", title: "Ode to Pakistan",                             titleUrdu: "دردبہ پاکستان",                        type: "chapter" }] },
  { id: "d20", title: "Lesson 20: In Class",                                    titleUrdu: "درس نمبر 20: درکلاس",                               type: "unit", chapters: [{ id: "20", code: "20", title: "In Class",                                    titleUrdu: "در کلاس",                              type: "chapter" }] },
  { id: "d21", title: "Lesson 21: Advice to a Son",                             titleUrdu: "درس نمبر 21: نصیحت بہ فرزند",                       type: "unit", chapters: [{ id: "21", code: "21", title: "Advice to a Son",                             titleUrdu: "نصیحت بہ فرزند",                       type: "chapter" }] },
  { id: "d22", title: "Lesson 22: Fatima Jinnah",                               titleUrdu: "درس نمبر 22: فاطمہ جناح",                           type: "unit", chapters: [{ id: "22", code: "22", title: "Fatima Jinnah",                               titleUrdu: "فاطمہ جناح",                           type: "chapter" }] },
  { id: "d23", title: "Lesson 23: Dialogue Between God and Man",                titleUrdu: "درس نمبر 23: محاروہ بین خداوانسان",                 type: "unit", chapters: [{ id: "23", code: "23", title: "Dialogue Between God and Man",                titleUrdu: "محاورہ بین خداوانسان",                 type: "chapter" }] },
  { id: "d24", title: "Lesson 24: Story of Flight",                             titleUrdu: "درس نمبر 24: داستان پرواز",                         type: "unit", chapters: [{ id: "24", code: "24", title: "Story of Flight",                             titleUrdu: "داستان پرواز",                         type: "chapter" }] },
  { id: "d25", title: "Lesson 25: Arrival of Rain",                             titleUrdu: "درس نمبر 25: آمدبھاران",                            type: "unit", chapters: [{ id: "25", code: "25", title: "Arrival of Rain",                             titleUrdu: "آمدبھاران",                            type: "chapter" }] },
  { id: "d26", title: "Lesson 26: A Letter to My Son",                          titleUrdu: "درس نمبر 26: نامہ ای بہ پسرم",                      type: "unit", chapters: [{ id: "26", code: "26", title: "A Letter to My Son",                          titleUrdu: "نامہ ای بہ پسرم",                      type: "chapter" }] },
  { id: "d27", title: "Lesson 27: Ghazal",                                      titleUrdu: "درس نمبر 27: غزل",                                  type: "unit", chapters: [{ id: "27", code: "27", title: "Ghazal",                                      titleUrdu: "غزل",                                  type: "chapter" }] },
  { id: "d28", title: "Lesson 28: Rashid Minhas, Nishan-e-Haidar",              titleUrdu: "درس نمبر 28: راشد منھاس، نشان حیدر",               type: "unit", chapters: [{ id: "28", code: "28", title: "Rashid Minhas, Nishan-e-Haidar",              titleUrdu: "راشد منھاس،نشان حیدر",                type: "chapter" }] },
  { id: "d29", title: "Lesson 29: Value of the Day",                            titleUrdu: "درس نمبر 29: ارزشِ روزش",                           type: "unit", chapters: [{ id: "29", code: "29", title: "Value of the Day",                            titleUrdu: "ارزشِ روزش",                           type: "chapter" }] },
  { id: "d30", title: "Lesson 30: In the Library",                              titleUrdu: "درس نمبر 30: درکتابخانہ",                           type: "unit", chapters: [{ id: "30", code: "30", title: "In the Library",                              titleUrdu: "درکتابخانہ",                            type: "chapter" }] },
  {
    id: "grammar",
    title: "Grammar",
    titleUrdu: "گرائمر",
    type: "section",
    chapters: [{ id: "g1", code: "G", title: "Grammar", titleUrdu: "گرائمر", type: "chapter" }],
  },
];

export function getAllChapters(): Chapter[] { return PTB_INTER1_FARSI.flatMap((u) => u.chapters); }
export function getChaptersByUnit(unitId: string): Chapter[] { return PTB_INTER1_FARSI.find((u) => u.id === unitId)?.chapters || []; }
export function getUnitByChapterId(chapterId: string): Unit | undefined { return PTB_INTER1_FARSI.find((u) => u.chapters.some((ch) => ch.id === chapterId)); }
