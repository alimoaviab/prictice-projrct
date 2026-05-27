/**
 * PTB Class 10 ایجوکیشن (Education) Syllabus
 * Chapters 6–9 (continuation) — Urdu text preserved exactly with RTL support
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

export const PTB_CLASS10_EDUCATION: Unit[] = [
  {
    id: "chap-6",
    title: "Chapter 6: Education in Pakistan",
    titleUrdu: "باب نمبر 6: پاکستان میں تعلیم",
    type: "unit",
    chapters: [
      { id: "6.1", code: "6.1", title: "Objectives of Education in Pakistan", titleUrdu: "پاکستان میں مقاصد تعلیم",   type: "chapter" },
      { id: "6.2", code: "6.2", title: "Types of Education",                  titleUrdu: "تعلیم کی اقسام",             type: "chapter" },
      { id: "6.3", code: "6.3", title: "Levels of Education",                 titleUrdu: "تعلیم کے مدارج",             type: "chapter" },
    ],
  },
  {
    id: "chap-7",
    title: "Chapter 7: Curriculum",
    titleUrdu: "باب نمبر 7: نصاب",
    type: "unit",
    chapters: [
      { id: "7.1", code: "7.1", title: "Definition of Curriculum",            titleUrdu: "نصاب کی تعریف",              type: "chapter" },
      { id: "7.2", code: "7.2", title: "Inter-relation of Components",        titleUrdu: "اجزا کا ارتباط",             type: "chapter" },
      { id: "7.3", code: "7.3", title: "Curriculum Development in Pakistan",  titleUrdu: "پاکستان میں نصاب کی تیاری", type: "chapter" },
    ],
  },
  {
    id: "chap-8",
    title: "Chapter 8: Organization of School Activities",
    titleUrdu: "باب نمبر 8: مدرسہ کی سرگرمیوں کی تنظیم",
    type: "unit",
    chapters: [
      { id: "8.1", code: "8.1", title: "Importance of Co-curricular Activities in School",          titleUrdu: "مدرسہ میں ہم نصابی سرگرمیوں کی اہمیت",             type: "chapter" },
      { id: "8.2", code: "8.2", title: "Role of Co-curricular Activities in Students' Development", titleUrdu: "ہم نصابی سرگرمیوں کا طلبہ کی نشوونما میں کردار", type: "chapter" },
      { id: "8.3", code: "8.3", title: "Environment and Co-curricular Activities",                  titleUrdu: "ماحول اور ہم نصابی سرگرمیاں",                     type: "chapter" },
    ],
  },
  {
    id: "chap-9",
    title: "Chapter 9: Guidance and Counselling",
    titleUrdu: "باب نمبر 9: رہنمائی اور مشاورت",
    type: "unit",
    chapters: [
      { id: "9.1", code: "9.1", title: "Meaning and Definition of Guidance and Counselling", titleUrdu: "رہنمائی اور مشاورت کے معانی اور تعریف",        type: "chapter" },
      { id: "9.2", code: "9.2", title: "Problems Faced by Students",                         titleUrdu: "طلبہ کو پیش آنے والے مسائل",                 type: "chapter" },
      { id: "9.3", code: "9.3", title: "Role of Guidance and Counselling in School",         titleUrdu: "مدرسے میں رہنمائی اور مشاورت کا کردار",      type: "chapter" },
    ],
  },
];

export function getAllChapters(): Chapter[] { return PTB_CLASS10_EDUCATION.flatMap((u) => u.chapters); }
export function getChaptersByUnit(unitId: string): Chapter[] { return PTB_CLASS10_EDUCATION.find((u) => u.id === unitId)?.chapters || []; }
export function getUnitByChapterId(chapterId: string): Unit | undefined { return PTB_CLASS10_EDUCATION.find((u) => u.chapters.some((ch) => ch.id === chapterId)); }
