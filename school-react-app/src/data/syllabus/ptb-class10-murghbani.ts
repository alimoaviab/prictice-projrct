/**
 * PTB Class 10 مرغبانی (Poultry Farming) Syllabus
 * Chapters 7–12 (continuation) — Urdu text preserved exactly with RTL support
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

export const PTB_CLASS10_MURGHBANI: Unit[] = [
  { id: "chap-7",  title: "Chapter 7: Feed of Chickens",                                    titleUrdu: "باب نمبر 7: مرغیوں کی خوراک",                          type: "unit", chapters: [{ id: "7.1",  code: "7.1",  title: "Feed of Chickens",                                    titleUrdu: "مرغیوں کی خوراک",                         type: "chapter" }] },
  { id: "chap-8",  title: "Chapter 8: Rearing of Broiler Birds",                            titleUrdu: "باب نمبر 8: برائلر پرندوں کی پرورش",                   type: "unit", chapters: [{ id: "8.1",  code: "8.1",  title: "Rearing of Broiler Birds",                            titleUrdu: "برائلر پرندوں کی پرورش",                  type: "chapter" }] },
  { id: "chap-9",  title: "Chapter 9: Rearing of Layer Chickens",                           titleUrdu: "باب نمبر 9: لیئر مرغیوں کی پرورش",                     type: "unit", chapters: [{ id: "9.1",  code: "9.1",  title: "Rearing of Layer Chickens",                           titleUrdu: "لیئر مرغیوں کی پرورش",                    type: "chapter" }] },
  { id: "chap-10", title: "Chapter 10: Diseases of Chickens",                               titleUrdu: "باب نمبر 10: مرغیوں کے امراض",                         type: "unit", chapters: [{ id: "10.1", code: "10.1", title: "Diseases of Chickens",                               titleUrdu: "مرغیوں کے امراض",                          type: "chapter" }] },
  { id: "chap-11", title: "Chapter 11: Prevention of Diseases in Chickens",                 titleUrdu: "باب نمبر 11: مرغیوں میں بیماریوں کی روک تھام",        type: "unit", chapters: [{ id: "11.1", code: "11.1", title: "Prevention of Diseases in Chickens",                 titleUrdu: "مرغیوں میں بیماریوں کی روک تھام",        type: "chapter" }] },
  { id: "chap-12", title: "Chapter 12: Accounting of Poultry Farm",                         titleUrdu: "باب نمبر 12: پولٹری فارم کا حساب کتاب",                type: "unit", chapters: [{ id: "12.1", code: "12.1", title: "Accounting of Poultry Farm",                         titleUrdu: "پولٹری فارم کا حساب کتاب",                type: "chapter" }] },
];

export function getAllChapters(): Chapter[] { return PTB_CLASS10_MURGHBANI.flatMap((u) => u.chapters); }
export function getChaptersByUnit(unitId: string): Chapter[] { return PTB_CLASS10_MURGHBANI.find((u) => u.id === unitId)?.chapters || []; }
export function getUnitByChapterId(chapterId: string): Unit | undefined { return PTB_CLASS10_MURGHBANI.find((u) => u.chapters.some((ch) => ch.id === chapterId)); }
