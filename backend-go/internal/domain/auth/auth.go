// Package auth implements the /api/auth/* endpoints. Mirrors
// old-app/school-app/app/api/auth/{login,signup,_log,session}/route.ts and
// old-app/school-app/app/api/academic-years/switch/route.ts.
package auth

import (
	"crypto/rand"
	"encoding/hex"
	"encoding/json"
	"net/http"
	"strings"
	"time"

	"github.com/eduplexo/backend-go/internal/api"
	authpkg "github.com/eduplexo/backend-go/internal/auth"
	"github.com/eduplexo/backend-go/internal/config"
	"github.com/eduplexo/backend-go/internal/store"
)

// Handler bundles dependencies for the auth routes.
type Handler struct {
	Cfg   config.Config
	Store *store.MemStore
}

// New returns a configured auth handler.
func New(cfg config.Config, s *store.MemStore) *Handler {
	return &Handler{Cfg: cfg, Store: s}
}

// loginRequest mirrors the body the original /api/auth/login endpoint
// accepts. The frontend sends `{email, password, role?}`.
type loginRequest struct {
	Email    string `json:"email"`
	Password string `json:"password"`
	Role     string `json:"role,omitempty"`
}

type loginResponseData struct {
	Role                 string `json:"role"`
	Token                string `json:"token"`
	UserID               string `json:"user_id"`
	Email                string `json:"email"`
	SchoolID             string `json:"school_id"`
	ActiveAcademicYearID string `json:"active_academic_year_id,omitempty"`
	ProfileID            string `json:"profile_id,omitempty"`
	ClassID              string `json:"class_id,omitempty"`
	StudentID            string `json:"student_id,omitempty"`
}

