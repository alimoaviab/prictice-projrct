/**
 * PTB Inter Part-I Physics Syllabus
 * 12 chapters — "(SMART)" preserved exactly
 * Note: some topic numbers are non-sequential (skipped as per source)
 */

export interface Chapter { id: string; code: string; title: string; type: "chapter"; }
export interface Unit { id: string; title: string; type: "unit"; chapters: Chapter[]; }

export const PTB_INTER1_PHYSICS: Unit[] = [
  {
    id: "chap-1",
    title: "CHAP 1: Measurements",
    type: "unit",
    chapters: [
      { id: "1.3", code: "1.3", title: "UNCERTAINTY IN MEASUREMENT (SMART)",                           type: "chapter" },
      { id: "1.4", code: "1.4", title: "USE OF SIGNIFICANT FIGURES (SMART)",                          type: "chapter" },
      { id: "1.5", code: "1.5", title: "PRECISION AND ACCURACY (SMART)",                              type: "chapter" },
      { id: "1.6", code: "1.6", title: "ASSESSMENT OF TOTAL UNCERTAINTY IN THE FINAL RESULT (SMART)", type: "chapter" },
      { id: "1.7", code: "1.7", title: "DIMENSIONS OF PHYSICAL QUANTITIES (SMART)",                   type: "chapter" },
    ],
  },
  {
    id: "chap-2",
    title: "CHAP 2: Force and Motion",
    type: "unit",
    chapters: [
      { id: "2.3", code: "2.3", title: "PRODUCT OF TWO VECTORS (SMART)",                type: "chapter" },
      { id: "2.4", code: "2.4", title: "EQUATIONS OF MOTIONS (SMART)",                  type: "chapter" },
      { id: "2.5", code: "2.5", title: "MOTION UNDER GRAVITY (SMART)",                  type: "chapter" },
      { id: "2.6", code: "2.6", title: "PROJECTILE MOTION (SMART)",                     type: "chapter" },
      { id: "2.7", code: "2.7", title: "MOMENTUM (SMART)",                              type: "chapter" },
      { id: "2.8", code: "2.8", title: "ELASTIC AND INELASTIC COLLISIONS (SMART)",      type: "chapter" },
      { id: "2.9", code: "2.9", title: "INELASTIC COLLISION IN ONE DIMENSION (SMART)",  type: "chapter" },
    ],
  },
  {
    id: "chap-3",
    title: "CHAP 3: Circular and Rotational Motion",
    type: "unit",
    chapters: [
      { id: "3.1", code: "3.1", title: "ANGULAR MEASUREMENTS (SMART)",                        type: "chapter" },
      { id: "3.2", code: "3.2", title: "CENTRIPETAL FORCE (SMART)",                           type: "chapter" },
      { id: "3.3", code: "3.3", title: "ARTIFICIAL SATELLITES (SMART)",                      type: "chapter" },
      { id: "3.4", code: "3.4", title: "MOMENT OF INERTIA (SMART)",                          type: "chapter" },
      { id: "3.5", code: "3.5", title: "ANGULAR MOMENTUM (SMART)",                           type: "chapter" },
      { id: "3.6", code: "3.6", title: "LAW OF CONSERVATION OF ANGULAR MOMENTUM (SMART)",   type: "chapter" },
    ],
  },
  {
    id: "chap-4",
    title: "CHAP 4: Work, Energy and Power",
    type: "unit",
    chapters: [
      { id: "4.2", code: "4.2", title: "WORK DONE BY A VARIABLE FORCE (SMART)",                               type: "chapter" },
      { id: "4.3", code: "4.3", title: "CONSERVATIVE AND NON-CONSERVATIVE FORCES (SMART)",                    type: "chapter" },
      { id: "4.4", code: "4.4", title: "POWER (SMART)",                                                       type: "chapter" },
      { id: "4.5", code: "4.5", title: "ENERGY (SMART)",                                                      type: "chapter" },
      { id: "4.6", code: "4.6", title: "ESCAPE VELOCITY (SMART)",                                             type: "chapter" },
      { id: "4.7", code: "4.7", title: "WORK-ENERGY THEOREM (SMART)",                                         type: "chapter" },
      { id: "4.8", code: "4.8", title: "INTERCONVERSION OF POTENTIAL ENERGY AND KINETIC ENERGY (SMART)",      type: "chapter" },
    ],
  },
  {
    id: "chap-5",
    title: "CHAP 5: Solid and Fluid Dynamics",
    type: "unit",
    chapters: [
      { id: "5.2",  code: "5.2",  title: "MECHANICAL PROPERTIES OF SOLIDS (SMART)",                type: "chapter" },
      { id: "5.3",  code: "5.3",  title: "STRESS, STRAIN AND YOUNG'S MODULUS (SMART)",             type: "chapter" },
      { id: "5.5",  code: "5.5",  title: "ELASTIC DEFORMATION, PLASTIC DEFORMATION AND ELASTIC LIMIT (SMART)", type: "chapter" },
      { id: "5.6",  code: "5.6",  title: "STRAIN ENERGY IN DEFORMED MATERIALS (SMART)",            type: "chapter" },
      { id: "5.7",  code: "5.7",  title: "ARCHIMEDES PRINCIPLE AND FLOTATION (SMART)",             type: "chapter" },
      { id: "5.8",  code: "5.8",  title: "STEADY, NON-VISCOUS and IDEAL FLUID (SMART)",            type: "chapter" },
      { id: "5.9",  code: "5.9",  title: "EQUATION OF CONTINUITY (SMART)",                         type: "chapter" },
      { id: "5.11", code: "5.11", title: "BERNOULLI'S EQUATION (SMART)",                           type: "chapter" },
      { id: "5.12", code: "5.12", title: "USES OF BERNOULLI'S EQUATION (SMART)",                   type: "chapter" },
      { id: "5.13", code: "5.13", title: "VISCOUS DRAG AND STOKES LAW (SMART)",                    type: "chapter" },
      { id: "5.14", code: "5.14", title: "TERMINAL VELOCITY (SMART)",                              type: "chapter" },
    ],
  },
  {
    id: "chap-6",
    title: "CHAP 6: Heat and Thermodynamics",
    type: "unit",
    chapters: [
      { id: "6.2",  code: "6.2",  title: "INTERNAL ENERGY (SMART)",                             type: "chapter" },
      { id: "6.3",  code: "6.3",  title: "HEAT AND WORK (SMART)",                               type: "chapter" },
      { id: "6.4",  code: "6.4",  title: "FIRST LAW OF THERMODYNAMICS (SMART)",                 type: "chapter" },
      { id: "6.5",  code: "6.5",  title: "REVERSIBLE AND IRREVERSIBLE PROCESSES (SMART)",       type: "chapter" },
      { id: "6.7",  code: "6.7",  title: "SECOND LAW OF THERMODYNAMICS (SMART)",                type: "chapter" },
      { id: "6.8",  code: "6.8",  title: "CARNOT ENGINE AND CARNOT'S THEOREM (SMART)",          type: "chapter" },
      { id: "6.9",  code: "6.9",  title: "REFRIGERATOR (SMART)",                                type: "chapter" },
      { id: "6.10", code: "6.10", title: "ENTROPY (SMART)",                                     type: "chapter" },
    ],
  },
  {
    id: "chap-7",
    title: "CHAP 7: Waves and Vibrations",
    type: "unit",
    chapters: [
      { id: "7.2",  code: "7.2",  title: "PRINCIPLE OF SUPERPOSITION OF WAVES (SMART)",                       type: "chapter" },
      { id: "7.3",  code: "7.3",  title: "INTERFERENCE AND ITS TYPES (SMART)",                                type: "chapter" },
      { id: "7.5",  code: "7.5",  title: "STATIONARY WAVES ON A STRETCHED STRING (SMART)",                   type: "chapter" },
      { id: "7.6",  code: "7.6",  title: "STATIONARY WAVES IN AIR COLUMNS (SMART)",                          type: "chapter" },
      { id: "7.7",  code: "7.7",  title: "EXPERIMENT DEMONSTRATING STATIONARY WAVES USING MICROWAVES (SMART)", type: "chapter" },
      { id: "7.8",  code: "7.8",  title: "DIFFRACTION OF WAVES (SMART)",                                      type: "chapter" },
      { id: "7.9",  code: "7.9",  title: "BEATS (SMART)",                                                     type: "chapter" },
      { id: "7.10", code: "7.10", title: "INTENSITY (I) OF A WAVE (SMART)",                                   type: "chapter" },
      { id: "7.11", code: "7.11", title: "DOPPLER EFFECT (SMART)",                                            type: "chapter" },
      { id: "7.12", code: "7.12", title: "APPLICATIONS OF DOPPLER EFFECT (SMART)",                           type: "chapter" },
    ],
  },
  {
    id: "chap-8",
    title: "CHAP 8: Physical Optics and Gravitational Waves",
    type: "unit",
    chapters: [
      { id: "8.1", code: "8.1", title: "POLARIZATION OF LIGHT (SMART)",                                    type: "chapter" },
      { id: "8.3", code: "8.3", title: "PRODUCTION AND DETECTION OF PLANE POLARIZED LIGHT (SMART)",        type: "chapter" },
      { id: "8.4", code: "8.4", title: "POLARIZATION OF LIGHT BY THE METHOD OF REFLECTION (SMART)",       type: "chapter" },
      { id: "8.5", code: "8.5", title: "MALUS LAW (SMART)",                                                type: "chapter" },
      { id: "8.6", code: "8.6", title: "GRAVITATIONAL WAVES (GWS) (SMART)",                               type: "chapter" },
      { id: "8.7", code: "8.7", title: "INTERFEROMETER (SMART)",                                           type: "chapter" },
    ],
  },
  {
    id: "chap-9",
    title: "CHAP 9: Electrostatics and Current Electricity",
    type: "unit",
    chapters: [
      { id: "9.1",  code: "9.1",  title: "COULOMB'S LAW (SMART)",                                        type: "chapter" },
      { id: "9.2",  code: "9.2",  title: "ELECTRIC FIELD STRENGTH (SMART)",                              type: "chapter" },
      { id: "9.3",  code: "9.3",  title: "ELECTRIC FLUX (SMART)",                                        type: "chapter" },
      { id: "9.4",  code: "9.4",  title: "GAUSS'S LAW (SMART)",                                          type: "chapter" },
      { id: "9.5",  code: "9.5",  title: "ELECTRIC POTENTIAL (SMART)",                                   type: "chapter" },
      { id: "9.6",  code: "9.6",  title: "ELECTRON VOLT (SMART)",                                        type: "chapter" },
      { id: "9.9",  code: "9.9",  title: "SHIELDING FROM EXTERNAL ELECTRIC FIELD (SMART)",               type: "chapter" },
      { id: "9.10", code: "9.10", title: "ELECTRIC CURRENT (SMART)",                                     type: "chapter" },
      { id: "9.11", code: "9.11", title: "CURRENT THROUGH A CONDUCTOR (SMART)",                          type: "chapter" },
      { id: "9.12", code: "9.12", title: "OHM'S LAW (SMART)",                                            type: "chapter" },
      { id: "9.13", code: "9.13", title: "RESISTIVITY AND ITS DEPENDENCE UPON TEMPERATURE (SMART)",      type: "chapter" },
      { id: "9.14", code: "9.14", title: "ELECTRIC POWER (SMART)",                                       type: "chapter" },
      { id: "9.15", code: "9.15", title: "ELECTROMOTIVE FORCE (EMF) AND POTENTIAL DIFFERENCE (SMART)",   type: "chapter" },
      { id: "9.16", code: "9.16", title: "KIRCHHOFF'S RULES (SMART)",                                    type: "chapter" },
      { id: "9.17", code: "9.17", title: "WHEATSTONE BRIDGE (SMART)",                                    type: "chapter" },
      { id: "9.18", code: "9.18", title: "POTENTIOMETER (SMART)",                                        type: "chapter" },
      { id: "9.19", code: "9.19", title: "USE OF GALVANOMETER (SMART)",                                  type: "chapter" },
      { id: "9.20", code: "9.20", title: "THERMISTORS (SMART)",                                          type: "chapter" },
      { id: "9.21", code: "9.21", title: "LIGHT DEPENDENT RESISTOR (SMART)",                             type: "chapter" },
    ],
  },
  {
    id: "chap-10",
    title: "CHAP 10: Electromagnetism",
    type: "unit",
    chapters: [
      { id: "10.1",  code: "10.1",  title: "FORCE ON A CURRENT-CARRYING CONDUCTOR IN A UNIFORM MAGNETIC FIELD (SMART)", type: "chapter" },
      { id: "10.2",  code: "10.2",  title: "MAGNETIC FLUX AND FLUX DENSITY (SMART)",                               type: "chapter" },
      { id: "10.4",  code: "10.4",  title: "MOTION OF A CHARGED PARTICLES IN A MAGNETIC FIELD (SMART)",            type: "chapter" },
      { id: "10.6",  code: "10.6",  title: "INDUCED EMF AND FARADAY'S LAW (SMART)",                                type: "chapter" },
      { id: "10.8",  code: "10.8",  title: "FACTORS AFFECTING EMF (SMART)",                                        type: "chapter" },
      { id: "10.9",  code: "10.9",  title: "FERROFLUIDS (SMART)",                                                  type: "chapter" },
      { id: "10.10", code: "10.10", title: "A SEISMOMETER (SMART)",                                                type: "chapter" },
    ],
  },
  {
    id: "chap-11",
    title: "CHAP 11: Special Theory of Relativity",
    type: "unit",
    chapters: [
      { id: "11.1", code: "11.1", title: "RELATIVE MOTION (SMART)",                             type: "chapter" },
      { id: "11.2", code: "11.2", title: "FRAMES OF REFERENCE (SMART)",                         type: "chapter" },
      { id: "11.3", code: "11.3", title: "SPECIAL THEORY OF RELATIVITY (SMART)",                type: "chapter" },
      { id: "11.4", code: "11.4", title: "THE EQUIVALENCE BETWEEN MASS AND ENERGY (SMART)",     type: "chapter" },
    ],
  },
  {
    id: "chap-12",
    title: "CHAP 12: Nuclear and Particle Physics",
    type: "unit",
    chapters: [
      { id: "12.1", code: "12.1", title: "STRUCTURE AND PROPERTIES OF THE NUCLEUS (SMART)",                    type: "chapter" },
      { id: "12.2", code: "12.2", title: "FUNDAMENTAL FORCES OF NATURE (SMART)",                               type: "chapter" },
      { id: "12.3", code: "12.3", title: "MATTER AND ANTI-MATTER (SMART)",                                     type: "chapter" },
      { id: "12.4", code: "12.4", title: "RADIOACTIVITY (SMART)",                                              type: "chapter" },
      { id: "12.5", code: "12.5", title: "FUNDAMENTAL PARTICLES (SMART)",                                      type: "chapter" },
      { id: "12.6", code: "12.6", title: "QUARKS (SMART)",                                                     type: "chapter" },
      { id: "12.7", code: "12.7", title: "HIGGS BOSON (SMART)",                                                type: "chapter" },
      { id: "12.9", code: "12.9", title: "THE ASYMMETRY OF MATTER AND ANTI-MATTER IN THE UNIVERSE (SMART)",   type: "chapter" },
    ],
  },
];

export function getAllChapters(): Chapter[] { return PTB_INTER1_PHYSICS.flatMap((u) => u.chapters); }
export function getChaptersByUnit(unitId: string): Chapter[] { return PTB_INTER1_PHYSICS.find((u) => u.id === unitId)?.chapters || []; }
export function getUnitByChapterId(chapterId: string): Unit | undefined { return PTB_INTER1_PHYSICS.find((u) => u.chapters.some((ch) => ch.id === chapterId)); }
