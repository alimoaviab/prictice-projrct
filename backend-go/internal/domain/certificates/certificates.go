// Package certificates implements the /api/certificates/* endpoints.
//
// Provides:
//   - Template CRUD (create, list, get, update, delete, duplicate)
//   - Certificate generation (bulk, per-student)
//   - Certificate verification (by code)
//   - Certificate revocation
package certificates

import (
	"crypto/sha1"
	"encoding/hex"
	"encoding/json"
	"fmt"
	"math/rand"
	"net/http"
	"sort"
	"strings"
	"time"

	"github.com/eduplexo/backend-go/internal/api"
	"github.com/eduplexo/backend-go/internal/auth"
	"github.com/eduplexo/backend-go/internal/store"
	"github.com/go-chi/chi/v5"
)

type Handler struct {
	Store *store.MemStore
	Save  func(string, any)
}

func New(s *store.MemStore, save func(string, any)) *Handler {
	if save == nil {
		save = func(string, any) {}
	}
	return &Handler{Store: s, Save: save}
}

// ─── Templates ───────────────────────────────────────────────────────────

func (h *Handler) ListTemplates(w http.ResponseWriter, r *http.Request) {
	ctx := api.FromRequest(r)
	if err := auth.AssertPermission(ctx, "certificates", auth.ActionView); err != nil {
		api.WriteResult(w, api.Fail("FORBIDDEN", err.Error(), 403, nil))
		return
	}
	h.Store.RLock()
	defer h.Store.RUnlock()

	out := make([]map[string]any, 0)
	for _, t := range h.Store.CertificateTemplates {
		if t.SchoolID != ctx.SchoolID {
			continue
		}
		out = append(out, templateToMap(t))
	}
	sort.Slice(out, func(i, j int) bool {
		return out[i]["created_at"].(time.Time).After(out[j]["created_at"].(time.Time))
	})
	api.WriteResult(w, api.Ok(out))
}

func (h *Handler) GetTemplate(w http.ResponseWriter, r *http.Request) {
	ctx := api.FromRequest(r)
	id := chi.URLParam(r, "id")
	h.Store.RLock()
	defer h.Store.RUnlock()

	for _, t := range h.Store.CertificateTemplates {
		if t.ID == id && t.SchoolID == ctx.SchoolID {
			api.WriteResult(w, api.Ok(templateToMap(t)))
			return
		}
	}
	api.WriteResult(w, api.Fail("NOT_FOUND", "Template not found.", 404, nil))
}

type templateInput struct {
	Name          string          `json:"name"`
	Type          string          `json:"type"`
	Orientation   string          `json:"orientation"`
	BackgroundURL string          `json:"background_url"`
	WatermarkURL  string          `json:"watermark_url"`
	BorderStyle   string          `json:"border_style"`
	BodyText      string          `json:"body_text"`
	IsDefault     bool            `json:"is_default"`
	Elements      json.RawMessage `json:"elements"`
}

func (h *Handler) CreateTemplate(w http.ResponseWriter, r *http.Request) {
	ctx := api.FromRequest(r)
	var body templateInput
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
		api.WriteResult(w, api.Fail("VALIDATION_ERROR", "Invalid JSON body.", 400, nil))
		return
	}
	if strings.TrimSpace(body.Name) == "" {
		api.WriteResult(w, api.Fail("VALIDATION_ERROR", "Template name is required.", 400, nil))
		return
	}

	now := time.Now()
	t := &store.CertificateTemplate{
		ID:            store.NewID("ctpl"),
		SchoolID:      ctx.SchoolID,
		Name:          strings.TrimSpace(body.Name),
		Type:          orDefault(body.Type, "character"),
		Orientation:   orDefault(body.Orientation, "landscape"),
		BackgroundURL: body.BackgroundURL,
		WatermarkURL:  body.WatermarkURL,
		BorderStyle:   body.BorderStyle,
		BodyText:      body.BodyText,
		IsDefault:     body.IsDefault,
		Elements:      string(body.Elements),
		Status:        "active",
		CreatedAt:     now,
		UpdatedAt:     now,
	}

	h.Store.Lock()
	h.Store.CertificateTemplates = append(h.Store.CertificateTemplates, t)
	h.Store.Unlock()
	h.Save("certificate_templates", t)

	api.WriteResult(w, api.Ok(templateToMap(t)))
}

