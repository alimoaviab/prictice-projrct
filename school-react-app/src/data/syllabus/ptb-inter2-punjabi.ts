/**
 * PTB Inter Part-II پنجابی (Punjabi) Syllabus
 * 9 prose (نثر) + 23 poetry (نظم) pieces
 * Punjabi/Urdu text preserved exactly with RTL support
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

export const PTB_INTER2_PUNJABI: Unit[] = [
  // ── Prose (نثر) ────────────────────────────────────────────────────────────
  {
    id: "nasar",
    title: "Prose",
    titleUrdu: "نثر",
    type: "section",
    chapters: [
      { id: "n1",  code: "1",  title: "Mysticism and Punjabi Language",          titleUrdu: "تصوف تے پنجابی زبان",            type: "chapter" },
      { id: "n2",  code: "2",  title: "Agriculture Story",                        titleUrdu: "زراعت کہانی",                    type: "chapter" },
      { id: "n3",  code: "3",  title: "Butterflies",                              titleUrdu: "پتنگے",                          type: "chapter" },
      { id: "n4",  code: "4",  title: "Previous Studies",                         titleUrdu: "پچھلی پڑھائی",                  type: "chapter" },
      { id: "n5",  code: "5",  title: "Types of Punjabi Prose",                   titleUrdu: "پنجابی نثر دیاں ونڈاں",         type: "chapter" },
      { id: "n6",  code: "6",  title: "Habba Khatoon",                            titleUrdu: "حبہ خاتون",                      type: "chapter" },
      { id: "n7",  code: "7",  title: "Radar Story",                              titleUrdu: "ریڈار کہانی",                    type: "chapter" },
      { id: "n8",  code: "8",  title: "Dim Light",                                titleUrdu: "گھسمیلا چانن",                   type: "chapter" },
      { id: "n9",  code: "9",  title: "Folk Customs of Punjab",                   titleUrdu: "پنجاب دیاں لوک رسماں",          type: "chapter" },
    ],
  },
  // ── Poetry (نظم) ───────────────────────────────────────────────────────────
  {
    id: "nazm",
    title: "Poetry",
    titleUrdu: "نظم",
    type: "section",
    chapters: [
      { id: "p1",  code: "1",  title: "Hamd",                                         titleUrdu: "حمد",                              type: "chapter" },
      { id: "p2",  code: "2",  title: "Na'at",                                         titleUrdu: "نعت",                              type: "chapter" },
      { id: "p3",  code: "3",  title: "Bol Farid",                                     titleUrdu: "بول فرید",                         type: "chapter" },
      { id: "p4",  code: "4",  title: "Kafian",                                        titleUrdu: "کافیاں",                           type: "chapter" },
      { id: "p5",  code: "5",  title: "Abiyat (Sultan Bahu)",                          titleUrdu: "ابیات (سلطان باہو)",               type: "chapter" },
      { id: "p6",  code: "6",  title: "Kafi (Syed Bhulleh Shah)",                      titleUrdu: "کافی (سید بھلے شاہ)",             type: "chapter" },
      { id: "p7",  code: "7",  title: "Maqola Sha'ir",                                 titleUrdu: "مقولہ شاعر",                       type: "chapter" },
      { id: "p8",  code: "8",  title: "Kalam",                                         titleUrdu: "کلام",                             type: "chapter" },
      { id: "p9",  code: "9",  title: "Kafi — Khawaja Ghulam Farid",                   titleUrdu: "(کافی) خواجہ غلام فرید",          type: "chapter" },
      { id: "p10", code: "10", title: "Chobargy",                                       titleUrdu: "چوبرگے",                           type: "chapter" },
      { id: "p11", code: "11", title: "Ghazal — Allama Yaqoob Anwar",                  titleUrdu: "(غزل) علامہ یعقوب انور",          type: "chapter" },
      { id: "p12", code: "12", title: "Klarkh",                                         titleUrdu: "کلارکھ",                           type: "chapter" },
      { id: "p13", code: "13", title: "Sakay Patar",                                    titleUrdu: "سکے پاتر",                         type: "chapter" },
      { id: "p14", code: "14", title: "Ghazal — Rauf Sheikh",                           titleUrdu: "(غزل) رؤف شیخ",                   type: "chapter" },
      { id: "p15", code: "15", title: "Ghazal — Saleem Kashir",                         titleUrdu: "(غزل) سلیم کاشر",                 type: "chapter" },
      { id: "p16", code: "16", title: "Ghazal — Dr. Anwar Rashid",                      titleUrdu: "(غزل) ڈاکٹر انور رشید",           type: "chapter" },
      { id: "p17", code: "17", title: "Ghazal — Manzoor Wazeerabadi",                   titleUrdu: "(غزل) منظوروزیرآبادی",            type: "chapter" },
      { id: "p18", code: "18", title: "Deep Waters",                                    titleUrdu: "ڈونگھے پانی",                      type: "chapter" },
      { id: "p19", code: "19", title: "Ghazal — Ali Muhammad Malook",                   titleUrdu: "(غزل) علی محمد ملوک",             type: "chapter" },
      { id: "p20", code: "20", title: "Ghazal — Akram Majeed",                          titleUrdu: "(غزل) اکرم مجید",                 type: "chapter" },
      { id: "p21", code: "21", title: "Matan",                                           titleUrdu: "متاں",                             type: "chapter" },
      { id: "p22", code: "22", title: "Song of the Stars",                               titleUrdu: "تاریاں دا گیت",                   type: "chapter" },
      { id: "p23", code: "23", title: "Punjabi Translation of Ghalib's Ghazal",          titleUrdu: "غالب دی غزل دا پنجابی ترجمہ",    type: "chapter" },
    ],
  },
];

export function getAllChapters(): Chapter[] { return PTB_INTER2_PUNJABI.flatMap((u) => u.chapters); }
export function getChaptersByUnit(unitId: string): Chapter[] { return PTB_INTER2_PUNJABI.find((u) => u.id === unitId)?.chapters || []; }
export function getUnitByChapterId(chapterId: string): Unit | undefined { return PTB_INTER2_PUNJABI.find((u) => u.chapters.some((ch) => ch.id === chapterId)); }
