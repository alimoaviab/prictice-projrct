package chatbot

import (
	"strings"

	"github.com/eduplexo/backend-go/internal/api"
	"github.com/eduplexo/backend-go/internal/store"
)

type chatScope struct {
	Role             string
	SchoolID         string
	UserID           string
	StudentID        string
	TeacherID        string
	AllowedClassIDs  map[string]struct{}
	AllowedStudentIDs map[string]struct{}
	AllowGlobal      bool
}

func resolveChatScope(s *store.MemStore, ctx *api.RequestContext) chatScope {
	role := strings.ToLower(strings.TrimSpace(ctx.Role))
	scope := chatScope{
		Role:             role,
		SchoolID:         ctx.SchoolID,
		UserID:           ctx.UserID,
		AllowedClassIDs:  map[string]struct{}{},
		AllowedStudentIDs: map[string]struct{}{},
		AllowGlobal:      role == "super_admin" && strings.TrimSpace(ctx.SchoolID) == "",
	}

	if scope.AllowGlobal {
		return scope
	}

	if scope.SchoolID == "" {
		return scope
	}

	if role == "admin" || role == "super_admin" {
		for _, c := range s.Classes {
			if c.SchoolID == scope.SchoolID {
				scope.AllowedClassIDs[c.ID] = struct{}{}
			}
		}
		return scope
	}

	for _, t := range s.Teachers {
		if t.SchoolID == scope.SchoolID && t.UserID == scope.UserID {
			scope.TeacherID = t.ID
			for _, classID := range t.ClassIDs {
				if classID != "" {
					scope.AllowedClassIDs[classID] = struct{}{}
				}
			}
			break
		}
	}

	for _, st := range s.Students {
		if st.SchoolID == scope.SchoolID && st.UserID == scope.UserID {
			scope.StudentID = st.ID
			scope.AllowedStudentIDs[st.ID] = struct{}{}
			if st.ClassID != "" {
				scope.AllowedClassIDs[st.ClassID] = struct{}{}
			}
			break
		}
	}

	if role == "parent" {
		for _, rel := range s.StudentParents {
			if rel.SchoolID == scope.SchoolID && rel.ParentUserID == scope.UserID {
				scope.AllowedStudentIDs[rel.StudentID] = struct{}{}
				for _, st := range s.Students {
					if st.ID == rel.StudentID && st.SchoolID == scope.SchoolID && st.ClassID != "" {
						scope.AllowedClassIDs[st.ClassID] = struct{}{}
					}
				}
			}
		}
	}

	if role != "teacher" && role != "student" && role != "parent" {
		for _, c := range s.Classes {
			if c.SchoolID == scope.SchoolID {
				scope.AllowedClassIDs[c.ID] = struct{}{}
			}
		}
	}

	return scope
}

func (s chatScope) classAllowed(classID string) bool {
	if s.AllowGlobal {
		return true
	}
	_, ok := s.AllowedClassIDs[classID]
	return ok
}

func (s chatScope) classAllowedAny(classIDs []string) bool {
	if s.AllowGlobal {
		return true
	}
	for _, classID := range classIDs {
		if s.classAllowed(classID) {
			return true
		}
	}
	return false
}

func (s chatScope) studentAllowed(studentID string) bool {
	if s.AllowGlobal {
		return true
	}
	if len(s.AllowedStudentIDs) == 0 {
		return s.Role == "admin" || s.Role == "super_admin"
	}
	_, ok := s.AllowedStudentIDs[studentID]
	return ok
}

func (s chatScope) canSeeFeeSummary() bool {
	return s.AllowGlobal || s.Role == "admin" || s.Role == "super_admin"
}
