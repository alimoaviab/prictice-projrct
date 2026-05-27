/**
 * PTB Inter Part-I اسلامیات اختیاری (Islamiat Optional) Syllabus
 * 10 chapters — Urdu text preserved exactly
 * ﷺ preserved in chapters 7, 8, 9; ؓ preserved in chapter 10
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

export const PTB_INTER1_ISLAMIAT_IKHTYARI: Unit[] = [
  {
    id: "chap-1",
    title: "Chapter 1: Civilization and Culture",
    titleUrdu: "باب نمبر 1: تہذیب وتمدن",
    type: "unit",
    chapters: [{ id: "1", code: "1", title: "Civilization and Culture",                                                                                 titleUrdu: "تہذیب وتمدن", type: "chapter" }],
  },
  {
    id: "chap-2",
    title: "Chapter 2: Taqwa, Dhikr, Gratitude, Forgiveness, Justice, Ihsan, Service to Humanity",
    titleUrdu: "باب نمبر 2: تقوٰی، ذکر، شکر، عفودرگزر، عدل، احسان، خدمت خلق",
    type: "unit",
    chapters: [{ id: "2", code: "2", title: "Taqwa, Dhikr, Gratitude, Forgiveness, Justice, Ihsan, Service to Humanity",                                titleUrdu: "تقوٰی، ذکر، شکر، عفودرگزر، عدل، احسان، خدمت خلق", type: "chapter" }],
  },
  {
    id: "chap-3",
    title: "Chapter 3: Family and Domestic Life, Rights of Parents, Rights of Spouses",
    titleUrdu: "باب نمبر 3: خاندانی و عائلی زندگی، والدین کے حقوق، حقوق الزوجین",
    type: "unit",
    chapters: [{ id: "3", code: "3", title: "Family and Domestic Life, Rights of Parents, Rights of Spouses",                                           titleUrdu: "خاندانی و عائلی زندگی، والدین کے حقوق، حقوق الزوجین", type: "chapter" }],
  },
  {
    id: "chap-4",
    title: "Chapter 4: Islamic Education System, Rights of Students, Rights of Teachers, Maktab, Mosque",
    titleUrdu: "باب نمبر 4: اسلام کا نظام تعلیم، شاگرد کے حقوق، استاد کے حقوق، مکتب، مسجد",
    type: "unit",
    chapters: [{ id: "4", code: "4", title: "Islamic Education System, Rights of Students, Rights of Teachers, Maktab, Mosque",                         titleUrdu: "اسلام کا نظام تعلیم، شاگرد کے حقوق، استاد کے حقوق، مکتب، مسجد", type: "chapter" }],
  },
  {
    id: "chap-5",
    title: "Chapter 5: Maintaining Family Ties, Rights of Neighbours, Rights and Duties of Citizens",
    titleUrdu: "باب نمبر 5: صلہ رحمی، ہمسائے کے حقوق، شہری کے حقوق و فرائض",
    type: "unit",
    chapters: [{ id: "5", code: "5", title: "Maintaining Family Ties, Rights of Neighbours, Rights and Duties of Citizens",                             titleUrdu: "صلہ رحمی، ہمسائے کے حقوق، شہری کے حقوق و فرائض", type: "chapter" }],
  },
  {
    id: "chap-6",
    title: "Chapter 6: Muslim World, Brotherhood, Propagation and Preaching, Jihad",
    titleUrdu: "باب نمبر 6: عالم اسلام، اخوت، تبلیغ ودعوت، جہاد",
    type: "unit",
    chapters: [{ id: "6", code: "6", title: "Muslim World, Brotherhood, Propagation and Preaching, Jihad",                                              titleUrdu: "عالم اسلام، اخوت، تبلیغ ودعوت، جہاد", type: "chapter" }],
  },
  {
    id: "chap-7",
    title: "Chapter 7: Conditions of Arabia Before Islam, Early Life of the Prophetﷺ, Migration to Madinah, Charter of Madinah",
    titleUrdu: "باب نمبر 7: ظہوراسلام سے قبل عرب کے حالات، رسولﷺ کی ابتدائی زندگی، قریش کے مقاط سے ہجرت مدینہ، میثاق مدینہ",
    type: "unit",
    chapters: [{ id: "7", code: "7", title: "Conditions of Arabia Before Islam, Early Life of the Prophetﷺ, Migration to Madinah, Charter of Madinah",  titleUrdu: "ظہوراسلام سے قبل عرب کے حالات، رسولﷺ کی ابتدائی زندگی، قریش کے مقاط سے ہجرت مدینہ، میثاق مدینہ", type: "chapter" }],
  },
  {
    id: "chap-8",
    title: "Chapter 8: Battle of Badr, Battle of Uhud, Treaty of Hudaybiyyah, Battle of Khaybar, Battle of Mu'tah, Battle of Hunayn",
    titleUrdu: "باب نمبر 8: غزوہ بدر، غزوہ احد، صلح حدیبیہ، غزوہ خیبر، غزوہ مؤتہ، جنگ حنین",
    type: "unit",
    chapters: [{ id: "8", code: "8", title: "Battle of Badr, Battle of Uhud, Treaty of Hudaybiyyah, Battle of Khaybar, Battle of Mu'tah, Battle of Hunayn", titleUrdu: "غزوہ بدر، غزوہ احد، صلح حدیبیہ، غزوہ خیبر، غزوہ مؤتہ، جنگ حنین", type: "chapter" }],
  },
  {
    id: "chap-9",
    title: "Chapter 9: Conquest of Makkah, Battle of Hunayn and Tabuk, Farewell Hajj, Charter of Madinah",
    titleUrdu: "باب نمبر 9: فتح مکہ، غزوہ حنین و تبوک، حجتہ الوداع، میثاق مدینہ",
    type: "unit",
    chapters: [{ id: "9", code: "9", title: "Conquest of Makkah, Battle of Hunayn and Tabuk, Farewell Hajj, Charter of Madinah",                         titleUrdu: "فتح مکہ، غزوہ حنین و تبوک، حجتہ الوداع، میثاق مدینہ", type: "chapter" }],
  },
  {
    id: "chap-10",
    title: "Chapter 10: Hazrat Abu Bakr Siddiqؓ, Hazrat Umarؓ, Hazrat Uthmanؓ, Hazrat Aliؓ",
    titleUrdu: "باب نمبر 10: حضرت ابوبکرصدیقؓ، حضرت عمرؓ، حضرت عثمانؓ، حضرت علیؓ",
    type: "unit",
    chapters: [{ id: "10", code: "10", title: "Hazrat Abu Bakr Siddiqؓ, Hazrat Umarؓ, Hazrat Uthmanؓ, Hazrat Aliؓ",                                     titleUrdu: "حضرت ابوبکرصدیقؓ، حضرت عمرؓ، حضرت عثمانؓ، حضرت علیؓ", type: "chapter" }],
  },
];

export function getAllChapters(): Chapter[] { return PTB_INTER1_ISLAMIAT_IKHTYARI.flatMap((u) => u.chapters); }
export function getChaptersByUnit(unitId: string): Chapter[] { return PTB_INTER1_ISLAMIAT_IKHTYARI.find((u) => u.id === unitId)?.chapters || []; }
export function getUnitByChapterId(chapterId: string): Unit | undefined { return PTB_INTER1_ISLAMIAT_IKHTYARI.find((u) => u.chapters.some((ch) => ch.id === chapterId)); }
