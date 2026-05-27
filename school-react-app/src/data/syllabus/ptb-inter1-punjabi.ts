/**
 * PTB Inter Part-I پنجابی (Punjabi) Syllabus
 * 12 prose (نثر) + 24 poetry (نظم) + Essays section
 * Punjabi/Urdu text preserved exactly with RTL support
 * Incomplete brackets in source preserved exactly:
 *   "دوہڑے (ہاشم شاہ"  "کافی (خواجہ غلام فرید"  "سی حرفی (احمد علی سائیں"
 * ؑ (ayn sign) preserved in نظم 12
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

export const PTB_INTER1_PUNJABI: Unit[] = [
  {
    id: "nasar",
    title: "Prose",
    titleUrdu: "نثر",
    type: "section",
    chapters: [
      { id: "n1",  code: "1",  title: "Mi'raj Sharif",                             titleUrdu: "معراج شریف",                      type: "chapter" },
      { id: "n2",  code: "2",  title: "Story of the Punjabi Language",             titleUrdu: "پنجابی زبان دی کہانی",            type: "chapter" },
      { id: "n3",  code: "3",  title: "Hazrat Baha-ud-Din Zakariya Multani",       titleUrdu: "حضرت بہاؤالدین زکریا ملتانی",    type: "chapter" },
      { id: "n4",  code: "4",  title: "Pakistan has been Created",                 titleUrdu: "پاکستان بن گیا اے",              type: "chapter" },
      { id: "n5",  code: "5",  title: "Under the Sheesham Tree",                  titleUrdu: "ٹاہلی تھلے",                      type: "chapter" },
      { id: "n6",  code: "6",  title: "Shah Abdul Latif Bhittai",                  titleUrdu: "شاہ عبدالطیف بھٹائی",            type: "chapter" },
      { id: "n7",  code: "7",  title: "Skulls and Nests",                          titleUrdu: "کھوپڑیاں تے آہلنے",              type: "chapter" },
      { id: "n8",  code: "8",  title: "London Tube Station",                       titleUrdu: "لندن دے ٹیوب سٹیشن",            type: "chapter" },
      { id: "n9",  code: "9",  title: "Rai Ahmad Khan Kharal Shaheed",             titleUrdu: "رائے احمد خاں کھرل شہید",       type: "chapter" },
      { id: "n10", code: "10", title: "In the Cotton",                             titleUrdu: "کپاہ وچ",                         type: "chapter" },
      { id: "n11", code: "11", title: "Folk Songs",                                titleUrdu: "لوک گیت",                         type: "chapter" },
      { id: "n12", code: "12", title: "Unseen Ailments",                           titleUrdu: "ان ڈٹھے روگ",                    type: "chapter" },
    ],
  },
  {
    id: "nazm",
    title: "Poetry",
    titleUrdu: "نظم",
    type: "section",
    chapters: [
      { id: "p1",  code: "1",  title: "Hamd",                                          titleUrdu: "حمد",                                      type: "chapter" },
      { id: "p2",  code: "2",  title: "Na'at",                                          titleUrdu: "نعت",                                      type: "chapter" },
      { id: "p3",  code: "3",  title: "Shalok",                                         titleUrdu: "شلوک",                                     type: "chapter" },
      { id: "p4",  code: "4",  title: "Kafi",                                           titleUrdu: "کافی",                                     type: "chapter" },
      { id: "p5",  code: "5",  title: "Abiyat",                                         titleUrdu: "ابیات",                                    type: "chapter" },
      { id: "p6",  code: "6",  title: "Dohrray",                                        titleUrdu: "دوہڑے",                                    type: "chapter" },
      { id: "p7",  code: "7",  title: "Si Harfi",                                       titleUrdu: "سی حرفی",                                  type: "chapter" },
      { id: "p8",  code: "8",  title: "Kafi (Baba Bulleh Shah)",                        titleUrdu: "کافی (بابا بلھے شاہ)",                    type: "chapter" },
      { id: "p9",  code: "9",  title: "Supplication and Entreaty of Brothers",          titleUrdu: "منت وزاری کردن برادران",                  type: "chapter" },
      { id: "p10", code: "10", title: "Dohrray (Hashim Shah",                           titleUrdu: "دوہڑے (ہاشم شاہ",                         type: "chapter" },
      { id: "p11", code: "11", title: "Kafi (Khawaja Ghulam Farid",                     titleUrdu: "کافی (خواجہ غلام فرید",                   type: "chapter" },
      { id: "p12", code: "12", title: "Hazrat Yusufؑ",                                  titleUrdu: "حضرت یوسفؑ",                               type: "chapter" },
      { id: "p13", code: "13", title: "Kalam Ishq Lahar",                               titleUrdu: "کلام عشق لہر",                            type: "chapter" },
      { id: "p14", code: "14", title: "Si Harfi (Ahmad Ali Sain",                       titleUrdu: "سی حرفی (احمد علی سائیں",                 type: "chapter" },
      { id: "p15", code: "15", title: "Ghazal — Peer Fazal Gujrati",                   titleUrdu: "(غزل) پیر فضل گجراتی",                    type: "chapter" },
      { id: "p16", code: "16", title: "Warrior and Martyr",                             titleUrdu: "غازی تے شہید",                            type: "chapter" },
      { id: "p17", code: "17", title: "One's Own Beloved",                              titleUrdu: "اپنی سہان",                               type: "chapter" },
      { id: "p18", code: "18", title: "Tauqeer Hussain",                                titleUrdu: "توقیر حسین",                              type: "chapter" },
      { id: "p19", code: "19", title: "At Last There is Light",                         titleUrdu: "اوڑک ہوندی لو",                           type: "chapter" },
      { id: "p20", code: "20", title: "Ghazal — Arif Abdul Mateen",                    titleUrdu: "(غزل) عارف عبدالمتین",                    type: "chapter" },
      { id: "p21", code: "21", title: "New Fresh Blossom",                              titleUrdu: "نواں نواں بور",                           type: "chapter" },
      { id: "p22", code: "22", title: "A Plant",                                        titleUrdu: "ہک بوٹا",                                 type: "chapter" },
      { id: "p23", code: "23", title: "Three Poems",                                    titleUrdu: "تن نظماں",                                type: "chapter" },
      { id: "p24", code: "24", title: "Friday Bazaar",                                  titleUrdu: "جمعہ بازار",                              type: "chapter" },
    ],
  },
  {
    id: "mazameen",
    title: "Essays",
    titleUrdu: "مضامین",
    type: "section",
    chapters: [
      { id: "m1", code: "1", title: "Essays", titleUrdu: "مضامین", type: "chapter" },
    ],
  },
];

export function getAllChapters(): Chapter[] { return PTB_INTER1_PUNJABI.flatMap((u) => u.chapters); }
export function getChaptersByUnit(unitId: string): Chapter[] { return PTB_INTER1_PUNJABI.find((u) => u.id === unitId)?.chapters || []; }
export function getUnitByChapterId(chapterId: string): Unit | undefined { return PTB_INTER1_PUNJABI.find((u) => u.chapters.some((ch) => ch.id === chapterId)); }
