/**
 * PTB Class 6 - ترجمۃ القرآن (Translation of Holy Quran) - Complete Syllabus
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

export const PTB_CLASS6_TARJUMA_QURAN: Unit[] = [
  {
    id: "surahs",
    title: "سورتیں (Surahs)",
    type: "section",
    chapters: [
      { id: "3.1", code: "3.1", title: "سُورَۃُ الفَاتِحَۃِ", type: "section" },
      { id: "4.1", code: "4.1", title: "سُورَۃُ الفِیلِ", type: "section" },
      { id: "5.1", code: "5.1", title: "سُورَۃُ قُرَیِشٍ", type: "section" },
      { id: "6.1", code: "6.1", title: "سُورَۃُ المَاعُونِ", type: "section" },
      { id: "7.1", code: "7.1", title: "سُورَۃُ الکَوثَرِ", type: "section" },
      { id: "8.1", code: "8.1", title: "سُورَۃُ الکٰفِرُونَ", type: "section" },
      { id: "9.1", code: "9.1", title: "سُورَۃُ النَّصٰرِ", type: "section" },
      { id: "10.1", code: "10.1", title: "سُورَۃُ اللَّھَبِ", type: "section" },
      { id: "11.1", code: "11.1", title: "سُورَۃُ الاِخلَاصِ", type: "section" },
      { id: "12.1", code: "12.1", title: "سُورَۃُ الفَلَقِ", type: "section" },
      { id: "12.2", code: "12.2", title: "سُورَۃُ النَّاسِ", type: "section" }
    ]
  },
  {
    id: "prophets",
    title: "انبیاء کرام (Prophets)",
    type: "section",
    chapters: [
      { id: "13.1", code: "13.1", title: "حضرت آدم علیہ السلام", type: "section" },
      { id: "14.1", code: "14.1", title: "حضرت نوح علیہ السلام", type: "section" },
      { id: "15.1", code: "15.1", title: "حضرت ھود علیہ السلام", type: "section" },
      { id: "16.1", code: "16.1", title: "حضرت صالح علیہ السلام", type: "section" },
      { id: "17.1", code: "17.1", title: "حضرت لوط علیہ السلام", type: "section" },
      { id: "18.1", code: "18.1", title: "حضرت شَعیب علیہ السلام", type: "section" }
    ]
  }
];

export function getAllChapters(): Chapter[] {
  return PTB_CLASS6_TARJUMA_QURAN.flatMap(unit => unit.chapters);
}
export function getChaptersByUnit(unitId: string): Chapter[] {
  const unit = PTB_CLASS6_TARJUMA_QURAN.find(u => u.id === unitId);
  return unit ? unit.chapters : [];
}
export function getChapterById(chapterId: string): Chapter | undefined {
  return getAllChapters().find(ch => ch.id === chapterId);
}
export function getTotalChapterCount(): number {
  return getAllChapters().length;
}
export const SYLLABUS_METADATA = {
  subject: "ترجمۃ القرآن (Translation of Holy Quran)",
  class: "6th",
  board: "PTB",
  totalSurahs: 11,
  totalProphets: 6,
  totalChapters: getTotalChapterCount(),
  language: "Arabic/Urdu"
};
