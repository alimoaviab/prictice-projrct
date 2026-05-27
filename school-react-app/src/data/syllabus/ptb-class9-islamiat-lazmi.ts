/**
 * PTB Class 9 اسلامیات لازمی (Islamiat Compulsory) Syllabus
 * 7 chapters — ﷺ and ؒ and ؓ preserved exactly
 * "(سمارٹ)" tags preserved exactly where written
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

export const PTB_CLASS9_ISLAMIAT_LAZMI: Unit[] = [
  {
    id: "bab-1",
    title: "Chapter 1: Holy Quran and Hadith of the Seal of Prophetsﷺ",
    titleUrdu: "باب اول: قرآن مجید اور حدیث نبوی خاتم النبین ﷺ",
    type: "unit",
    chapters: [
      { id: "1.1", code: "1.1", title: "Compilation and Protection of the Holy Quran",          titleUrdu: "قرآن مجید کی تدوین اور اس کی حفاظت",                     type: "chapter" },
      { id: "1.2", code: "1.2", title: "Protection and Compilation of Hadith (First Era)",      titleUrdu: "حفاظت و تدوین حدیث (دوراول)",                           type: "chapter" },
      { id: "1.3", code: "1.3", title: "Ahadith-e-Nabawiyyah (Seal of Prophetsﷺ)",             titleUrdu: "احادیثِ نبویہ (خاتم النبین ﷺ)",                         type: "chapter" },
      { id: "1.4", code: "1.4", title: "Al-Asma ul-Husna",                                       titleUrdu: "اَلاَسمَاءُ الحُسنٰی",                                    type: "chapter" },
    ],
  },
  {
    id: "bab-2",
    title: "Chapter 2: Faith and Worship",
    titleUrdu: "باب دوم: ایمانیات و عبادات",
    type: "unit",
    chapters: [
      { id: "2.1", code: "2.1", title: "Belief in Tawheed",                                     titleUrdu: "عقیدہ توحید",                                             type: "chapter" },
      { id: "2.2", code: "2.2", title: "Belief in Prophethood",                                 titleUrdu: "عقیدہ رسالت",                                            type: "chapter" },
      { id: "2.3", code: "2.3", title: "Angels",                                                titleUrdu: "ملائکہ (فرشتے)",                                         type: "chapter" },
      { id: "2.4", code: "2.4", title: "Divine Books (Heavenly Books)",                         titleUrdu: "کُتب سماویہ (آسمانی کتابیں)",                            type: "chapter" },
      { id: "2.5", code: "2.5", title: "Belief in the Hereafter",                               titleUrdu: "عقیدہ آخرت",                                             type: "chapter" },
      { id: "2.6", code: "2.6", title: "Prayer",                                                titleUrdu: "نماز",                                                   type: "chapter" },
      { id: "2.7", code: "2.7", title: "Fasting",                                               titleUrdu: "روزہ",                                                   type: "chapter" },
      { id: "2.8", code: "2.8", title: "Zakat",                                                 titleUrdu: "زکوۃ",                                                   type: "chapter" },
      { id: "2.9", code: "2.9", title: "Hajj and Sacrifice",                                    titleUrdu: "حج اور قربانی",                                          type: "chapter" },
    ],
  },
  {
    id: "bab-3",
    title: "Chapter 3: Seerah of the Prophet, Seal of Prophetsﷺ",
    titleUrdu: "باب سوم: سیرت نبوی خاتم النبین ﷺ",
    type: "unit",
    chapters: [
      { id: "3.1",  code: "3.1",  title: "Conquest of Makkah",                                                           titleUrdu: "فتح مکہ",                                                              type: "chapter" },
      { id: "3.2",  code: "3.2",  title: "Battle of Hunayn",                                                              titleUrdu: "غزوہ حنین",                                                           type: "chapter" },
      { id: "3.3",  code: "3.3",  title: "Year of Delegations (9 Hijri)",                                                 titleUrdu: "عامُ الوفود (9 ہجری)",                                                type: "chapter" },
      { id: "3.4",  code: "3.4",  title: "Battle of Tabuk",                                                               titleUrdu: "غزوہ تبوک",                                                           type: "chapter" },
      { id: "3.5",  code: "3.5",  title: "Farewell Hajj",                                                                 titleUrdu: "حجۃ الوداع",                                                          type: "chapter" },
      { id: "3.6",  code: "3.6",  title: "Passing of the Prophetﷺ (Seal of Prophets)",                                   titleUrdu: "وصال نبوی (خاتم النبینﷺ)",                                           type: "chapter" },
      { id: "3.7",  code: "3.7",  title: "Childhood and Youth of Hazrat Muhammad Mustafaﷺ Seal of Prophets",             titleUrdu: "حضرت محمد مصطفی خاتم النبین ﷺ کا بچپن اور جوانی",                   type: "chapter" },
      { id: "3.8",  code: "3.8",  title: "Devotion to Worship of Hazrat Muhammad Mustafaﷺ",                              titleUrdu: "حضرت محمد مصطفی ﷺ کا ذوق عبادت",                                    type: "chapter" },
      { id: "3.9",  code: "3.9",  title: "Generosity and Selflessness of Hazrat Muhammad Mustafaﷺ",                      titleUrdu: "حضرت محمد مصطفی ﷺ کی سخاوت و ایثار",                                type: "chapter" },
      { id: "3.10", code: "3.10", title: "Maintaining Family Ties",                                                       titleUrdu: "صلہ رحمی",                                                            type: "chapter" },
      { id: "3.11", code: "3.11", title: "Kind Treatment Towards Women",                                                  titleUrdu: "خواتین کے ساتھ حسن سلوک",                                            type: "chapter" },
      { id: "3.12", code: "3.12", title: "Method of Upbringing",                                                          titleUrdu: "انداز تربیت",                                                          type: "chapter" },
    ],
  },
  {
    id: "bab-4",
    title: "Chapter 4: Morals and Etiquettes",
    titleUrdu: "باب چہارم: اخلاق و آداب",
    type: "unit",
    chapters: [
      { id: "4.1", code: "4.1", title: "Gratitude and Contentment (Smart)",       titleUrdu: "شکروقناعت (سمارٹ)",                type: "chapter" },
      { id: "4.2", code: "4.2", title: "Trustworthiness and Honesty (Smart)",     titleUrdu: "امانت و دیانت (سمارٹ)",            type: "chapter" },
      { id: "4.3", code: "4.3", title: "Sincerity and Piety",                     titleUrdu: "اخلاص و تقوی",                     type: "chapter" },
      { id: "4.4", code: "4.4", title: "Concealing Faults",                       titleUrdu: "پردہ پوشی",                        type: "chapter" },
      { id: "4.5", code: "4.5", title: "Pride (Smart)",                           titleUrdu: "تکبر (سمارٹ)",                     type: "chapter" },
      { id: "4.6", code: "4.6", title: "Envy (Smart)",                            titleUrdu: "حسد (سمارٹ)",                      type: "chapter" },
      { id: "4.7", code: "4.7", title: "Lying",                                   titleUrdu: "جھوٹ",                             type: "chapter" },
      { id: "4.8", code: "4.8", title: "Backbiting and Slander",                  titleUrdu: "غیبت اور بہتان",                   type: "chapter" },
      { id: "4.9", code: "4.9", title: "Magic, Omens and Superstition",           titleUrdu: "جادو،فال اور توہم پرستی",          type: "chapter" },
    ],
  },
  {
    id: "bab-5",
    title: "Chapter 5: Good Social Conduct and Dealings",
    titleUrdu: "باب پنجم: حسن معاملات و معاشرت",
    type: "unit",
    chapters: [
      { id: "5.1", code: "5.1", title: "Rules and Issues of Oath",                                         titleUrdu: "قسم کے احکام و مسائل",                         type: "chapter" },
      { id: "5.2", code: "5.2", title: "Rules and Issues of Testimony (Smart)",                            titleUrdu: "گواہی کے احکام و مسائل (سمارٹ)",              type: "chapter" },
      { id: "5.3", code: "5.3", title: "Rights of People (Rights of Neighbours) (Smart)",                  titleUrdu: "حقوق العباد (ہمسایوں کے حقوق) (سمارٹ)",      type: "chapter" },
      { id: "5.4", code: "5.4", title: "Prohibition of Interest/Usury (Smart)",                            titleUrdu: "سود کی حرمت (سمارٹ)",                          type: "chapter" },
      { id: "5.5", code: "5.5", title: "Islamic State",                                                     titleUrdu: "اسلامی ریاست",                                 type: "chapter" },
      { id: "5.6", code: "5.6", title: "Jihad in the Way of Allah (Smart)",                                titleUrdu: "جہاد فی سبیل اللہ (سمارٹ)",                   type: "chapter" },
    ],
  },
  {
    id: "bab-6",
    title: "Chapter 6: Sources of Guidance and Islamic Personalities",
    titleUrdu: "باب ششم: ہدایت کے سرچشمے اور مشاہیر اسلام",
    type: "unit",
    chapters: [
      { id: "6.1",  code: "6.1",  title: "Hazrat Imam Zayn al-Abideen (Smart)",                            titleUrdu: "حضرت امام زین العابدین رحمۃ اللہ علیہ (سمارٹ)",           type: "chapter" },
      { id: "6.2",  code: "6.2",  title: "Hazrat Imam Zayd ibn Ali (Smart)",                                titleUrdu: "حضرت امام زید بن علی رحمۃ اللہ علیہ (سمارٹ)",            type: "chapter" },
      { id: "6.3",  code: "6.3",  title: "Hazrat Abu Musa Ash'ari (Smart)",                                titleUrdu: "حضرت ابو موسی اشعری رضی اللہ تعالیٰ عنہ (سمارٹ)",       type: "chapter" },
      { id: "6.4",  code: "6.4",  title: "Hazrat Abdullah ibn Amr ibn al-As",                              titleUrdu: "حضرت عبداللہ بن عمروبن العاص رضی اللہ تعالیٰ عنھما",   type: "chapter" },
      { id: "6.5",  code: "6.5",  title: "Hazrat Amr ibn Umayya",                                          titleUrdu: "حضرت عمرو بن امیہ رضی اللہ تعالیٰ عنہ",                 type: "chapter" },
      { id: "6.6",  code: "6.6",  title: "Hazrat Amr ibn al-As (Smart)",                                   titleUrdu: "حضرت عمرو بن العاص رضی اللہ تعالیٰ عنہ (سمارٹ)",        type: "chapter" },
      { id: "6.7",  code: "6.7",  title: "Hazrat Jabir ibn Abdullah",                                      titleUrdu: "حضرت جابر بن عبداللہ رضی اللہ تعالیٰ",                  type: "chapter" },
      { id: "6.8",  code: "6.8",  title: "Hazrat Anas ibn Malik (Smart)",                                  titleUrdu: "حضرت انس بن مالک رضی اللہ تعالیٰ عنہ (سمارٹ)",          type: "chapter" },
      { id: "6.9",  code: "6.9",  title: "Female Companions (Smart)",                                      titleUrdu: "صحابیات رضی اللہ تعالی عنھن (سمارٹ)",                   type: "chapter" },
      { id: "6.10", code: "6.10", title: "Sufi Saints (Smart)",                                            titleUrdu: "صوفیہ کرام رحمۃ اللہ علیہھم (سمارٹ)",                   type: "chapter" },
      { id: "6.11", code: "6.11", title: "Scholars and Thinkers (Smart)",                                  titleUrdu: "علماومفکرین رحمۃ اللہ علیہھم (سمارٹ)",                   type: "chapter" },
    ],
  },
  {
    id: "bab-7",
    title: "Chapter 7: Islamic Teachings and Requirements of the Modern Age",
    titleUrdu: "باب ہفتم: اسلامی تعلیمات اور عصر حاضر کے تقاضے",
    type: "unit",
    chapters: [
      { id: "7.1", code: "7.1", title: "Self-confidence and Self-reliance",                        titleUrdu: "خود اعتمادی و خود انحصاری",                                  type: "chapter" },
      { id: "7.2", code: "7.2", title: "Physical and Mental Health and Physical Exercise",         titleUrdu: "جسمانی و ذہنی صحت اور جسمانی ریاضت",                       type: "chapter" },
      { id: "7.3", code: "7.3", title: "Importance of Future Planning in Islam",                  titleUrdu: "اسلام میں مستقبل کی منصوبہ بندی کی اہمیت",                  type: "chapter" },
      { id: "7.4", code: "7.4", title: "Distinguishing Features of Islamic Civilization",         titleUrdu: "اسلامی تہذیب کے امتیازات",                                  type: "chapter" },
    ],
  },
];

export function getAllChapters(): Chapter[] { return PTB_CLASS9_ISLAMIAT_LAZMI.flatMap((u) => u.chapters); }
export function getChaptersByUnit(unitId: string): Chapter[] { return PTB_CLASS9_ISLAMIAT_LAZMI.find((u) => u.id === unitId)?.chapters || []; }
export function getUnitByChapterId(chapterId: string): Unit | undefined { return PTB_CLASS9_ISLAMIAT_LAZMI.find((u) => u.chapters.some((ch) => ch.id === chapterId)); }