func (h *Handler) UpdateTemplate(w http.ResponseWriter, r *http.Request) {
	ctx := api.FromRequest(r)
	id := chi.URLParam(r, "id")
	var body templateInput
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
		api.WriteResult(w, api.Fail("VALIDATION_ERROR", "Invalid JSON body.", 400, nil))
		return
	}

	h.Store.Lock()
	defer h.Store.Unlock()
	for _, t := range h.Store.CertificateTemplates {
		if t.ID == id && t.SchoolID == ctx.SchoolID {
			if body.Name != "" {
				t.Name = body.Name
			}
			if body.Type != "" {
				t.Type = body.Type
			}
			if body.Orientation != "" {
				t.Orientation = body.Orientation
			}
			if body.BodyText != "" {
				t.BodyText = body.BodyText
			}
			if body.BackgroundURL != "" {
				t.BackgroundURL = body.BackgroundURL
			}
			if len(body.Elements) > 0 {
				t.Elements = string(body.Elements)
			}
			t.UpdatedAt = time.Now()
			h.Save("certificate_templates", t)
			api.WriteResult(w, api.Ok(templateToMap(t)))
			return
		}
	}
	api.WriteResult(w, api.Fail("NOT_FOUND", "Template not found.", 404, nil))
}

func (h *Handler) DeleteTemplate(w http.ResponseWriter, r *http.Request) {
	ctx := api.FromRequest(r)
	id := chi.URLParam(r, "id")

	h.Store.Lock()
	defer h.Store.Unlock()
	for i, t := range h.Store.CertificateTemplates {
		if t.ID == id && t.SchoolID == ctx.SchoolID {
			h.Store.CertificateTemplates = append(h.Store.CertificateTemplates[:i], h.Store.CertificateTemplates[i+1:]...)
			h.Save("certificate_templates:delete", id)
			api.WriteResult(w, api.Ok(map[string]any{"success": true}))
			return
		}
	}
	api.WriteResult(w, api.Fail("NOT_FOUND", "Template not found.", 404, nil))
}

func (h *Handler) DuplicateTemplate(w http.ResponseWriter, r *http.Request) {
	ctx := api.FromRequest(r)
	id := chi.URLParam(r, "id")

	h.Store.Lock()
	defer h.Store.Unlock()
	for _, t := range h.Store.CertificateTemplates {
		if t.ID == id && t.SchoolID == ctx.SchoolID {
			now := time.Now()
			dup := *t
			dup.ID = store.NewID("ctpl")
			dup.Name = t.Name + " (Copy)"
			dup.IsDefault = false
			dup.CreatedAt = now
			dup.UpdatedAt = now
			h.Store.CertificateTemplates = append(h.Store.CertificateTemplates, &dup)
			h.Save("certificate_templates", &dup)
			api.WriteResult(w, api.Ok(templateToMap(&dup)))
			return
		}
	}
	api.WriteResult(w, api.Fail("NOT_FOUND", "Template not found.", 404, nil))
}

// ─── Certificate Generation ──────────────────────────────────────────────

type generateInput struct {
	TemplateID   string            `json:"template_id"`
	StudentIDs   []string          `json:"student_ids"`
	IssueDate    string            `json:"issue_date"`
	CustomFields map[string]string `json:"custom_fields"`
}

