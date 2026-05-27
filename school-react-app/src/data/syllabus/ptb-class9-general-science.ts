/**
 * PTB Class 9 General Science Syllabus (Urdu medium topics)
 * Chapters 1–6 — Urdu/mixed text preserved exactly
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

export const PTB_CLASS9_GENERAL_SCIENCE: Unit[] = [
  {
    id: "chap-1",
    title: "Chapter 1: Introduction and Role of Science",
    titleUrdu: "باب نمبر 1: سائنس کا تعارف اور کردار",
    type: "unit",
    chapters: [
      { id: "1.1", code: "1.1", title: "History of Science",                                           titleUrdu: "سائنس کی تاریخ",                                        type: "chapter" },
      { id: "1.2", code: "1.2", title: "Concept of Science in Islam",                                  titleUrdu: "اسلام میں سائنس کا تصور",                              type: "chapter" },
      { id: "1.3", code: "1.3", title: "Services of Muslim and Pakistani Scientists",                  titleUrdu: "مسلم اور پاکستانی سائنسدانوں کی خدمات",               type: "chapter" },
      { id: "1.4", code: "1.4", title: "Branches of Science",                                          titleUrdu: "سائنس کی شاخیں",                                        type: "chapter" },
      { id: "1.5", code: "1.5", title: "Role of Science and Technology in Our Life",                   titleUrdu: "سائنس اور ٹیکنالوجی کا ہماری زندگی میں کردار",         type: "chapter" },
      { id: "1.6", code: "1.6", title: "Limitations of Current Science",                               titleUrdu: "موجودہ سائنس کی حدود",                                  type: "chapter" },
    ],
  },
  {
    id: "chap-2",
    title: "Chapter 2: Our Life and Chemistry",
    titleUrdu: "باب نمبر 2: ہماری زندگی اور کیمیا",
    type: "unit",
    chapters: [
      { id: "2.1", code: "2.1", title: "Basic Building Elements of Life",                              titleUrdu: "زندگی کے بنیادی تعمیراتی ایلیمنٹس",                   type: "chapter" },
      { id: "2.2", code: "2.2", title: "Carbon and Its Importance",                                    titleUrdu: "کاربن اور اُس کی اہمیت",                               type: "chapter" },
      { id: "2.3", code: "2.3", title: "Organic Chemistry",                                            titleUrdu: "نامیاتی کیمیا",                                         type: "chapter" },
      { id: "2.4", code: "2.4", title: "Water",                                                        titleUrdu: "پانی",                                                  type: "chapter" },
      { id: "2.5", code: "2.5", title: "Air",                                                          titleUrdu: "ہوا",                                                   type: "chapter" },
      { id: "2.6", code: "2.6", title: "Important Elements for Life",                                  titleUrdu: "زندگی کے لیے اہم ایلیمنٹس",                            type: "chapter" },
    ],
  },
  {
    id: "chap-3",
    title: "Chapter 3: Biochemistry and Biotechnology",
    titleUrdu: "باب نمبر 3: بائیو کیمسٹری اور بائیوٹیکنالوجی",
    type: "unit",
    chapters: [
      { id: "3.1", code: "3.1", title: "Metabolism",                                                   titleUrdu: "میٹابولزم",                                             type: "chapter" },
      { id: "3.2", code: "3.2", title: "Enzymes",                                                      titleUrdu: "انزائمز",                                               type: "chapter" },
      { id: "3.3", code: "3.3", title: "Blood and Its Functions",                                      titleUrdu: "خون اور اُسکے افعال",                                   type: "chapter" },
      { id: "3.4", code: "3.4", title: "DNA as Hereditary Material",                                   titleUrdu: "ڈی این اے بطور وراثتی مادہ",                           type: "chapter" },
      { id: "3.5", code: "3.5", title: "Genetic Engineering",                                          titleUrdu: "جنیٹک انجینئرنگ",                                      type: "chapter" },
      { id: "3.6", code: "3.6", title: "Role of Biotechnology in Improvement of Crops",                titleUrdu: "فصلوں کی بہتری میں بائیو ٹیکنالوجی کا کردار",         type: "chapter" },
      { id: "3.7", code: "3.7", title: "Antibiotics and Vaccines",                                     titleUrdu: "اینٹی بائیوٹکس اور ویکسینز",                           type: "chapter" },
      { id: "3.8", code: "3.8", title: "Making Waste and Scarce Items Reusable",                       titleUrdu: "فالتو اور کمیاب اشیاء کو دوبارہ استعمال کے قابل بنانا", type: "chapter" },
    ],
  },
  {
    id: "chap-4",
    title: "Chapter 4: Human Health",
    titleUrdu: "باب نمبر 4: انسانی صحت",
    type: "unit",
    chapters: [
      { id: "4.1", code: "4.1", title: "Food and Its Components",                                      titleUrdu: "غذا اور اُس کے اجزا",                                  type: "chapter" },
      { id: "4.2", code: "4.2", title: "Food and Energy",                                              titleUrdu: "غذا اور انرجی",                                         type: "chapter" },
      { id: "4.3", code: "4.3", title: "Balanced Diet",                                                titleUrdu: "متوازن غذا",                                            type: "chapter" },
      { id: "4.4", code: "4.4", title: "Coordination in Bodily Functions",                             titleUrdu: "جسمانی افعال میں کوآرڈینیشن",                          type: "chapter" },
      { id: "4.5", code: "4.5", title: "Different Stages of Human Life",                               titleUrdu: "انسانی زندگی کے مختلف مراحل",                          type: "chapter" },
      { id: "4.6", code: "4.6", title: "Exercise and Health",                                          titleUrdu: "ورزش اور صحت",                                          type: "chapter" },
      { id: "4.7", code: "4.7", title: "First Aid",                                                    titleUrdu: "فرسٹ ایڈ",                                              type: "chapter" },
    ],
  },
  {
    id: "chap-5",
    title: "Chapter 5: Diseases, Causes and Prevention",
    titleUrdu: "باب نمبر 5: بیماریاں، وجوہات اور بچاؤ",
    type: "unit",
    chapters: [
      { id: "5.1", code: "5.1", title: "Diseases Caused by Germs",                                    titleUrdu: "جراثیم سے پیدا ہونے والی بیماریاں",                    type: "chapter" },
      { id: "5.2", code: "5.2", title: "Spread of Germs",                                              titleUrdu: "جراثیم کا پھیلاؤ",                                      type: "chapter" },
      { id: "5.3", code: "5.3", title: "Protection from Germs",                                        titleUrdu: "جراثیم سے بچاؤ",                                        type: "chapter" },
      { id: "5.4", code: "5.4", title: "Harmful Effects of Smoke and Tobacco",                        titleUrdu: "دھواں اور تمباکو نوشی کے مضر اثرات",                   type: "chapter" },
      { id: "5.5", code: "5.5", title: "Mental Diseases",                                              titleUrdu: "دماغی بیماریاں",                                        type: "chapter" },
      { id: "5.6", code: "5.6", title: "Drugs",                                                        titleUrdu: "ڈرگ",                                                   type: "chapter" },
    ],
  },
  {
    id: "chap-6",
    title: "Chapter 6: Environment and Natural Resources",
    titleUrdu: "باب نمبر 6: ماحول اور قدرتی وسائل",
    type: "unit",
    chapters: [
      { id: "6.1", code: "6.1", title: "Earth's Atmosphere",                                           titleUrdu: "زمین کا ایٹما سفیئر",                                   type: "chapter" },
      { id: "6.2", code: "6.2", title: "Environmental Pollution",                                      titleUrdu: "ماحول کی آلودگی",                                       type: "chapter" },
      { id: "6.3", code: "6.3", title: "Minerals and Fossil Fuels",                                    titleUrdu: "معدنیات اور فوسل فیولز",                                type: "chapter" },
      { id: "6.4", code: "6.4", title: "Agriculture and Pakistan's Crops",                             titleUrdu: "زراعت اور پاکستان کی فصلیں",                           type: "chapter" },
      { id: "6.5", code: "6.5", title: "Dairy and Poultry Farming",                                    titleUrdu: "ڈیری اور پولٹری فارمنگ",                                type: "chapter" },
      { id: "6.6", code: "6.6", title: "Wildlife and National Parks",                                  titleUrdu: "جنگلی حیات اور نیشنل پارکس",                           type: "chapter" },
      { id: "6.7", code: "6.7", title: "Effects of Population Increase on Environment",                titleUrdu: "اضافہ آبادی کے ماحول پر اثرات",                        type: "chapter" },
    ],
  },
];

export function getAllChapters(): Chapter[] { return PTB_CLASS9_GENERAL_SCIENCE.flatMap((u) => u.chapters); }
export function getChaptersByUnit(unitId: string): Chapter[] { return PTB_CLASS9_GENERAL_SCIENCE.find((u) => u.id === unitId)?.chapters || []; }
export function getUnitByChapterId(chapterId: string): Unit | undefined { return PTB_CLASS9_GENERAL_SCIENCE.find((u) => u.chapters.some((ch) => ch.id === chapterId)); }
