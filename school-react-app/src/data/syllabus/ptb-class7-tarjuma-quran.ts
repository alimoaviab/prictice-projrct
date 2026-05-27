/**
 * PTB Class 7 - ترجمۃ القرآن (Translation of Holy Quran) - Complete Syllabus
 * Source: Punjab Textbook Board
 * 
 * Subject: ترجمۃ القرآن (Translation of Holy Quran)
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

export const PTB_CLASS7_TARJUMA_QURAN: Unit[] = [
  {
    id: "surahs",
    title: "سورتیں (Surahs)",
    type: "section",
    chapters: [
      { id: "1", code: "1", title: "سُورَۃُ الَّنَبَا", type: "section" },
      { id: "2", code: "2", title: "سُورَۃُ النّٰزِعٰتِ", type: "section" },
      { id: "3", code: "3", title: "سُورَۃُ عَبَسَ", type: "section" },
      { id: "4", code: "4", title: "سُورَۃُ التَّکوِیرِ", type: "section" },
      { id: "5", code: "5", title: "سُورَۃُ الاِنفِطَارِ", type: "section" },
      { id: "6", code: "6", title: "سُورَۃُ المُطَفِّفِینَ", type: "section" },
      { id: "7", code: "7", title: "سُورَۃُ الاِنشِقَاقِ", type: "section" },
      { id: "8", code: "8", title: "سُورَۃُ البُرُوجِ", type: "section" },
      { id: "9", code: "9", title: "سُورَۃُ الطّارِقِ", type: "section" },
      { id: "10", code: "10", title: "سُورَۃُ الاَعلیٰ", type: "section" },
      { id: "11", code: "11", title: "سُورَۃُ الغَاشِیَۃِ", type: "section" },
      { id: "12", code: "12", title: "سُورَۃُ الفَجرِ", type: "section" },
      { id: "13", code: "13", title: "سُورَۃُ البَلَدِ", type: "section" },
      { id: "14", code: "14", title: "سُورَۃُ الشَّمسِ", type: "section" },
      { id: "15", code: "15", title: "سُورَۃُ الَّیلِ", type: "section" },
      { id: "16", code: "16", title: "سُورَۃُ الضُّحٰی", type: "section" },
      { id: "17", code: "17", title: "سُورَۃُ اَلَم نَشرَح", type: "section" },
      { id: "18", code: "18", title: "سُورَۃُ التِّینِ", type: "section" },
      { id: "19", code: "19", title: "سُورَۃُ العَلَقِ", type: "section" },
      { id: "20", code: "20", title: "سُورَۃُ القَدرِ", type: "section" },
      { id: "21", code: "21", title: "سُورَۃُ البَیِّنَۃِ", type: "section" },
      { id: "22", code: "22", title: "سُورَۃُ الزِّلزَالِ", type: "section" },
      { id: "23", code: "23", title: "سُورَۃُ العٰدِیٰتِ", type: "section" },
      { id: "24", code: "24", title: "سُورَۃُ القَارِعَۃِ", type: "section" },
      { id: "25", code: "25", title: "سُورَۃُ التَّکَاثُرِ", type: "section" },
      { id: "26", code: "26", title: "سُورَۃُ العَصرِ", type: "section" },
      { id: "27", code: "27", title: "سُورَۃُ الھُمَزَۃِ", type: "section" }
    ]
  },
  {
    id: "prophets",
    title: "انبیاء کرام (Prophets)",
    type: "section",
    chapters: [
      { id: "28", code: "28", title: "حضرت ابراہیم علیہ السلام", type: "section" },
      { id: "29", code: "29", title: "حضرت موسیٰ علیہ السلام", type: "section" },
      { id: "30", code: "30", title: "حضرت داؤد علیہ السلام", type: "section" }
    ]
  }
];

export function getAllChapters(): Chapter[] {
  return PTB_CLASS7_TARJUMA_QURAN.flatMap(unit => unit.chapters);
}

export function getChaptersByUnit(unitId: string): Chapter[] {
  const unit = PTB_CLASS7_TARJUMA_QURAN.find(u => u.id === unitId);
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
  class: "7th",
  board: "PTB",
  totalSurahs: 27,
  totalProphets: 3,
  totalChapters: getTotalChapterCount(),
  language: "Arabic/Urdu"
};
