/**
 * PTB Class 10 اسلامیات اختیاری (Islamiat Optional) Syllabus
 * Continuation syllabus: Ayat 11–19, Ahadith 13–25, Chapter 3 (Islamic Teachings), Chapter 5 (Arabic Grammar)
 * Urdu/Arabic text preserved exactly
 * ﷺ preserved in topic 2
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

export const PTB_CLASS10_ISLAMIAT_IKHTYARI: Unit[] = [
  {
    id: "ayat",
    title: "Holy Verses (Ayat 11–19)",
    titleUrdu: "آیات کریمہ",
    type: "unit",
    chapters: [
      { id: "a11", code: "11", title: "Verse 11", titleUrdu: "آیت نمبر :11", type: "chapter" },
      { id: "a12", code: "12", title: "Verse 12", titleUrdu: "آیت نمبر :12", type: "chapter" },
      { id: "a13", code: "13", title: "Verse 13", titleUrdu: "آیت نمبر :13", type: "chapter" },
      { id: "a14", code: "14", title: "Verse 14", titleUrdu: "آیت نمبر :14", type: "chapter" },
      { id: "a15", code: "15", title: "Verse 15", titleUrdu: "آیت نمبر :15", type: "chapter" },
      { id: "a16", code: "16", title: "Verse 16", titleUrdu: "آیت نمبر :16", type: "chapter" },
      { id: "a17", code: "17", title: "Verse 17", titleUrdu: "آیت نمبر :17", type: "chapter" },
      { id: "a18", code: "18", title: "Verse 18", titleUrdu: "آیت نمبر :18", type: "chapter" },
      { id: "a19", code: "19", title: "Verse 19", titleUrdu: "آیت نمبر :19", type: "chapter" },
    ],
  },
  {
    id: "ahadith",
    title: "Noble Ahadith (13–25)",
    titleUrdu: "احادیث مبارکہ",
    type: "unit",
    chapters: [
      { id: "h13", code: "13", title: "Hadith 13", titleUrdu: "حدیث نمبر :13", type: "chapter" },
      { id: "h14", code: "14", title: "Hadith 14", titleUrdu: "حدیث نمبر :14", type: "chapter" },
      { id: "h15", code: "15", title: "Hadith 15", titleUrdu: "حدیث نمبر :15", type: "chapter" },
      { id: "h16", code: "16", title: "Hadith 16", titleUrdu: "حدیث نمبر :16", type: "chapter" },
      { id: "h17", code: "17", title: "Hadith 17", titleUrdu: "حدیث نمبر :17", type: "chapter" },
      { id: "h18", code: "18", title: "Hadith 18", titleUrdu: "حدیث نمبر :18", type: "chapter" },
      { id: "h19", code: "19", title: "Hadith 19", titleUrdu: "حدیث نمبر :19", type: "chapter" },
      { id: "h20", code: "20", title: "Hadith 20", titleUrdu: "حدیث نمبر :20", type: "chapter" },
      { id: "h21", code: "21", title: "Hadith 21", titleUrdu: "حدیث نمبر :21", type: "chapter" },
      { id: "h22", code: "22", title: "Hadith 22", titleUrdu: "حدیث نمبر :22", type: "chapter" },
      { id: "h23", code: "23", title: "Hadith 23", titleUrdu: "حدیث نمبر :23", type: "chapter" },
      { id: "h24", code: "24", title: "Hadith 24", titleUrdu: "حدیث نمبر :24", type: "chapter" },
      { id: "h25", code: "25", title: "Hadith 25", titleUrdu: "حدیث نمبر :25", type: "chapter" },
    ],
  },
  {
    id: "bab-3",
    title: "Chapter 3: Islamic Teachings",
    titleUrdu: "باب سوم ۔ تعلیماتِ اسلام",
    type: "unit",
    chapters: [
      { id: "t1",  code: "1",  title: "Tawheed (Monotheism)",                              titleUrdu: "توحید",                                  type: "chapter" },
      { id: "t2",  code: "2",  title: "Obedience to the Noble Prophetﷺ",                   titleUrdu: "اطاعت رسول کریمﷺ",                      type: "chapter" },
      { id: "t3",  code: "3",  title: "Purification and Cleanliness",                      titleUrdu: "طہارت و پاکیزگی",                        type: "chapter" },
      { id: "t4",  code: "4",  title: "Encouragement to Seek Knowledge",                   titleUrdu: "علم کی ترغیب",                           type: "chapter" },
      { id: "t5",  code: "5",  title: "Justice",                                            titleUrdu: "عدل",                                    type: "chapter" },
      { id: "t6",  code: "6",  title: "Jihad",                                              titleUrdu: "جہاد",                                   type: "chapter" },
      { id: "t7",  code: "7",  title: "Eating Halal",                                      titleUrdu: "اکل حلال",                               type: "chapter" },
      { id: "t8",  code: "8",  title: "Chastity and Modesty",                              titleUrdu: "عفت و حیا",                              type: "chapter" },
      { id: "t9",  code: "9",  title: "Social Justice",                                    titleUrdu: "سماجی انصاف",                            type: "chapter" },
      { id: "t10", code: "10", title: "Sense of Duty",                                     titleUrdu: "فرض شناسی",                              type: "chapter" },
      { id: "t11", code: "11", title: "Distinctive Features of Islamic Worship",           titleUrdu: "اسلامی عبادات کی امتیازی خصوصیات",     type: "chapter" },
    ],
  },
  {
    id: "bab-5",
    title: "Chapter 5: Grammar of Arabic Language",
    titleUrdu: "باب پنجم ۔ عربی زبان کی گرامر",
    type: "unit",
    chapters: [
      { id: "g1", code: "1", title: "Pronoun and Types of Noun",           titleUrdu: "اسم ضمیر اور اسم کی اقسام",    type: "chapter" },
      { id: "g2", code: "2", title: "Types of Verb",                       titleUrdu: "فعل کی قسمیں",                  type: "chapter" },
      { id: "g3", code: "3", title: "Compound (Incomplete Compound)",      titleUrdu: "مرکب (مرکب ناقص)",              type: "chapter" },
      { id: "g4", code: "4", title: "Compound (Named Compound)",           titleUrdu: "مرکب (مرکب نام)",               type: "chapter" },
      { id: "g5", code: "5", title: "Intransitive Verb to Passive Verb",   titleUrdu: "فعل لازم تا فعل مجہول",         type: "chapter" },
      { id: "g6", code: "6", title: "Particles",                           titleUrdu: "حروف",                          type: "chapter" },
    ],
  },
];

export function getAllChapters(): Chapter[] { return PTB_CLASS10_ISLAMIAT_IKHTYARI.flatMap((u) => u.chapters); }
export function getChaptersByUnit(unitId: string): Chapter[] { return PTB_CLASS10_ISLAMIAT_IKHTYARI.find((u) => u.id === unitId)?.chapters || []; }
export function getUnitByChapterId(chapterId: string): Unit | undefined { return PTB_CLASS10_ISLAMIAT_IKHTYARI.find((u) => u.chapters.some((ch) => ch.id === chapterId)); }
