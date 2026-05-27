/**
 * PTB Class 10 پنجابی (Punjabi) Syllabus
 * 7 prose (نثر 7–13) + 10 poetry (نظم 1–10) + 5 ghazals + Grammar section
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

export const PTB_CLASS10_PUNJABI: Unit[] = [
  {
    id: "nasar",
    title: "Prose",
    titleUrdu: "نثر",
    type: "section",
    chapters: [
      { id: "n7",  code: "7",  title: "Ghazi Ilm al-Din Shaheed",          titleUrdu: "غازی علم الدین شہید",           type: "chapter" },
      { id: "n8",  code: "8",  title: "Return",                             titleUrdu: "واپسی",                         type: "chapter" },
      { id: "n9",  code: "9",  title: "Our Region .. Our Heritage",         titleUrdu: "ساڈا وسیب ۔۔ ساڈا ورثہ",      type: "chapter" },
      { id: "n10", code: "10", title: "Story of a Parrot",                  titleUrdu: "قصہ اک طوطے دا",               type: "chapter" },
      { id: "n11", code: "11", title: "Thedda",                             titleUrdu: "ٹھیڈا",                         type: "chapter" },
      { id: "n12", code: "12", title: "Our Environment",                    titleUrdu: "ساڈا ماحول",                   type: "chapter" },
      { id: "n13", code: "13", title: "If Man Has Courage",                 titleUrdu: "ہمت کرے انسان تے",             type: "chapter" },
    ],
  },
  {
    id: "nazm",
    title: "Poetry",
    titleUrdu: "نظم",
    type: "section",
    chapters: [
      { id: "p1",  code: "1",  title: "Peace",                                      titleUrdu: "امن",                                    type: "chapter" },
      { id: "p2",  code: "2",  title: "I Seek Blessings for the Homeland",          titleUrdu: "میں خیراں منگاں دیس دیاں",              type: "chapter" },
      { id: "p3",  code: "3",  title: "Mother of a Martyr",                         titleUrdu: "شہید دی ماں",                           type: "chapter" },
      { id: "p4",  code: "4",  title: "Love for the Homeland",                      titleUrdu: "دیس پیار",                              type: "chapter" },
      { id: "p5",  code: "5",  title: "Prayer of a Student",                        titleUrdu: "اک طالب علم دی دعا",                   type: "chapter" },
      { id: "p6",  code: "6",  title: "May the Homeland Remain Safe",               titleUrdu: "وطن آہلنا رہے سلامت",                  type: "chapter" },
      { id: "p7",  code: "7",  title: "Which Way Should I Go",                      titleUrdu: "کیہڑے پاسے جاواں",                     type: "chapter" },
      { id: "p8",  code: "8",  title: "Sweet Message",                              titleUrdu: "سکھ سنہیڑا",                           type: "chapter" },
      { id: "p9",  code: "9",  title: "Agricultural Song",                          titleUrdu: "زراعتی گیت",                           type: "chapter" },
      { id: "p10", code: "10", title: "Goat Market",                                titleUrdu: "بکرا منڈی",                            type: "chapter" },
    ],
  },
  {
    id: "ghazal",
    title: "Ghazals",
    titleUrdu: "غزل",
    type: "section",
    chapters: [
      { id: "g1", code: "1", title: "Ghazal — Arif Abdul Mateen",           titleUrdu: "عارف عبد المتین",               type: "chapter" },
      { id: "g2", code: "2", title: "Ghazal — Munir Niazi",                 titleUrdu: "منیر نیازی",                    type: "chapter" },
      { id: "g3", code: "3", title: "Ghazal — Iqbal Soukri",                titleUrdu: "اقبال سوکڑی",                   type: "chapter" },
      { id: "g4", code: "4", title: "Ghazal — Akram Majeed",               titleUrdu: "اکرام مجید",                    type: "chapter" },
      { id: "g5", code: "5", title: "Ghazal — Dr. Muhammad Yunus Ahqar",   titleUrdu: "ڈاکٹر محمد یونس احقر",         type: "chapter" },
    ],
  },
  {
    id: "grammar",
    title: "Grammar",
    titleUrdu: "گرائمر",
    type: "section",
    chapters: [
      { id: "gr1", code: "1", title: "Essays",               titleUrdu: "مضامین",      type: "chapter" },
      { id: "gr2", code: "2", title: "Masculine and Feminine", titleUrdu: "مذکر مونث",  type: "chapter" },
      { id: "gr3", code: "3", title: "Singular and Plural",   titleUrdu: "واحد جمع",   type: "chapter" },
    ],
  },
];

export function getAllChapters(): Chapter[] { return PTB_CLASS10_PUNJABI.flatMap((u) => u.chapters); }
export function getChaptersByUnit(unitId: string): Chapter[] { return PTB_CLASS10_PUNJABI.find((u) => u.id === unitId)?.chapters || []; }
export function getUnitByChapterId(chapterId: string): Unit | undefined { return PTB_CLASS10_PUNJABI.find((u) => u.chapters.some((ch) => ch.id === chapterId)); }