// Login implements POST /api/auth/login. Behaviour mirrors
// old-app/school-app/app/api/auth/login/route.ts including:
//   - Same validation order (email+password required, then user lookup,
//     then password compare, then school status check).
//   - Same JWT claims and 8-hour expiry.
//   - Same session cookie (httpOnly, sameSite=lax, 8h, path=/).
//   - Same response envelope: `{ ok, data: { role, token, user_id, email, school_id, active_academic_year_id } }`.
func (h *Handler) Login(w http.ResponseWriter, r *http.Request) {
	var body loginRequest
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
		api.WriteJSON(w, http.StatusBadRequest, map[string]any{
			"ok":      false,
			"message": "Invalid JSON body.",
		})
		return
	}
	body.Email = strings.TrimSpace(strings.ToLower(body.Email))

	if body.Email == "" || body.Password == "" {
		api.WriteJSON(w, http.StatusBadRequest, map[string]any{
			"ok":      false,
			"message": "Email and password are required",
		})
		return
	}

	h.Store.RLock()
	var user *store.User
	for _, u := range h.Store.Users {
		if u.Email == body.Email {
			user = u
			break
		}
	}
	h.Store.RUnlock()

	if user == nil {
		api.WriteJSON(w, http.StatusUnauthorized, map[string]any{
			"ok":      false,
			"message": "Invalid email or password",
		})
		return
	}

	if !authpkg.VerifyPassword(body.Password, user.PasswordHash) {
		api.WriteJSON(w, http.StatusUnauthorized, map[string]any{
			"ok":      false,
			"message": "Invalid email or password",
		})
		return
	}

	// Check school status for non-super_admin users — same logic as the
	// original: only admin/teacher/parent/student users care about school
	// state, and the messages are preserved verbatim.
	if user.Role != "super_admin" {
		h.Store.RLock()
		var school *store.School
		for _, s := range h.Store.Schools {
			if s.SchoolID == user.SchoolID {
				school = s
				break
			}
		}
		h.Store.RUnlock()

		if school == nil {
			api.WriteJSON(w, http.StatusForbidden, map[string]any{
				"ok":      false,
				"message": "School registration not found.",
			})
			return
		}

		switch school.Status {
		case "pending":
			api.WriteJSON(w, http.StatusForbidden, map[string]any{
				"ok":      false,
				"message": "Your school account is under review. Please wait for approval.",
			})
			return
		case "rejected":
			api.WriteJSON(w, http.StatusForbidden, map[string]any{
				"ok":      false,
				"message": "Your school registration was rejected. Contact support.",
			})
			return
		case "suspended":
			api.WriteJSON(w, http.StatusForbidden, map[string]any{
				"ok":      false,
				"message": "Your school account has been suspended. Please contact administration.",
			})
			return
		}
	}

	// Resolve the active academic year server-side, exactly like the
	// original signing path does.
	activeYearID := h.findActiveAcademicYearID(user.SchoolID)

	claims := authpkg.Claims{
		SchoolID:             user.SchoolID,
		Role:                 user.Role,
		Permissions:          user.Permissions,
		ActiveAcademicYearID: activeYearID,
		SessionID:            "sess_" + randomID(),
		App:                  h.Cfg.AppName,
		ActorEmail:           user.Email,
	}
	claims.Subject = user.ID

	token, err := authpkg.SignToken(h.Cfg.JWTSecret, h.Cfg.AppName, claims, 8*time.Hour)
	if err != nil {
		api.WriteJSON(w, http.StatusInternalServerError, map[string]any{
			"ok":      false,
			"message": "Failed to issue session.",
		})
		return
	}

	now := time.Now()
	user.LastLoginAt = &now
	user.UpdatedAt = now

	h.setSessionCookie(w, token)

	// Resolve profile_id for role-specific portals.
	// Teachers need their teacher._id, students need student._id + class_id.
	var profileID, classID, studentID string
	h.Store.RLock()
	switch user.Role {
	case "teacher":
		for _, t := range h.Store.Teachers {
			if t.SchoolID == user.SchoolID && t.UserID == user.ID {
				profileID = t.ID
				break
			}
		}
	case "student":
		for _, s := range h.Store.Students {
			if s.SchoolID == user.SchoolID && s.UserID == user.ID {
				profileID = s.ID
				studentID = s.ID
				classID = s.ClassID
				break
			}
		}
	}
	h.Store.RUnlock()

	api.WriteJSON(w, http.StatusOK, map[string]any{
		"ok": true,
		"data": loginResponseData{
			Role:                 user.Role,
			Token:                token,
			UserID:               user.ID,
			Email:                user.Email,
			SchoolID:             user.SchoolID,
			ActiveAcademicYearID: activeYearID,
			ProfileID:            profileID,
			ClassID:              classID,
			StudentID:            studentID,
		},
	})
}

// signupRequest mirrors the body shape the original signup endpoint accepts.
// `school_name` / `schoolName` are alternative spellings the frontend uses.
type signupRequest struct {
	Role        string `json:"role"`
	Email       string `json:"email"`
	Password    string `json:"password"`
	FullName    string `json:"fullName"`
	AdminName   string `json:"admin_name"`
	SchoolName  string `json:"schoolName"`
	SchoolName2 string `json:"school_name"`
	SchoolCode  string `json:"schoolCode"`
	SchoolCode2 string `json:"school_code"`
}

