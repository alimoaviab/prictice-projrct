package subscription

import (
	"sort"
	"strings"
	"time"

	"github.com/eduplexo/backend-go/internal/store"
)

const (
	PackageAcademic       = "academic"
	PackageLearning       = "learning"
	PackageAdministration = "administration"
	PackageFinance        = "finance"
	PackageCommunication  = "communication"
	PackagePremium        = "premium"
)

type ModulePackage struct {
	ID        string   `json:"id"`
	Name      string   `json:"name"`
	Rate      int      `json:"rate"`
	Mandatory bool     `json:"mandatory"`
	Modules   []string `json:"modules"`
}

type AccessSnapshot struct {
	Subscription     *store.Subscription `json:"subscription,omitempty"`
	Status           string              `json:"status"`
	SelectedPackages []string            `json:"selected_packages"`
	DaysRemaining    int                 `json:"days_remaining"`
	IsExpired        bool                `json:"is_expired"`
	TrialWarning     string              `json:"trial_warning,omitempty"`
}

var defaultPackageRates = map[string]int{
	PackageAcademic:       5,
	PackageLearning:       4,
	PackageAdministration: 4,
	PackageFinance:        4,
	PackageCommunication:  2,
	PackagePremium:        1,
}

var packageOrder = []string{
	PackageAcademic,
	PackageLearning,
	PackageAdministration,
	PackageFinance,
	PackageCommunication,
	PackagePremium,
}

var packageModules = map[string][]string{
	PackageAcademic: {
		"academic-years",
		"classes",
		"teachers",
		"students",
		"subjects",
	},
	PackageLearning: {
		"homework",
		"exams",
		"tests",
		"results",
		"question-papers",
		"question-bank",
		"academic-analytics",
	},
	PackageAdministration: {
		"attendance",
		"leave",
		"timetable",
		"behavior",
	},
	PackageFinance: {
		"fee",
	},
	PackageCommunication: {
		"announcements",
		"conversations",
	},
	PackagePremium: {
		"live-classes",
		"certificates",
		"schedule",
	},
}

var packageNames = map[string]string{
	PackageAcademic:       "Academic Package",
	PackageLearning:       "Learning Package",
	PackageAdministration: "Administration Package",
	PackageFinance:        "Finance Package",
	PackageCommunication:  "Communication Package",
	PackagePremium:        "Premium Package",
}

func DefaultPackageRates() map[string]int {
	return normalizeRates(nil)
}

func PackageCatalog(rates map[string]int) []ModulePackage {
	rates = normalizeRates(rates)
	out := make([]ModulePackage, 0, len(packageOrder))
	for _, id := range packageOrder {
		out = append(out, ModulePackage{
			ID:        id,
			Name:      packageNames[id],
			Rate:      rates[id],
			Mandatory: id == PackageAcademic,
			Modules:   append([]string(nil), packageModules[id]...),
		})
	}
	return out
}

func normalizeRates(rates map[string]int) map[string]int {
	out := make(map[string]int, len(defaultPackageRates))
	for k, v := range defaultPackageRates {
		out[k] = v
	}
	for k, v := range rates {
		k = strings.ToLower(strings.TrimSpace(k))
		if _, ok := out[k]; ok && v >= 0 {
			out[k] = v
		}
	}
	return out
}

func isKnownPackage(id string) bool {
	for _, pkg := range packageOrder {
		if pkg == id {
			return true
		}
	}
	return false
}

func isKnownModule(id string) bool {
	for _, modules := range packageModules {
		for _, m := range modules {
			if m == id {
				return true
			}
		}
	}
	return false
}

var defaultModuleRates = map[string]int{
	// Academic modules
	"academic-years": 1,
	"classes":        1,
	"teachers":       1,
	"students":       1,
	"subjects":       1,
	// Learning modules
	"homework":           1,
	"exams":              1,
	"tests":              1,
	"results":            1,
	"question-papers":    1,
	"question-bank":      1,
	"academic-analytics": 1,
	// Administration modules
	"attendance": 1,
	"leave":      1,
	"timetable":  1,
	"behavior":   1,
	// Finance modules
	"fee": 4,
	// Communication modules
	"announcements": 1,
	"conversations": 1,
	// Premium modules
	"live-classes": 1,
	"certificates": 1,
	"schedule":     1,
}

func NormalizePackages(values []string) []string {
	known := map[string]bool{}
	for _, id := range packageOrder {
		known[id] = true
	}
	seen := map[string]bool{PackageAcademic: true}
	out := []string{PackageAcademic}
	for _, raw := range values {
		id := strings.ToLower(strings.TrimSpace(raw))
		id = strings.TrimPrefix(id, "package_")
		id = strings.TrimPrefix(id, "pkg_")
		if id == "" || id == PackageAcademic || !known[id] || seen[id] {
			continue
		}
		seen[id] = true
		out = append(out, id)
	}
	sort.SliceStable(out, func(i, j int) bool {
		return packageIndex(out[i]) < packageIndex(out[j])
	})
	return out
}

