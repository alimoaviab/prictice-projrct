package main

import "fmt"

// ═══════════════════════════════════════════════════════════════════════════
// MATHEMATICS
// ═══════════════════════════════════════════════════════════════════════════

func mathMCQs(grade int, chapter string) []questionData {
	switch chapter {
	case "Sets":
		return []questionData{
			{Type: "mcq", Difficulty: "easy", Marks: 1, HTML: "If A = {1, 2, 3} and B = {2, 3, 4}, then A ∩ B is:", Options: []struct{ Text string `json:"option_text"`; Correct bool `json:"is_correct"` }{{"{ }", false}, {"{2, 3}", true}, {"{1, 2, 3, 4}", false}, {"{1, 4}", false}}},
			{Type: "mcq", Difficulty: "easy", Marks: 1, HTML: "The number of subsets of a set with 3 elements is:", Options: []struct{ Text string `json:"option_text"`; Correct bool `json:"is_correct"` }{{"6", false}, {"8", true}, {"3", false}, {"9", false}}},
			{Type: "mcq", Difficulty: "medium", Marks: 1, HTML: "If A ⊂ B, then A ∪ B equals:", Options: []struct{ Text string `json:"option_text"`; Correct bool `json:"is_correct"` }{{"A", false}, {"B", true}, {"A ∩ B", false}, {"∅", false}}},
		}
	case "Quadratic Equations":
		return []questionData{
			{Type: "mcq", Difficulty: "easy", Marks: 1, HTML: "The standard form of a quadratic equation is:", Options: []struct{ Text string `json:"option_text"`; Correct bool `json:"is_correct"` }{{"ax + b = 0", false}, {"ax² + bx + c = 0", true}, {"ax³ + bx² + cx + d = 0", false}, {"a/x + b = 0", false}}},
			{Type: "mcq", Difficulty: "medium", Marks: 1, HTML: "The discriminant of x² - 5x + 6 = 0 is:", Options: []struct{ Text string `json:"option_text"`; Correct bool `json:"is_correct"` }{{"1", true}, {"25", false}, {"-1", false}, {"0", false}}},
			{Type: "mcq", Difficulty: "hard", Marks: 1, HTML: "If the roots of x² + px + q = 0 are equal, then:", Options: []struct{ Text string `json:"option_text"`; Correct bool `json:"is_correct"` }{{"p² = 4q", true}, {"p² > 4q", false}, {"p² < 4q", false}, {"p = q", false}}},
		}
	case "Differentiation":
		return []questionData{
			{Type: "mcq", Difficulty: "easy", Marks: 1, HTML: "d/dx (x³) equals:", Options: []struct{ Text string `json:"option_text"`; Correct bool `json:"is_correct"` }{{"x²", false}, {"3x²", true}, {"3x", false}, {"x³", false}}},
			{Type: "mcq", Difficulty: "medium", Marks: 1, HTML: "d/dx (sin x) equals:", Options: []struct{ Text string `json:"option_text"`; Correct bool `json:"is_correct"` }{{"cos x", true}, {"-cos x", false}, {"sin x", false}, {"-sin x", false}}},
			{Type: "mcq", Difficulty: "medium", Marks: 1, HTML: "d/dx (eˣ) equals:", Options: []struct{ Text string `json:"option_text"`; Correct bool `json:"is_correct"` }{{"eˣ", true}, {"xeˣ⁻¹", false}, {"eˣ⁻¹", false}, {"0", false}}},
		}
	case "Integration":
		return []questionData{
			{Type: "mcq", Difficulty: "easy", Marks: 1, HTML: "∫ x² dx equals:", Options: []struct{ Text string `json:"option_text"`; Correct bool `json:"is_correct"` }{{"x³/3 + C", true}, {"2x + C", false}, {"x³ + C", false}, {"3x² + C", false}}},
			{Type: "mcq", Difficulty: "medium", Marks: 1, HTML: "∫ cos x dx equals:", Options: []struct{ Text string `json:"option_text"`; Correct bool `json:"is_correct"` }{{"sin x + C", true}, {"-sin x + C", false}, {"cos x + C", false}, {"-cos x + C", false}}},
			{Type: "mcq", Difficulty: "medium", Marks: 1, HTML: "∫ 1/x dx equals:", Options: []struct{ Text string `json:"option_text"`; Correct bool `json:"is_correct"` }{{"ln|x| + C", true}, {"x⁻¹ + C", false}, {"-1/x² + C", false}, {"x + C", false}}},
		}
	default:
		return defaultMathMCQs(chapter)
	}
}

