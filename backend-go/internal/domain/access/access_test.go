package access

import (
	"testing"

	"github.com/eduplexo/backend-go/internal/api"
	"github.com/eduplexo/backend-go/internal/store"
)

func TestTeacherClassIDsLocked(t *testing.T) {
	s := &store.MemStore{
		Teachers: []*store.Teacher{
			{
				ID:       "teacher_1",
				UserID:   "user_teacher_1",
				SchoolID: "school_1",
			},
		},
		Classes: []*store.Class{
			{
				ID:       "class_1",
				SchoolID: "school_1",
				Subjects: []store.ClassSubject{
					{
						Name:      "Math",
						TeacherID: "teacher_1",
					},
				},
			},
			{
				ID:       "class_2",
				SchoolID: "school_1",
				Subjects: []store.ClassSubject{
					{
						Name:      "Science",
						TeacherID: "other_teacher",
					},
				},
			},
		},
		Subjects: []*store.Subject{
			{
				ID:        "subject_global_1",
				SchoolID:  "school_1",
				ClassID:   "class_3",
				TeacherID: "teacher_1",
			},
		},
	}

	ctx := &api.RequestContext{
		Role:     "teacher",
		UserID:   "user_teacher_1",
		SchoolID: "school_1",
	}

	classIDs := TeacherClassIDsLocked(s, ctx)

	if !classIDs["class_1"] {
		t.Errorf("expected access to class_1 via class.Subjects, but got none")
	}

	if classIDs["class_2"] {
		t.Errorf("did not expect access to class_2")
	}

	if !classIDs["class_3"] {
		t.Errorf("expected access to class_3 via global store.Subjects, but got none")
	}
}
