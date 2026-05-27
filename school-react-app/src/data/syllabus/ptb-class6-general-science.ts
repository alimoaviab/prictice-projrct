/**
 * PTB Class 6 (6TH) - General Science - Complete Syllabus
 * Source: Punjab Textbook Board
 */
export interface Chapter { id: string; code: string; title: string; type: "unit" | "review" | "section"; }
export interface Unit { id: string; title: string; type: "unit" | "review" | "section"; chapters: Chapter[]; }

export const PTB_CLASS6_GENERAL_SCIENCE: Unit[] = [
  {
    id: "unit-1",
    title: "UNIT 1: Cellular Organization",
    type: "unit",
    chapters: [
      { id: "1.1", code: "1.1", title: "Cells", type: "unit" },
      { id: "1.2", code: "1.2", title: "Tissues", type: "unit" },
      { id: "1.3", code: "1.3", title: "Organs and Organ Systems", type: "unit" }
    ]
  },
  {
    id: "unit-2",
    title: "UNIT 2: Reproduction in plants",
    type: "unit",
    chapters: [
      { id: "2.1", code: "2.1", title: "Reproduction", type: "unit" }
    ]
  },
  {
    id: "unit-3",
    title: "UNIT 3: Balanced Diet",
    type: "unit",
    chapters: [
      { id: "3.1", code: "3.1", title: "Food Groups and Sources", type: "unit" },
      { id: "3.2", code: "3.2", title: "Balanced Diet", type: "unit" },
      { id: "3.3", code: "3.3", title: "Food Pyramid", type: "unit" }
    ]
  },
  {
    id: "unit-4",
    title: "UNIT 4: Human Digestive System",
    type: "unit",
    chapters: [
      { id: "4.1", code: "4.1", title: "Digestion", type: "unit" },
      { id: "4.2", code: "4.2", title: "Digestive Glands", type: "unit" },
      { id: "4.3", code: "4.3", title: "Disorders of Digestive System", type: "unit" }
    ]
  },
  {
    id: "unit-5",
    title: "UNIT 5: Matter as Particles",
    type: "unit",
    chapters: [
      { id: "5.1", code: "5.1", title: "Particle Theory of Matter", type: "unit" },
      { id: "5.2", code: "5.2", title: "Diffusion of Particles", type: "unit" },
      { id: "5.3", code: "5.3", title: "Changes in States of Matter", type: "unit" }
    ]
  },
  {
    id: "unit-6",
    title: "UNIT 6: Elements and Compounds",
    type: "unit",
    chapters: [
      { id: "6.1", code: "6.1", title: "Element", type: "unit" },
      { id: "6.2", code: "6.2", title: "Compounds", type: "unit" }
    ]
  },
  {
    id: "unit-7",
    title: "UNIT 7: Mixtures",
    type: "unit",
    chapters: [
      { id: "7.1", code: "7.1", title: "Mixtures", type: "unit" },
      { id: "7.2", code: "7.2", title: "Difference between Elements, Compounds and Mixture", type: "unit" }
    ]
  },
  {
    id: "unit-8",
    title: "UNIT 8: Energy",
    type: "unit",
    chapters: [
      { id: "8.1", code: "8.1", title: "Potential Energy (P.E.)", type: "unit" },
      { id: "8.2", code: "8.2", title: "Kinetic Energy (K.E.)", type: "unit" },
      { id: "8.3", code: "8.3", title: "Energy as a Physical Quantity", type: "unit" },
      { id: "8.4", code: "8.4", title: "Law of Conservation of Energy", type: "unit" },
      { id: "8.5", code: "8.5", title: "Sources of Energy", type: "unit" }
    ]
  },
  {
    id: "unit-9",
    title: "UNIT 9: Electricity",
    type: "unit",
    chapters: [
      { id: "9.1", code: "9.1", title: "Static Electricity", type: "unit" },
      { id: "9.2", code: "9.2", title: "Current Electricity", type: "unit" }
    ]
  },
  {
    id: "unit-10",
    title: "UNIT 10: Magnetism",
    type: "unit",
    chapters: [
      { id: "10.1", code: "10.1", title: "Magnetic Field", type: "unit" },
      { id: "10.2", code: "10.2", title: "Electromagnets", type: "unit" }
    ]
  },
  {
    id: "unit-11",
    title: "UNIT 11: Technology in Everyday Life",
    type: "unit",
    chapters: [
      { id: "11.1", code: "11.1", title: "Growing Seasonal Plants and Vegetables", type: "unit" },
      { id: "11.2", code: "11.2", title: "Preparation of Milk Products", type: "unit" },
      { id: "11.3", code: "11.3", title: "How to make a Solar Oven and Assemble Electric Bell?", type: "unit" }
    ]
  },
  {
    id: "unit-12",
    title: "UNIT 12: Solar System",
    type: "unit",
    chapters: [
      { id: "12.1", code: "12.1", title: "Solar and Plants", type: "unit" },
      { id: "12.2", code: "12.2", title: "Solar System (The Sun and Plants)", type: "unit" },
      { id: "12.3", code: "12.3", title: "Satellites", type: "unit" },
      { id: "12.4", code: "12.4", title: "Artificial Satellites", type: "unit" },
      { id: "12.5", code: "12.5", title: "Key Milestones in Space Technology", type: "unit" }
    ]
  },
  {
    id: "unit-13",
    title: "UNIT 13: Dengue Fever and Corona Virus",
    type: "unit",
    chapters: [
      { id: "13.1", code: "13.1", title: "Dengue Fever and Corona Virus", type: "unit" }
    ]
  }
];

export function getAllChapters(): Chapter[] { return PTB_CLASS6_GENERAL_SCIENCE.flatMap(u => u.chapters); }
export function getChaptersByUnit(unitId: string): Chapter[] { const u = PTB_CLASS6_GENERAL_SCIENCE.find(x => x.id === unitId); return u ? u.chapters : []; }
export function getChapterById(chapterId: string): Chapter | undefined { return getAllChapters().find(ch => ch.id === chapterId); }
export function getTotalChapterCount(): number { return getAllChapters().length; }
export const SYLLABUS_METADATA = { subject: "General Science", class: "6th", board: "PTB", totalUnits: 13, totalChapters: getTotalChapterCount(), language: "English" };
