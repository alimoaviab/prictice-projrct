/**
 * PTB Inter Part-II Commercial Geography Syllabus
 * Two sections: World Geography + Pakistan Geography
 * Chapter numbering restarts at 1 for Pakistan section — preserved as provided
 */

export interface Chapter { id: string; code: string; title: string; type: "chapter"; }
export interface Unit { id: string; title: string; type: "unit"; chapters: Chapter[]; }

export const PTB_INTER2_COMMERCIAL_GEOGRAPHY: Unit[] = [
  // ── WORLD GEOGRAPHY ────────────────────────────────────────────────────────
  { id: "w-chap-1",  title: "CHAP 1: Introduction to Geography",      type: "unit", chapters: [{ id: "w1",  code: "1",  title: "Introduction to Geography",     type: "chapter" }] },
  { id: "w-chap-2",  title: "CHAP 2: Human Economic Activities",      type: "unit", chapters: [{ id: "w2",  code: "2",  title: "Human Economic Activities",     type: "chapter" }] },
  { id: "w-chap-3",  title: "CHAP 3: Fishing",                        type: "unit", chapters: [{ id: "w3",  code: "3",  title: "Fishing",                       type: "chapter" }] },
  { id: "w-chap-4",  title: "CHAP 4: Animal Husbandry / Herding",     type: "unit", chapters: [{ id: "w4",  code: "4",  title: "Animal Husbandry / Herding",    type: "chapter" }] },
  { id: "w-chap-5",  title: "CHAP 5: Natural Vegetation / Forests",   type: "unit", chapters: [{ id: "w5",  code: "5",  title: "Natural Vegetation / Forests",  type: "chapter" }] },
  { id: "w-chap-6",  title: "CHAP 6: Population",                     type: "unit", chapters: [{ id: "w6",  code: "6",  title: "Population",                    type: "chapter" }] },
  {
    id: "w-chap-7",
    title: "CHAP 7: Industries",
    type: "unit",
    chapters: [
      { id: "w7.1", code: "7.1", title: "Industries",               type: "chapter" },
      { id: "w7.2", code: "7.2", title: "Iron and Steel",           type: "chapter" },
      { id: "w7.3", code: "7.3", title: "Cotton and Textile Industry", type: "chapter" },
      { id: "w7.4", code: "7.4", title: "Woolen Textile Industry",  type: "chapter" },
      { id: "w7.5", code: "7.5", title: "Silk Textile Industry",    type: "chapter" },
      { id: "w7.6", code: "7.6", title: "Fertilizer Industry",      type: "chapter" },
    ],
  },
  {
    id: "w-chap-8",
    title: "CHAP 8: Crops",
    type: "unit",
    chapters: [
      { id: "w8.1", code: "8.1", title: "Wheat",          type: "chapter" },
      { id: "w8.2", code: "8.2", title: "Sugarcane",      type: "chapter" },
      { id: "w8.3", code: "8.3", title: "Rice",           type: "chapter" },
      { id: "w8.4", code: "8.4", title: "Cotton",         type: "chapter" },
      { id: "w8.5", code: "8.5", title: "Tea",            type: "chapter" },
      { id: "w8.6", code: "8.6", title: "Wool",           type: "chapter" },
      { id: "w8.7", code: "8.7", title: "Natural Rubber", type: "chapter" },
    ],
  },
  {
    id: "w-chap-9",
    title: "CHAP 9: Minerals and Energy Resources",
    type: "unit",
    chapters: [
      { id: "w9.1", code: "9.1", title: "Iron Ore",       type: "chapter" },
      { id: "w9.2", code: "9.2", title: "Gold",           type: "chapter" },
      { id: "w9.3", code: "9.3", title: "Uranium",        type: "chapter" },
      { id: "w9.4", code: "9.4", title: "Coal",           type: "chapter" },
      { id: "w9.5", code: "9.5", title: "Petroleum",      type: "chapter" },
      { id: "w9.6", code: "9.6", title: "Natural Gas",    type: "chapter" },
      { id: "w9.7", code: "9.7", title: "Atomic Energy",  type: "chapter" },
    ],
  },
  // ── PAKISTAN GEOGRAPHY ─────────────────────────────────────────────────────
  { id: "pk-chap-1",  title: "CHAP 1: History of Pakistan",           type: "unit", chapters: [{ id: "pk1",  code: "1",  title: "History of Pakistan",           type: "chapter" }] },
  { id: "pk-chap-2",  title: "CHAP 2: Physical Features of Pakistan", type: "unit", chapters: [{ id: "pk2",  code: "2",  title: "Physical Features of Pakistan", type: "chapter" }] },
  { id: "pk-chap-3",  title: "CHAP 3: Climate of Pakistan",           type: "unit", chapters: [{ id: "pk3",  code: "3",  title: "Climate of Pakistan",           type: "chapter" }] },
  { id: "pk-chap-4",  title: "CHAP 4: Soil",                          type: "unit", chapters: [{ id: "pk4",  code: "4",  title: "Soil",                          type: "chapter" }] },
  { id: "pk-chap-5",  title: "CHAP 5: Natural Vegetation / Forests",  type: "unit", chapters: [{ id: "pk5",  code: "5",  title: "Natural Vegetation / Forests",  type: "chapter" }] },
  { id: "pk-chap-6",  title: "CHAP 6: Irrigation System",             type: "unit", chapters: [{ id: "pk6",  code: "6",  title: "Irrigation System",             type: "chapter" }] },
  {
    id: "pk-chap-7",
    title: "CHAP 7: Crops",
    type: "unit",
    chapters: [
      { id: "pk7.1", code: "7.1", title: "Wheat",     type: "chapter" },
      { id: "pk7.2", code: "7.2", title: "Rice",      type: "chapter" },
      { id: "pk7.3", code: "7.3", title: "Cotton",    type: "chapter" },
      { id: "pk7.4", code: "7.4", title: "Sugarcane", type: "chapter" },
      { id: "pk7.5", code: "7.5", title: "Maize",     type: "chapter" },
      { id: "pk7.6", code: "7.6", title: "Tobacco",   type: "chapter" },
    ],
  },
  { id: "pk-chap-8",  title: "CHAP 8: Population",                    type: "unit", chapters: [{ id: "pk8",  code: "8",  title: "Population",                    type: "chapter" }] },
  {
    id: "pk-chap-9",
    title: "CHAP 9: Means of Transport",
    type: "unit",
    chapters: [
      { id: "pk9.1", code: "9.1", title: "Means of Transport",       type: "chapter" },
      { id: "pk9.2", code: "9.2", title: "Pakistan Railways",        type: "chapter" },
      { id: "pk9.3", code: "9.3", title: "Roads of Pakistan",        type: "chapter" },
      { id: "pk9.4", code: "9.4", title: "Means of Air Transport",   type: "chapter" },
      { id: "pk9.5", code: "9.5", title: "Means of water Transport", type: "chapter" },
    ],
  },
  { id: "pk-chap-10", title: "CHAP 10: Electricity Projects of Pakistan", type: "unit", chapters: [{ id: "pk10", code: "10", title: "Electricity Projects of Pakistan", type: "chapter" }] },
];

export function getAllChapters(): Chapter[] { return PTB_INTER2_COMMERCIAL_GEOGRAPHY.flatMap((u) => u.chapters); }
export function getChaptersByUnit(unitId: string): Chapter[] { return PTB_INTER2_COMMERCIAL_GEOGRAPHY.find((u) => u.id === unitId)?.chapters || []; }
export function getUnitByChapterId(chapterId: string): Unit | undefined { return PTB_INTER2_COMMERCIAL_GEOGRAPHY.find((u) => u.chapters.some((ch) => ch.id === chapterId)); }
