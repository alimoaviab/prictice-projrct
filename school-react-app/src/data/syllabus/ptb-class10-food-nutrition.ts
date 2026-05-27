/**
 * PTB Class 10 غذا اور غذائیت (Food and Nutrition) Syllabus
 * Chapters 6–10 (continuation) — Urdu text preserved exactly with RTL support
 * Note: مینو kept with brackets exactly as written
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

export const PTB_CLASS10_FOOD_NUTRITION: Unit[] = [
  {
    id: "chap-6",
    title: "Chapter 6: Methods of Preparing and Cooking Food",
    titleUrdu: "باب نمبر 6: غذاؤں کی تیاری اور پکانے کے طریقے",
    type: "unit",
    chapters: [
      { id: "6.1", code: "6.1", title: "Methods of Preparing and Cooking Food",    titleUrdu: "غذاؤں کی تیاری اور پکانے کے طریقے",      type: "chapter" },
      { id: "6.2", code: "6.2", title: "Safety Measures in the Kitchen",            titleUrdu: "باورچی خانے میں حفاظتی اقدامات",         type: "chapter" },
    ],
  },
  {
    id: "chap-7",
    title: "Chapter 7: Nutrition of Family and Society",
    titleUrdu: "باب نمبر 7: خاندان اور معاشرے کی غذائیت",
    type: "unit",
    chapters: [
      { id: "7.1", code: "7.1", title: "Nutritional Needs of Sensitive Groups in Society",   titleUrdu: "معاشرے کے حساس گروہوں کی غذائی ضروریات",     type: "chapter" },
      { id: "7.2", code: "7.2", title: "Prevention of Malnutrition in Society",              titleUrdu: "معاشرے میں غذائی قلت کی روک تھام",          type: "chapter" },
    ],
  },
  {
    id: "chap-8",
    title: "Chapter 8: Food Management",
    titleUrdu: "باب نمبر 8: انتظام طعام",
    type: "unit",
    chapters: [
      { id: "8.1", code: "8.1", title: "Principles of Food Management",                               titleUrdu: "انتظام طعام کے اصول",                                        type: "chapter" },
      { id: "8.2", code: "8.2", title: "Making Menu for Different Economic Classes",                   titleUrdu: "مختلف معاشی طبقات کے لیے فہرست طعام ( مینو ) بنانا",        type: "chapter" },
      { id: "8.3", code: "8.3", title: "Making Menu for Different Phases of Life",                    titleUrdu: "زندگی کے مختلف ادوار کے لیے فہرست طعام ( مینو ) بنانا",     type: "chapter" },
      { id: "8.4", code: "8.4", title: "Making Menu for Different Occasions",                         titleUrdu: "مختلف تقاریب کے لیے فہرست طعام ( مینو ) بنانا",              type: "chapter" },
    ],
  },
  {
    id: "chap-9",
    title: "Chapter 9: Setting the Table and Serving Food",
    titleUrdu: "باب نمبر 9: میز لگانا اور کھانا پیش کرنا",
    type: "unit",
    chapters: [
      { id: "9.1", code: "9.1", title: "Serving Food and Setting the Table",   titleUrdu: "کھانا پیش کرنا اور میز لگانا",            type: "chapter" },
      { id: "9.2", code: "9.2", title: "Etiquettes and Manners of Eating",     titleUrdu: "کھانا کھانے کے آداب و طور طریقے",        type: "chapter" },
    ],
  },
  {
    id: "chap-10",
    title: "Chapter 10: Preserving Food",
    titleUrdu: "باب نمبر 10: غذاؤں کو محفوظ کرنا",
    type: "unit",
    chapters: [
      { id: "10.1", code: "10.1", title: "Preserving Food",                  titleUrdu: "غذاؤں کو محفوظ کرنا",     type: "chapter" },
      { id: "10.2", code: "10.2", title: "Spoilage of Food",                 titleUrdu: "غذاؤں کا خراب ہونا",      type: "chapter" },
      { id: "10.3", code: "10.3", title: "Adulteration in Food",             titleUrdu: "غذاؤں میں آمیزی اجزا",   type: "chapter" },
    ],
  },
];

export function getAllChapters(): Chapter[] { return PTB_CLASS10_FOOD_NUTRITION.flatMap((u) => u.chapters); }
export function getChaptersByUnit(unitId: string): Chapter[] { return PTB_CLASS10_FOOD_NUTRITION.find((u) => u.id === unitId)?.chapters || []; }
export function getUnitByChapterId(chapterId: string): Unit | undefined { return PTB_CLASS10_FOOD_NUTRITION.find((u) => u.chapters.some((ch) => ch.id === chapterId)); }