// Signup implements POST /api/auth/signup. Mirrors the Node route file.
// For role="admin": creates a new School (status=pending), default
// AcademicYear, and Admin user — returns 201 with `{ status: "pending", school_id }`.
// For other roles: looks up the school by its school_id/code, validates,
// creates the user, signs a token, sets the cookie, and returns 201 with
// the token.
func (h *Handler) Signup(w http.ResponseWriter, r *http.Request) {
	var body signupRequest
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
		api.WriteJSON(w, http.StatusBadRequest, signupErr("Invalid JSON body."))
		return
	}

	role := strings.ToLower(strings.TrimSpace(body.Role))
	if role == "" {
		role = "admin"
	}
	email := strings.ToLower(strings.TrimSpace(body.Email))
	password := body.Password
	fullName := strings.TrimSpace(firstNonEmpty(body.AdminName, body.FullName))
	schoolName := strings.TrimSpace(firstNonEmpty(body.SchoolName, body.SchoolName2))
	schoolCode := strings.ToUpper(strings.TrimSpace(firstNonEmpty(body.SchoolCode, body.SchoolCode2)))

	if role != "admin" && role != "teacher" && role != "student" && role != "parent" {
		api.WriteJSON(w, http.StatusBadRequest, signupErr("Invalid role selected"))
		return
	}
	if email == "" || password == "" || fullName == "" {
		api.WriteJSON(w, http.StatusBadRequest, signupErr("All fields are required"))
		return
	}
	if role == "admin" && schoolName == "" {
		api.WriteJSON(w, http.StatusBadRequest, signupErr("School name is required"))
		return
	}
	if role != "admin" && schoolCode == "" {
		api.WriteJSON(w, http.StatusBadRequest, signupErr("School code is required"))
		return
	}
	if len(password) < 6 {
		api.WriteJSON(w, http.StatusBadRequest, signupErr("Password must be at least 6 characters"))
		return
	}

	h.Store.RLock()
	for _, u := range h.Store.Users {
		if strings.EqualFold(u.Email, email) {
			h.Store.RUnlock()
			api.WriteJSON(w, http.StatusConflict, signupErr("This email is already registered in the system."))
			return
		}
	}
	h.Store.RUnlock()

	hash, err := authpkg.HashPassword(password)
	if err != nil {
		api.WriteJSON(w, http.StatusInternalServerError, signupErr("Signup failed. Please try again."))
		return
	}

	now := time.Now()

	if role == "admin" {
		schoolID := "SCH-" + strings.ToUpper(randomID()[:8])
		uniqueCode := h.uniqueSchoolCode(schoolName)

		yearID := store.NewID("ay")
		year := time.Now().Year()

		h.Store.Lock()
		h.Store.Schools = append(h.Store.Schools, &store.School{
			ID:        store.NewID("sch"),
			SchoolID:  schoolID,
			Name:      schoolName,
			Code:      uniqueCode,
			Status:    "active", // Bypassing Super Admin approval for now: changed from "pending"
			CreatedAt: now,
			UpdatedAt: now,
		})
		h.Store.AcademicYears = append(h.Store.AcademicYears, &store.AcademicYear{
			ID:          yearID,
			SchoolID:    schoolID,
			Year:        formatYearRange(year),
			StartDate:   time.Date(year, 4, 1, 0, 0, 0, 0, time.UTC),
			EndDate:     time.Date(year+1, 3, 31, 0, 0, 0, 0, time.UTC),
			IsActive:    true,
			Status:      "active",
			Description: "Default academic year",
			CreatedAt:   now,
			UpdatedAt:   now,
		})
		h.Store.Users = append(h.Store.Users, &store.User{
			ID:           store.NewID("usr"),
			SchoolID:     schoolID,
			Email:        email,
			PasswordHash: hash,
			Role:         "admin",
			Permissions:  []string{"*"},
			Profile: store.UserProfile{
				FirstName: firstWord(fullName),
				LastName:  remainingWords(fullName),
			},
			Status:    "active",
			CreatedAt: now,
			UpdatedAt: now,
		})
		h.Store.Unlock()

		// Bypassing Super Admin approval for now: status is "active", token is still omitted (user goes to /auth/login)
		api.WriteJSON(w, http.StatusCreated, map[string]any{
			"ok":      true,
			"success": true,
			"message": "Your school account is active. Please log in.",
			"data": map[string]any{
				"status":    "active",
				"school_id": schoolID,
			},
		})
		return
	}

	// Non-admin signup: find the existing school by school_id or code.
	h.Store.RLock()
	var school *store.School
	for _, s := range h.Store.Schools {
		if s.SchoolID == schoolCode || s.Code == schoolCode {
			school = s
			break
		}
	}
	h.Store.RUnlock()
	if school == nil {
		api.WriteJSON(w, http.StatusNotFound, signupErr("Invalid school code"))
		return
	}

	activeYearID := h.findActiveAcademicYearID(school.SchoolID)

	userID := store.NewID("usr")
	h.Store.Lock()
	h.Store.Users = append(h.Store.Users, &store.User{
		ID:           userID,
		SchoolID:     school.SchoolID,
		Email:        email,
		PasswordHash: hash,
		Role:         role,
		Permissions:  []string{},
		Profile: store.UserProfile{
			FirstName: firstWord(fullName),
			LastName:  remainingWords(fullName),
		},
		Status:    "active",
		CreatedAt: now,
		UpdatedAt: now,
	})
	h.Store.Unlock()

	claims := authpkg.Claims{
		SchoolID:             school.SchoolID,
		Role:                 role,
		Permissions:          []string{},
		ActiveAcademicYearID: activeYearID,
		SessionID:            "sess_" + randomID(),
		App:                  h.Cfg.AppName,
		ActorEmail:           email,
	}
	claims.Subject = userID
	token, err := authpkg.SignToken(h.Cfg.JWTSecret, h.Cfg.AppName, claims, 8*time.Hour)
	if err != nil {
		api.WriteJSON(w, http.StatusInternalServerError, signupErr("Signup failed. Please try again."))
		return
	}

	h.setSessionCookie(w, token)

	api.WriteJSON(w, http.StatusCreated, map[string]any{
		"ok":      true,
		"success": true,
		"data": map[string]any{
			"role":                    role,
			"token":                   token,
			"email":                   email,
			"school_id":               school.SchoolID,
			"active_academic_year_id": activeYearID,
		},
	})
}

