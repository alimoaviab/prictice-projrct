// Raw MCQ import and lightweight parser for PTB Inter-II Biology
// This file contains the user's pasted MCQ text and exposes a function
// `parsePtBmcqRaw()` that returns an array of lightweight question objects
// compatible with the `CompleteQuestion` shape used in this project.

const RAW_MCQ = `CHAPTER 15: HOMEOSTASIS
15.1 Concepts in Homeostasis
Q1. The protection of an internal environment from the harms of fluctuations is the definition of which of the following?
(A) Osmoregulation (B) Excretion (C) Thermoregulation (D) Homeostasis

Q2. The environment where the animal produce large volumes of diluted urine:
(A) Hypotonic aquatic (B) Isotonic aquatic (C) Hypertonic aquatic (D) Terrestrial

Q3. The protection of an internal environment from the harms of fluctuations is the definition of which of the following?
(A) Homeotherms (B) Homeopathy (C) Homeostasis (D) None

Q4. The environment where the animal produce large volumes of diluted urine:
(A) Hypotonic aquatic (B) Isotonic aquatic (C) Hypertonic aquatic (D) Terrestrial

Q5. The more concentrated external environment is termed as:
(A) Hypotonic (B) Hypertonic (C) Isotonic (D) Osmotic

Q6. A diluted solution compared to the cell concentration is termed as:
(A) Hypertonic (B) Hypotonic (C) Isotonic (D) Paratonic

Q7. Animals inhibiting environment with acute shortage water excrets:
(A) Ammonia (B) Uric acid (C) Urea (D) Allantion

Q8. Mechanism, which eliminates nitrogenous waste, is referred as:
(A) Osmoregulation (B) Excretion (C) Thermoregulation (D) Ejection

Q9. The more concentrated external environment is termed as:
(A) Hypotonic (B) Hypertonic (C) Isotonic (D) Osmotic

Q10. A diluted solution compared to the cell concentration is termed as:
(A) Hypertonic (B) Hypotonic (C) Isotonic (D) Paratonic

Q11. Animals inhibiting environment with acute shortage water excrete:
(A) Ammonia (B) Uric acid (C) Urea (D) Allantion

Q12. Mechanism, which eliminates nitrogenous waste, is referred as:
(A) Nutrition (B) Excretion (C) Protection (D) Thermoregulation

15.2 Osmoregulation in Plants
Q13. The category of the plants that has adaptations of small and thick leaves to limit water loss are called:
(A) Hydrophytes (B) Xerophytes (C) Mesophytes (D) Hygrophytes

Q14. A plant is adapted to remove the floading of its cells in fresh water:
(A) Mesophytes (B) Cactus (C) Hyrdrophytes (D) Xerophytes

Q15. Which one is not a mesophyte?
(A) Brassica (B) Rose (C) Mango (D) Cacti

Q16. Which one is an example of xerophytes?
(A) Brassia (B) Rose (C) Mango (D) Cactus

Q17. They have adaptations for reduced rate of transpiration:
(A) Mesophyte (B) Halophytes (C) Hydrophyte (D) Xerophyte

15.3 Osmoregulation in Animals
Q18. Contractile vacuoles are found in:
(A) Plants (B) Fresh water protozoa (C) Terrestrial animals (D) Marine plants

Q19. Tri ethylamine oxide is produced in:
(A) Hag fish (B) Bony fish (C) Marine fish (D) Cartilaginous

Q20. The tolerance of dehydration is called:
(A) Osmoconformers (B) Osmoregulation (C) Anhydrobiosis (D) Dehydration

Q21. Animals that do not require to adjust their internal environment state actively are known:
(A) Osmoregulation (B) Osmo conformers (C) Terrestrial (D) Hypertonic

Q22. Fresh water protozoans pump out excess water by:
(A) Contractile vacuole (B) Food vacuole (C) Pinocytosis (D) Phagocytosis

Q23. Among the vertebrates, hag fish are isotonic with the surrounding:
(A) Fresh water (B) Sea water (C) Pound water (D) River water

Q24. The fishes which drink large amount of sea water and excrete concentrated urine are:
(A) Cartilaginous fishes (B) Bony fishes (C) Lung fishes (D) Jawless fishes

Q25. Fresh water flatworms excrete:
(A) Very dilute urine (B) Very concentrated urine (C) Slightly concentrated urine (D) Moderately concentrated urine

15.4 Excretion in Plants
Q26. Which of the following is called as excretophore i.e. contributing mainly in the elimination of wastes in plants?
(A) Stem (B) Roots (C) Leaves (D) Flowers

Q27. Which part of the plant body serves as excretophore?
(A) Root (B) Stem (C) Leaves (D) Flowers

15.5 Excretion in Animals
Q28. The excretory product that requires minimum water for its elimination compare in others:
(A) Urea (B) Uric acid (C) Creatinine (D) Ammonia

Q29. 1 g of ammonia nitrogen requires how much water for excretion:
(A) 50 ml (B) 100 ml (C) 250 ml (D) 500 ml

Q30. Urea is detoxified form of ......... in the area cycle which can be retained in the body.
(A) Ammonia (B) Nitrogen (C) Uric acid (D) CO2

Q31. Animals excreting urea are called:
(A) Ammonotelic (B) Aminotelic (C) Uretelic (D) Uricotelic

Q32. Number of ammonia molecules required for produce one molecule of urea is:
(A) 01 (B) 02 (C) 03 (D) 04

Q33. Nitrogenous waste is very toxic and dissolves quickly in body fluid is:
(A) CO2 (B) Urea (C) Ammonia (D) Uric acid

Q34. Metabolism of purines and pyrimidines produce significant amount of:
(A) Creatinine (B) Creatine (C) Xanthine (D) Trimethyl amine oxide

Q35. The excretory product that requires maximum water for its removal is:
(A) Ammonia (B) Creatinine (C) Urea (D) Uric acid

Q36. The nitrogenous waste which is highly toxic and dissolves quickly in body fluids is:
(A) Ammonia (B) Urea (C) Uric acid (D) Carbon dioxide

Q37. The chief nitrogenous waste in birds and reptiles is:
(A) Ammonia (B) Urea (C) Uric acid (D) Creatirine

15.6 Excretion in Representative Animals
Q38. The group of animals whose excretory system is structurally associated with nutritive tract:
(A) Vertebrates (B) Earthworms (C) Planaria (D) Insects

Q39. Flame cells are part of excretory system of:
(A) Hydra (B) Cockroach (C) Planaria (D) Earthworm

Q40. Animals of the group of flatworms have simple tubular excretory system called as:
(A) Kidney (B) Nephron (C) Nephridia (D) Protonephridia

... (TRUNCATED) ...
`;

