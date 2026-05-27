/**
 * PTB Class 6 - پنجابی (Punjabi) - Complete Syllabus
 * Source: Punjab Textbook Board
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

export const PTB_CLASS6_PUNJABI: Unit[] = [
  {
    id: "lessons",
    title: "سبق (Lessons)",
    type: "section",
    chapters: [
      { id: "1", code: "1", title: "حمد", type: "section" },
      { id: "2", code: "2", title: "پیارے نبیﷺ", type: "section" },
      { id: "3", code: "3", title: "نعت", type: "section" },
      { id: "4", code: "4", title: "ایثار تے قربانی", type: "section" },
      { id: "5", code: "5", title: "قائد اعظمؒ", type: "section" },
      { id: "6", code: "6", title: "ساڈی صحت", type: "section" },
      { id: "7", code: "7", title: "وطن دِی حفاظت", type: "section" },
      { id: "8", code: "8", title: "تاریاں نے اِک پنڈ وسایا", type: "section" },
      { id: "9", code: "9", title: "مُسلمان دا اِنصاف", type: "section" },
      { id: "10", code: "10", title: "وَڈا اِنسان", type: "section" },
      { id: "11", code: "11", title: "شوکا جدوں سکُولے جاوے", type: "section" },
      { id: "12", code: "12", title: "حضرت داتا گنج بخشؒ", type: "section" },
      { id: "13", code: "13", title: "بچیّاں دا اقبالؒ", type: "section" },
      { id: "14", code: "14", title: "بے زبان", type: "section" },
      { id: "15", code: "15", title: "اتفاق", type: "section" },
      { id: "16", code: "16", title: "بابا فرید گنج شکرؒ", type: "section" },
      { id: "17", code: "17", title: "دُعا", type: "section" },
      { id: "18", code: "18", title: "نُور منارے", type: "section" },
      { id: "19", code: "19", title: "ساڈا دیس", type: "section" },
      { id: "20", code: "20", title: "بول دا پالن", type: "section" },
      { id: "21", code: "21", title: "میلا شالامار", type: "section" },
      { id: "22", code: "22", title: "پاکستان دی کہانی", type: "section" },
      { id: "23", code: "23", title: "اَسیں آں پاکستانی", type: "section" },
      { id: "24", code: "24", title: "سائنس دے کرشمے", type: "section" },
      { id: "25", code: "25", title: "ربّا اپنا کرم کما", type: "section" },
      { id: "26", code: "26", title: "ساڈے شیر، شہید وطن دے", type: "section" },
      { id: "27", code: "27", title: "قدم وَدھائی چلیئے", type: "section" },
      { id: "28", code: "28", title: "دو کُکّڑ", type: "section" },
      { id: "29", code: "29", title: "دو کنجُوس", type: "section" },
      { id: "30", code: "30", title: "عیدُالفطر", type: "section" },
      { id: "31", code: "31", title: "بات بتولی", type: "section" },
      { id: "32", code: "32", title: "میں چنگا اِنسان بناں گا", type: "section" }
    ]
  }
];

export function getAllChapters(): Chapter[] {
  return PTB_CLASS6_PUNJABI.flatMap(unit => unit.chapters);
}
export function getChaptersByUnit(unitId: string): Chapter[] {
  const unit = PTB_CLASS6_PUNJABI.find(u => u.id === unitId);
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
  class: "6th",
  board: "PTB",
  totalLessons: 32,
  totalChapters: getTotalChapterCount(),
  language: "Punjabi/Urdu"
};
