/**
 * PTB Class 10 ہوم اکنامکس (Home Economics) Syllabus
 * 7 chapters — Urdu text preserved exactly with RTL support
 */

export interface Chapter {
  id: string;
  code: string;
  title: string;
  titleUrdu: string;
  type: "chapter";
}

export interface Unit {
  id: string;
  title: string;
  titleUrdu: string;
  type: "unit";
  chapters: Chapter[];
}

export const PTB_CLASS10_HOME_ECONOMICS: Unit[] = [
  {
    id: "chap-1",
    title: "Chapter 1: Introduction to Weaving and Clothing",
    titleUrdu: "باب نمبر1: پارچہ بافی اور لباس کا تعارف",
    type: "unit",
    chapters: [
      { id: "1.1", code: "1.1", title: "Definition and Importance of Weaving and Clothing",          titleUrdu: "پارچہ بافی اور لباس کی تعریف اور اہمیت",                    type: "chapter" },
      { id: "1.2", code: "1.2", title: "Fibers",                                                      titleUrdu: "ریشے",                                                       type: "chapter" },
      { id: "1.3", code: "1.3", title: "Types and Properties of Weaving Fibers",                     titleUrdu: "پارچہ بافی کے ر یشوں کی اقسام اور خصوصیات",                type: "chapter" },
      { id: "1.4", code: "1.4", title: "Study of Pure and Mixed Fabrics Available in the Market",    titleUrdu: "مارکیٹ میں دستیاب اصلی اور امتزاجی کپڑوں کا مطالعہ",      type: "chapter" },
    ],
  },
  {
    id: "chap-2",
    title: "Chapter 2: Making Clothes",
    titleUrdu: "باب نمبر2: لباس بنانا",
    type: "unit",
    chapters: [
      { id: "2.1", code: "2.1", title: "Sewing Materials",                                           titleUrdu: "سلائی کا سامان",                                            type: "chapter" },
      { id: "2.2", code: "2.2", title: "Principles of Sewing Clothes",                               titleUrdu: "لباس کی سلائی کےاصول",                                     type: "chapter" },
      { id: "2.3", code: "2.3", title: "Procedure for Selecting Fabric and Design",                  titleUrdu: "کپڑے اور ڈیزائن کے انتخاب کا طریقہ کار",                   type: "chapter" },
    ],
  },
  {
    id: "chap-3",
    title: "Chapter 3: Clothing Needs of Different Age Groups",
    titleUrdu: "باب نمبر3: عمر کے مختلف گروپوں کی لباس کی ضروریات",
    type: "unit",
    chapters: [
      { id: "3.1", code: "3.1", title: "Factors Affecting Choice of Clothing",                       titleUrdu: "لباس کےانتخاب پر اثرانداز ہونےوالے عوامل",                 type: "chapter" },
      { id: "3.2", code: "3.2", title: "Suitability of Clothes for Different Age Groups",            titleUrdu: "عمر کے مختلف گروہوں کے لئے کپڑوں کی موزونیت",              type: "chapter" },
      { id: "3.3", code: "3.3", title: "Making Clothes New by Altering Them",                        titleUrdu: "کپڑوں میں ردوبدل کر کے انہیں نیا بنانا",                   type: "chapter" },
    ],
  },
  {
    id: "chap-4",
    title: "Chapter 4: Introduction to Management",
    titleUrdu: "باب نمبر4: انتظام کا تعارف",
    type: "unit",
    chapters: [
      { id: "4.1", code: "4.1", title: "Concept of Management",                                      titleUrdu: "انتظام کا تصور",                                           type: "chapter" },
      { id: "4.2", code: "4.2", title: "Values, Objectives and Standards",                           titleUrdu: "اقدار, مقاصد اور معیار",                                   type: "chapter" },
      { id: "4.3", code: "4.3", title: "Management of Resources, Time, Income and Energy",           titleUrdu: "زرائع کا انتظام,وقت,آمدنی،اور توانائی",                  type: "chapter" },
    ],
  },
  {
    id: "chap-5",
    title: "Chapter 5: Environment and Management",
    titleUrdu: "باب نمبر5: ماحول اور انتظام",
    type: "unit",
    chapters: [
      { id: "5.1", code: "5.1", title: "Healthy Environment",                                        titleUrdu: "صحت مند ماحول",                                            type: "chapter" },
      { id: "5.2", code: "5.2", title: "Management of Cleanliness and Disposal of Waste",            titleUrdu: "صفائی اورفاضل مواد ٹھکانے لگانے کا انتظام",              type: "chapter" },
      { id: "5.3", code: "5.3", title: "Safety at Home",                                             titleUrdu: "گھر میں تحفظ",                                             type: "chapter" },
    ],
  },
  {
    id: "chap-6",
    title: "Chapter 6: Art and Design",
    titleUrdu: "باب نمبر6: آرٹ اور ڈیزائن",
    type: "unit",
    chapters: [
      { id: "6.1", code: "6.1", title: "Understanding Design",                                       titleUrdu: "ڈیزائن کو سمجھنا",                                         type: "chapter" },
      { id: "6.2", code: "6.2", title: "Understanding Elements and Principles of Design",            titleUrdu: "ڈیزائن کے عناصر اور اصولوں کو سمجھنا",                    type: "chapter" },
      { id: "6.3", code: "6.3", title: "Relationship of Art with Home and Environment",              titleUrdu: "آرٹ کا گھر اور ماحول کے ساتھ تعلق",                       type: "chapter" },
    ],
  },
  {
    id: "chap-7",
    title: "Chapter 7: Art in Daily Life",
    titleUrdu: "باب نمبر7: روزمرہ زندگی میں آرٹ",
    type: "unit",
    chapters: [
      { id: "7.1", code: "7.1", title: "Use of Design in Clothing",                                  titleUrdu: "لباس میں ڈیزائن کا استعمال",                               type: "chapter" },
      { id: "7.2", code: "7.2", title: "Use of Design in Home and Environment",                      titleUrdu: "گھر اور ماحول میں ڈیزائن کا استعمال",                     type: "chapter" },
      { id: "7.3", code: "7.3", title: "Use of Design in Presenting Food",                           titleUrdu: "کھانا پیش کرنے میں ڈیزائن کا استعمال",                    type: "chapter" },
    ],
  },
];

export function getAllChapters(): Chapter[] { return PTB_CLASS10_HOME_ECONOMICS.flatMap((u) => u.chapters); }
export function getChaptersByUnit(unitId: string): Chapter[] { return PTB_CLASS10_HOME_ECONOMICS.find((u) => u.id === unitId)?.chapters || []; }
export function getUnitByChapterId(chapterId: string): Unit | undefined { return PTB_CLASS10_HOME_ECONOMICS.find((u) => u.chapters.some((ch) => ch.id === chapterId)); }