func (h *Handler) Generate(w http.ResponseWriter, r *http.Request) {
	ctx := api.FromRequest(r)
	var body generateInput
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
		api.WriteResult(w, api.Fail("VALIDATION_ERROR", "Invalid JSON body.", 400, nil))
		return
	}
	if body.TemplateID == "" || len(body.StudentIDs) == 0 {
		api.WriteResult(w, api.Fail("VALIDATION_ERROR", "template_id and student_ids are required.", 400, nil))
		return
	}

	h.Store.Lock()
	defer h.Store.Unlock()

	// Find template
	var template *store.CertificateTemplate
	for _, t := range h.Store.CertificateTemplates {
		if t.ID == body.TemplateID && t.SchoolID == ctx.SchoolID {
			template = t
			break
		}
	}
	if template == nil {
		api.WriteResult(w, api.Fail("NOT_FOUND", "Template not found.", 404, nil))
		return
	}

	issueDate := time.Now()
	if body.IssueDate != "" {
		if parsed, err := time.Parse("2006-01-02", body.IssueDate); err == nil {
			issueDate = parsed
		}
	}

	generated := make([]map[string]any, 0)
	for _, studentID := range body.StudentIDs {
		// Find student
		var student *store.Student
		for _, s := range h.Store.Students {
			if s.ID == studentID && s.SchoolID == ctx.SchoolID {
				student = s
				break
			}
		}
		if student == nil {
			continue
		}

		// Find class name
		className := ""
		for _, c := range h.Store.Classes {
			if c.ID == student.ClassID {
				className = c.Name
				break
			}
		}

		certNo := generateCertNo(ctx.SchoolID, studentID)
		verificationCode := generateVerificationCode()

		cert := &store.GeneratedCertificate{
			ID:               store.NewID("cert"),
			SchoolID:         ctx.SchoolID,
			TemplateID:       template.ID,
			StudentID:        studentID,
			StudentName:      student.FirstName + " " + student.LastName,
			ClassName:        className,
			CertificateType:  template.Type,
			CertificateNo:    certNo,
			VerificationCode: verificationCode,
			IssueDate:        issueDate,
			Status:           "issued",
			CreatedAt:        time.Now(),
		}

		h.Store.GeneratedCertificates = append(h.Store.GeneratedCertificates, cert)
		h.Save("generated_certificates", cert)
		generated = append(generated, h.certToMap(cert))
	}

	api.WriteResult(w, api.Ok(generated))
}

// ─── List Generated ──────────────────────────────────────────────────────

func (h *Handler) ListCertificates(w http.ResponseWriter, r *http.Request) {
	ctx := api.FromRequest(r)
	q := r.URL.Query()
	studentID := q.Get("student_id")
	classID := q.Get("class_id")
	certType := q.Get("type")

	h.Store.RLock()
	defer h.Store.RUnlock()

	out := make([]map[string]any, 0)
	for _, c := range h.Store.GeneratedCertificates {
		if c.SchoolID != ctx.SchoolID {
			continue
		}
		if studentID != "" && c.StudentID != studentID {
			continue
		}
		if certType != "" && c.CertificateType != certType {
			continue
		}
		if classID != "" {
			// Check student's class
			for _, s := range h.Store.Students {
				if s.ID == c.StudentID && s.ClassID != classID {
					continue
				}
			}
		}
		out = append(out, h.certToMap(c))
	}
	sort.Slice(out, func(i, j int) bool {
		return out[i]["created_at"].(time.Time).After(out[j]["created_at"].(time.Time))
	})
	api.WriteResult(w, api.Ok(out))
}

// ─── Revoke ──────────────────────────────────────────────────────────────

func (h *Handler) Revoke(w http.ResponseWriter, r *http.Request) {
	ctx := api.FromRequest(r)
	id := chi.URLParam(r, "id")

	h.Store.Lock()
	defer h.Store.Unlock()
	for _, c := range h.Store.GeneratedCertificates {
		if c.ID == id && c.SchoolID == ctx.SchoolID {
			c.Status = "revoked"
			h.Save("generated_certificates", c)
			api.WriteResult(w, api.Ok(h.certToMap(c)))
			return
		}
	}
	api.WriteResult(w, api.Fail("NOT_FOUND", "Certificate not found.", 404, nil))
}

// ─── Verify (public) ─────────────────────────────────────────────────────

func (h *Handler) Verify(w http.ResponseWriter, r *http.Request) {
	code := chi.URLParam(r, "code")

	h.Store.RLock()
	defer h.Store.RUnlock()
	for _, c := range h.Store.GeneratedCertificates {
		if c.VerificationCode == code {
			api.WriteResult(w, api.Ok(map[string]any{
				"valid":            c.Status == "issued",
				"status":           c.Status,
				"student_name":     c.StudentName,
				"class_name":       c.ClassName,
				"certificate_type": c.CertificateType,
				"certificate_no":   c.CertificateNo,
				"issue_date":       c.IssueDate,
			}))
			return
		}
	}
	api.WriteResult(w, api.Fail("NOT_FOUND", "Certificate not found or invalid code.", 404, nil))
}

// ─── Helpers ─────────────────────────────────────────────────────────────

