/**
 * PTB Class 1 General Knowledge Syllabus
 * Complete chapter structure with Urdu text
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

export const PTB_CLASS1_GENERAL_KNOWLEDGE: Unit[] = [
  {
    id: "chapter-1",
    title: "Chapter 1: My Introduction",
    titleUrdu: "باب نمبر 1: میرا تعارف",
    type: "unit",
    chapters: [
      { id: "1.1", code: "1.1", title: "My Introduction", titleUrdu: "میرا تعارف", type: "chapter" },
    ],
  },
  {
    id: "chapter-2",
    title: "Chapter 2: My Body",
    titleUrdu: "باب نمبر 2: میرا جسم",
    type: "unit",
    chapters: [
      { id: "2.1", code: "2.1", title: "My Body", titleUrdu: "میرا جسم", type: "chapter" },
    ],
  },
  {
    id: "chapter-3",
    title: "Chapter 3: Health and Hygiene",
    titleUrdu: "باب نمبر 3: صحت وصفائی",
    type: "unit",
    chapters: [
      { id: "3.1", code: "3.1", title: "Health and Hygiene", titleUrdu: "صحت وصفائی", type: "chapter" },
    ],
  },
  {
    id: "chapter-4",
    title: "Chapter 4: My Family and Friends",
    titleUrdu: "باب نمبر 4: میرا خاندان اور میرے دوست",
    type: "unit",
    chapters: [
      { id: "4.1", code: "4.1", title: "My Family and Friends", titleUrdu: "میرا خاندان اور میرے دوست", type: "chapter" },
    ],
  },
  {
    id: "chapter-5",
    title: "Chapter 5: Games and Recreation",
    titleUrdu: "باب نمبر 5: کھیل اور تفریح",
    type: "unit",
    chapters: [
      { id: "5.1", code: "5.1", title: "Games and Recreation", titleUrdu: "کھیل اور تفریح", type: "chapter" },
    ],
  },
  {
    id: "chapter-6",
    title: "Chapter 6: Our Morals",
    titleUrdu: "باب نمبر 6: ہمارا اخلاق",
    type: "unit",
    chapters: [
      { id: "6.1", code: "6.1", title: "Our Morals", titleUrdu: "ہمارا اخلاق", type: "chapter" },
    ],
  },
  {
    id: "chapter-7",
    title: "Chapter 7: Places of Worship",
    titleUrdu: "باب نمبر 7: عبادت گاہیں",
    type: "unit",
    chapters: [
      { id: "7.1", code: "7.1", title: "Places of Worship", titleUrdu: "عبادت گاہیں", type: "chapter" },
    ],
  },
  {
    id: "chapter-8",
    title: "Chapter 8: Our Beloved Country Pakistan",
    titleUrdu: "باب نمبر 8: ہمارا پیارا وطن پاکستان",
    type: "unit",
    chapters: [
      { id: "8.1", code: "8.1", title: "Our Beloved Country Pakistan", titleUrdu: "ہمارا پیارا وطن پاکستان", type: "chapter" },
    ],
  },
  {
    id: "chapter-9",
    title: "Chapter 9: My School",
    titleUrdu: "باب نمبر 9: میرا سکول",
    type: "unit",
    chapters: [
      { id: "9.1", code: "9.1", title: "My School", titleUrdu: "میرا سکول", type: "chapter" },
    ],
  },
  {
    id: "chapter-10",
    title: "Chapter 10: Means of Transport",
    titleUrdu: "باب نمبر 10: ذرائع آمدورفت",
    type: "unit",
    chapters: [
      { id: "10.1", code: "10.1", title: "Means of Transport", titleUrdu: "ذرائع آمدورفت", type: "chapter" },
    ],
  },
  {
    id: "chapter-11",
    title: "Chapter 11: Traffic Rules",
    titleUrdu: "باب نمبر 11: ٹریفک قوانین",
    type: "unit",
    chapters: [
      { id: "11.1", code: "11.1", title: "Traffic Rules", titleUrdu: "ٹریفک قوانین", type: "chapter" },
    ],
  },
  {
    id: "chapter-12",
    title: "Chapter 12: Good Moral Habits",
    titleUrdu: "باب نمبر 12: اچھے اخلاقی عادات",
    type: "unit",
    chapters: [
      { id: "12.1", code: "12.1", title: "Good Moral Habits", titleUrdu: "اچھے اخلاقی عادات", type: "chapter" },
    ],
  },
  {
    id: "chapter-13",
    title: "Chapter 13: Plants and Animals",
    titleUrdu: "باب نمبر 13: پودے اور جانور",
    type: "unit",
    chapters: [
      { id: "13.1", code: "13.1", title: "Plants and Animals", titleUrdu: "پودے اور جانور", type: "chapter" },
    ],
  },
  {
    id: "chapter-14",
    title: "Chapter 14: Earth and Sky",
    titleUrdu: "باب نمبر 14: زمین اور آسمان",
    type: "unit",
    chapters: [
      { id: "14.1", code: "14.1", title: "Earth and Sky", titleUrdu: "زمین اور آسمان", type: "chapter" },
    ],
  },
];

// Helper function to get all chapters as flat list
export function getAllChapters(): Chapter[] {
  return PTB_CLASS1_GENERAL_KNOWLEDGE.flatMap((unit) => unit.chapters);
}

// Helper function to get chapters by unit
export function getChaptersByUnit(unitId: string): Chapter[] {
  const unit = PTB_CLASS1_GENERAL_KNOWLEDGE.find((u) => u.id === unitId);
  return unit?.chapters || [];
}

// Helper function to get unit by chapter ID
export function getUnitByChapterId(chapterId: string): Unit | undefined {
  return PTB_CLASS1_GENERAL_KNOWLEDGE.find((unit) =>
    unit.chapters.some((ch) => ch.id === chapterId)
  );
}
