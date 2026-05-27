/**
 * PTB Inter Part-I اُردو لازمی (Urdu Compulsory) Syllabus
 * 2 nazm + 8 nasar + 4 nazm + 4 ghazal + Qawaid + Grammar sections
 * "(سمارٹ)" preserved exactly where written
 * ﷺ preserved in text
 * Note: nasar 5 is absent in source — preserved as provided
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

export const PTB_INTER1_URDU_LAZMI: Unit[] = [
  {
    id: "poetry-1",
    title: "Poetry (Opening)",
    titleUrdu: "نظم",
    type: "section",
    chapters: [
      { id: "nm1", code: "1", title: "Hamd (Smart)",  titleUrdu: "حمد (سمارٹ)",  type: "chapter" },
      { id: "nm2", code: "2", title: "Na'at (Smart)", titleUrdu: "نعت (سمارٹ)", type: "chapter" },
    ],
  },
  {
    id: "nasar",
    title: "Prose",
    titleUrdu: "نثر",
    type: "section",
    chapters: [
      { id: "ns1", code: "1", title: "Noble Character of the Prophetﷺ (Smart)",       titleUrdu: "اخلاقِ نبویﷺ (سمارٹ)",                        type: "chapter" },
      { id: "ns2", code: "2", title: "Fasting in Poverty (Smart)",                     titleUrdu: "فاقہ میں روزہ (سمارٹ)",                       type: "chapter" },
      { id: "ns3", code: "3", title: "Letters of Ghalib (Smart)",                      titleUrdu: "مکاتیبِ غالب (سمارٹ)",                        type: "chapter" },
      { id: "ns4", code: "4", title: "Teacher in the Dock (Smart)",                    titleUrdu: "استاد عدالت کے کٹہرے میں (سمارٹ)",           type: "chapter" },
      { id: "ns6", code: "6", title: "And Pakistan was Created (Smart)",               titleUrdu: "اور پاکستان بن گیا (سمارٹ)",                  type: "chapter" },
      { id: "ns7", code: "7", title: "New Law (Smart)",                                titleUrdu: "نیا قانون (سمارٹ)",                           type: "chapter" },
      { id: "ns8", code: "8", title: "Threshold (Smart)",                              titleUrdu: "دہلیز (سمارٹ)",                               type: "chapter" },
      { id: "ns9", code: "9", title: "History's Shroud (Smart)",                       titleUrdu: "تاریخ کا کفن (سمارٹ)",                        type: "chapter" },
    ],
  },
  {
    id: "poetry-2",
    title: "Poetry (Continued)",
    titleUrdu: "نظم",
    type: "section",
    chapters: [
      { id: "nm3", code: "3", title: "O Valley of Lullab (Smart)",                     titleUrdu: "اے وادیِ لولاب (سمارٹ)",                      type: "chapter" },
      { id: "nm4", code: "4", title: "O Traveller from the Homeland, Tell Us (Smart)", titleUrdu: "او دیس سے آنے والے بتا (سمارٹ)",              type: "chapter" },
      { id: "nm5", code: "5", title: "Freedom (Smart)",                                titleUrdu: "آزادی (سمارٹ)",                               type: "chapter" },
      { id: "nm6", code: "6", title: "Sincerity (Smart)",                              titleUrdu: "اِخلاص (سمارٹ)",                              type: "chapter" },
    ],
  },
  {
    id: "ghazal",
    title: "Ghazals",
    titleUrdu: "غزل",
    type: "section",
    chapters: [
      { id: "g2", code: "2", title: "Ghazal 2: No Madness in the Mind, No Desire in the Heart (Smart)", titleUrdu: "غزل نمبر 2: سر میں سودا بھی نہیں،دل میں تمنّا بھی نہیں (سمارٹ)", type: "chapter" },
      { id: "g3", code: "3", title: "Ghazal 3: To Wander Much Restlessly, to Remain Anxious (Smart)",   titleUrdu: "غزل نمبر 3: بے چین بہت پھرنا، گھبرائے ہوئے رہنا (سمارٹ)",         type: "chapter" },
      { id: "g4", code: "4", title: "Ghazal 4: He Broke All Ties While Leaving (Smart)",                titleUrdu: "غزل نمبر 4: سلسلے توڑگیا وہ سبھی جاتے جاتے (سمارٹ)",              type: "chapter" },
      { id: "g5", code: "5", title: "Ghazal 5: Look for the Signal Before the Sails Open (Smart)",      titleUrdu: "غزل نمبر 5: بادباں کھلنے سے پہلے کا اشارہ دیکھنا (سمارٹ)",         type: "chapter" },
    ],
  },
  {
    id: "qawaid-insha",
    title: "Composition and Grammar (Objective)",
    titleUrdu: "حصہ قوائدوانشا (معروضی)",
    type: "section",
    chapters: [
      { id: "q1",  code: "1",  title: "Matla'",                       titleUrdu: "مطلع",                    type: "chapter" },
      { id: "q2",  code: "2",  title: "Maqta'",                       titleUrdu: "مقطع",                   type: "chapter" },
      { id: "q3",  code: "3",  title: "Qafiyah",                      titleUrdu: "قافیہ",                   type: "chapter" },
      { id: "q4",  code: "4",  title: "Radif",                        titleUrdu: "ردیف",                    type: "chapter" },
      { id: "q5",  code: "5",  title: "Talmih",                       titleUrdu: "تلمیح",                   type: "chapter" },
      { id: "q6",  code: "6",  title: "Tashbih",                      titleUrdu: "تشبیہہ",                  type: "chapter" },
      { id: "q7",  code: "7",  title: "Isti'arah",                    titleUrdu: "استعارہ",                 type: "chapter" },
      { id: "q8",  code: "8",  title: "Correction of Sentences",      titleUrdu: "جملوں کی درستگی",        type: "chapter" },
      { id: "q9",  code: "9",  title: "Masculine and Feminine",       titleUrdu: "تذکیر و تانیث",          type: "chapter" },
      { id: "q10", code: "10", title: "Idioms",                       titleUrdu: "محاورات",                 type: "chapter" },
      { id: "q11", code: "11", title: "Majaz Mursal and Kinayah",     titleUrdu: "مجاز مرسل، کنایہ",       type: "chapter" },
      { id: "q12", code: "12", title: "Ilm Badi'",                   titleUrdu: "علم بدیع",                type: "chapter" },
    ],
  },
  {
    id: "grammar",
    title: "Grammar (Dialogue, Reports/Essays, Applications, Receipts, Summary)",
    titleUrdu: "گرائمر (مکالمے، رداد/مضامین، درخواستیں، رسیدیں، تلخیص پیرگراف)",
    type: "section",
    chapters: [
      { id: "gr1", code: "1", title: "Dialogues",              titleUrdu: "مکالمے",                  type: "chapter" },
      { id: "gr2", code: "2", title: "Reports/Essays",         titleUrdu: "رداد/مضامین",             type: "chapter" },
      { id: "gr3", code: "3", title: "Applications",           titleUrdu: "درخواستیں",               type: "chapter" },
      { id: "gr4", code: "4", title: "Receipts",               titleUrdu: "رسیدیں",                  type: "chapter" },
      { id: "gr5", code: "5", title: "Summary of a Paragraph", titleUrdu: "تلخیص پیراگراف",         type: "chapter" },
      { id: "gr6", code: "6", title: "Diary Entries",          titleUrdu: "روزنامچے",                type: "chapter" },
    ],
  },
];

export function getAllChapters(): Chapter[] { return PTB_INTER1_URDU_LAZMI.flatMap((u) => u.chapters); }
export function getChaptersByUnit(unitId: string): Chapter[] { return PTB_INTER1_URDU_LAZMI.find((u) => u.id === unitId)?.chapters || []; }
export function getUnitByChapterId(chapterId: string): Unit | undefined { return PTB_INTER1_URDU_LAZMI.find((u) => u.chapters.some((ch) => ch.id === chapterId)); }