func templateToMap(t *store.CertificateTemplate) map[string]any {
	return map[string]any{
		"_id":            t.ID,
		"school_id":      t.SchoolID,
		"name":           t.Name,
		"type":           t.Type,
		"orientation":    t.Orientation,
		"background_url": t.BackgroundURL,
		"watermark_url":  t.WatermarkURL,
		"border_style":   t.BorderStyle,
		"body_text":      t.BodyText,
		"elements":       t.Elements,
		"is_default":     t.IsDefault,
		"status":         t.Status,
		"created_at":     t.CreatedAt,
		"updated_at":     t.UpdatedAt,
	}
}

func (h *Handler) certToMap(c *store.GeneratedCertificate) map[string]any {
	metadata, bodyText := h.certificateMetadata(c)
	return map[string]any{
		"_id":               c.ID,
		"school_id":         c.SchoolID,
		"template_id":       c.TemplateID,
		"student_id":        c.StudentID,
		"student_name":      c.StudentName,
		"class_name":        c.ClassName,
		"certificate_type":  c.CertificateType,
		"certificate_no":    c.CertificateNo,
		"verification_code": c.VerificationCode,
		"issue_date":        c.IssueDate,
		"status":            c.Status,
		"metadata":          metadata,
		"body_text":         bodyText,
		"created_at":        c.CreatedAt,
	}
}

func (h *Handler) certificateMetadata(c *store.GeneratedCertificate) (map[string]string, string) {
	meta := map[string]string{
		"student_name":      c.StudentName,
		"class":             c.ClassName,
		"class_name":        c.ClassName,
		"certificate_no":    c.CertificateNo,
		"verification_code": c.VerificationCode,
		"issue_date":        c.IssueDate.Format("January 2, 2006"),
		"year":              fmt.Sprintf("%d", c.IssueDate.Year()),
	}

	var template *store.CertificateTemplate
	for _, t := range h.Store.CertificateTemplates {
		if t.ID == c.TemplateID && t.SchoolID == c.SchoolID {
			template = t
			break
		}
	}
	for _, school := range h.Store.Schools {
		if school.SchoolID == c.SchoolID {
			meta["school_name"] = school.Name
			meta["school_address"] = school.Address
			meta["school_phone"] = school.Phone
			break
		}
	}
	for _, st := range h.Store.Students {
		if st.ID != c.StudentID || st.SchoolID != c.SchoolID {
			continue
		}
		meta["student_name"] = strings.TrimSpace(st.FirstName + " " + st.LastName)
		meta["father_name"] = st.Guardian.Name
		meta["roll_no"] = st.RollNo
		meta["registration_no"] = st.AdmissionNo
		meta["admission_no"] = st.AdmissionNo
		meta["section"] = st.Section
		for _, cls := range h.Store.Classes {
			if cls.ID == st.ClassID {
				meta["class"] = cls.Name
				meta["class_name"] = cls.Name
				break
			}
		}
		break
	}
	for _, ay := range h.Store.AcademicYears {
		if ay.SchoolID == c.SchoolID && ay.IsActive {
			meta["session"] = ay.Year
			meta["academic_year"] = ay.Year
			break
		}
	}
	for _, res := range h.Store.Results {
		if res.SchoolID == c.SchoolID && res.StudentID == c.StudentID {
			meta["marks"] = fmt.Sprintf("%.0f", res.ObtainedMarks)
			meta["grade"] = "N/A"
			break
		}
	}

	body := ""
	if template != nil {
		body = template.BodyText
	}
	if strings.TrimSpace(body) == "" {
		body = "This is to certify that {{student_name}} of Class {{class}} has been a student of {{school_name}}. This certificate is issued on {{issue_date}}."
	}
	for k, v := range meta {
		body = strings.ReplaceAll(body, "{{"+k+"}}", v)
	}
	return meta, body
}

func generateCertNo(schoolID, studentID string) string {
	src := fmt.Sprintf("%s:%s:%d:%d", schoolID, studentID, time.Now().UnixNano(), rand.Int())
	h := sha1.Sum([]byte(src))
	hash := strings.ToUpper(hex.EncodeToString(h[:])[:6])
	return fmt.Sprintf("CERT-%d-%s", time.Now().Year(), hash)
}

func generateVerificationCode() string {
	b := make([]byte, 12)
	rand.Read(b)
	return strings.ToUpper(hex.EncodeToString(b)[:16])
}

func orDefault(val, def string) string {
	if val == "" {
		return def
	}
	return val
}