interface OutQuestion {
  id: string;
  text: string;
  type: string; // 'mcq' or 'short' | 'long'
  difficulty: string;
  marks: number;
  chapterId: string;
  chapterTitle: string;
}

export function parsePtBmcqRaw(): OutQuestion[] {
  const lines = RAW_MCQ.split(/\r?\n/);
  const results: OutQuestion[] = [];
  let currentChapter = "";
  let currentSubchapterId = "";
  let currentSubchapterTitle = "";

  const chapterHeadingRegex = /^CHAPTER\s*(\d+):\s*(.+)$/i;
  const subchapterRegex = /^(\d+\.\d+)\s+(.+)$/;
  const qRegex = /^Q(\d+)\.\s*(.*)$/i;
  const optionsInlineRegex = /\(A\)\s*([^\(]+)\s*\(B\)\s*([^\(]+)\s*\(C\)\s*([^\(]+)\s*\(D\)\s*([^\(]+)$/i;

  for (let i = 0; i < lines.length; i++) {
    const raw = lines[i].trim();
    if (!raw) continue;
    const chap = raw.match(chapterHeadingRegex);
    if (chap) {
      currentChapter = chap[1];
      currentSubchapterId = currentChapter; // fallback
      currentSubchapterTitle = chap[2].trim();
      continue;
    }
    const sub = raw.match(subchapterRegex);
    if (sub) {
      currentSubchapterId = sub[1];
      currentSubchapterTitle = sub[2].trim();
      continue;
    }
    const q = raw.match(qRegex);
    if (q) {
      const qNum = q[1];
      let qText = q[2].trim();
      // Try extract inline options
      let optionsMatch = qText.match(optionsInlineRegex);
      if (!optionsMatch) {
        // try next line
        const next = (lines[i + 1] || "").trim();
        const combined = qText + " " + next;
        optionsMatch = combined.match(optionsInlineRegex);
        if (optionsMatch) i++; // consume next line
      }
      let type = "short";
      if (optionsMatch) type = "mcq";
      const id = `${currentSubchapterId || currentChapter || 'ch'}-${qNum}`;
      results.push({
        id,
        text: qText.replace(optionsInlineRegex, "").trim(),
        type,
        difficulty: "Medium",
        marks: type === "mcq" ? 1 : 2,
        chapterId: currentSubchapterId || currentChapter || "",
        chapterTitle: currentSubchapterTitle || "",
      });
    }
  }
  return results;
}

export default parsePtBmcqRaw;
