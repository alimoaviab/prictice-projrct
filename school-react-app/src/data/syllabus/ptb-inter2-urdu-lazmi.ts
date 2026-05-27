/**
 * PTB Inter Part-II اُردو لازمی (Urdu Compulsory) Syllabus
 * 14 prose (نثر) + 10 poetry (نظم) + 12 ghazals + Grammar sections
 * Urdu text preserved exactly with RTL support
 * ؓ and ؒ symbols preserved exactly where present
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

export const PTB_INTER2_URDU_LAZMI: Unit[] = [
  // ── Prose (نثر) ────────────────────────────────────────────────────────────
  {
    id: "nasar",
    title: "Prose",
    titleUrdu: "نثر",
    type: "section",
    chapters: [
      { id: "n1",  code: "1",  title: "Virtues of Umar ibn Abd al-Azizؓ",                     titleUrdu: "مناقب عمر بن عبدالعزیزؓ",                        type: "chapter" },
      { id: "n2",  code: "2",  title: "Formation of Pakistan",                                  titleUrdu: "تشکیل پاکستان",                                  type: "chapter" },
      { id: "n3",  code: "3",  title: "Nawab Mohsin-ul-Mulk",                                   titleUrdu: "نواب محسن الملک",                                type: "chapter" },
      { id: "n4",  code: "4",  title: "Hard-working and Wise",                                  titleUrdu: "محنت پسند خردمند",                              type: "chapter" },
      { id: "n5",  code: "5",  title: "Follies of Akbari",                                      titleUrdu: "اکبری کی حماقتیں",                              type: "chapter" },
      { id: "n6",  code: "6",  title: "First Victory",                                          titleUrdu: "پہلی فتح",                                       type: "chapter" },
      { id: "n7",  code: "7",  title: "Knock",                                                  titleUrdu: "دستک",                                           type: "chapter" },
      { id: "n8",  code: "8",  title: "Aerial",                                                 titleUrdu: "ہوائی",                                          type: "chapter" },
      { id: "n9",  code: "9",  title: "Maulana Zafar Ali Khan",                                 titleUrdu: "مولانا ظفرعلی خاں",                             type: "chapter" },
      { id: "n10", code: "10", title: "Qazi of Cordoba",                                        titleUrdu: "قرطبہ کا قاضی",                                  type: "chapter" },
      { id: "n11", code: "11", title: "Modern Means of Communication",                          titleUrdu: "مواصلات کے جدید ذرائع",                          type: "chapter" },
      { id: "n12", code: "12", title: "Maulvi Nazir Ahmad Dehlvi",                              titleUrdu: "مولوی نذیر احمد دہلوی",                         type: "chapter" },
      { id: "n13", code: "13", title: "A Travelogue That Belongs Nowhere",                      titleUrdu: "ایک سفر نامہ جو کہیں کا بھی نہیں ہے",           type: "chapter" },
      { id: "n14", code: "14", title: "Ayub Abbasi",                                            titleUrdu: "ایوب عباسی",                                     type: "chapter" },
    ],
  },
  // ── Poetry (نظم) ───────────────────────────────────────────────────────────
  {
    id: "nazm",
    title: "Poetry",
    titleUrdu: "نظم",
    type: "section",
    chapters: [
      { id: "p1",  code: "1",  title: "Hamd",                                              titleUrdu: "حمد",                                              type: "chapter" },
      { id: "p2",  code: "2",  title: "Na'at",                                              titleUrdu: "نعت",                                              type: "chapter" },
      { id: "p3",  code: "3",  title: "May God Keep This Garden Green",                    titleUrdu: "خدا سر سبز رکھے اس چمن کو",                        type: "chapter" },
      { id: "p4",  code: "4",  title: "Islamic Equality",                                  titleUrdu: "اسلامی مساوات",                                    type: "chapter" },
      { id: "p5",  code: "5",  title: "Suraghe Zahirwo",                                   titleUrdu: "سراغِ زاہرو",                                       type: "chapter" },
      { id: "p6",  code: "6",  title: "Human Being",                                       titleUrdu: "آدمی",                                              type: "chapter" },
      { id: "p7",  code: "7",  title: "Address to the Youth",                              titleUrdu: "نوجوان سے خطاب",                                   type: "chapter" },
      { id: "p8",  code: "8",  title: "During a Mountain Journey",                         titleUrdu: "ایک کوہستانی سفر کے دوران میں",                    type: "chapter" },
      { id: "p9",  code: "9",  title: "Change",                                            titleUrdu: "تغیر",                                              type: "chapter" },
      { id: "p10", code: "10", title: "Qit'aat",                                            titleUrdu: "قطعات",                                             type: "chapter" },
    ],
  },
  // ── Ghazals (غزل) ──────────────────────────────────────────────────────────
  {
    id: "ghazal",
    title: "Ghazals",
    titleUrdu: "غزل",
    type: "section",
    chapters: [
      { id: "g1",  code: "1,2",   title: "Ghazal 1,2 — Khawaja Mir Dard",        titleUrdu: "غزل نمبر 1،2: خواجہ میر درد",         type: "chapter" },
      { id: "g2",  code: "3,4",   title: "Ghazal 3,4 — Ghulam Mustafa Hamdani",  titleUrdu: "غزل نمبر 3،4: غلام مصطفی ہمدانی",    type: "chapter" },
      { id: "g3",  code: "5,6",   title: "Ghazal 5,6 — Mirza Ghalib",            titleUrdu: "غزل نمبر 5،6: مرزا غالب",             type: "chapter" },
      { id: "g4",  code: "7,8",   title: "Ghazal 7,8 — Allama Iqbalؒ",           titleUrdu: "غزل نمبر 7،8: علامہ اقبالؒ",          type: "chapter" },
      { id: "g5",  code: "9,10",  title: "Ghazal 9,10 — Nasir Kazmi",            titleUrdu: "غزل نمبر 9،10: ناصر کاظمی",           type: "chapter" },
      { id: "g6",  code: "11",    title: "Ghazal 11 — Firaq Gorakhpuri",          titleUrdu: "غزل نمبر 11: فراق گور کھپوری",        type: "chapter" },
      { id: "g7",  code: "12",    title: "Ghazal 12 — Tabish Dehlavi",            titleUrdu: "غزل نمبر 12: تابش دہلوی",             type: "chapter" },
    ],
  },
  // ── Grammar / Composition (معروضی) ─────────────────────────────────────────
  {
    id: "qawaid-insha",
    title: "Composition and Grammar (Objective)",
    titleUrdu: "حصہ قوائدوانشا (معروضی)",
    type: "section",
    chapters: [
      { id: "q1", code: "1", title: "Agreement and Correct Use of Particles",      titleUrdu: "مطابقت اور حروف کا درست استعمال", type: "chapter" },
      { id: "q2", code: "2", title: "Punctuation Marks",                            titleUrdu: "رموز اوقاف",                       type: "chapter" },
      { id: "q3", code: "3", title: "Use of Masadir as Auxiliary Verbs",            titleUrdu: "مصادر کا بطور امدادی افعال کا استعمال", type: "chapter" },
    ],
  },
  // ── Grammar (Letters & Essays) ─────────────────────────────────────────────
  {
    id: "grammar",
    title: "Grammar (Letters, Essays)",
    titleUrdu: "گرائمر (خطوط)، (مضامین)",
    type: "section",
    chapters: [
      { id: "gr1", code: "1", title: "Letters",     titleUrdu: "خطوط",   type: "chapter" },
      { id: "gr2", code: "2", title: "Essays",      titleUrdu: "مضامین", type: "chapter" },
      { id: "gr3", code: "3", title: "Autobiography",titleUrdu: "آپ بیتی", type: "chapter" },
    ],
  },
];

export function getAllChapters(): Chapter[] { return PTB_INTER2_URDU_LAZMI.flatMap((u) => u.chapters); }
export function getChaptersByUnit(unitId: string): Chapter[] { return PTB_INTER2_URDU_LAZMI.find((u) => u.id === unitId)?.chapters || []; }
export function getUnitByChapterId(chapterId: string): Unit | undefined { return PTB_INTER2_URDU_LAZMI.find((u) => u.chapters.some((ch) => ch.id === chapterId)); }