func defaultMathMCQs(chapter string) []questionData {
	return []questionData{
		{Type: "mcq", Difficulty: "easy", Marks: 1, HTML: fmt.Sprintf("Which of the following is a key concept in %s?", chapter), Options: []struct{ Text string `json:"option_text"`; Correct bool `json:"is_correct"` }{{"Definition and properties", true}, {"Unrelated concept", false}, {"None of these", false}, {"All of these", false}}},
		{Type: "mcq", Difficulty: "medium", Marks: 1, HTML: fmt.Sprintf("In the chapter '%s', the fundamental formula is used to:", chapter), Options: []struct{ Text string `json:"option_text"`; Correct bool `json:"is_correct"` }{{"Solve problems", true}, {"Create problems", false}, {"Avoid calculations", false}, {"None of these", false}}},
	}
}

func mathShort(grade int, chapter string) []questionData {
	switch chapter {
	case "Sets":
		return []questionData{
			{Type: "short", Difficulty: "easy", Marks: 3, HTML: "Define the following: (i) Universal Set (ii) Subset (iii) Power Set"},
			{Type: "short", Difficulty: "medium", Marks: 3, HTML: "If A = {1, 2, 3, 4, 5} and B = {3, 4, 5, 6, 7}, find A ∪ B, A ∩ B, and A - B."},
		}
	case "Quadratic Equations":
		return []questionData{
			{Type: "short", Difficulty: "easy", Marks: 3, HTML: "Solve the quadratic equation: x² - 7x + 12 = 0"},
			{Type: "short", Difficulty: "medium", Marks: 3, HTML: "Find the nature of roots of 2x² + 3x - 5 = 0 using the discriminant."},
		}
	case "Differentiation":
		return []questionData{
			{Type: "short", Difficulty: "easy", Marks: 3, HTML: "Differentiate y = 3x⁴ - 2x³ + 5x - 7 with respect to x."},
			{Type: "short", Difficulty: "medium", Marks: 3, HTML: "Find dy/dx if y = (2x + 1)(3x - 2) using the product rule."},
		}
	case "Integration":
		return []questionData{
			{Type: "short", Difficulty: "easy", Marks: 3, HTML: "Evaluate: ∫ (3x² + 2x + 1) dx"},
			{Type: "short", Difficulty: "medium", Marks: 3, HTML: "Evaluate: ∫₀² (x² + 1) dx"},
		}
	default:
		return []questionData{
			{Type: "short", Difficulty: "easy", Marks: 3, HTML: fmt.Sprintf("Define the basic concepts of '%s' with examples.", chapter)},
			{Type: "short", Difficulty: "medium", Marks: 3, HTML: fmt.Sprintf("Solve a numerical problem related to '%s'.", chapter)},
		}
	}
}

