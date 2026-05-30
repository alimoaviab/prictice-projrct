package store

import (
	"log"
	"time"
)

// EnsureSchoolDefaults iterates all schools in the MemStore and ensures each
// one has the required default records for every feature. This is the
// permanent solution to the "new features don't apply to old accounts"
// problem.
//
// When a new feature is added that requires per-school default data, add a
// new ensure* helper below and call it from this function. The function is
// idempotent — it only creates records that don't already exist.
//
// Call this AFTER pg.Load() and BEFORE the server starts listening.
func EnsureSchoolDefaults(s *MemStore) {
	if s == nil {
		return
	}

	s.Lock()
	defer s.Unlock()

	// Collect all non-system school IDs
	var schoolIDs []string
	for _, sch := range s.Schools {
		if sch.SchoolID == "system" {
			continue
		}
		schoolIDs = append(schoolIDs, sch.SchoolID)
	}

	if len(schoolIDs) == 0 {
		return
	}

	var created int

	// Run all feature provisioners
	created += ensureSchoolSettings(s, schoolIDs)
	created += ensureDefaultAcademicYear(s, schoolIDs)
	created += ensureGlobalBoards(s)
	// Add new feature provisioners here as features are added:
	// created += ensureDefaultFeeTypes(s, schoolIDs)
	// created += ensureDefaultNotificationPrefs(s, schoolIDs)

	if created > 0 {
		log.Printf("[defaults] provisioned %d default records for %d schools", created, len(schoolIDs))
	}
}

// ensureSchoolSettings ensures every school has a SchoolSettings record.
// Without this, the settings page shows empty/broken for old schools.
func ensureSchoolSettings(s *MemStore, schoolIDs []string) int {
	// Build lookup of existing settings
	existing := make(map[string]bool, len(s.SchoolSettings))
	for _, ss := range s.SchoolSettings {
		existing[ss.SchoolID] = true
	}

	created := 0
	now := time.Now()
	for _, sid := range schoolIDs {
		if existing[sid] {
			continue
		}
		s.SchoolSettings = append(s.SchoolSettings, &SchoolSettings{
			SchoolID:  sid,
			Profile:   map[string]any{},
			Branding:  map[string]any{},
			Academic:  map[string]any{},
			UpdatedAt: now,
		})
		created++
	}
	return created
}

// ensureDefaultAcademicYear ensures every school has at least one academic
// year. Without this, new features that depend on academic_year_id fail for
// schools that somehow lost their year records.
func ensureDefaultAcademicYear(s *MemStore, schoolIDs []string) int {
	// Build lookup of schools that already have at least one academic year
	existing := make(map[string]bool, len(s.AcademicYears))
	for _, ay := range s.AcademicYears {
		existing[ay.SchoolID] = true
	}

	created := 0
	now := time.Now()
	for _, sid := range schoolIDs {
		if existing[sid] {
			continue
		}
		startYear := now.Year()
		if now.Month() < time.April {
			startYear = startYear - 1
		}
		s.AcademicYears = append(s.AcademicYears, &AcademicYear{
			ID:        NewID("ay"),
			SchoolID:  sid,
			Year:      formatAcademicYear(startYear),
			StartDate: time.Date(startYear, 4, 1, 0, 0, 0, 0, time.UTC),
			EndDate:   time.Date(startYear+1, 3, 31, 0, 0, 0, 0, time.UTC),
			IsActive:  true,
			Status:    "active",
			CreatedAt: now,
			UpdatedAt: now,
		})
		created++
	}
	return created
}

// ensureGlobalBoards ensures the default syllabuses used by the frontend exist as Boards.
func ensureGlobalBoards(s *MemStore) int {
	defaults := []struct{ ID, Name, Code string }{
		{"ptb", "PTB", "PTB"},
		{"afaq-snc", "AFAQ SNC", "AFAQ SNC"},
		{"oxford-snc", "OXFORD SNC", "OXFORD SNC"},
		{"gohar-snc", "GOHAR SNC", "GOHAR SNC"},
		{"ba", "B.A", "B.A"},
	}

	existing := make(map[string]bool)
	for _, b := range s.Boards {
		existing[b.ID] = true
	}

	created := 0
	now := time.Now()
	for _, d := range defaults {
		if existing[d.ID] {
			continue
		}
		s.Boards = append(s.Boards, &Board{
			ID:        d.ID,
			Name:      d.Name,
			Code:      d.Code,
			IsActive:  true,
			CreatedAt: now,
			UpdatedAt: now,
		})
		created++
	}
	return created
}
