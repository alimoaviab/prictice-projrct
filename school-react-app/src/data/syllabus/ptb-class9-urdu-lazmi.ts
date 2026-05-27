/**
 * PTB Class 9 اُردو لازمی (Urdu Compulsory) Syllabus
 * Nasar (10) + Nazm (6) + Ghazal (4) + Urdu B / Qawaid
 * "(سمارٹ)" tags preserved exactly
 * All heading/topic discrepancies preserved exactly as in source
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

export const PTB_CLASS9_URDU_LAZMI: Unit[] = [
  {
    id: "nasar",
    title: "Prose Section",
    titleUrdu: "حصہ نثر",
    type: "section",
    chapters: [
      { id: "ns1",  code: "1",  title: "Akhlaq Hasanah (Smart)",                                              titleUrdu: "اخلاق حسنہ (سمارٹ)",                                           type: "chapter" },
      { id: "ns2",  code: "2",  title: "Self-Help (Smart)",                                                   titleUrdu: "اپنی مدد آپ (سمارٹ)",                                          type: "chapter" },
      { id: "ns3",  code: "3",  title: "Kaleem and Mirza Zahir Dar Bayg (Smart)",                             titleUrdu: "کلیم اور مرزا ظاہر دار بیگ (سمارٹ)",                          type: "chapter" },
      { id: "ns4",  code: "4",  title: "Nam Dev-Mali (Smart)",                                                titleUrdu: "نام دیو-مالی (سمارٹ)",                                          type: "chapter" },
      { id: "ns5",  code: "5",  title: "Rest and Comfort (Smart)",                                           titleUrdu: "آرام و سکون (سمارٹ)",                                           type: "chapter" },
      { id: "ns6",  code: "6",  title: "Epitaph (Smart)",                                                    titleUrdu: "کتبہ (سمارٹ)",                                                  type: "chapter" },
      { id: "ns7",  code: "7",  title: "Elementary Arithmetic",                                               titleUrdu: "ابتدائی حساب",                                                  type: "chapter" },
      { id: "ns8",  code: "8",  title: "Scenes Strung on a Thread (Smart)",                                  titleUrdu: "لڑی میں پروے ہوئے منظر (سمارٹ)",                               type: "chapter" },
      { id: "ns9",  code: "9",  title: "Wolf",                                                                titleUrdu: "بھیڑیا",                                                        type: "chapter" },
      { id: "ns10", code: "10", title: "Don't Lose Heart, Move Forward, the Goal is Not Far Now (Smart)",    titleUrdu: "حوصلہ نہ ہارو آگے بڑھو منزل اب کے دور نہیں (سمارٹ)",       type: "chapter" },
    ],
  },
  {
    id: "nazm",
    title: "Poetry Section",
    titleUrdu: "حصہ نظم",
    type: "section",
    chapters: [
      { id: "nm1", code: "1", title: "Hamd (Smart)",                               titleUrdu: "حمد (سمارٹ)",                     type: "chapter" },
      { id: "nm2", code: "2", title: "Na'at (Smart)",                              titleUrdu: "نعت (سمارٹ)",                     type: "chapter" },
      { id: "nm3", code: "3", title: "Blessing of Hard Work (Smart)",              titleUrdu: "محنت کی برکت (سمارٹ)",            type: "chapter" },
      { id: "nm4", code: "4", title: "To Javed (Smart)",                           titleUrdu: "جاوید کے نام (سمارٹ)",            type: "chapter" },
      { id: "nm5", code: "5", title: "Piyam-e-Latif (Smart)",                      titleUrdu: "پیام لطیف (سمارٹ)",               type: "chapter" },
      { id: "nm6", code: "6", title: "Cricket and Mushaira",                       titleUrdu: "کرکٹ اور مشاعرہ",                 type: "chapter" },
    ],
  },
  {
    id: "ghazal",
    title: "Ghazal Section",
    titleUrdu: "حصہ غزل",
    type: "section",
    chapters: [
      {
        id: "g1",
        code: "1",
        // heading: "فقیرا نہ آئے صدا کرچلے" — topic: "فقیرا نہ آئے صدا کر چلے" (space) — preserved exactly
        title: "Ghazal 1: Faqira Na Aaye Sada Kar Chale (Smart)",
        titleUrdu: "فقیرا نہ آئے صدا کر چلے (سمارٹ)",
        type: "chapter",
      },
      { id: "g2", code: "2", title: "Ghazal 2: Sun To Sahi Jahan Mein Hai Tera Afsana Kya",               titleUrdu: "سن تو سہی جہاں میں ہے تیرا افسانہ کیا",               type: "chapter" },
      { id: "g3", code: "3", title: "Ghazal 3: Gham Hai Ya Khushi Hai Tu (Smart)",                        titleUrdu: "غم ہے یا خوشی ہے تو (سمارٹ)",                          type: "chapter" },
      {
        id: "g4",
        code: "4",
        // heading: "کاش طوفاں میں سفینے کو اتارا ہو" — topic: "کاش طوفوں میں سفینے کو اتارا ہوا" — preserved exactly
        title: "Ghazal 4: Kash Toofon Mein Safeenay Ko Utara Hua (Smart)",
        titleUrdu: "کاش طوفوں میں سفینے کو اتارا ہوا (سمارٹ)",
        type: "chapter",
      },
    ],
  },
  {
    id: "urdu-b",
    title: "Urdu (B) / Grammar and Composition",
    titleUrdu: "اُردو (ب) / قواعد و انشاء",
    type: "section",
    chapters: [
      { id: "q1",  code: "1",  title: "Singular / Plural",                                  titleUrdu: "واحد / جمع",                                   type: "chapter" },
      { id: "q2",  code: "2",  title: "Masculine / Feminine",                               titleUrdu: "مذکر / مونث",                                  type: "chapter" },
      { id: "q3",  code: "3",  title: "Words / Antonyms",                                   titleUrdu: "الفاظ / متضاد",                                type: "chapter" },
      { id: "q4",  code: "4",  title: "Words / Synonyms",                                   titleUrdu: "الفاظ / مترادف",                               type: "chapter" },
      { id: "q5",  code: "5",  title: "Incorrect Idioms / Correction of Sentences",         titleUrdu: "غلط محاورات / جملوں کی درستگی",              type: "chapter" },
      { id: "q6",  code: "6",  title: "Completion of Idioms",                               titleUrdu: "محاورات کی تکمیل",                             type: "chapter" },
      { id: "q7",  code: "7",  title: "Letters",                                             titleUrdu: "خطوط",                                         type: "chapter" },
      { id: "q8",  code: "8",  title: "Applications",                                       titleUrdu: "درخواستیں",                                    type: "chapter" },
      { id: "q9",  code: "9",  title: "Stories",                                             titleUrdu: "کہانیاں",                                      type: "chapter" },
      { id: "q10", code: "10", title: "Dialogues",                                           titleUrdu: "مکالمے",                                       type: "chapter" },
      { id: "q11", code: "11", title: "Use of 'Ne'",                                         titleUrdu: "\"نے\" کا استعمال",                            type: "chapter" },
      { id: "q12", code: "12", title: "Use of 'Ko'",                                         titleUrdu: "\"کو\" کا استعمال",                            type: "chapter" },
      { id: "q13", code: "13", title: "Agreement of Verb with Subject",                      titleUrdu: "فعل کی فاعل کے ساتھ مطابقت",                  type: "chapter" },
      { id: "q14", code: "14", title: "Agreement of Adjective and Noun",                     titleUrdu: "اسم صفت اور اسم موصوف میں مطابقت",           type: "chapter" },
      { id: "q15", code: "15", title: "Agreement of Pronoun and Antecedent",                 titleUrdu: "اسم ضمیر اور مرجع میں مطابقت",                type: "chapter" },
    ],
  },
];

export function getAllChapters(): Chapter[] { return PTB_CLASS9_URDU_LAZMI.flatMap((u) => u.chapters); }
export function getChaptersByUnit(unitId: string): Chapter[] { return PTB_CLASS9_URDU_LAZMI.find((u) => u.id === unitId)?.chapters || []; }
export function getUnitByChapterId(chapterId: string): Unit | undefined { return PTB_CLASS9_URDU_LAZMI.find((u) => u.chapters.some((ch) => ch.id === chapterId)); }
