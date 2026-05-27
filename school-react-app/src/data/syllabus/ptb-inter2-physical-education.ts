/**
 * PTB Inter Part-II فزیکل ایجوکیشن (Physical Education) Syllabus
 * Chapters 6–13 (continuation) with Urdu text preserved exactly with RTL support
 * Note: topic text differs slightly from chapter title in some chapters — both preserved as written
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

export const PTB_INTER2_PHYSICAL_EDUCATION: Unit[] = [
  {
    id: "chap-6",
    title: "Chapter 6: Benefits of Sports",
    titleUrdu: "باب نمبر 6: کھیلوں کی افادیت",
    type: "unit",
    chapters: [
      { id: "6", code: "6", title: "Benefits of Sports", titleUrdu: "کھیلوں کی افادیت", type: "chapter" },
    ],
  },
  {
    id: "chap-7",
    title: "Chapter 7: Organized Games",
    titleUrdu: "باب نمبر 7: منظم کھیل",
    type: "unit",
    chapters: [
      { id: "7.1", code: "7.1", title: "Badminton",    titleUrdu: "بیڈ منٹن",    type: "chapter" },
      { id: "7.2", code: "7.2", title: "Table Tennis", titleUrdu: "ٹیبل ٹینس",  type: "chapter" },
      { id: "7.3", code: "7.3", title: "Basketball",   titleUrdu: "باسکٹ بال",  type: "chapter" },
      { id: "7.4", code: "7.4", title: "Hockey",       titleUrdu: "ہاکی",        type: "chapter" },
    ],
  },
  {
    id: "chap-8",
    title: "Chapter 8: Athletic Games",
    titleUrdu: "باب نمبر 8: کسرتی کھیل",
    type: "unit",
    chapters: [
      { id: "8.1", code: "8.1", title: "Long Jump",                       titleUrdu: "لانگ جمپ",                type: "chapter" },
      { id: "8.2", code: "8.2", title: "Javelin",                         titleUrdu: "نیزہ",                    type: "chapter" },
      { id: "8.3", code: "8.3", title: "High Jump",                       titleUrdu: "ہائی جمپ",               type: "chapter" },
      { id: "8.4", code: "8.4", title: "400 Meter Race",                  titleUrdu: "400 میٹر دوڑ",            type: "chapter" },
      { id: "8.5", code: "8.5", title: "Qualities of a Good Player",      titleUrdu: "اچھے کھلاڑی کے اوصاف",  type: "chapter" },
    ],
  },
  {
    id: "chap-9",
    title: "Chapter 9: Physical System",
    titleUrdu: "باب نمبر 9: جسمانی نظام",
    type: "unit",
    chapters: [
      { id: "9", code: "9", title: "Physical System", titleUrdu: "جسمانی نظام", type: "chapter" },
    ],
  },
  {
    id: "chap-10",
    title: "Chapter 10: Food and Nutrition",
    titleUrdu: "باب نمبر 10: خوراک اور غذائیت",
    type: "unit",
    // topic text in source: "خوراک اور غذا" — preserved exactly
    chapters: [
      { id: "10", code: "10", title: "Food and Nutrition", titleUrdu: "خوراک اور غذا", type: "chapter" },
    ],
  },
  {
    id: "chap-11",
    title: "Chapter 11: Drugs and Their Effects",
    titleUrdu: "باب نمبر 11: منشیات اور اس کے اثرات",
    type: "unit",
    // topic text in source: "منشیات اور ان کے اثرات" — preserved exactly
    chapters: [
      { id: "11", code: "11", title: "Drugs and Their Effects", titleUrdu: "منشیات اور ان کے اثرات", type: "chapter" },
    ],
  },
  {
    id: "chap-12",
    title: "Chapter 12: Sexual Health",
    titleUrdu: "باب نمبر 12: جنسی حفظان صحت",
    type: "unit",
    chapters: [
      { id: "12", code: "12", title: "Sexual Health", titleUrdu: "جنسی حفظان صحت", type: "chapter" },
    ],
  },
  {
    id: "chap-13",
    title: "Chapter 13: First Aid",
    titleUrdu: "باب نمبر 13: ابتدائی طبی امداد",
    type: "unit",
    chapters: [
      { id: "13", code: "13", title: "First Aid", titleUrdu: "ابتدائی طبی امداد", type: "chapter" },
    ],
  },
];

export function getAllChapters(): Chapter[] {
  return PTB_INTER2_PHYSICAL_EDUCATION.flatMap((u) => u.chapters);
}
export function getChaptersByUnit(unitId: string): Chapter[] {
  return PTB_INTER2_PHYSICAL_EDUCATION.find((u) => u.id === unitId)?.chapters || [];
}
export function getUnitByChapterId(chapterId: string): Unit | undefined {
  return PTB_INTER2_PHYSICAL_EDUCATION.find((u) => u.chapters.some((ch) => ch.id === chapterId));
}
