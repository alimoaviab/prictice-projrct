/**
 * PTB Inter Part-I طبعی جغرافیہ (Physical Geography) Syllabus
 * 8 chapters — Urdu text preserved exactly
 * Note: Chapter 5 heading "ہواؤں کا" vs topic "ہواں کا" — both preserved exactly as written
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

export const PTB_INTER1_TABII_GEOGRAPHY: Unit[] = [
  { id: "chap-1", title: "Chapter 1: Physical Geography",                titleUrdu: "باب نمبر 1: طبعی جغرافیہ",                type: "unit", chapters: [{ id: "1", code: "1", title: "Physical Geography",               titleUrdu: "طبعی جغرافیہ",               type: "chapter" }] },
  { id: "chap-2", title: "Chapter 2: Internal Structure of the Earth",   titleUrdu: "باب نمبر 2: زمین کی اندرونی ساخت",        type: "unit", chapters: [{ id: "2", code: "2", title: "Internal Structure of the Earth",  titleUrdu: "زمین کی اندرونی ساخت",       type: "chapter" }] },
  { id: "chap-3", title: "Chapter 3: Landforms",                         titleUrdu: "باب نمبر 3: زمینی خدوخال",               type: "unit", chapters: [{ id: "3", code: "3", title: "Landforms",                         titleUrdu: "زمینی خدوخال",               type: "chapter" }] },
  { id: "chap-4", title: "Chapter 4: Atmosphere",                        titleUrdu: "باب نمبر 4: کرہ ہوائی",                  type: "unit", chapters: [{ id: "4", code: "4", title: "Atmosphere",                        titleUrdu: "کرہ ہوائی",                  type: "chapter" }] },
  {
    id: "chap-5",
    title: "Chapter 5: Global Wind System",
    titleUrdu: "باب نمبر 5: ہواؤں کا عالمی نظام",
    type: "unit",
    // topic text "ہواں کا عالمی نظام" differs from heading — preserved exactly
    chapters: [{ id: "5", code: "5", title: "Global Wind System",                      titleUrdu: "ہواں کا عالمی نظام",          type: "chapter" }],
  },
  { id: "chap-6", title: "Chapter 6: Humidity of Air",                   titleUrdu: "باب نمبر 6: ہوا کی نمی",                 type: "unit", chapters: [{ id: "6", code: "6", title: "Humidity of Air",                    titleUrdu: "ہوا کی نمی",                 type: "chapter" }] },
  { id: "chap-7", title: "Chapter 7: Movements of Ocean Water",          titleUrdu: "باب نمبر 7: سمندر کے پانی کی حرکات",     type: "unit", chapters: [{ id: "7", code: "7", title: "Movements of Ocean Water",           titleUrdu: "سمندر کے پانی کی حرکات",    type: "chapter" }] },
  { id: "chap-8", title: "Chapter 8: Climate Zones",                     titleUrdu: "باب نمبر 8: آب و ہوا کے خطے",            type: "unit", chapters: [{ id: "8", code: "8", title: "Climate Zones",                       titleUrdu: "آب و ہوا کے خطے",           type: "chapter" }] },
];

export function getAllChapters(): Chapter[] { return PTB_INTER1_TABII_GEOGRAPHY.flatMap((u) => u.chapters); }
export function getChaptersByUnit(unitId: string): Chapter[] { return PTB_INTER1_TABII_GEOGRAPHY.find((u) => u.id === unitId)?.chapters || []; }
export function getUnitByChapterId(chapterId: string): Unit | undefined { return PTB_INTER1_TABII_GEOGRAPHY.find((u) => u.chapters.some((ch) => ch.id === chapterId)); }