// SwitchAcademicYear implements POST /api/academic-years/switch.
// Mirrors old-app/school-app/app/api/academic-years/switch/route.ts.
// Re-issues the JWT with the new active_academic_year_id after validating
// the year belongs to the caller's tenant.
func (h *Handler) SwitchAcademicYear(w http.ResponseWriter, r *http.Request) {
	ctx := api.FromRequest(r)
	if ctx == nil {
		api.WriteJSON(w, http.StatusUnauthorized, map[string]any{"ok": false, "message": "Authentication required."})
		return
	}

	var body struct {
		AcademicYearID string `json:"academic_year_id"`
	}
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
		api.WriteJSON(w, http.StatusBadRequest, map[string]any{"ok": false, "message": "Invalid JSON body."})
		return
	}
	yearID := strings.TrimSpace(body.AcademicYearID)
	if yearID == "" {
		api.WriteJSON(w, http.StatusBadRequest, map[string]any{"ok": false, "message": "academic_year_id is required"})
		return
	}

	h.Store.RLock()
	var year *store.AcademicYear
	for _, y := range h.Store.AcademicYears {
		if y.ID == yearID && y.SchoolID == ctx.SchoolID {
			year = y
			break
		}
	}
	h.Store.RUnlock()
	if year == nil {
		api.WriteJSON(w, http.StatusNotFound, map[string]any{"ok": false, "message": "Academic year not found in this school."})
		return
	}

	claims := authpkg.Claims{
		SchoolID:             ctx.SchoolID,
		Role:                 ctx.Role,
		Permissions:          ctx.Permissions,
		ActiveAcademicYearID: year.ID,
		SessionID:            firstNonEmpty(ctx.SessionID, "sess_"+randomID()),
		App:                  h.Cfg.AppName,
		ActorEmail:           ctx.ActorEmail,
	}
	claims.Subject = ctx.UserID

	token, err := authpkg.SignToken(h.Cfg.JWTSecret, h.Cfg.AppName, claims, 8*time.Hour)
	if err != nil {
		api.WriteJSON(w, http.StatusInternalServerError, map[string]any{"ok": false, "message": "Failed to issue session."})
		return
	}

	h.setSessionCookie(w, token)

	api.WriteJSON(w, http.StatusOK, map[string]any{
		"ok": true,
		"data": map[string]any{
			"token":            token,
			"academic_year_id": year.ID,
			"year":             year.Year,
			"is_active":        year.IsActive,
		},
	})
}

// Session implements GET /api/auth/session — the original endpoint returns
// `null` so probes during boot don't 404. We do the same.
func (h *Handler) Session(w http.ResponseWriter, _ *http.Request) {
	api.WriteJSON(w, http.StatusOK, nil)
}

