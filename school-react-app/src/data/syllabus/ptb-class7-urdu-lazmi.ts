/**
 * PTB Class 7 (7TH) - اُردو لازمی (Urdu Compulsory) - Complete Syllabus
 * Source: Punjab Textbook Board
 */
export interface Chapter { id: string; code: string; title: string; type: "unit" | "review" | "section"; }
export interface Unit { id: string; title: string; type: "unit" | "review" | "section"; chapters: Chapter[]; }

export const PTB_CLASS7_URDU_LAZMI: Unit[] = [
  {
    id: "nasabi-asbaq",
    title: "نصابی اسباق",
    type: "section",
    chapters: [
      { id: "1",  code: "1",  title: "حمد", type: "section" },
      { id: "2",  code: "2",  title: "نعت", type: "section" },
      { id: "3",  code: "3",  title: "آدابِ معاشرت سیرتِ طیبہ ﷺ کی روشنی میں", type: "section" },
      { id: "4",  code: "4",  title: "ملکی ترقی میں خواتین کا کردار", type: "section" },
      { id: "5",  code: "5",  title: "ٹریفک کے قوانین اور ہماری ذمہ داریاں", type: "section" },
      { id: "6",  code: "6",  title: "وطن کے لیے (نظم)", type: "section" },
      { id: "7",  code: "7",  title: "چچا چھکن نے تصویر ٹانگی", type: "section" },
      { id: "8",  code: "8",  title: "مذہب نہیں سکھاتا آپس میں بیر رکھنا", type: "section" },
      { id: "9",  code: "9",  title: "پھر اِن شاہین بچوں کو بال و پر دے", type: "section" },
      { id: "10", code: "10", title: "بارش کا پہلا قطرہ (نظم)", type: "section" },
      { id: "11", code: "11", title: "محسنِ پاکستان", type: "section" },
      { id: "12", code: "12", title: "دہشت گردی اور ہماری ذمہ داریاں", type: "section" },
      { id: "13", code: "13", title: "کم سن شہید", type: "section" },
      { id: "14", code: "14", title: "زندگی ہے مختلف جذبوں کی ہمواری کا نام (نظم)", type: "section" },
      { id: "15", code: "15", title: "کرپشن اور اس کا خاتمہ", type: "section" },
      { id: "16", code: "16", title: "کشمیر کی وادی میں لہرا کر رہو پرچم", type: "section" },
      { id: "17", code: "17", title: "اتحاد (نظم)", type: "section" },
      { id: "18", code: "18", title: "شجرکاری اور ہمارے موسم", type: "section" },
      { id: "19", code: "19", title: "انسدادِ منشیات", type: "section" },
      { id: "20", code: "20", title: "دعا (نظم)", type: "section" }
    ]
  },
  {
    id: "sarf-o-nahw",
    title: "صرف ونحو",
    type: "section",
    chapters: [
      { id: "g-1", code: "g-1", title: "حروف اور اس کی اقسام", type: "section" },
      { id: "g-2", code: "g-2", title: "اسم اور اس کی اقسام", type: "section" },
      { id: "g-3", code: "g-3", title: "اسمِ معرفہ و نکرہ کی اقسام", type: "section" },
      { id: "g-4", code: "g-4", title: "فعل اور اس کی اقسام", type: "section" },
      { id: "g-5", code: "g-5", title: "افعال (بلحاظ فاعل)", type: "section" },
      { id: "g-6", code: "g-6", title: "رموزِ اوقاف", type: "section" }
    ]
  },
  {
    id: "urdu-b",
    title: "اُردو (ب)",
    type: "section",
    chapters: [
      { id: "b-1",  code: "1",  title: "مذکر مونث", type: "section" },
      { id: "b-2",  code: "2",  title: "واحد جمع", type: "section" },
      { id: "b-3",  code: "3",  title: "ضرب الامثال", type: "section" },
      { id: "b-4",  code: "4",  title: "متشابہ الفاظ", type: "section" },
      { id: "b-5",  code: "5",  title: "مترادف الفاظ", type: "section" },
      { id: "b-6",  code: "6",  title: "متضاد الفاظ", type: "section" },
      { id: "b-7",  code: "7",  title: "سابقے لاحقے", type: "section" },
      { id: "b-8",  code: "8",  title: "اعراب", type: "section" },
      { id: "b-9",  code: "9",  title: "محاورات", type: "section" },
      { id: "b-10", code: "10", title: "غلط جملوں کی درستگی", type: "section" },
      { id: "b-11", code: "11", title: "درخواستیں", type: "section" },
      { id: "b-12", code: "12", title: "خطوط", type: "section" },
      { id: "b-13", code: "13", title: "کہانیاں", type: "section" },
      { id: "b-14", code: "14", title: "مضامین", type: "section" }
    ]
  }
];

export function getAllChapters(): Chapter[] { return PTB_CLASS7_URDU_LAZMI.flatMap(u => u.chapters); }
export function getChaptersByUnit(unitId: string): Chapter[] { const u = PTB_CLASS7_URDU_LAZMI.find(x => x.id === unitId); return u ? u.chapters : []; }
export function getChapterById(chapterId: string): Chapter | undefined { return getAllChapters().find(ch => ch.id === chapterId); }
export function getTotalChapterCount(): number { return getAllChapters().length; }
export const SYLLABUS_METADATA = { subject: "اُردو لازمی (Urdu Compulsory)", class: "7th", board: "PTB", totalChapters: getTotalChapterCount(), language: "Urdu" };
