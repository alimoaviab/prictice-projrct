/**
 * PTB Class 4 (FOUR) - Social Studies - Complete Syllabus
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

export const PTB_CLASS4_SOCIAL_STUDIES: Unit[] = [
  {
    id: "bab-1",
    title: "باب نمبر 1: شہریت",
    type: "unit",
    chapters: [
      { id: "1.1", code: "1.1", title: "شہریت اور انسانی حقوق", type: "unit" },
      { id: "1.2", code: "1.2", title: "تنوع اور رواداری", type: "unit" }
    ]
  },
  {
    id: "bab-2",
    title: "باب نمبر 2: ثقافت",
    type: "unit",
    chapters: [
      { id: "2.1", code: "2.1", title: "ثقافت", type: "unit" },
      { id: "2.2", code: "2.2", title: "ذرائع ابلاغ", type: "unit" }
    ]
  },
  {
    id: "bab-3",
    title: "باب نمبر 3: ریاست اور حکومت",
    type: "unit",
    chapters: [
      { id: "3.1", code: "3.1", title: "ریاست اور حکومت", type: "unit" },
      { id: "3.2", code: "3.2", title: "حکومت کے اعضا (عناصر)", type: "unit" }
    ]
  },
  {
    id: "bab-4",
    title: "باب نمبر 4: تاریخ",
    type: "unit",
    chapters: [
      { id: "4.1", code: "4.1", title: "انسانی تہذیب کا آغاز", type: "unit" },
      { id: "4.2", code: "4.2", title: "قیامِ پاکستان میں صوبوں/علاقوں کا کردار اور پاکستان کی اہم تاریخی شخصیات", type: "unit" }
    ]
  },
  {
    id: "bab-5",
    title: "باب نمبر 5: جغرافیہ",
    type: "unit",
    chapters: [
      { id: "5.1", code: "5.1", title: "گلوب اور نقشے کی مہارتیں", type: "unit" },
      { id: "5.2", code: "5.2", title: "پاکستان کے طبعی خدوخال", type: "unit" },
      { id: "5.3", code: "5.3", title: "موسم اور آب و ہوا", type: "unit" },
      { id: "5.4", code: "5.4", title: "آبادی", type: "unit" }
    ]
  },
  {
    id: "bab-6",
    title: "باب نمبر 6: معاشیات",
    type: "unit",
    chapters: [
      { id: "6.1", code: "6.1", title: "معاشیات", type: "unit" }
    ]
  }
];

export function getAllChapters(): Chapter[] {
  return PTB_CLASS4_SOCIAL_STUDIES.flatMap(unit => unit.chapters);
}
export function getChaptersByUnit(unitId: string): Chapter[] {
  const unit = PTB_CLASS4_SOCIAL_STUDIES.find(u => u.id === unitId);
  return unit ? unit.chapters : [];
}
export function getChapterById(chapterId: string): Chapter | undefined {
  return getAllChapters().find(ch => ch.id === chapterId);
}
export function getTotalChapterCount(): number {
  return getAllChapters().length;
}
export const SYLLABUS_METADATA = {
  subject: "Social Studies",
  class: "4th",
  board: "PTB",
  totalUnits: 6,
  totalChapters: getTotalChapterCount(),
  language: "Urdu"
};
