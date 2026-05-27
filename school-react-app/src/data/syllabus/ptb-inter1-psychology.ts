/**
 * PTB Inter Part-I نفسیات (Psychology) Syllabus
 * 9 chapters — Chapters 4 and 5 have sub-topics, others are single topics
 * Urdu text preserved exactly with RTL support
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

export const PTB_INTER1_PSYCHOLOGY: Unit[] = [
  {
    id: "chap-1",
    title: "Chapter 1: Introduction to Psychology",
    titleUrdu: "باب نمبر 1: نفسیات کا تعارف",
    type: "unit",
    chapters: [{ id: "1", code: "1", title: "Introduction to Psychology",              titleUrdu: "نفسیات کا تعارف",             type: "chapter" }],
  },
  {
    id: "chap-2",
    title: "Chapter 2: Research Methods",
    titleUrdu: "باب نمبر 2: اسالیبِ تحقیق",
    type: "unit",
    chapters: [{ id: "2", code: "2", title: "Research Methods",                        titleUrdu: "اسالیبِ تحقیق",               type: "chapter" }],
  },
  {
    id: "chap-3",
    title: "Chapter 3: Nervous System and Behaviour",
    titleUrdu: "باب نمبر 3: نظامِ عصبی اور کردار",
    type: "unit",
    chapters: [{ id: "3", code: "3", title: "Nervous System and Behaviour",            titleUrdu: "نظامِ عصبی اور کردار",        type: "chapter" }],
  },
  {
    id: "chap-4",
    title: "Chapter 4: Senses, Attention and Perception",
    titleUrdu: "باب نمبر 4: حواس، توجہ اور ادراکِ حواس",
    type: "unit",
    chapters: [
      { id: "4.1", code: "4.1", title: "Senses",      titleUrdu: "حواس",        type: "chapter" },
      { id: "4.2", code: "4.2", title: "Attention",   titleUrdu: "توجہ",        type: "chapter" },
      { id: "4.3", code: "4.3", title: "Perception",  titleUrdu: "ادراکِ حواس", type: "chapter" },
    ],
  },
  {
    id: "chap-5",
    title: "Chapter 5: Learning and Memory",
    titleUrdu: "باب نمبر 5: آموزش اور حافظہ",
    type: "unit",
    chapters: [
      { id: "5.1", code: "5.1", title: "Learning",    titleUrdu: "آموزش",  type: "chapter" },
      { id: "5.2", code: "5.2", title: "Memory",      titleUrdu: "حافظہ",  type: "chapter" },
    ],
  },
  {
    id: "chap-6",
    title: "Chapter 6: Motivational Behaviour",
    titleUrdu: "باب نمبر 6: محرکاتی کردار",
    type: "unit",
    chapters: [{ id: "6", code: "6", title: "Motivational Behaviour",                  titleUrdu: "محرکاتی کردار",               type: "chapter" }],
  },
  {
    id: "chap-7",
    title: "Chapter 7: Personality",
    titleUrdu: "باب نمبر 7: شخصیت",
    type: "unit",
    chapters: [{ id: "7", code: "7", title: "Personality",                             titleUrdu: "شخصیت",                       type: "chapter" }],
  },
  {
    id: "chap-8",
    title: "Chapter 8: Emotional Behaviour",
    titleUrdu: "باب نمبر 8: ہیجانی کردار",
    type: "unit",
    chapters: [{ id: "8", code: "8", title: "Emotional Behaviour",                     titleUrdu: "ہیجانی کردار",                type: "chapter" }],
  },
  {
    id: "chap-9",
    title: "Chapter 9: Higher Cognitive Functions",
    titleUrdu: "باب نمبر 9: اعلیٰ وقوفی اعمال",
    type: "unit",
    chapters: [{ id: "9", code: "9", title: "Higher Cognitive Functions",              titleUrdu: "اعلیٰ وقوفی اعمال",           type: "chapter" }],
  },
];

export function getAllChapters(): Chapter[] { return PTB_INTER1_PSYCHOLOGY.flatMap((u) => u.chapters); }
export function getChaptersByUnit(unitId: string): Chapter[] { return PTB_INTER1_PSYCHOLOGY.find((u) => u.id === unitId)?.chapters || []; }
export function getUnitByChapterId(chapterId: string): Unit | undefined { return PTB_INTER1_PSYCHOLOGY.find((u) => u.chapters.some((ch) => ch.id === chapterId)); }
