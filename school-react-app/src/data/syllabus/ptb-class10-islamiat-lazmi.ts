/**
 * PTB Class 10 اسلامیات لازمی (Islamiat Compulsory) Syllabus
 * 7 chapters — Urdu/Arabic text preserved exactly
 * ﷺ and ؒ and ؓ preserved exactly
 * "پاب پنجم" preserved exactly as written in source (not "باب")
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

export const PTB_CLASS10_ISLAMIAT_LAZMI: Unit[] = [
  {
    id: "bab-1",
    title: "Chapter 1: Holy Quran and Hadith of the Seal of Prophetsﷺ",
    titleUrdu: "باب اوّل: قرآن مجید و حدیثِ نبویﷺ",
    type: "unit",
    chapters: [
      { id: "1.2", code: "2", title: "Protection and Compilation of Hadith: First Era",    titleUrdu: "حفاظت و تدوینِ حدیث: دورِاوّل",   type: "chapter" },
      { id: "1.3", code: "3", title: "Ahadith-e-Nabawiyyahﷺ",                              titleUrdu: "احادیثِ نبویہﷺ",                   type: "chapter" },
    ],
  },
  {
    id: "bab-2",
    title: "Chapter 2: Faith and Worship",
    titleUrdu: "باب دوم : ایمانیات و عبادات",
    type: "unit",
    chapters: [
      { id: "2.1", code: "2.1", title: "Angels",                                 titleUrdu: "ملائکہ",                          type: "chapter" },
      { id: "2.2", code: "2.2", title: "Divine Books (Heavenly Books)",          titleUrdu: "کتب سماویہ (آسمانی کتابیں)",      type: "chapter" },
      { id: "2.3", code: "2.3", title: "Belief in the Hereafter",                titleUrdu: "عقیدۂ آخرت",                      type: "chapter" },
      { id: "2.4", code: "2.4", title: "Zakat",                                  titleUrdu: "زکوۃ",                             type: "chapter" },
      { id: "2.5", code: "2.5", title: "Hajj and Sacrifice",                     titleUrdu: "حج اور قربانی",                    type: "chapter" },
    ],
  },
  {
    id: "bab-3",
    title: "Chapter 3: Seerah of the Prophet, Seal of Prophetsﷺ",
    titleUrdu: "باب سوم : سیرت نبوی خاتم النبین ﷺ",
    type: "unit",
    chapters: [
      { id: "3.1", code: "3.1", title: "Battle of Tabuk",                                titleUrdu: "غزوۂ تبوک",                       type: "chapter" },
      { id: "3.2", code: "3.2", title: "Farewell Hajj",                                  titleUrdu: "حجۃ الوداع",                      type: "chapter" },
      { id: "3.3", code: "3.3", title: "Passing of the Prophetﷺ (Seal of Prophets)",    titleUrdu: "وصال نبوی (خاتم النبین)",         type: "chapter" },
      { id: "3.4", code: "3.4", title: "Maintaining Family Ties",                        titleUrdu: "صلہ رحمی",                        type: "chapter" },
      { id: "3.5", code: "3.5", title: "Kind Treatment Towards Women",                   titleUrdu: "خواتین کے ساتھ حسن سلوک",        type: "chapter" },
      { id: "3.6", code: "3.6", title: "Method of Upbringing",                           titleUrdu: "اندازِ تربیت",                    type: "chapter" },
    ],
  },
  {
    id: "bab-4",
    title: "Chapter 4: Morals and Etiquettes",
    titleUrdu: "باب چہارم: اخلاق و آداب",
    type: "unit",
    chapters: [
      { id: "4.1", code: "4.1", title: "Sincerity and Piety",                           titleUrdu: "اخلاص و تقویٰ",                   type: "chapter" },
      { id: "4.2", code: "4.2", title: "Concealing Faults",                              titleUrdu: "پردہ پوشی",                        type: "chapter" },
      { id: "4.3", code: "4.3", title: "Lying",                                          titleUrdu: "جھوٹ",                             type: "chapter" },
      { id: "4.4", code: "4.4", title: "Backbiting and Slander",                         titleUrdu: "غیبت اور بہتان",                  type: "chapter" },
      { id: "4.5", code: "4.5", title: "Magic, Omens and Superstition",                 titleUrdu: "جادو،فال اور توہم پرستی",         type: "chapter" },
    ],
  },
  {
    id: "bab-5",
    // "پاب پنجم" preserved exactly as written in source
    title: "Chapter 5: Good Social Conduct and Dealings",
    titleUrdu: "پاب پنجم: حسن معاشرت و معاملات",
    type: "unit",
    chapters: [
      { id: "5.1", code: "5.1", title: "Prohibition of Interest/Usury",         titleUrdu: "سود کی حرمت",                     type: "chapter" },
      { id: "5.2", code: "5.2", title: "Islamic State",                          titleUrdu: "اسلامی ریاست",                    type: "chapter" },
      { id: "5.3", code: "5.3", title: "Jihad in the Way of Allah",              titleUrdu: "جہاز فی سبیل اللہ",               type: "chapter" },
    ],
  },
  {
    id: "bab-6",
    title: "Chapter 6: Sources of Guidance and Islamic Personalities",
    titleUrdu: "باب ششم : ہدایت کے سر چشمے اور مشاہیر اسلام",
    type: "unit",
    chapters: [
      { id: "6.1", code: "6.1", title: "Hazrat Imam Zayd ibn Aliؒ",             titleUrdu: "حضرت امام زید بن علیؒ",            type: "chapter" },
      { id: "6.2", code: "6.2", title: "Hazrat Amr ibn al-Asؓ",                 titleUrdu: "حضرت عمروبن العاصؓ",              type: "chapter" },
      { id: "6.3", code: "6.3", title: "Hazrat Jabir ibn Abdullahؓ",            titleUrdu: "حضرت جابربن عبداللہؓ",            type: "chapter" },
      { id: "6.4", code: "6.4", title: "Hazrat Anas ibn Malikؓ",                titleUrdu: "حضرت انس بن مالکؓ",               type: "chapter" },
      { id: "6.5", code: "6.5", title: "Female Companionsؓ",                    titleUrdu: "صحابیاتؓ",                         type: "chapter" },
      { id: "6.6", code: "6.6", title: "Sufi Saints",                           titleUrdu: "صوفیہ کرام",                       type: "chapter" },
      { id: "6.7", code: "6.7", title: "Scholars and Thinkers",                 titleUrdu: "ؒعلماومفکرین",                     type: "chapter" },
    ],
  },
  {
    id: "bab-7",
    title: "Chapter 7: Islamic Teachings and Requirements of the Modern Age",
    titleUrdu: "باب ہفتم: اسلامی تعلیمات اور عصر حاضر کے تقاضے",
    type: "unit",
    chapters: [
      { id: "7.1", code: "7.1", title: "Future Planning in Islam",              titleUrdu: "اسلام میں مستقبل کی منصوبہ بندی",  type: "chapter" },
      { id: "7.2", code: "7.2", title: "Distinguishing Features of Islamic Civilization", titleUrdu: "اسلامی تہذیب کی امتیازات", type: "chapter" },
    ],
  },
];

export function getAllChapters(): Chapter[] { return PTB_CLASS10_ISLAMIAT_LAZMI.flatMap((u) => u.chapters); }
export function getChaptersByUnit(unitId: string): Chapter[] { return PTB_CLASS10_ISLAMIAT_LAZMI.find((u) => u.id === unitId)?.chapters || []; }
export function getUnitByChapterId(chapterId: string): Unit | undefined { return PTB_CLASS10_ISLAMIAT_LAZMI.find((u) => u.chapters.some((ch) => ch.id === chapterId)); }
