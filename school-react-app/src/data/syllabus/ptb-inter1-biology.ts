/**
 * PTB Inter Part-I Biology Syllabus
 * "(SMART)" preserved exactly where written
 * Note: topic numbers preserved as provided (some chapters have non-sequential numbering)
 */

export interface Chapter { id: string; code: string; title: string; type: "chapter"; }
export interface Unit { id: string; title: string; type: "unit"; chapters: Chapter[]; }

export const PTB_INTER1_BIOLOGY: Unit[] = [
  {
    id: "chap-1",
    title: "CHAP 1: Biodiversity and Classification",
    type: "unit",
    chapters: [
      { id: "1.1", code: "1.1", title: "THREE-DOMAIN SYSTEM OF CLASSIFICATION (SMART)",    type: "chapter" },
      { id: "1.3", code: "1.3", title: "SALIENT FEATURES OF KINGDOMS OF DOMAIN EUKARYA (SMART)", type: "chapter" },
      { id: "1.4", code: "1.4", title: "CLASSIFICATION OF KINGDOM ANIMALIA (SMART)",        type: "chapter" },
    ],
  },
  {
    id: "chap-2",
    title: "CHAP 2: Bacteria and Viruses",
    type: "unit",
    chapters: [
      { id: "2.1", code: "2.1", title: "STRUCTURE OF BACTERIA (SMART)",            type: "chapter" },
      { id: "2.2", code: "2.2", title: "ENDOSPORE FORMATION IN BACTERIA (SMART)",  type: "chapter" },
      { id: "2.4", code: "2.4", title: "FLAGELLA. (SMART)",                        type: "chapter" },
      { id: "2.7", code: "2.7", title: "NORMAL FLORA (SMART)",                     type: "chapter" },
      { id: "2.8", code: "2.8", title: "VIRUS (SMART)",                            type: "chapter" },
    ],
  },
  {
    id: "chap-3",
    title: "CHAP 3: Cells and Subcellular Organelles",
    type: "unit",
    chapters: [
      { id: "3.4", code: "3.4", title: "STRUCTURE OF CELL (SMART)",                   type: "chapter" },
      { id: "3.5", code: "3.5", title: "PROKARYOTIC AND EUKARYOTIC CELLS (SMART)",    type: "chapter" },
      { id: "3.6", code: "3.6", title: "CELL SIGNALLING (SMART)",                     type: "chapter" },
      { id: "3.7", code: "3.7", title: "MEMBRANE TRANSPORT MECHANISMS (SMART)",       type: "chapter" },
      { id: "3.8", code: "3.8", title: "STEM CELLS (SMART)",                          type: "chapter" },
    ],
  },
  {
    id: "chap-4",
    title: "CHAP 4: Molecular Biology",
    type: "unit",
    chapters: [
      { id: "4.4", code: "4.4", title: "IMPORTANCE OF WATER (SMART)",    type: "chapter" },
      { id: "4.5", code: "4.5", title: "CARBOHYDRATES (SMART)",          type: "chapter" },
      { id: "4.6", code: "4.6", title: "PROTEINS (SMART)",               type: "chapter" },
      { id: "4.7", code: "4.7", title: "LIPIDS (SMART)",                 type: "chapter" },
      { id: "4.8", code: "4.8", title: "NUCLEIC ACIDS (SMART)",          type: "chapter" },
      { id: "4.9", code: "4.9", title: "CONJUGATED MOLECULES (SMART)",   type: "chapter" },
    ],
  },
  {
    id: "chap-5",
    title: "CHAP 5: Enzymes",
    type: "unit",
    chapters: [
      { id: "5.1", code: "5.1", title: "ENZYMES (SMART)",                              type: "chapter" },
      { id: "5.2", code: "5.2", title: "COFACTORS AND COENZYMES (SMART)",              type: "chapter" },
      { id: "5.3", code: "5.3", title: "MECHANISM OF ENZYME ACTION (SMART)",           type: "chapter" },
      { id: "5.5", code: "5.5", title: "ENZYMEINHIBITION (SMART)",                     type: "chapter" },
      { id: "5.6", code: "5.6", title: "ENZYMEINHIBITION. (SMART)",                    type: "chapter" },
      { id: "5.7", code: "5.7", title: "CLASSIFICATION OF ENZYMES (SMART)",            type: "chapter" },
    ],
  },
  {
    id: "chap-6",
    title: "CHAP 6: Bioenergetics",
    type: "unit",
    chapters: [
      { id: "6.1", code: "6.1", title: "PHOTOSYNTHESIS (SMART)",         type: "chapter" },
      { id: "6.2", code: "6.2", title: "CELLULAR RESPIRATION (SMART)",   type: "chapter" },
    ],
  },
  {
    id: "chap-8",
    title: "CHAP 8: Plant Physiology",
    type: "unit",
    chapters: [
      { id: "8.2",  code: "8.2",  title: "GAS EXCHANGE IN PLANTS (SMART)",          type: "chapter" },
      { id: "8.5",  code: "8.5",  title: "TRANSPORT OFF WATER IN PLANTS (SMART)",   type: "chapter" },
      { id: "8.6",  code: "8.6",  title: "TRANSLOCATION OF FOOD IN PLANTS (SMART)", type: "chapter" },
      { id: "8.7",  code: "8.7",  title: "GROWTH IN PLANTS (SMART)",                type: "chapter" },
      { id: "8.8",  code: "8.8",  title: "OSMOREGULATION IN PLANTS (SMART)",        type: "chapter" },
      { id: "8.9",  code: "8.9",  title: "THERMOREGULATION IN PLANTS (SMART)",      type: "chapter" },
      { id: "8.10", code: "8.10", title: "MOVEMENT IN PLANTS (SMART)",              type: "chapter" },
      { id: "8.11", code: "8.11", title: "PHTOTOPERIODISM (SMART)",                 type: "chapter" },
      { id: "8.12", code: "8.12", title: "VERNALISATION (SMART)",                   type: "chapter" },
    ],
  },
  {
    id: "chap-9",
    title: "CHAP 9: Human Digestive System",
    type: "unit",
    chapters: [
      { id: "9.1", code: "9.1", title: "ANATOMY & PHYSIOLOGY OF DIGESTIVE SYSTEM (SMART)", type: "chapter" },
    ],
  },
  {
    id: "chap-10",
    title: "CHAP 10: Human Respiratory System",
    type: "unit",
    chapters: [
      { id: "10.1", code: "10.1", title: "RESPIRATORY SYSTEM OF MAN (SMART)",  type: "chapter" },
      { id: "10.3", code: "10.3", title: "RESPIRATORY PIGMENTS (SMART)",        type: "chapter" },
      { id: "10.4", code: "10.4", title: "RESPIRATORY DISORDERS (SMART)",       type: "chapter" },
    ],
  },
  {
    id: "chap-11",
    title: "CHAP 11: Human Circulatory System",
    type: "unit",
    chapters: [
      { id: "11.1", code: "11.1", title: "STRUCTURE & FUNCTIONING OF HEART (SMART)", type: "chapter" },
      { id: "11.2", code: "11.2", title: "BLOOD VESSELS (SMART)",                    type: "chapter" },
      { id: "11.3", code: "11.3", title: "BLOOD PRESSURE (SMART)",                   type: "chapter" },
      { id: "11.5", code: "11.5", title: "LYMPHATIC SYSTEM OF HUMAN (SMART)",        type: "chapter" },
    ],
  },
  {
    id: "chap-12",
    title: "CHAP 12: Human Skeletal and Muscular System",
    type: "unit",
    chapters: [
      { id: "12.1", code: "12.1", title: "BONES AND CARTILAGE (SMART)", type: "chapter" },
      { id: "12.3", code: "12.3", title: "MUSCLES (SMART)",             type: "chapter" },
    ],
  },
];

export function getAllChapters(): Chapter[] { return PTB_INTER1_BIOLOGY.flatMap((u) => u.chapters); }
export function getChaptersByUnit(unitId: string): Chapter[] { return PTB_INTER1_BIOLOGY.find((u) => u.id === unitId)?.chapters || []; }
export function getUnitByChapterId(chapterId: string): Unit | undefined { return PTB_INTER1_BIOLOGY.find((u) => u.chapters.some((ch) => ch.id === chapterId)); }