func mathLong(grade int, chapter string) []questionData {
	switch chapter {
	case "Sets":
		return []questionData{{Type: "long", Difficulty: "hard", Marks: 8, HTML: "Prove De Morgan's Laws for sets: (i) (A ∪ B)' = A' ∩ B' (ii) (A ∩ B)' = A' ∪ B'. Also verify with an example using U = {1,2,3,4,5,6,7,8,9,10}, A = {1,2,3,4,5}, B = {4,5,6,7,8}."}}
	case "Quadratic Equations":
		return []questionData{{Type: "long", Difficulty: "hard", Marks: 8, HTML: "Derive the quadratic formula. Then use it to solve: 3x² - 5x - 2 = 0. Also find the sum and product of roots and verify your answer."}}
	case "Differentiation":
		return []questionData{{Type: "long", Difficulty: "hard", Marks: 8, HTML: "A rectangular box with a square base and open top is to be made from 48 cm² of material. Find the dimensions that maximize the volume. Use differentiation to solve."}}
	case "Integration":
		return []questionData{{Type: "long", Difficulty: "hard", Marks: 8, HTML: "Find the area bounded by the curve y = x² - 4x + 3, the x-axis, and the lines x = 1 and x = 3. Draw a rough sketch and show all steps."}}
	default:
		return []questionData{{Type: "long", Difficulty: "hard", Marks: 8, HTML: fmt.Sprintf("Explain the complete theory of '%s' with derivations and solve a comprehensive numerical problem.", chapter)}}
	}
}

// ═══════════════════════════════════════════════════════════════════════════
// PHYSICS
// ═══════════════════════════════════════════════════════════════════════════

func physicsMCQs(grade int, chapter string) []questionData {
	switch chapter {
	case "Kinematics":
		return []questionData{
			{Type: "mcq", Difficulty: "easy", Marks: 1, HTML: "The SI unit of velocity is:", Options: []struct{ Text string `json:"option_text"`; Correct bool `json:"is_correct"` }{{"m/s", true}, {"m/s²", false}, {"km/h", false}, {"m", false}}},
			{Type: "mcq", Difficulty: "medium", Marks: 1, HTML: "A body starts from rest and accelerates at 2 m/s². Its velocity after 5 seconds is:", Options: []struct{ Text string `json:"option_text"`; Correct bool `json:"is_correct"` }{{"10 m/s", true}, {"5 m/s", false}, {"2.5 m/s", false}, {"20 m/s", false}}},
			{Type: "mcq", Difficulty: "medium", Marks: 1, HTML: "The area under velocity-time graph gives:", Options: []struct{ Text string `json:"option_text"`; Correct bool `json:"is_correct"` }{{"Distance", true}, {"Acceleration", false}, {"Speed", false}, {"Force", false}}},
		}
	case "Electrostatics":
		return []questionData{
			{Type: "mcq", Difficulty: "easy", Marks: 1, HTML: "The SI unit of electric charge is:", Options: []struct{ Text string `json:"option_text"`; Correct bool `json:"is_correct"` }{{"Coulomb", true}, {"Ampere", false}, {"Volt", false}, {"Ohm", false}}},
			{Type: "mcq", Difficulty: "medium", Marks: 1, HTML: "Coulomb's law is analogous to:", Options: []struct{ Text string `json:"option_text"`; Correct bool `json:"is_correct"` }{{"Newton's law of gravitation", true}, {"Ohm's law", false}, {"Faraday's law", false}, {"Lenz's law", false}}},
			{Type: "mcq", Difficulty: "hard", Marks: 1, HTML: "Electric field inside a hollow charged conductor is:", Options: []struct{ Text string `json:"option_text"`; Correct bool `json:"is_correct"` }{{"Zero", true}, {"Maximum", false}, {"Minimum", false}, {"Infinite", false}}},
		}
	default:
		return []questionData{
			{Type: "mcq", Difficulty: "easy", Marks: 1, HTML: fmt.Sprintf("Which of the following is related to '%s'?", chapter), Options: []struct{ Text string `json:"option_text"`; Correct bool `json:"is_correct"` }{{"Fundamental principle", true}, {"Unrelated concept", false}, {"None of these", false}, {"Cannot be determined", false}}},
			{Type: "mcq", Difficulty: "medium", Marks: 1, HTML: fmt.Sprintf("The SI unit used in '%s' is:", chapter), Options: []struct{ Text string `json:"option_text"`; Correct bool `json:"is_correct"` }{{"Standard SI unit", true}, {"CGS unit", false}, {"FPS unit", false}, {"No unit", false}}},
		}
	}
}