func NormalizePackagesAndModules(values []string) []string {
	seen := map[string]bool{PackageAcademic: true}
	out := []string{PackageAcademic}
	for _, raw := range values {
		id := strings.ToLower(strings.TrimSpace(raw))
		id = strings.TrimPrefix(id, "package_")
		id = strings.TrimPrefix(id, "pkg_")
		if id == "" || id == PackageAcademic || seen[id] {
			continue
		}
		if isKnownPackage(id) || isKnownModule(id) {
			seen[id] = true
			out = append(out, id)
		}
	}
	sort.SliceStable(out, func(i, j int) bool {
		idxI := packageIndex(out[i])
		idxJ := packageIndex(out[j])
		if idxI != idxJ {
			return idxI < idxJ
		}
		return out[i] < out[j]
	})
	return out
}

func ParseSelectedPackages(packageID string, selected []string) []string {
	if len(selected) > 0 {
		return NormalizePackagesAndModules(selected)
	}
	raw := strings.ToLower(strings.TrimSpace(packageID))
	if raw == "" {
		return []string{PackageAcademic}
	}
	switch raw {
	case "trial":
		return []string{PackageAcademic}
	case "starter", "growth", "custom", "enterprise", "plan_starter", "plan_growth", "plan_custom":
		return append([]string(nil), packageOrder...)
	}
	parts := strings.FieldsFunc(raw, func(r rune) bool {
		return r == ',' || r == ';' || r == '|' || r == ' '
	})
	return NormalizePackagesAndModules(parts)
}

func EncodeSelectedPackages(selected []string) string {
	return strings.Join(NormalizePackagesAndModules(selected), ",")
}

func MonthlyEstimate(activeStudents int, selected []string, rates map[string]int) int {
	if activeStudents < 0 {
		activeStudents = 0
	}
	rates = normalizeRates(rates)
	totalRate := 0

	enabledModules := map[string]bool{}
	for _, raw := range selected {
		item := strings.ToLower(strings.TrimSpace(raw))
		if isKnownPackage(item) {
			for _, m := range packageModules[item] {
				enabledModules[m] = true
			}
		} else if isKnownModule(item) {
			enabledModules[item] = true
		}
	}

	for pkg, modules := range packageModules {
		pkgRate := rates[pkg]
		pkgSelectedRate := 0
		for _, m := range modules {
			if enabledModules[m] {
				modRate := defaultModuleRates[m]
				if modRate == 0 {
					modRate = 1
				}
				pkgSelectedRate += modRate
			}
		}
		if pkgSelectedRate > pkgRate {
			pkgSelectedRate = pkgRate
		}
		totalRate += pkgSelectedRate
	}

	total := activeStudents * totalRate
	if total < 500 {
		return 500
	}
	return total
}

func PackageModules(selected []string) map[string]bool {
	out := map[string]bool{
		"dashboard":    true,
		"subscription": true,
		"billing":      true,
		"payment":      true,
		"support":      true,
		"settings":     true,
	}
	for _, raw := range selected {
		item := strings.ToLower(strings.TrimSpace(raw))
		if isKnownPackage(item) {
			for _, module := range packageModules[item] {
				out[module] = true
			}
		} else if isKnownModule(item) {
			out[item] = true
		}
	}
	return out
}

func PackageForModule(module string) string {
	module = strings.ToLower(strings.TrimSpace(module))
	for pkg, modules := range packageModules {
		for _, m := range modules {
			if m == module {
				return pkg
			}
		}
	}
	return ""
}

func IsPackageAllowed(selected []string, packageID string) bool {
	packageID = strings.ToLower(strings.TrimSpace(packageID))
	if packageID == "" || packageID == PackageAcademic {
		return true
	}
	for _, raw := range selected {
		item := strings.ToLower(strings.TrimSpace(raw))
		if item == packageID {
			return true
		}
		for _, m := range packageModules[packageID] {
			if m == item {
				return true
			}
		}
	}
	return false
}

func IsModuleAllowed(selected []string, packageID string, module string) bool {
	packageID = strings.ToLower(strings.TrimSpace(packageID))
	module = strings.ToLower(strings.TrimSpace(module))
	if packageID == "" || packageID == PackageAcademic {
		return true
	}
	for _, raw := range selected {
		item := strings.ToLower(strings.TrimSpace(raw))
		if item == packageID || item == module {
			return true
		}
	}
	return false
}

