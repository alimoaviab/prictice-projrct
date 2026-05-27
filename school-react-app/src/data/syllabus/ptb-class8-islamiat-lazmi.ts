/**
 * PTB Class 8 - اسلامیات لازمی (Islamiyat Compulsory) - Complete Syllabus
 * Source: Punjab Textbook Board
 * 
 * Subject: اسلامیات لازمی (Islamiyat Compulsory)
 * Class: 8th
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

export const PTB_CLASS8_ISLAMIAT_LAZMI: Unit[] = [
  {
    id: "bab-2",
    title: "باب دوم: ایمانیات وعبادات",
    type: "unit",
    chapters: [
      {
        id: "2.1",
        code: "2.1",
        title: "تقدیر پرایمان",
        type: "unit"
      },
      {
        id: "2.2",
        code: "2.2",
        title: "عقیدہ آخرت",
        type: "unit"
      },
      {
        id: "2.3",
        code: "2.3",
        title: "خشیت الٰہی",
        type: "unit"
      },
      {
        id: "2.4",
        code: "2.4",
        title: "زکوۃ کی فضیلت و اہمیت",
        type: "unit"
      },
      {
        id: "2.5",
        code: "2.5",
        title: "حج اور اس کی عالمگیریت",
        type: "unit"
      },
      {
        id: "2.6",
        code: "2.6",
        title: "اسلامی عبادات کے تقاضے اوراثرات",
        type: "unit"
      }
    ]
  },
  {
    id: "bab-3",
    title: "باب سوم: سیرت طیبہ ﷺ",
    type: "unit",
    chapters: [
      {
        id: "3.1",
        code: "3.1",
        title: "نبی کریم ﷺ کی دعوت وتبلیغ کی عالمگیریت وآفاقیت",
        type: "unit"
      },
      {
        id: "3.2",
        code: "3.2",
        title: "غزوہ خیبر",
        type: "unit"
      },
      {
        id: "3.3",
        code: "3.3",
        title: "معرکہ مؤتہ",
        type: "unit"
      },
      {
        id: "3.4",
        code: "3.4",
        title: "خصائص و شمائل",
        type: "unit"
      },
      {
        id: "3.5",
        code: "3.5",
        title: "نبی کریم ﷺ کی معاشرتی تعلیمات",
        type: "unit"
      }
    ]
  },
  {
    id: "bab-4",
    title: "باب چہارم: اخلاق وآداب",
    type: "unit",
    chapters: [
      {
        id: "4.1",
        code: "4.1",
        title: "مساوات",
        type: "unit"
      },
      {
        id: "4.2",
        code: "4.2",
        title: "اُخوت اسلامی اور اتحادِ ملی",
        type: "unit"
      },
      {
        id: "4.3",
        code: "4.3",
        title: "بد گمانی سے پرہیز",
        type: "unit"
      },
      {
        id: "4.4",
        code: "4.4",
        title: "حرص وطَمَع کی ممانعت",
        type: "unit"
      }
    ]
  },
  {
    id: "bab-5",
    title: "باب پنجم: حسن معاملات و معاشرت",
    type: "unit",
    chapters: [
      {
        id: "5.1",
        code: "5.1",
        title: "حقوق العباد",
        type: "unit"
      },
      {
        id: "5.2",
        code: "5.2",
        title: "خرید و فروخت کے احکام وآداب",
        type: "unit"
      }
    ]
  },
  {
    id: "bab-6",
    title: "باب ششم: ہدایت کے سر چشمے اورمشاہیر اسلام",
    type: "unit",
    chapters: [
      {
        id: "6.1",
        code: "6.1",
        title: "امہات المومنین رضی اللہ تعالیٰ عنھن",
        type: "unit"
      },
      {
        id: "6.2",
        code: "6.2",
        title: "حضرت سیدنا امام حسین رضی اللہ تعالیٰ عنہ",
        type: "unit"
      },
      {
        id: "6.3",
        code: "6.3",
        title: "صحابہ کرام رضی اللہ تعالی عنھم",
        type: "unit"
      },
      {
        id: "6.4",
        code: "6.4",
        title: "صوفیہ کرام رحمتہ اللہ علیھم",
        type: "unit"
      },
      {
        id: "6.5",
        code: "6.5",
        title: "علما و مفکرین رحمۃ اللہ علیھم",
        type: "unit"
      },
      {
        id: "6.6",
        code: "6.6",
        title: "فاتحین",
        type: "unit"
      }
    ]
  },
  {
    id: "bab-7",
    title: "باب ہفتم: اسلامی تعلیمات اور عصر حاضر کے تقاضے",
    type: "unit",
    chapters: [
      {
        id: "7.1",
        code: "7.1",
        title: "دعوت و تبلیغ",
        type: "unit"
      },
      {
        id: "7.2",
        code: "7.2",
        title: "ذرائع ابلاغ کا استعمال",
        type: "unit"
      }
    ]
  }
];

/**
 * Get all chapters as a flat array
 */
export function getAllChapters(): Chapter[] {
  return PTB_CLASS8_ISLAMIAT_LAZMI.flatMap(unit => unit.chapters);
}

/**
 * Get chapters by unit ID
 */
export function getChaptersByUnit(unitId: string): Chapter[] {
  const unit = PTB_CLASS8_ISLAMIAT_LAZMI.find(u => u.id === unitId);
  return unit ? unit.chapters : [];
}

/**
 * Get chapter by ID
 */
export function getChapterById(chapterId: string): Chapter | undefined {
  return getAllChapters().find(ch => ch.id === chapterId);
}

/**
 * Get total chapter count
 */
export function getTotalChapterCount(): number {
  return getAllChapters().length;
}

/**
 * Syllabus metadata
 */
export const SYLLABUS_METADATA = {
  subject: "اسلامیات لازمی (Islamiyat Compulsory)",
  class: "8th",
  board: "PTB",
  totalUnits: 6,
  totalChapters: getTotalChapterCount(),
  language: "Urdu"
};
