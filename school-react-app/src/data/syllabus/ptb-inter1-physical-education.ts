/**
 * PTB Inter Part-I فزیکل ایجوکیشن (Physical Education) Syllabus
 * 10 chapters — Urdu text preserved exactly with RTL support
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

export const PTB_INTER1_PHYSICAL_EDUCATION: Unit[] = [
  {
    id: "chap-1",
    title: "Chapter 1: Definition and Importance of Physical Education",
    titleUrdu: "باب نمبر 1: جسمانی تعلیم کی تعریف واہمیت",
    type: "unit",
    chapters: [{ id: "1.1", code: "1.1", title: "Definition and Importance of Physical Education", titleUrdu: "جسمانی تعلیم کی تعریف و اہمیت",       type: "chapter" }],
  },
  {
    id: "chap-2",
    title: "Chapter 2: Aims and Objectives of Physical Education",
    titleUrdu: "باب نمبر 2: جسمانی تعلیم کے اغراض ومقاصد",
    type: "unit",
    chapters: [{ id: "2.1", code: "2.1", title: "Aims and Objectives of Physical Education",     titleUrdu: "جسمانی تعلیم کے اغراض ومقاصد",      type: "chapter" }],
  },
  {
    id: "chap-3",
    title: "Chapter 3: Scope of Physical Activities",
    titleUrdu: "باب نمبر 3: جسمانی سرگرمیوں کا دائرہ کار",
    type: "unit",
    chapters: [{ id: "3.1", code: "3.1", title: "Scope of Physical Activities",                   titleUrdu: "جسمانی سرگرمیوں کا دائرہ کار",      type: "chapter" }],
  },
  {
    id: "chap-4",
    title: "Chapter 4: Organized Games",
    titleUrdu: "باب نمبر 4: منظم کھیل",
    type: "unit",
    chapters: [
      { id: "4.1", code: "4.1", title: "Netball",    titleUrdu: "نیٹ بال",    type: "chapter" },
      { id: "4.2", code: "4.2", title: "Volleyball",  titleUrdu: "والی بال",   type: "chapter" },
      { id: "4.3", code: "4.3", title: "Football",    titleUrdu: "فٹ بال",     type: "chapter" },
    ],
  },
  {
    id: "chap-5",
    title: "Chapter 5: Rules and Basic Skills of Athletic Games",
    titleUrdu: "باب نمبر 5: کسرتی کھیلوں کے ضابطے اور بنیادی مہارتیں",
    type: "unit",
    chapters: [
      { id: "5.1", code: "5.1", title: "Triple Jump",    titleUrdu: "سہ جست",         type: "chapter" },
      { id: "5.2", code: "5.2", title: "Discus Throw",   titleUrdu: "ڈسکس تھرو",     type: "chapter" },
      { id: "5.3", code: "5.3", title: "Shot Put",       titleUrdu: "گولہ اندازی",    type: "chapter" },
      { id: "5.4", code: "5.4", title: "Relay Race",     titleUrdu: "ڈاک دوڑ",        type: "chapter" },
    ],
  },
  {
    id: "chap-6",
    title: "Chapter 6: Health Science",
    titleUrdu: "باب نمبر 6: علم الصحت",
    type: "unit",
    chapters: [{ id: "6.1", code: "6.1", title: "Health Science",                                 titleUrdu: "علم الصحت",                          type: "chapter" }],
  },
  {
    id: "chap-7",
    title: "Chapter 7: Human Body and Its Functioning",
    titleUrdu: "باب نمبر 7: انسانی جسم اور اس کی کارکردگی",
    type: "unit",
    chapters: [
      { id: "7.1", code: "7.1", title: "Human Body and Its Functioning",    titleUrdu: "انسانی جسم اور اس کی کارکردگی",  type: "chapter" },
      { id: "7.2", code: "7.2", title: "Respiratory System",                titleUrdu: "نظام تنفس",                      type: "chapter" },
      { id: "7.3", code: "7.3", title: "Circulatory System",                titleUrdu: "نظام دوران خون",                  type: "chapter" },
    ],
  },
  {
    id: "chap-8",
    title: "Chapter 8: Posture, Postural Defects and Their Correction",
    titleUrdu: "باب نمبر 8: قامت و قامتی نقائص اور ان کی اصلاح",
    type: "unit",
    chapters: [{ id: "8.1", code: "8.1", title: "Postural Defects and Their Correction",          titleUrdu: "قامتی نقائص اور ان کی اصلاح",       type: "chapter" }],
  },
  {
    id: "chap-9",
    title: "Chapter 9: First Aid",
    titleUrdu: "باب نمبر 9: ابتدائی طبی امداد",
    type: "unit",
    chapters: [{ id: "9.1", code: "9.1", title: "First Aid",                                      titleUrdu: "ابتدائی طبی امداد",                  type: "chapter" }],
  },
  {
    id: "chap-10",
    title: "Chapter 10: Infectious Diseases",
    titleUrdu: "باب نمبر 10: متعدی امراض",
    type: "unit",
    chapters: [{ id: "10.1", code: "10.1", title: "Infectious Diseases",                          titleUrdu: "متعدی امراض",                        type: "chapter" }],
  },
];

export function getAllChapters(): Chapter[] { return PTB_INTER1_PHYSICAL_EDUCATION.flatMap((u) => u.chapters); }
export function getChaptersByUnit(unitId: string): Chapter[] { return PTB_INTER1_PHYSICAL_EDUCATION.find((u) => u.id === unitId)?.chapters || []; }
export function getUnitByChapterId(chapterId: string): Unit | undefined { return PTB_INTER1_PHYSICAL_EDUCATION.find((u) => u.chapters.some((ch) => ch.id === chapterId)); }
