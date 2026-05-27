/**
 * PTB Inter Part-II نفسیات (Psychology) Syllabus
 * 4 sections with Urdu text preserved exactly with RTL support
 * Note: topic 3.6 "صںفی امتیاز و جنسی ہراسانی" preserved exactly as written in source
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

export const PTB_INTER2_PSYCHOLOGY: Unit[] = [
  {
    id: "hissa-1",
    title: "Part 1: Developmental Psychology",
    titleUrdu: "حصہ اوّل: نموئی نفسیات",
    type: "unit",
    chapters: [
      { id: "1.1", code: "1.1", title: "Psychology of Development",   titleUrdu: "نشوونما کی نفسیات",  type: "chapter" },
      { id: "1.2", code: "1.2", title: "Theories of Development",     titleUrdu: "نشوونما کے نظریات", type: "chapter" },
    ],
  },
  {
    id: "hissa-2",
    title: "Part 2: Health Psychology",
    titleUrdu: "حصہ دوم: صحت کی نفسیات",
    type: "unit",
    chapters: [
      { id: "2.1", code: "2.1", title: "Health Psychology",                   titleUrdu: "صحت کی نفسیات",      type: "chapter" },
      { id: "2.2", code: "2.2", title: "Stress",                              titleUrdu: "فشار",               type: "chapter" },
      { id: "2.3", code: "2.3", title: "Anxiety Disorders",                   titleUrdu: "تشویشی امراض",       type: "chapter" },
      { id: "2.4", code: "2.4", title: "Schizophrenia",                       titleUrdu: "شیزوفرینیا",         type: "chapter" },
      { id: "2.5", code: "2.5", title: "Eating Disorders",                    titleUrdu: "طعامی امراض",        type: "chapter" },
      { id: "2.6", code: "2.6", title: "Improving Dietary Habits",            titleUrdu: "غذائی عادات بہتر بنانا", type: "chapter" },
    ],
  },
  {
    id: "hissa-3",
    title: "Part 3: Social Psychology",
    titleUrdu: "حصہ سوم: سماجی نفسیات",
    type: "unit",
    chapters: [
      { id: "3.1", code: "3.1", title: "Social Psychology",                   titleUrdu: "سماجی نفسیات",            type: "chapter" },
      { id: "3.2", code: "3.2", title: "Anti-Social Behaviour",               titleUrdu: "سماج دشمن کردار",         type: "chapter" },
      { id: "3.3", code: "3.3", title: "Prejudice",                           titleUrdu: "تعصب",                    type: "chapter" },
      { id: "3.4", code: "3.4", title: "Drugs and Smoking",                   titleUrdu: "منشیات اور تمباکو نوشی",  type: "chapter" },
      { id: "3.5", code: "3.5", title: "Violence",                            titleUrdu: "تشدد",                    type: "chapter" },
      { id: "3.6", code: "3.6", title: "Gender Discrimination and Sexual Harassment", titleUrdu: "صںفی امتیاز و جنسی ہراسانی", type: "chapter" },
      { id: "3.7", code: "3.7", title: "Attitude and Public Opinion",         titleUrdu: "رویہ اور رائے عامہ",      type: "chapter" },
      { id: "3.8", code: "3.8", title: "Public Opinion",                      titleUrdu: "رائے عامہ",               type: "chapter" },
      { id: "3.9", code: "3.9", title: "Leadership",                          titleUrdu: "قیادت",                   type: "chapter" },
    ],
  },
  {
    id: "hissa-4",
    title: "Part 4: Guidance and Counselling",
    titleUrdu: "حصہ چہارم: رہنمائی اور مشاورت",
    type: "unit",
    chapters: [
      { id: "4.1", code: "4.1", title: "Guidance and Counselling",    titleUrdu: "رہنمائی اور مشاورت",  type: "chapter" },
      { id: "4.2", code: "4.2", title: "Methods of Counselling",      titleUrdu: "مشاورت کے طریقے",    type: "chapter" },
    ],
  },
];

export function getAllChapters(): Chapter[] {
  return PTB_INTER2_PSYCHOLOGY.flatMap((u) => u.chapters);
}
export function getChaptersByUnit(unitId: string): Chapter[] {
  return PTB_INTER2_PSYCHOLOGY.find((u) => u.id === unitId)?.chapters || [];
}
export function getUnitByChapterId(chapterId: string): Unit | undefined {
  return PTB_INTER2_PSYCHOLOGY.find((u) => u.chapters.some((ch) => ch.id === chapterId));
}