func physicsShort(grade int, chapter string) []questionData {
	switch chapter {
	case "Kinematics":
		return []questionData{
			{Type: "short", Difficulty: "easy", Marks: 3, HTML: "Define: (i) Distance (ii) Displacement (iii) Speed (iv) Velocity"},
			{Type: "short", Difficulty: "medium", Marks: 3, HTML: "A car accelerates from 20 m/s to 50 m/s in 10 seconds. Find its acceleration and distance covered."},
		}
	case "Electrostatics":
		return []questionData{
			{Type: "short", Difficulty: "easy", Marks: 3, HTML: "State Coulomb's Law and write its mathematical expression."},
			{Type: "short", Difficulty: "medium", Marks: 3, HTML: "Two charges of 3μC and 5μC are placed 20 cm apart. Find the force between them."},
		}
	default:
		return []questionData{
			{Type: "short", Difficulty: "easy", Marks: 3, HTML: fmt.Sprintf("Define the key terms related to '%s'.", chapter)},
			{Type: "short", Difficulty: "medium", Marks: 3, HTML: fmt.Sprintf("Solve a numerical problem from '%s'.", chapter)},
		}
	}
}

func physicsLong(grade int, chapter string) []questionData {
	switch chapter {
	case "Kinematics":
		return []questionData{{Type: "long", Difficulty: "hard", Marks: 8, HTML: "Derive the three equations of motion using velocity-time graph. A ball is thrown vertically upward with velocity 30 m/s. Find: (i) Maximum height (ii) Time to reach maximum height (iii) Total time of flight. (Take g = 10 m/s²)"}}
	case "Electrostatics":
		return []questionData{{Type: "long", Difficulty: "hard", Marks: 8, HTML: "Derive the expression for electric field intensity due to a point charge. Three charges +2μC, -3μC, and +4μC are placed at the vertices of an equilateral triangle of side 10 cm. Find the net force on the +2μC charge."}}
	default:
		return []questionData{{Type: "long", Difficulty: "hard", Marks: 8, HTML: fmt.Sprintf("Explain the complete theory of '%s' with derivations, diagrams, and solve a comprehensive numerical problem.", chapter)}}
	}
}

// ═══════════════════════════════════════════════════════════════════════════
// CHEMISTRY
// ═══════════════════════════════════════════════════════════════════════════

func chemistryMCQs(grade int, chapter string) []questionData {
	return []questionData{
		{Type: "mcq", Difficulty: "easy", Marks: 1, HTML: fmt.Sprintf("Which concept is fundamental to '%s'?", chapter), Options: []struct{ Text string `json:"option_text"`; Correct bool `json:"is_correct"` }{{"Core principle of the chapter", true}, {"Unrelated concept", false}, {"None of these", false}, {"All of these", false}}},
		{Type: "mcq", Difficulty: "medium", Marks: 1, HTML: fmt.Sprintf("In '%s', the correct statement is:", chapter), Options: []struct{ Text string `json:"option_text"`; Correct bool `json:"is_correct"` }{{"Based on fundamental law", true}, {"Contradicts basic principles", false}, {"Has no practical application", false}, {"Is purely theoretical", false}}},
		{Type: "mcq", Difficulty: "hard", Marks: 1, HTML: fmt.Sprintf("The advanced application of '%s' involves:", chapter), Options: []struct{ Text string `json:"option_text"`; Correct bool `json:"is_correct"` }{{"Complex calculations and analysis", true}, {"Simple observation only", false}, {"No mathematical treatment", false}, {"Guesswork", false}}},
	}
}

func chemistryShort(grade int, chapter string) []questionData {
	return []questionData{
		{Type: "short", Difficulty: "easy", Marks: 3, HTML: fmt.Sprintf("Define the key terms and concepts of '%s'.", chapter)},
		{Type: "short", Difficulty: "medium", Marks: 3, HTML: fmt.Sprintf("Explain the mechanism/process involved in '%s' with a balanced equation.", chapter)},
	}
}

