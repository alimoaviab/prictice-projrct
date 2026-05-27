/**
 * PTB Class 9 - اسلامیات اختیاری (Islamiyat Elective) - Complete Syllabus
 * Source: Punjab Textbook Board
 * 
 * Subject: اسلامیات اختیاری (Islamiyat Elective)
 * Class: 9th
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

export const PTB_CLASS9_ISLAMIYAT_ELECTIVE: Unit[] = [
  // آیات کریمہ (Holy Verses)
  {
    id: "ayat-section",
    title: "آیات کریمہ",
    type: "section",
    chapters: [
      {
        id: "ayat-1",
        code: "آیت 1",
        title: "آیت نمبر :1",
        type: "section"
      },
      {
        id: "ayat-2",
        code: "آیت 2",
        title: "آیت نمبر :2",
        type: "section"
      },
      {
        id: "ayat-3",
        code: "آیت 3",
        title: "آیت نمبر :3",
        type: "section"
      },
      {
        id: "ayat-4",
        code: "آیت 4",
        title: "آیت نمبر :4",
        type: "section"
      },
      {
        id: "ayat-5",
        code: "آیت 5",
        title: "آیت نمبر :5",
        type: "section"
      },
      {
        id: "ayat-6",
        code: "آیت 6",
        title: "آیت نمبر :6",
        type: "section"
      },
      {
        id: "ayat-7",
        code: "آیت 7",
        title: "آیت نمبر :7",
        type: "section"
      },
      {
        id: "ayat-8",
        code: "آیت 8",
        title: "آیت نمبر :8",
        type: "section"
      },
      {
        id: "ayat-9",
        code: "آیت 9",
        title: "آیت نمبر :9",
        type: "section"
      },
      {
        id: "ayat-10",
        code: "آیت 10",
        title: "آیت نمبر :10",
        type: "section"
      }
    ]
  },
  // احادیث مبارکہ (Holy Hadiths)
  {
    id: "hadith-section",
    title: "احادیث مبارکہ",
    type: "section",
    chapters: [
      {
        id: "hadith-1",
        code: "حدیث 1",
        title: "حدیث نمبر :1",
        type: "section"
      },
      {
        id: "hadith-2",
        code: "حدیث 2",
        title: "حدیث نمبر :2",
        type: "section"
      },
      {
        id: "hadith-3",
        code: "حدیث 3",
        title: "حدیث نمبر :3",
        type: "section"
      },
      {
        id: "hadith-4",
        code: "حدیث 4",
        title: "حدیث نمبر :4",
        type: "section"
      },
      {
        id: "hadith-5",
        code: "حدیث 5",
        title: "حدیث نمبر :5",
        type: "section"
      },
      {
        id: "hadith-6",
        code: "حدیث 6",
        title: "حدیث نمبر :6",
        type: "section"
      },
      {
        id: "hadith-7",
        code: "حدیث 7",
        title: "حدیث نمبر :7",
        type: "section"
      },
      {
        id: "hadith-8",
        code: "حدیث 8",
        title: "حدیث نمبر :8",
        type: "section"
      },
      {
        id: "hadith-9",
        code: "حدیث 9",
        title: "حدیث نمبر :9",
        type: "section"
      },
      {
        id: "hadith-10",
        code: "حدیث 10",
        title: "حدیث نمبر :10",
        type: "section"
      },
      {
        id: "hadith-11",
        code: "حدیث 11",
        title: "حدیث نمبر :11",
        type: "section"
      },
      {
        id: "hadith-12",
        code: "حدیث 12",
        title: "حدیث نمبر :12",
        type: "section"
      }
    ]
  },
  // باب اوّل ۔ القرآن
  {
    id: "bab-1",
    title: "باب اوّل ۔ القرآن",
    type: "unit",
    chapters: [
      {
        id: "1.1",
        code: "1.1",
        title: "القرآن",
        type: "unit"
      }
    ]
  },
  // باب چہارم ۔ سیرت طیبہ ﷺ
  {
    id: "bab-4",
    title: "باب چہارم ۔ سیرت طیبہ ﷺ",
    type: "unit",
    chapters: [
      {
        id: "4.1",
        code: "4.1",
        title: "رسالت کا مفہوم، منصب اور اس کی عظمت",
        type: "unit"
      },
      {
        id: "4.2",
        code: "4.2",
        title: "انبیاء کرام کی تبلیغی مساعی",
        type: "unit"
      },
      {
        id: "4.3",
        code: "4.3",
        title: "آنحضورﷺ کی تکمیل فریضہ رسالت",
        type: "unit"
      },
      {
        id: "4.4",
        code: "4.4",
        title: "ختم نبوت",
        type: "unit"
      },
      {
        id: "4.5",
        code: "4.5",
        title: "آنحضورﷺ کا پاکیزہ کردار",
        type: "unit"
      },
      {
        id: "4.6",
        code: "4.6",
        title: "اخلاق نبویﷺ",
        type: "unit"
      }
    ]
  },
  // باب پنجم ۔ عربی زبان کی گرامر
  {
    id: "bab-5",
    title: "باب پنجم ۔ عربی زبان کی گرامر",
    type: "unit",
    chapters: [
      {
        id: "5.1",
        code: "5.1",
        title: "کلمہ",
        type: "unit"
      },
      {
        id: "5.2",
        code: "5.2",
        title: "اسم نکرہ و اسم معرفہ",
        type: "unit"
      },
      {
        id: "5.3",
        code: "5.3",
        title: "مذکر مونث (مونث لفظی و مونث معنوی)",
        type: "unit"
      },
      {
        id: "5.4",
        code: "5.4",
        title: "مفرد، تثنیہ، جمع",
        type: "unit"
      },
      {
        id: "5.5",
        code: "5.5",
        title: "جمع کی قسمیں (جمع مکسرو جمع سالم)",
        type: "unit"
      },
      {
        id: "5.6",
        code: "5.6",
        title: "جمع کی سالم قسمیں (جمع مذکر سالم و مونث سالم)",
        type: "unit"
      }
    ]
  }
];

/**
 * Get all chapters as a flat array
 */
export function getAllChapters(): Chapter[] {
  return PTB_CLASS9_ISLAMIYAT_ELECTIVE.flatMap(unit => unit.chapters);
}

/**
 * Get chapters by unit ID
 */
export function getChaptersByUnit(unitId: string): Chapter[] {
  const unit = PTB_CLASS9_ISLAMIYAT_ELECTIVE.find(u => u.id === unitId);
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
  subject: "اسلامیات اختیاری (Islamiyat Elective)",
  class: "9th",
  board: "PTB",
  totalSections: 5,
  totalChapters: getTotalChapterCount(),
  language: "Urdu/Arabic",
  sections: {
    ayat: 10,
    hadith: 12,
    quran: 1,
    sirat: 6,
    grammar: 6
  }
};
