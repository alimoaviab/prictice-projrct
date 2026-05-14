package api

import (
	"strings"
	"time"
)

// ParseDate parses YYYY-MM-DD or RFC3339 dates. Returns zero time on failure.
// Mirrors how the original Mongoose route handlers casually accept either
// format.
func ParseDate(s string) (time.Time, bool) {
	s = strings.TrimSpace(s)
	if s == "" {
		return time.Time{}, false
	}
	for _, layout := range []string{"2006-01-02", time.RFC3339, time.RFC3339Nano, "2006-01-02T15:04:05"} {
		if t, err := time.Parse(layout, s); err == nil {
			return t, true
		}
	}
	return time.Time{}, false
}

// DayBounds returns the start (00:00) and inclusive end-of-day (23:59:59.999)
// of the given date in UTC, matching the original
// `attendanceDate.setHours(0, 0, 0, 0)` pattern.
func DayBounds(t time.Time) (time.Time, time.Time) {
	d := time.Date(t.Year(), t.Month(), t.Day(), 0, 0, 0, 0, time.UTC)
	end := d.Add(24*time.Hour - time.Nanosecond)
	return d, end
}

// FormatDate renders a date as YYYY-MM-DD, the way the original services
// emit `date.toISOString().split("T")[0]`.
func FormatDate(t time.Time) string {
	if t.IsZero() {
		return ""
	}
	return t.Format("2006-01-02")
}

// SafeSlice returns a sub-slice [start, end) clamped to len(items).
func SafeSlice[T any](items []T, start, end int) []T {
	if start < 0 {
		start = 0
	}
	if start > len(items) {
		start = len(items)
	}
	if end < start {
		end = start
	}
	if end > len(items) {
		end = len(items)
	}
	return items[start:end]
}


// FormatInt is strconv.Itoa under another name. Avoids importing strconv in
// every domain handler that already imports this package.
func FormatInt(i int) string {
	if i == 0 {
		return "0"
	}
	out := ""
	negative := i < 0
	if negative {
		i = -i
	}
	for i > 0 {
		out = string(rune('0'+i%10)) + out
		i /= 10
	}
	if negative {
		out = "-" + out
	}
	return out
}
