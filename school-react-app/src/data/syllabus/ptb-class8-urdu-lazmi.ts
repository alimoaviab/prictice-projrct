/**
 * PTB Class 8 (8TH) - اُردو لازمی (Urdu Compulsory) - Complete Syllabus
 * Source: Punjab Textbook Board
 */
export interface Chapter { id: string; code: string; title: string; type: "unit" | "review" | "section"; }
export interface Unit { id: string; title: string; type: "unit" | "review" | "section"; chapters: Chapter[]; }

export const PTB_CLASS8_URDU_LAZMI: Unit[] = [
  {
    id: "nasabi-asbaq",
    title: "نصابی اسباق",
    type: "section",
    chapters: [
      { id: "1",  code: "1",  title: "حمد (نظم)", type: "section" },
      { id: "2",  code: "2",  title: "نعت (نظم)", type: "section" },
      { id: "3",  code: "3",  title: "تبسم کے پھول", type: "section" },
      { id: "4",  code: "4",  title: "عظیم سپہ سالار", type: "section" },
      { id: "5",  code: "5",  title: "چغل خور", type: "section" },
      { id: "6",  code: "6",  title: "قدرتی آفات", type: "section" },
      { id: "7",  code: "7",  title: "وطن کی مٹی گواہ رہنا (نظم)", type: "section" },
      { id: "8",  code: "8",  title: "مناظرِ پاکستان", type: "section" },
      { id: "9",  code: "9",  title: "میجر شبیر شریف شہید", type: "section" },
      { id: "10", code: "10", title: "پاکستان کی تہذیب و ثقافت", type: "section" },
      { id: "11", code: "11", title: "اک ریل کے سفر کی تصویر کھنچتا ہوں (نظم)", type: "section" },
      { id: "12", code: "12", title: "ہاکی", type: "section" },
      { id: "13", code: "13", title: "قدرتی ماحول", type: "section" },
      { id: "14", code: "14", title: "حکیم محمد سعید شہید", type: "section" },
      { id: "15", code: "15", title: "درسِ عمل (نظم)", type: "section" },
      { id: "16", code: "16", title: "خواتین کا احترام اور مقام", type: "section" },
      { id: "17", code: "17", title: "کرپشن ایک سماجی بُرائی", type: "section" },
      { id: "18", code: "18", title: "دریا کنارے چاندنی (نظم)", type: "section" },
      { id: "19", code: "19", title: "ابتدائی طبی امداد", type: "section" },
      { id: "20", code: "20", title: "بچے کی دعا (نظم)", type: "section" }
    ]
  },
  {
    id: "sarf-o-nahw",
    title: "صرف و نحو",
    type: "section",
    chapters: [
      { id: "g-1", code: "g-1", title: "حروف اور اس کی اقسام", type: "section" },
      { id: "g-2", code: "g-2", title: "اسم اور اس کی اقسام", type: "section" },
      { id: "g-3", code: "g-3", title: "اسم معرفہ و نکرہ کی اقسام", type: "section" },
      { id: "g-4", code: "g-4", title: "فعل اور اس کی اقسام", type: "section" },
      { id: "g-5", code: "g-5", title: "افعال کی اقسام (بلحاظِ فاعل)", type: "section" },
      { id: "g-6", code: "g-6", title: "رموزِ اوقاف", type: "section" }
    ]
  },
  {
    id: "urdu-b",
    title: "اردو (ب)",
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

export function getAllChapters(): Chapter[] { return PTB_CLASS8_URDU_LAZMI.flatMap(u => u.chapters); }
export function getChaptersByUnit(unitId: string): Chapter[] { const u = PTB_CLASS8_URDU_LAZMI.find(x => x.id === unitId); return u ? u.chapters : []; }
export function getChapterById(chapterId: string): Chapter | undefined { return getAllChapters().find(ch => ch.id === chapterId); }
export function getTotalChapterCount(): number { return getAllChapters().length; }
export const SYLLABUS_METADATA = { subject: "اُردو لازمی (Urdu Compulsory)", class: "8th", board: "PTB", totalChapters: getTotalChapterCount(), language: "Urdu" };
