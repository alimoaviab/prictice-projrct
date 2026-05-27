/**
 * PTB Class 10 اُردو لازمی (Urdu Compulsory) Syllabus
 * 20 items: 2 nazm + 10 nasar + 4 nazm + 4 ghazal
 * Urdu text preserved exactly — all heading/topic inconsistencies from source preserved
 * ﷺ preserved in nasar 3
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

export const PTB_CLASS10_URDU_LAZMI: Unit[] = [
  {
    id: "content",
    title: "Urdu Lazmi",
    titleUrdu: "اُردو لازمی",
    type: "section",
    chapters: [
      { id: "1",  code: "1",  title: "Hamd",                                                           titleUrdu: "حمد",                                                          type: "chapter" },
      { id: "2",  code: "2",  title: "Na'at",                                                          titleUrdu: "نعت",                                                          type: "chapter" },
      { id: "3",  code: "3",  title: "Noble Character of the Seal of Prophetsﷺ",                      titleUrdu: "اخلاق نبوی خاتم النبین ﷺ",                                    type: "chapter" },
      { id: "4",  code: "4",  title: "Sir Syed's Childhood",                                           titleUrdu: "سر سید کا بچپن",                                               type: "chapter" },
      { id: "5",  code: "5",  title: "Mohsin's Neighbourhood",                                        titleUrdu: "محسن کا محلہ",                                                 type: "chapter" },
      { id: "6",  code: "6",  title: "Atonement",                                                      titleUrdu: "کفارہ",                                                         type: "chapter" },
      { id: "7",  code: "7",  title: "When My Eyes Opened This Morning",                               titleUrdu: "سویرے جو کل آنکھ میری کھلی",                                   type: "chapter" },
      { id: "8",  code: "8",  title: "The Fruit of Friendship",                                        titleUrdu: "دوستی کا پھل",                                                 type: "chapter" },
      { id: "9",  code: "9",  title: "My Village",                                                     titleUrdu: "میرا گاؤں",                                                     type: "chapter" },
      { id: "10", code: "10", title: "The Ruins of Babylon",                                           titleUrdu: "بابل کے کھنڈر",                                                type: "chapter" },
      { id: "11", code: "11", title: "Old Age Home",                                                   titleUrdu: "اولڈ ایج ہوم",                                                 type: "chapter" },
      {
        id: "12",
        code: "12",
        // heading: "کچھ ذریعہ تعلیم کے باب میں" — topic: "کچھ دیر تعلیم کے باب میں" — both preserved
        title: "Something About the Medium of Education",
        titleUrdu: "کچھ دیر تعلیم کے باب میں",
        type: "chapter",
      },
      { id: "13", code: "13", title: "Adami Namah",                                                    titleUrdu: "آدمی نامہ",                                                    type: "chapter" },
      { id: "14", code: "14", title: "Numod-e-Subh",                                                   titleUrdu: "نمود صبح",                                                     type: "chapter" },
      {
        id: "15",
        code: "15",
        // heading: "خِطاب بہ جوانانِ اسلام" — topic: "خطاب بہ جواناں اسلام" — both preserved
        title: "Address to the Youth of Islam",
        titleUrdu: "خطاب بہ جواناں اسلام",
        type: "chapter",
      },
      { id: "16", code: "16", title: "Waghairah",                                                      titleUrdu: "وغیرہ",                                                         type: "chapter" },
      { id: "17", code: "17", title: "Ghazal: Bazichah-e-Atfal Hai Dunya Mire Agay",                  titleUrdu: "بازیچہ اطفال ہے دنیا مِرے آگے",                               type: "chapter" },
      { id: "18", code: "18", title: "Ghazal: Asar Us Ko Zara Nahin Hota",                            titleUrdu: "اثر اس کو ذرا نہیں ہوتا",                                     type: "chapter" },
      {
        id: "19",
        code: "19",
        // heading: "ہے مشقِ سخن جاری،چکی کی مشقت بھی" — topic: "بے مشق سخن جاری، چکی کی مشقت بھی" — preserved
        title: "Ghazal: Be Mashq-e-Sukhan Jari, Chakki Ki Mashqat Bhi",
        titleUrdu: "بے مشق سخن جاری، چکی کی مشقت بھی",
        type: "chapter",
      },
      {
        id: "20",
        code: "20",
        // heading: "یوں کہنے کو پیرا یہ اظہار بہت ہے" — topic: "یوں کہنے کو پیرایہ اظہار بہت ہے" — preserved
        title: "Ghazal: Yun Kehne Ko Pirayah-e-Izhar Bahut Hai",
        titleUrdu: "یوں کہنے کو پیرایہ اظہار بہت ہے",
        type: "chapter",
      },
    ],
  },
];

export function getAllChapters(): Chapter[] { return PTB_CLASS10_URDU_LAZMI.flatMap((u) => u.chapters); }
export function getChaptersByUnit(unitId: string): Chapter[] { return PTB_CLASS10_URDU_LAZMI.find((u) => u.id === unitId)?.chapters || []; }
export function getUnitByChapterId(chapterId: string): Unit | undefined { return PTB_CLASS10_URDU_LAZMI.find((u) => u.chapters.some((ch) => ch.id === chapterId)); }
