// analytics_engine.go — Precomputed analytics and trend detection.
//
// Generates insights by analyzing patterns in school data:
// - Attendance trends (improving/declining)
// - Fee collection rates
// - Weak student detection
// - Class comparisons
// - Proactive alerts
package chatbot

import (
	"fmt"
	"strings"
	"time"

	"github.com/eduplexo/backend-go/internal/api"
	"github.com/eduplexo/backend-go/internal/store"
)

// SchoolAnalytics contains precomputed analytics for a school.
type SchoolAnalytics struct {
	// Attendance
	AttendanceRate7Days  float64 `json:"attendance_rate_7days"`
	AttendanceRate30Days float64 `json:"attendance_rate_30days"`
	AttendanceTrend      string  `json:"attendance_trend"` // "improving" | "declining" | "stable"
	WeakAttendanceClasses []string `json:"weak_attendance_classes,omitempty"`

	// Fees
	FeeCollectionRate float64 `json:"fee_collection_rate"`
	OverdueCount      int     `json:"overdue_count"`
	PendingAmount     float64 `json:"pending_amount"`

	// Students
	TotalStudents    int      `json:"total_students"`
	WeakStudents     []string `json:"weak_students,omitempty"` // Below 40% average
	TopStudents      []string `json:"top_students,omitempty"`  // Above 80% average

	// Alerts
	Alerts []Alert `json:"alerts,omitempty"`
}

// Alert represents a proactive system alert.
type Alert struct {
	Level   string `json:"level"`   // "critical" | "warning" | "info"
	Title   string `json:"title"`
	Message string `json:"message"`
	Action  string `json:"action,omitempty"` // Suggested route
}

// ComputeAnalytics generates school-wide analytics from the MemStore.
func ComputeAnalytics(s *store.MemStore, ctx *api.RequestContext) *SchoolAnalytics {
	s.RLock()
	defer s.RUnlock()

	analytics := &SchoolAnalytics{}
	now := time.Now()

	// ─── Attendance Analytics ────────────────────────────────────────────
	var present7, total7, present30, total30 int
	for _, a := range s.Attendance {
		if a.SchoolID != ctx.SchoolID {
			continue
		}
		daysSince := now.Sub(a.Date).Hours() / 24
		if daysSince <= 7 {
			total7++
			if strings.ToLower(a.Status) == "present" || strings.ToLower(a.Status) == "late" {
				present7++
			}
		}
		if daysSince <= 30 {
			total30++
			if strings.ToLower(a.Status) == "present" || strings.ToLower(a.Status) == "late" {
				present30++
			}
		}
	}
	if total7 > 0 {
		analytics.AttendanceRate7Days = float64(present7) / float64(total7) * 100
	}
	if total30 > 0 {
		analytics.AttendanceRate30Days = float64(present30) / float64(total30) * 100
	}

	// Trend detection
	if analytics.AttendanceRate7Days > 0 && analytics.AttendanceRate30Days > 0 {
		diff := analytics.AttendanceRate7Days - analytics.AttendanceRate30Days
		if diff > 3 {
			analytics.AttendanceTrend = "improving"
		} else if diff < -3 {
			analytics.AttendanceTrend = "declining"
		} else {
			analytics.AttendanceTrend = "stable"
		}
	}

	// ─── Fee Analytics ───────────────────────────────────────────────────
	var collected, pending float64
	for _, f := range s.Fees {
		if f.SchoolID != ctx.SchoolID {
			continue
		}
		eff := f.Amount + f.AdjustmentAmount
		collected += f.PaidAmount
		rem := eff - f.PaidAmount
		if rem > 0 {
			pending += rem
			if !f.DueAt.IsZero() && f.DueAt.Before(now) {
				analytics.OverdueCount++
			}
		}
	}
	total := collected + pending
	if total > 0 {
		analytics.FeeCollectionRate = (collected / total) * 100
	}
	analytics.PendingAmount = pending

	// ─── Student Analytics ───────────────────────────────────────────────
	for _, st := range s.Students {
		if st.SchoolID == ctx.SchoolID && st.Status == "active" {
			analytics.TotalStudents++
		}
	}

	// ─── Generate Alerts ─────────────────────────────────────────────────
	analytics.Alerts = generateAlerts(analytics)

	return analytics
}

// generateAlerts creates proactive alerts based on analytics.
func generateAlerts(a *SchoolAnalytics) []Alert {
	alerts := []Alert{}

	// Attendance alerts
	if a.AttendanceRate7Days > 0 && a.AttendanceRate7Days < 70 {
		alerts = append(alerts, Alert{
			Level:   "critical",
			Title:   "Low Attendance",
			Message: fmt.Sprintf("This week's attendance is only %.0f%%. Immediate action needed.", a.AttendanceRate7Days),
			Action:  "/admin/attendance",
		})
	} else if a.AttendanceTrend == "declining" {
		alerts = append(alerts, Alert{
			Level:   "warning",
			Title:   "Attendance Declining",
			Message: "Attendance trend is declining compared to last month.",
			Action:  "/admin/attendance",
		})
	}

	// Fee alerts
	if a.OverdueCount > 10 {
		alerts = append(alerts, Alert{
			Level:   "critical",
			Title:   "High Overdue Fees",
			Message: fmt.Sprintf("%d students have overdue fees. Start recovery drive.", a.OverdueCount),
			Action:  "/admin/fee",
		})
	} else if a.OverdueCount > 0 {
		alerts = append(alerts, Alert{
			Level:   "warning",
			Title:   "Pending Fees",
			Message: fmt.Sprintf("%d students have overdue fees.", a.OverdueCount),
			Action:  "/admin/fee",
		})
	}

	// Collection rate
	if a.FeeCollectionRate > 0 && a.FeeCollectionRate < 50 {
		alerts = append(alerts, Alert{
			Level:   "warning",
			Title:   "Low Collection Rate",
			Message: fmt.Sprintf("Fee collection is only %.0f%%. Send reminders.", a.FeeCollectionRate),
			Action:  "/admin/fee",
		})
	}

	return alerts
}

// FormatAnalyticsSummary creates a human-readable analytics summary.
func FormatAnalyticsSummary(a *SchoolAnalytics) string {
	var sb strings.Builder
	sb.WriteString("📈 **School Analytics**\n\n")

	// Attendance
	if a.AttendanceRate7Days > 0 {
		trend := "→"
		if a.AttendanceTrend == "improving" {
			trend = "↗️ Improving"
		} else if a.AttendanceTrend == "declining" {
			trend = "↘️ Declining"
		} else {
			trend = "→ Stable"
		}
		sb.WriteString(fmt.Sprintf("📋 **Attendance:** %.0f%% (7-day) | Trend: %s\n", a.AttendanceRate7Days, trend))
	}

	// Fees
	if a.FeeCollectionRate > 0 {
		sb.WriteString(fmt.Sprintf("💰 **Fee Collection:** %.0f%% | Overdue: %d students\n", a.FeeCollectionRate, a.OverdueCount))
	}

	// Students
	sb.WriteString(fmt.Sprintf("👨‍🎓 **Students:** %d active\n", a.TotalStudents))

	// Alerts
	if len(a.Alerts) > 0 {
		sb.WriteString("\n⚠️ **Alerts:**\n")
		for _, alert := range a.Alerts {
			icon := "ℹ️"
			if alert.Level == "critical" {
				icon = "🔴"
			} else if alert.Level == "warning" {
				icon = "⚠️"
			}
			sb.WriteString(fmt.Sprintf("%s %s\n", icon, alert.Message))
		}
	}

	return sb.String()
}