func PackageForAPIPath(path string) (string, string) {
	path = strings.TrimSpace(path)
	path = strings.TrimPrefix(path, "/api")
	if path == "" {
		path = "/"
	}

	if strings.HasPrefix(path, "/classes/") && strings.Contains(path, "/fees") {
		return PackageFinance, "fee"
	}

	rules := []struct {
		prefix  string
		pkg     string
		module  string
	}{
		{"/homework", PackageLearning, "homework"},
		{"/exams", PackageLearning, "exams"},
		{"/tests", PackageLearning, "tests"},
		{"/results", PackageLearning, "results"},
		{"/question-papers", PackageLearning, "question-papers"},
		{"/question-bank", PackageLearning, "question-bank"},
		{"/questions", PackageLearning, "question-bank"},
		{"/chapters", PackageLearning, "question-bank"},
		{"/analytics/results", PackageLearning, "academic-analytics"},
		{"/analytics/exam", PackageLearning, "academic-analytics"},
		{"/analytics/chapter-performance", PackageLearning, "academic-analytics"},
		{"/attendance", PackageAdministration, "attendance"},
		{"/leave", PackageAdministration, "leave"},
		{"/timetable", PackageAdministration, "timetable"},
		{"/behavior", PackageAdministration, "behavior"},
		{"/school/fees", PackageFinance, "fee"},
		{"/fees", PackageFinance, "fee"},
		{"/scholarships", PackageFinance, "fee"},
		{"/fee-discounts", PackageFinance, "fee"},
		{"/wallet", PackageFinance, "fee"},
		{"/student/fees", PackageFinance, "fee"},
		{"/parent/fees", PackageFinance, "fee"},
		{"/announcements", PackageCommunication, "announcements"},
		{"/messages", PackageCommunication, "conversations"},
		{"/live/classes", PackagePremium, "live-classes"},
		{"/certificates", PackagePremium, "certificates"},
		{"/schedules", PackagePremium, "schedule"},
	}
	for _, rule := range rules {
		if path == rule.prefix || strings.HasPrefix(path, rule.prefix+"/") {
			return rule.pkg, rule.module
		}
	}
	return "", ""
}

func IsExpiredAllowedAPI(path string) bool {
	path = strings.TrimPrefix(path, "/api")
	allowed := []string{
		"/subscription",
		"/payment",
		"/support",
		"/notifications",
	}
	for _, prefix := range allowed {
		if path == prefix || strings.HasPrefix(path, prefix+"/") {
			return true
		}
	}
	return false
}

func SnapshotFromStore(s *store.MemStore, schoolID string) AccessSnapshot {
	if s == nil || strings.TrimSpace(schoolID) == "" {
		return AccessSnapshot{Status: "expired", SelectedPackages: nil, IsExpired: true}
	}

	s.Lock()
	defer s.Unlock()

	var latest *store.Subscription
	for _, sub := range s.Subscriptions {
		if sub.SchoolID != schoolID {
			continue
		}
		if latest == nil || sub.CreatedAt.After(latest.CreatedAt) {
			latest = sub
		}
	}
	if latest == nil {
		return AccessSnapshot{Status: "expired", SelectedPackages: nil, IsExpired: true}
	}

	now := time.Now()
	status := strings.ToLower(strings.TrimSpace(latest.Status))
	if status == "" {
		status = "active"
	}
	if (status == "active" || status == "trial") && !latest.NextRenewal.IsZero() && now.After(latest.NextRenewal) {
		status = "expired"
		latest.Status = "expired"
		latest.UpdatedAt = now
		s.AuditLogs = append(s.AuditLogs, &store.AuditLog{
			ID:         store.NewID("aud"),
			SchoolID:   schoolID,
			ActorID:    "system",
			ActorRole:  "system",
			Action:     "expiry_event",
			EntityType: "subscription",
			EntityID:   latest.ID,
			Metadata:   map[string]any{"expired_at": now},
			CreatedAt:  now,
		})
	}

	daysRemaining := 0
	if !latest.NextRenewal.IsZero() && now.Before(latest.NextRenewal) {
		daysRemaining = int(latest.NextRenewal.Sub(now).Hours() / 24)
	}
	warning := ""
	if status == "trial" {
		elapsedDays := int(now.Sub(latest.CreatedAt).Hours() / 24)
		if elapsedDays >= 13 {
			warning = "urgent"
		} else if elapsedDays >= 10 {
			warning = "warning"
		}
	}

	selected := ParseSelectedPackages(latest.PackageID, latest.SelectedPackages)
	latest.SelectedPackages = selected
	latest.PackageID = EncodeSelectedPackages(selected)

	return AccessSnapshot{
		Subscription:     latest,
		Status:           status,
		SelectedPackages: selected,
		DaysRemaining:    daysRemaining,
		IsExpired:        status == "expired" || status == "cancelled" || status == "paused",
		TrialWarning:     warning,
	}
}

func packageIndex(id string) int {
	for i, item := range packageOrder {
		if item == id {
			return i
		}
	}
	return len(packageOrder)
}