// Log implements POST /api/auth/_log — the original is a noop logger.
func (h *Handler) Log(w http.ResponseWriter, _ *http.Request) {
	api.WriteJSON(w, http.StatusOK, map[string]any{"ok": true})
}

// GoogleStatus implements GET /api/auth/google/status. The Phase-2 backend
// keeps the connection always disabled; the original computes this from the
// `googleCalendar` object on the Teacher document. Frontend handles both.
func (h *Handler) GoogleStatus(w http.ResponseWriter, _ *http.Request) {
	api.WriteJSON(w, http.StatusOK, map[string]any{
		"ok":   true,
		"data": map[string]any{"connected": false, "isConnected": false},
	})
}

// ─── helpers ─────────────────────────────────────────────────────────────

func (h *Handler) findActiveAcademicYearID(schoolID string) string {
	h.Store.RLock()
	defer h.Store.RUnlock()
	for _, y := range h.Store.AcademicYears {
		if y.SchoolID == schoolID && y.IsActive {
			return y.ID
		}
	}
	return ""
}

func (h *Handler) uniqueSchoolCode(name string) string {
	base := strings.ToUpper(strings.ReplaceAll(name, " ", ""))
	cleaned := strings.Builder{}
	for _, r := range base {
		if (r >= 'A' && r <= 'Z') || (r >= '0' && r <= '9') {
			cleaned.WriteRune(r)
		}
	}
	out := cleaned.String()
	if out == "" {
		out = "SCHOOL"
	}
	if len(out) > 10 {
		out = out[:10]
	}

	h.Store.RLock()
	defer h.Store.RUnlock()
	exists := func(code string) bool {
		for _, s := range h.Store.Schools {
			if s.Code == code {
				return true
			}
		}
		return false
	}
	if !exists(out) {
		return out
	}
	for i := 0; i < 10; i++ {
		suffix := strings.ToUpper(randomID()[:4])
		base := out
		if len(base) > 5 {
			base = base[:5]
		}
		candidate := base + suffix
		if !exists(candidate) {
			return candidate
		}
	}
	return "SCH" + strings.ToUpper(randomID()[:7])
}

func (h *Handler) setSessionCookie(w http.ResponseWriter, token string) {
	// Cross-site cookie support: when CookieSecure is true (production with HTTPS),
	// use SameSite=None so the cookie is sent on cross-origin requests from the
	// frontend (e.g. Vercel) to the backend on a different domain.
	sameSite := http.SameSiteLaxMode
	if h.Cfg.CookieSecure {
		sameSite = http.SameSiteNoneMode
	}
	http.SetCookie(w, &http.Cookie{
		Name:     "session",
		Value:    token,
		HttpOnly: true,
		Secure:   h.Cfg.CookieSecure,
		SameSite: sameSite,
		Path:     "/",
		MaxAge:   60 * 60 * 8,
	})
}

func signupErr(message string) map[string]any {
	return map[string]any{
		"ok":    false,
		"error": map[string]any{"message": message},
	}
}

func firstNonEmpty(values ...string) string {
	for _, v := range values {
		if strings.TrimSpace(v) != "" {
			return v
		}
	}
	return ""
}

func firstWord(s string) string {
	parts := strings.Fields(s)
	if len(parts) == 0 {
		return ""
	}
	return parts[0]
}

func remainingWords(s string) string {
	parts := strings.Fields(s)
	if len(parts) <= 1 {
		return ""
	}
	return strings.Join(parts[1:], " ")
}

func formatYearRange(year int) string {
	return formatInt(year) + "-" + formatInt(year+1)
}

func formatInt(i int) string {
	// Avoid pulling strconv just for a single call.
	const digits = "0123456789"
	if i == 0 {
		return "0"
	}
	negative := i < 0
	if negative {
		i = -i
	}
	out := ""
	for i > 0 {
		out = string(digits[i%10]) + out
		i /= 10
	}
	if negative {
		out = "-" + out
	}
	return out
}

func randomID() string {
	b := make([]byte, 8)
	_, _ = rand.Read(b)
	return hex.EncodeToString(b)
}
