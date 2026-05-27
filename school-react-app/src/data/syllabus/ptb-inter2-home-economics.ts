/**
 * PTB Inter Part-II Home Economics Syllabus
 * 18 chapters — Urdu text preserved exactly with RTL support
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

export const PTB_INTER2_HOME_ECONOMICS: Unit[] = [
  {
    id: "chap-1",
    title: "Chapter 1: Importance of Food",
    titleUrdu: "باب نمبر 1: غذا کی اہمیت",
    type: "unit",
    chapters: [
      { id: "1", code: "1", title: "Importance of Food", titleUrdu: "غذا کی اہمیت", type: "chapter" },
    ],
  },
  {
    id: "chap-2",
    title: "Chapter 2: Balanced Diet",
    titleUrdu: "باب نمبر 2: متوازن غذا",
    type: "unit",
    chapters: [
      { id: "2", code: "2", title: "Balanced Diet", titleUrdu: "متوازن غذا", type: "chapter" },
    ],
  },
  {
    id: "chap-3",
    title: "Chapter 3: Nutritional Requirements",
    titleUrdu: "باب نمبر 3: غذائی ضروریات",
    type: "unit",
    chapters: [
      { id: "3", code: "3", title: "Nutritional Requirements", titleUrdu: "غذائی ضروریات", type: "chapter" },
    ],
  },
  {
    id: "chap-4",
    title: "Chapter 4: Protein",
    titleUrdu: "باب نمبر 4: پروٹین",
    type: "unit",
    chapters: [
      { id: "4", code: "4", title: "Protein", titleUrdu: "پروٹین", type: "chapter" },
    ],
  },
  {
    id: "chap-5",
    title: "Chapter 5: Carbohydrates",
    titleUrdu: "باب نمبر 5: کاربوہائیڈریٹ یا نشاستہ",
    type: "unit",
    chapters: [
      { id: "5", code: "5", title: "Carbohydrates", titleUrdu: "کاربوہائیڈریٹ یا نشاستہ", type: "chapter" },
    ],
  },
  {
    id: "chap-6",
    title: "Chapter 6: Fats and Oils",
    titleUrdu: "باب نمبر 6: روغنیات یا چکنائی",
    type: "unit",
    chapters: [
      { id: "6", code: "6", title: "Fats and Oils", titleUrdu: "روغنیات یا چکنائی", type: "chapter" },
    ],
  },
  {
    id: "chap-7",
    title: "Chapter 7: Vitamins",
    titleUrdu: "باب نمبر 7: وٹامن یا حیاتین",
    type: "unit",
    chapters: [
      { id: "7", code: "7", title: "Vitamins", titleUrdu: "وٹامن یا حیاتین", type: "chapter" },
    ],
  },
  {
    id: "chap-8",
    title: "Chapter 8: Mineral Salts",
    titleUrdu: "باب نمبر 8: معدنی نمکیات",
    type: "unit",
    chapters: [
      { id: "8", code: "8", title: "Mineral Salts", titleUrdu: "معدنی نمکیات", type: "chapter" },
    ],
  },
  {
    id: "chap-9",
    title: "Chapter 9: Menu Planning",
    titleUrdu: "باب نمبر 9: فہرست طعام کی تربیت",
    type: "unit",
    chapters: [
      { id: "9", code: "9", title: "Menu Planning", titleUrdu: "فہرست طعام کی تربیت", type: "chapter" },
    ],
  },
  {
    id: "chap-10",
    title: "Chapter 10: Grocery Shopping",
    titleUrdu: "باب نمبر 10: اشیائے خوردنی کی خریداری",
    type: "unit",
    chapters: [
      { id: "10", code: "10", title: "Grocery Shopping", titleUrdu: "اشیائے خوردنی کی خریداری", type: "chapter" },
    ],
  },
  {
    id: "chap-11",
    title: "Chapter 11: Principles and Methods of Cooking",
    titleUrdu: "باب نمبر 11: کھانا پکانے کے اصول و طریقے",
    type: "unit",
    chapters: [
      { id: "11", code: "11", title: "Principles and Methods of Cooking", titleUrdu: "کھانا پکانے کے اصول و طریقے", type: "chapter" },
    ],
  },
  {
    id: "chap-12",
    title: "Chapter 12: Methods of Serving Food",
    titleUrdu: "باب نمبر 12: کھانا پیش کرنے کے طریقے",
    type: "unit",
    chapters: [
      { id: "12", code: "12", title: "Methods of Serving Food", titleUrdu: "کھانا پیش کرنے کے طریقے", type: "chapter" },
    ],
  },
  {
    id: "chap-13",
    title: "Chapter 13: Basic Steps of Sewing",
    titleUrdu: "باب نمبر 13: سلائی کے ابتدائی مراحل",
    type: "unit",
    chapters: [
      { id: "13", code: "13", title: "Basic Steps of Sewing", titleUrdu: "سلائی کے ابتدائی مراحل", type: "chapter" },
    ],
  },
  {
    id: "chap-14",
    title: "Chapter 14: Importance of Proper Measurements for Good Fitting",
    titleUrdu: "باب نمبر 14: اچھی فٹنگ کےلیے مناسب ناپ کی اہمیت",
    type: "unit",
    chapters: [
      { id: "14", code: "14", title: "Importance of Proper Measurements for Good Fitting", titleUrdu: "اچھی فٹنگ کےلیے مناسب ناپ کی اہمیت", type: "chapter" },
    ],
  },
  {
    id: "chap-15",
    title: "Chapter 15: Importance of Study of Fibers",
    titleUrdu: "باب نمبر 15: ریشوں کے مطالعے کی اہمیت",
    type: "unit",
    chapters: [
      { id: "15", code: "15", title: "Importance of Study of Fibers", titleUrdu: "ریشوں کے مطالعے کی اہمیت", type: "chapter" },
    ],
  },
  {
    id: "chap-16",
    title: "Chapter 16: Basic Methods of Weaving",
    titleUrdu: "باب نمبر 16: پارچہ بافی کے بنیادی طریقے",
    type: "unit",
    chapters: [
      { id: "16", code: "16", title: "Basic Methods of Weaving", titleUrdu: "پارچہ بافی کے بنیادی طریقے", type: "chapter" },
    ],
  },
  {
    id: "chap-17",
    title: "Chapter 17: Clothing Planning",
    titleUrdu: "باب نمبر 17: کپڑوں کی منصوبہ بندی",
    type: "unit",
    chapters: [
      { id: "17", code: "17", title: "Clothing Planning", titleUrdu: "کپڑوں کی منصوبہ بندی", type: "chapter" },
    ],
  },
  {
    id: "chap-18",
    title: "Chapter 18: Personal Grooming",
    titleUrdu: "باب نمبر 18: ذاتی زیبائش",
    type: "unit",
    chapters: [
      { id: "18", code: "18", title: "Personal Grooming", titleUrdu: "ذاتی زیبائش", type: "chapter" },
    ],
  },
];

export function getAllChapters(): Chapter[] {
  return PTB_INTER2_HOME_ECONOMICS.flatMap((u) => u.chapters);
}
export function getChaptersByUnit(unitId: string): Chapter[] {
  return PTB_INTER2_HOME_ECONOMICS.find((u) => u.id === unitId)?.chapters || [];
}
export function getUnitByChapterId(chapterId: string): Unit | undefined {
  return PTB_INTER2_HOME_ECONOMICS.find((u) => u.chapters.some((ch) => ch.id === chapterId));
}
