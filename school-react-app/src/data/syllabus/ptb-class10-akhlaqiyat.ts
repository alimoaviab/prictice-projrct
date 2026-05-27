/**
 * PTB Class 10 اخلاقیات (Ethics) Syllabus
 * 5 chapters — Urdu text preserved exactly with RTL support
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

export const PTB_CLASS10_AKHLAQIYAT: Unit[] = [
  {
    id: "bab-1",
    title: "Chapter 1: Introduction to Religions",
    titleUrdu: "باب اول: مذاہب کا تعارف",
    type: "unit",
    chapters: [
      { id: "1.1", code: "1.1", title: "Guidance of Religions in Solving Problems",  titleUrdu: "مشکلات کے حل میں مذاہب کی رہنمائی",  type: "chapter" },
      { id: "1.2", code: "1.2", title: "Concept of Sin and Crime",                    titleUrdu: "گناہ اور جرم کا تصور",                type: "chapter" },
    ],
  },
  {
    id: "bab-2",
    title: "Chapter 2: World Religions",
    titleUrdu: "باب دوم: عالمی مذاہب",
    type: "unit",
    chapters: [
      { id: "2.1", code: "2.1", title: "Mahavir — Introduction and Basic Teachings",  titleUrdu: "مہاویر- تعارف اور بنیادی تعلیمات",    type: "chapter" },
    ],
  },
  {
    id: "bab-3",
    title: "Chapter 3: Morals and Values",
    titleUrdu: "باب سوم: اخلاق و اقدار",
    type: "unit",
    chapters: [
      { id: "3.1", code: "3.1", title: "Effects of Worship on Human Life (In Light of World Religions)", titleUrdu: "(مذاہب عالمی کی روشنی میں)عبادت کے انسانی زندگی پر اثرات", type: "chapter" },
      { id: "3.2", code: "3.2", title: "Moral Values in World Religions",              titleUrdu: "عالمی مذاہب میں اخلاقی اقدار",             type: "chapter" },
      { id: "3.3", code: "3.3", title: "Effects of Accountability on Character Building", titleUrdu: "انسانی کردار سازی پر احتساب کے اثرات",  type: "chapter" },
      { id: "3.4", code: "3.4", title: "Punctuality in Religious Teachings",           titleUrdu: "مذہبی تعلیمات میں پابندی وقت",            type: "chapter" },
    ],
  },
  {
    id: "bab-4",
    title: "Chapter 4: Etiquettes",
    titleUrdu: "باب چہارم: آداب",
    type: "unit",
    chapters: [
      { id: "4.1", code: "4.1", title: "Railway Station, Bus Stand, Airport, Bazaar", titleUrdu: "ریلوے اسٹیشن، بس اسٹینڈ، ہوائی اڈا، بازار", type: "chapter" },
    ],
  },
  {
    id: "bab-5",
    title: "Chapter 5: Notable Personalities",
    titleUrdu: "باب پنجم: مشاہیر",
    type: "unit",
    chapters: [
      { id: "5.1", code: "5.1", title: "Aristotle",      titleUrdu: "ارسطو",       type: "chapter" },
      { id: "5.2", code: "5.2", title: "Kant",           titleUrdu: "کانٹ",        type: "chapter" },
      { id: "5.3", code: "5.3", title: "Sri Aurobindo",  titleUrdu: "سری اربندو", type: "chapter" },
    ],
  },
];

export function getAllChapters(): Chapter[] { return PTB_CLASS10_AKHLAQIYAT.flatMap((u) => u.chapters); }
export function getChaptersByUnit(unitId: string): Chapter[] { return PTB_CLASS10_AKHLAQIYAT.find((u) => u.id === unitId)?.chapters || []; }
export function getUnitByChapterId(chapterId: string): Unit | undefined { return PTB_CLASS10_AKHLAQIYAT.find((u) => u.chapters.some((ch) => ch.id === chapterId)); }