func chemistryLong(grade int, chapter string) []questionData {
	return []questionData{{Type: "long", Difficulty: "hard", Marks: 8, HTML: fmt.Sprintf("Discuss '%s' in detail. Include: (a) Definition and explanation (b) Types/Classification (c) Examples with equations (d) Industrial/practical applications.", chapter)}}
}

// ═══════════════════════════════════════════════════════════════════════════
// BIOLOGY
// ═══════════════════════════════════════════════════════════════════════════

func biologyMCQs(grade int, chapter string) []questionData {
	return []questionData{
		{Type: "mcq", Difficulty: "easy", Marks: 1, HTML: fmt.Sprintf("Which of the following is related to '%s'?", chapter), Options: []struct{ Text string `json:"option_text"`; Correct bool `json:"is_correct"` }{{"Key biological concept", true}, {"Unrelated topic", false}, {"Physics concept", false}, {"Chemistry concept", false}}},
		{Type: "mcq", Difficulty: "medium", Marks: 1, HTML: fmt.Sprintf("In '%s', the correct biological process is:", chapter), Options: []struct{ Text string `json:"option_text"`; Correct bool `json:"is_correct"` }{{"Natural biological mechanism", true}, {"Artificial process", false}, {"Chemical reaction only", false}, {"Physical change only", false}}},
	}
}

func biologyShort(grade int, chapter string) []questionData {
	return []questionData{
		{Type: "short", Difficulty: "easy", Marks: 3, HTML: fmt.Sprintf("Define and explain the main concepts of '%s'.", chapter)},
		{Type: "short", Difficulty: "medium", Marks: 3, HTML: fmt.Sprintf("Draw a labeled diagram related to '%s' and explain its significance.", chapter)},
	}
}

func biologyLong(grade int, chapter string) []questionData {
	return []questionData{{Type: "long", Difficulty: "hard", Marks: 8, HTML: fmt.Sprintf("Write a detailed note on '%s'. Include: (a) Introduction (b) Process/Mechanism (c) Diagram (d) Significance (e) Disorders/Applications.", chapter)}}
}

// ═══════════════════════════════════════════════════════════════════════════
// GENERAL (English, Urdu, CS, Islamiat, Pak Studies)
// ═══════════════════════════════════════════════════════════════════════════

func generalMCQs(grade int, subject, chapter string) []questionData {
	return []questionData{
		{Type: "mcq", Difficulty: "easy", Marks: 1, HTML: fmt.Sprintf("Which is the main theme of '%s'?", chapter), Options: []struct{ Text string `json:"option_text"`; Correct bool `json:"is_correct"` }{{"Central theme of the chapter", true}, {"Unrelated topic", false}, {"Opposite meaning", false}, {"None of these", false}}},
		{Type: "mcq", Difficulty: "medium", Marks: 1, HTML: fmt.Sprintf("The key learning from '%s' is:", chapter), Options: []struct{ Text string `json:"option_text"`; Correct bool `json:"is_correct"` }{{"Important lesson/concept", true}, {"Irrelevant information", false}, {"Contradictory statement", false}, {"All of the above", false}}},
	}
}

func generalShort(grade int, subject, chapter string) []questionData {
	return []questionData{
		{Type: "short", Difficulty: "easy", Marks: 3, HTML: fmt.Sprintf("Write a short note on '%s'.", chapter)},
		{Type: "short", Difficulty: "medium", Marks: 3, HTML: fmt.Sprintf("Explain the importance/significance of '%s' in detail.", chapter)},
	}
}

func generalLong(grade int, subject, chapter string) []questionData {
	return []questionData{{Type: "long", Difficulty: "hard", Marks: 8, HTML: fmt.Sprintf("Write a comprehensive essay on '%s'. Discuss its background, main points, significance, and conclusion.", chapter)}}
}
