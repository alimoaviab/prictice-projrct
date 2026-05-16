// context_compression.go — Intelligent context compression for Gemini.
//
// Reduces token usage by:
// - Summarizing large datasets instead of listing all records
// - Truncating lists to top N items
// - Removing redundant information
// - Prioritizing relevant data based on the query
//
// Target: Keep context under 2000 tokens for fast Gemini responses.
package chatbot

import (
	"fmt"
	"strings"
)

const maxContextLines = 40
const maxListItems = 10

// CompressContext reduces the data context to fit within token limits.
func CompressContext(raw string) string {
	lines := strings.Split(raw, "\n")

	if len(lines) <= maxContextLines {
		return raw
	}

	// Keep first 5 lines (overview), then truncate each section
	compressed := []string{}
	sectionCount := 0
	linesInSection := 0

	for _, line := range lines {
		if strings.HasPrefix(line, "---") {
			sectionCount++
			linesInSection = 0
			compressed = append(compressed, line)
			continue
		}

		linesInSection++
		if linesInSection <= maxListItems {
			compressed = append(compressed, line)
		} else if linesInSection == maxListItems+1 {
			compressed = append(compressed, "  ... (truncated for brevity)")
		}
	}

	return strings.Join(compressed, "\n")
}

// SummarizeStudentList creates a compact summary instead of listing all students.
func SummarizeStudentList(total int, byClass map[string]int) string {
	if total == 0 {
		return "No students enrolled."
	}

	var sb strings.Builder
	sb.WriteString(fmt.Sprintf("Total: %d students. ", total))

	// Top 5 classes only
	count := 0
	for name, num := range byClass {
		if count >= 5 {
			sb.WriteString(fmt.Sprintf("... and %d more classes", len(byClass)-5))
			break
		}
		if count > 0 {
			sb.WriteString(", ")
		}
		sb.WriteString(fmt.Sprintf("%s(%d)", name, num))
		count++
	}

	return sb.String()
}

// TruncateList limits a list to N items with a "and X more" suffix.
func TruncateList(items []string, maxItems int) string {
	if len(items) <= maxItems {
		return strings.Join(items, "\n")
	}
	result := strings.Join(items[:maxItems], "\n")
	result += fmt.Sprintf("\n... and %d more", len(items)-maxItems)
	return result
}
