/**
 * PTB Inter Part-I اسلامیات لازمی (Islamiat Compulsory) Syllabus
 * 7 chapters — ﷺ preserved exactly, topic numbering as provided (some non-sequential)
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

export const PTB_INTER1_ISLAMIAT_LAZMI: Unit[] = [
  {
    id: "chap-1",
    title: "Chapter 1: Holy Quran, Hadith and the Seal of Prophets ﷺ",
    titleUrdu: "باب نمبر 1: قرآن مجیدوحدیث خاتم النبین ﷺ",
    type: "unit",
    chapters: [
      { id: "1.1", code: "1.1", title: "Uloom al-Quran",   titleUrdu: "علوم القرآن",  type: "chapter" },
      { id: "1.2", code: "1.2", title: "Uloom al-Hadith",  titleUrdu: "علوم الحدیث", type: "chapter" },
    ],
  },
  {
    id: "chap-2",
    title: "Chapter 2: Faith and Worship",
    titleUrdu: "باب نمبر 2: ایمانیات وعبادات",
    type: "unit",
    chapters: [
      { id: "2.1", code: "2.1", title: "Proofs and Requirements of Tawheed",         titleUrdu: "توحید کے دلائل اور تقاضے",               type: "chapter" },
      { id: "2.2", code: "2.2", title: "Distinctive Features of Prophethood of Muhammadﷺ", titleUrdu: "رسالت محمدیﷺ کی خصوصیات",            type: "chapter" },
      { id: "2.3", code: "2.3", title: "Belief in Angels",                            titleUrdu: "ملائکہ پر ایمان",                         type: "chapter" },
      { id: "2.4", code: "2.4", title: "Belief in Divine Books",                      titleUrdu: "کتب سماویہ پر ایمان",                    type: "chapter" },
      { id: "2.5", code: "2.5", title: "Belief in the Hereafter",                     titleUrdu: "آخرت پر ایمان",                          type: "chapter" },
      { id: "2.6", code: "2.6", title: "Philosophy of Prayer",                        titleUrdu: "فلسفہ نماز",                              type: "chapter" },
      { id: "2.7", code: "2.7", title: "Philosophy of Zakat and Charity",             titleUrdu: "فلسفہ زکوٰۃ وصدقات",                    type: "chapter" },
      { id: "2.8", code: "2.8", title: "Philosophy of Fasting",                       titleUrdu: "فلسفہ صوم",                               type: "chapter" },
      { id: "2.9", code: "2.9", title: "Philosophy of Hajj and Sacrifice",            titleUrdu: "فلسفہ حج وقربانی",                       type: "chapter" },
    ],
  },
  {
    id: "chap-3",
    title: "Chapter 3: Seerah of the Prophet, Seal of Prophetsﷺ",
    titleUrdu: "باب نمبر 3: سیرت نبوی خاتم النبینﷺ",
    type: "unit",
    chapters: [
      { id: "3.1", code: "3.1", title: "Prophet ﷺ as Ideal Head of Family",        titleUrdu: "نبی کریم خاتم النبینﷺ بطور مثالی سربراہ خاندان", type: "chapter" },
      { id: "3.2", code: "3.2", title: "Prophet ﷺ as Ideal Head of State",         titleUrdu: "نبی کریم خاتم النبینﷺ بطور مثالی سربراہ ریاست", type: "chapter" },
      { id: "3.3", code: "3.3", title: "Prophet ﷺ as Ideal Commander-in-Chief",    titleUrdu: "نبی کریم خاتم النبینﷺ بطور مثالی سپہ سالار",    type: "chapter" },
      { id: "3.4", code: "3.4", title: "Economic Teachings of the Prophetﷺ",       titleUrdu: "نبی کریم خاتم النبینﷺ کی معاشی تعلیمات",         type: "chapter" },
    ],
  },
  {
    id: "chap-4",
    title: "Chapter 4: Morals and Etiquettes",
    titleUrdu: "باب نمبر 4: اخلاق وآداب",
    type: "unit",
    chapters: [
      { id: "4.1", code: "4.1", title: "Collective Welfare and Respect for Humanity", titleUrdu: "اجتماعی خیر خواہی اور احترام انسانیت", type: "chapter" },
      { id: "4.2", code: "4.2", title: "Avoiding Moral Vices",                        titleUrdu: "اخلاقی رذائل سے اجتناب",             type: "chapter" },
    ],
  },
  {
    id: "chap-5",
    title: "Chapter 5: Good Conduct and Social Relations",
    titleUrdu: "باب نمبر 5: حسن معاملات ومعاشرت",
    type: "unit",
    chapters: [
      { id: "5.1", code: "5.1", title: "Rights of People (Teachers, Support Staff, Spouses, Children, Widow)", titleUrdu: "حقوق العباد(اساتذہ کرام،معاون عملہ،زوجین،اولاد،،بیوہ)", type: "chapter" },
      { id: "5.3", code: "5.3", title: "Islamic Teachings on Marriage and Divorce",   titleUrdu: "نکاح وطلاق کی اسلامی تعلیمات",      type: "chapter" },
    ],
  },
  {
    id: "chap-6",
    title: "Chapter 6: Sources of Guidance and Islamic Personalities",
    titleUrdu: "باب نمبر 6: ہدایت کے سرچشمے اور مشاہیر اسلام",
    type: "unit",
    chapters: [
      { id: "6.1", code: "6.1", title: "The Rightly-Guided Caliphate",                        titleUrdu: "خلافت راشدہ",                                          type: "chapter" },
      { id: "6.2", code: "6.2", title: "Imams of the Household of the Prophet (Ahl al-Bayt)", titleUrdu: "ائمہ اہل بیت اطہار رضی اللہ تعالیٰ عنہ",             type: "chapter" },
    ],
  },
  {
    id: "chap-7",
    title: "Chapter 7: Islamic Teachings and Requirements of the Modern Age",
    titleUrdu: "باب نمبر 7: اسلامی تعلیمات اور عصر حاضر کے تقاضے",
    type: "unit",
    chapters: [
      { id: "7.1", code: "7.1", title: "Observance of Law",                          titleUrdu: "قانون کی پاسداری",                    type: "chapter" },
      { id: "7.3", code: "7.3", title: "Islamophobia and Our Responsibilities",       titleUrdu: "اسلاموفوبیا اور ہماری ذمہ داریاں",   type: "chapter" },
    ],
  },
];

export function getAllChapters(): Chapter[] { return PTB_INTER1_ISLAMIAT_LAZMI.flatMap((u) => u.chapters); }
export function getChaptersByUnit(unitId: string): Chapter[] { return PTB_INTER1_ISLAMIAT_LAZMI.find((u) => u.id === unitId)?.chapters || []; }
export function getUnitByChapterId(chapterId: string): Unit | undefined { return PTB_INTER1_ISLAMIAT_LAZMI.find((u) => u.chapters.some((ch) => ch.id === chapterId)); }
