/**
 * PTB Class 7 - پنجابی (Punjabi) - Complete Syllabus
 * Source: Punjab Textbook Board
 * 
 * Subject: پنجابی (Punjabi)
 * Class: 7th
 * Board: PTB (Punjab Textbook Board)
 */

export interface Chapter {
  id: string;
  code: string;
  title: string;
  type: "unit" | "review" | "section";
}

export interface Unit {
  id: string;
  title: string;
  type: "unit" | "review" | "section";
  chapters: Chapter[];
}

export const PTB_CLASS7_PUNJABI: Unit[] = [
  {
    id: "lessons",
    title: "سبق (Lessons)",
    type: "section",
    chapters: [
      { id: "1", code: "1", title: "حمد", type: "section" },
      { id: "2", code: "2", title: "نعت", type: "section" },
      { id: "3", code: "3", title: "ساڈے پیارے نبیﷺ", type: "section" },
      { id: "4", code: "4", title: "قائد اعظمؒ", type: "section" },
      { id: "5", code: "5", title: "وگدی اے راوی", type: "section" },
      { id: "6", code: "6", title: "ساڈا پاکستان", type: "section" },
      { id: "7", code: "7", title: "حضرت سلطان باہوؒ", type: "section" },
      { id: "8", code: "8", title: "سپاہی", type: "section" },
      { id: "9", code: "9", title: "حضور نبی کریمﷺ", type: "section" },
      { id: "10", code: "10", title: "حضرت سخی سرورؒ", type: "section" },
      { id: "11", code: "11", title: "14۔اگست", type: "section" },
      { id: "12", code: "12", title: "کھوہ پیا وگدا", type: "section" },
      { id: "13", code: "13", title: "عِید الفِطر", type: "section" },
      { id: "14", code: "14", title: "گیت", type: "section" },
      { id: "15", code: "15", title: "بدر دی جنگ", type: "section" },
      { id: "16", code: "16", title: "نظم", type: "section" },
      { id: "17", code: "17", title: "سیّد وارث شاہؒ", type: "section" },
      { id: "18", code: "18", title: "تِن نانویں", type: "section" },
      { id: "19", code: "19", title: "سچے یار رسُولﷺ دے", type: "section" },
      { id: "20", code: "20", title: "دوغلے", type: "section" },
      { id: "21", code: "21", title: "نشے ناں زہر", type: "section" },
      { id: "22", code: "22", title: "آؤ بالو", type: "section" },
      { id: "23", code: "23", title: "پہاڑاں نی ملکہ", type: "section" },
      { id: "24", code: "24", title: "امریکہ وچ لاہور", type: "section" },
      { id: "25", code: "25", title: "ہک بوٹا", type: "section" },
      { id: "26", code: "26", title: "دب کے واہ تے رَج کے کھا", type: "section" },
      { id: "27", code: "27", title: "پیلُوں", type: "section" },
      { id: "28", code: "28", title: "پھُلاں دا مشاعرہ", type: "section" },
      { id: "29", code: "29", title: "ساڈا پِنڈ", type: "section" },
      { id: "30", code: "30", title: "سائنس دیاں برکتاں", type: "section" },
      { id: "31", code: "31", title: "ہرن مینار", type: "section" },
      { id: "32", code: "32", title: "ماں", type: "section" },
      { id: "33", code: "33", title: "ساڈی زمین", type: "section" },
      { id: "34", code: "34", title: "چن دی سَیر", type: "section" },
      { id: "35", code: "35", title: "پکھّی واسن", type: "section" },
      { id: "36", code: "36", title: "روہی", type: "section" },
      { id: "37", code: "37", title: "ایّکا", type: "section" },
      { id: "38", code: "38", title: "پیار", type: "section" },
      { id: "39", code: "39", title: "تحریک پاکستان وِچ عورتاں دا حصّہ", type: "section" },
      { id: "40", code: "40", title: "اُچیاں لمیاں ٹاہلیاں", type: "section" },
      { id: "41", code: "41", title: "ہالیا", type: "section" },
      { id: "42", code: "42", title: "حلال دی روٹی", type: "section" },
      { id: "43", code: "43", title: "صحت نہیں تے کجھ نہیں", type: "section" },
      { id: "44", code: "44", title: "گڈّی", type: "section" },
      { id: "45", code: "45", title: "سائنس دی ترقّی", type: "section" },
      { id: "46", code: "46", title: "دیس دے بچّے", type: "section" },
      { id: "47", code: "47", title: "منحوس", type: "section" }
    ]
  }
];

export function getAllChapters(): Chapter[] {
  return PTB_CLASS7_PUNJABI.flatMap(unit => unit.chapters);
}

export function getChaptersByUnit(unitId: string): Chapter[] {
  const unit = PTB_CLASS7_PUNJABI.find(u => u.id === unitId);
  return unit ? unit.chapters : [];
}

export function getChapterById(chapterId: string): Chapter | undefined {
  return getAllChapters().find(ch => ch.id === chapterId);
}

export function getTotalChapterCount(): number {
  return getAllChapters().length;
}

export const SYLLABUS_METADATA = {
  subject: "پنجابی (Punjabi)",
  class: "7th",
  board: "PTB",
  totalLessons: 47,
  totalChapters: getTotalChapterCount(),
  language: "Punjabi/Urdu"
};
