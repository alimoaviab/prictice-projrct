/**
 * PTB Class 8 (8TH) - پنجابی (Punjabi) - Complete Syllabus
 * Source: Punjab Textbook Board
 */
export interface Chapter { id: string; code: string; title: string; type: "unit" | "review" | "section"; }
export interface Unit { id: string; title: string; type: "unit" | "review" | "section"; chapters: Chapter[]; }

export const PTB_CLASS8_PUNJABI: Unit[] = [
  {
    id: "lessons",
    title: "اسباق / نظمیں / غزلیں",
    type: "section",
    chapters: [
      { id: "1",  code: "نظم 1",  title: "سچی ذات رب دی", type: "section" },
      { id: "2",  code: "باب 2",  title: "حضرت محمد ﷺ", type: "section" },
      { id: "3",  code: "نظم 3",  title: "نعت", type: "section" },
      { id: "4",  code: "باب 4",  title: "حضرت عمر فاروق رضی اللہ عنہ", type: "section" },
      { id: "5",  code: "باب 5",  title: "ایکے دی برکت", type: "section" },
      { id: "6",  code: "نظم 6",  title: "مہمان داری", type: "section" },
      { id: "7",  code: "باب 7",  title: "اچھا شہری", type: "section" },
      { id: "8",  code: "باب 8",  title: "دلاں نوں دلاں دے راہ", type: "section" },
      { id: "9",  code: "غزل 9",  title: "غزل", type: "section" },
      { id: "10", code: "باب 10", title: "جنت دی خاتون", type: "section" },
      { id: "11", code: "باب 11", title: "قادریار", type: "section" },
      { id: "12", code: "نظم 12", title: "قائداعظم", type: "section" },
      { id: "13", code: "باب 13", title: "انسان دی کہانی", type: "section" },
      { id: "14", code: "باب 14", title: "نشے توں بچو", type: "section" },
      { id: "15", code: "باب 15", title: "قائداعظم رحمتہ اللہ علیہ", type: "section" },
      { id: "16", code: "نظم 16", title: "میلا شالا مار", type: "section" },
      { id: "17", code: "باب 17", title: "ڈیرہ بابے راٹھ دا", type: "section" },
      { id: "18", code: "باب 18", title: "چٹھی", type: "section" },
      { id: "19", code: "باب 19", title: "شہیداں نوں سلام", type: "section" },
      { id: "20", code: "نظم 20", title: "محنت دی وڈیائی", type: "section" },
      { id: "21", code: "نظم 21", title: "بھیناں دے ویر", type: "section" },
      { id: "22", code: "باب 22", title: "کجھ ایٹمی توانائی بارے", type: "section" },
      { id: "23", code: "نظم 23", title: "دیس پیارا گیت", type: "section" },
      { id: "24", code: "باب 24", title: "فضا دی صفائی", type: "section" },
      { id: "25", code: "باب 25", title: "جہاد", type: "section" },
      { id: "26", code: "باب 26", title: "غنی سائیں", type: "section" },
      { id: "27", code: "نظم 27", title: "جیوے ساڈا پاکستان", type: "section" },
      { id: "28", code: "باب 28", title: "پہیے توں گڈی توڑی", type: "section" },
      { id: "29", code: "باب 29", title: "بیتے دا محرم — ہڑپہ", type: "section" },
      { id: "30", code: "نظم 30", title: "قدرت رب دی", type: "section" },
      { id: "31", code: "باب 31", title: "لطیفے", type: "section" },
      { id: "32", code: "نظم 32", title: "دوہڑے", type: "section" },
      { id: "33", code: "باب 33", title: "انسان تے قدرت", type: "section" },
      { id: "34", code: "غزل 34", title: "غزل", type: "section" },
      { id: "35", code: "باب 35", title: "زبیدہ ناں سچ", type: "section" },
      { id: "36", code: "نظم 36", title: "سوہنیا سائیاں", type: "section" }
    ]
  }
];

export function getAllChapters(): Chapter[] { return PTB_CLASS8_PUNJABI.flatMap(u => u.chapters); }
export function getChaptersByUnit(unitId: string): Chapter[] { const u = PTB_CLASS8_PUNJABI.find(x => x.id === unitId); return u ? u.chapters : []; }
export function getChapterById(chapterId: string): Chapter | undefined { return getAllChapters().find(ch => ch.id === chapterId); }
export function getTotalChapterCount(): number { return getAllChapters().length; }
export const SYLLABUS_METADATA = { subject: "پنجابی (Punjabi)", class: "8th", board: "PTB", totalLessons: 36, totalChapters: getTotalChapterCount(), language: "Punjabi/Urdu" };
