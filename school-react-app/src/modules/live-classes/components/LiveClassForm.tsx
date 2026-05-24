import { AppIcon } from "shared/ui/AppIcon";
import React, { useEffect, useState, FormEvent } from "react";
import { Input, Select, Button } from "@/components/ui";
import { showToast } from "@/utils/toast";
import { serviceRequest } from "@/services/service-client";

interface LiveClassFormProps {
  onSubmit: (data: any) => Promise<void>;
  classes: any[];
  teachers?: any[];
  showTeacherField?: boolean;
  initialTeacherId?: string;
  loading?: boolean;
}

export function LiveClassForm({
  onSubmit,
  classes,
  teachers = [],
  showTeacherField = false,
  initialTeacherId = "",
  loading = false
}: LiveClassFormProps) {
  const [formData, setFormData] = useState({
    title: "",
    teacherId: initialTeacherId,
    classId: "",
    subjectId: "",
    startTime: "",
    endTime: "",
    audienceType: "CLASS",           // Entire Class (default) or Specific Student
    targetStudentId: "",             // For specific student mode
  });
  const [subjectOptions, setSubjectOptions] = useState<Array<{ label: string; value: string }>>([]);
  const [loadingSubjects, setLoadingSubjects] = useState(false);
  const [classStudents, setClassStudents] = useState<any[]>([]);
  const [loadingStudents, setLoadingStudents] = useState(false);
  const [studentSearchQuery, setStudentSearchQuery] = useState("");
  
  const selectedClass = classes.find(c => c.id === formData.classId || c._id === formData.classId);
  
  // Filter students by search query
  const filteredStudents = classStudents.filter(s => {
    const query = studentSearchQuery.toLowerCase();
    const name = `${s.first_name || ""} ${s.last_name || ""}`.toLowerCase();
    const email = (s.email || "").toLowerCase();
    const admissionNo = (s.admission_no || "").toLowerCase();
    return name.includes(query) || email.includes(query) || admissionNo.includes(query);
  });

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    
    // Validation
    if (!formData.title || !formData.classId || !formData.subjectId || !formData.startTime || !formData.endTime) {
      showToast("Please fill in all required fields", "error");
      return;
    }
    
    if (showTeacherField && !formData.teacherId) {
      showToast("Please select a teacher", "error");
      return;
    }
    
    // Validate audience targeting
    if (formData.audienceType === "STUDENT" && !formData.targetStudentId) {
      showToast("Please select a student", "error");
      return;
    }
    
    console.log("Submitting live class form with data:", formData);
    await onSubmit(formData);
  };

  // Load subjects for the selected class
  useEffect(() => {
    let cancelled = false;

    async function loadClassSubjects(classId: string) {
      if (!classId) {
        setSubjectOptions([]);
        return;
      }

      setLoadingSubjects(true);
      try {
        const result = await serviceRequest<any>(`/api/school/subjects/class/${classId}`);
        if (!result.ok) {
          throw new Error(result.error.message || "Failed to load class subjects");
        }
        
        const data = result.data;
        const subjectsArray = Array.isArray(data) ? data : (data as any)?.subjects ?? [];
        
        const apiSubjects = subjectsArray
          .map((subject: any) => ({
            label: subject.name || String(subject._id ?? subject.id),
            value: subject.id || subject._id || subject.name
          }))
          .filter((option: { label: string; value: string }) => Boolean(option.value));

        const classFallbackSubjects = (selectedClass?.subjects ?? [])
          .map((subject: any) => {
            if (typeof subject === "string") {
              return { label: subject, value: subject };
            }

            const value = subject.name || subject.subject || subject.id || subject._id;
            return {
              label: subject.name || String(value),
              value: String(value)
            };
          })
          .filter((option: { label: string; value: string }) => Boolean(option.value));

        const subjects = apiSubjects.length > 0 ? apiSubjects : classFallbackSubjects;

        if (!cancelled) {
          setSubjectOptions(subjects);
        }
      } catch {
        if (!cancelled) {
          setSubjectOptions([]);
        }
      } finally {
        if (!cancelled) {
          setLoadingSubjects(false);
        }
      }
    }

    void loadClassSubjects(formData.classId);

    return () => {
      cancelled = true;
    };
  }, [formData.classId, selectedClass?.subjects]);

  // Load students for the selected class
  useEffect(() => {
    let cancelled = false;

    async function loadClassStudents(classId: string) {
      if (!classId) {
        setClassStudents([]);
        return;
      }

      setLoadingStudents(true);
      try {
        const result = await serviceRequest<any>(`/api/classes/${classId}/students`);
        if (!result.ok) {
          throw new Error(result.error.message || "Failed to load class students");
        }
        
        const data = result.data;
        const studentsArray = Array.isArray(data) ? data : (data as any)?.students ?? [];

        if (!cancelled) {
          setClassStudents(studentsArray);
          // Reset student selection when class changes
          setFormData(prev => ({ ...prev, targetStudentId: "" }));
          setStudentSearchQuery("");
        }
      } catch {
        if (!cancelled) {
          setClassStudents([]);
        }
      } finally {
        if (!cancelled) {
          setLoadingStudents(false);
        }
      }
    }

    void loadClassStudents(formData.classId);

    return () => {
      cancelled = true;
    };
  }, [formData.classId]);

  const classOptions = [
    { label: "Select Class", value: "" },
    ...classes.map(c => ({ label: c.name || c.label, value: c.id || c._id }))
  ];

  const teacherOptions = [
    { label: "Select Teacher", value: "" },
    ...teachers.map(t => ({ 
      label: `${t.first_name || ""} ${t.last_name || ""}`.trim() || t.name || t.email || "Teacher", 
      value: t.id || t._id 
    }))
  ];

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-6">
          <Input
            label="Session Title"
            placeholder="e.g. Weekly Mathematics Review"
            required
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            className="h-14 text-base rounded-2xl"
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <Select
              label="Class Section"
              required
              value={formData.classId}
              onChange={(e) => setFormData({ ...formData, classId: e.target.value, subjectId: "" })}
              options={classOptions}
              className="h-14 text-base rounded-2xl"
            />
            <Select
              label="Subject"
              required
              value={formData.subjectId}
              onChange={(e) => setFormData({ ...formData, subjectId: e.target.value })}
              options={[
                { label: loadingSubjects ? "Loading subjects..." : "Select Subject", value: "" },
                ...subjectOptions
              ]}
              disabled={!formData.classId || loadingSubjects}
              className="h-14 text-base rounded-2xl"
            />
          </div>

          {showTeacherField && (
            <Select
              label="Assign Teacher"
              required
              value={formData.teacherId}
              onChange={(e) => setFormData({ ...formData, teacherId: e.target.value })}
              options={teacherOptions}
              className="h-14 text-base rounded-2xl"
            />
          )}

          {/* Session Audience Section */}
          <div className="bg-slate-50 rounded-2xl p-5 border border-slate-100 space-y-4">
            <div>
              <label className="text-xs font-bold text-slate-900 uppercase tracking-wider">Session Audience</label>
              <p className="text-xs text-slate-500 mt-1">Who can see this session?</p>
            </div>

            <div className="space-y-3">
              {/* Entire Class Option */}
              <label className="flex items-center gap-3 cursor-pointer p-3 rounded-xl hover:bg-white transition-colors">
                <input
                  type="radio"
                  name="audience"
                  value="CLASS"
                  checked={formData.audienceType === "CLASS"}
                  onChange={(e) => {
                    setFormData({ ...formData, audienceType: e.target.value, targetStudentId: "" });
                    setStudentSearchQuery("");
                  }}
                  className="w-4 h-4 accent-indigo-600"
                />
                <div className="flex-1">
                  <div className="text-xs font-bold text-slate-900">Entire Class</div>
                  <div className="text-[11px] text-slate-500">All students in {selectedClass?.name || "selected class"}</div>
                </div>
              </label>

              {/* Specific Student Option */}
              <label className="flex items-center gap-3 cursor-pointer p-3 rounded-xl hover:bg-white transition-colors">
                <input
                  type="radio"
                  name="audience"
                  value="STUDENT"
                  checked={formData.audienceType === "STUDENT"}
                  onChange={(e) => setFormData({ ...formData, audienceType: e.target.value })}
                  className="w-4 h-4 accent-indigo-600"
                />
                <div className="flex-1">
                  <div className="text-xs font-bold text-slate-900">Specific Student</div>
                  <div className="text-[11px] text-slate-500">Only one student from the class</div>
                </div>
              </label>
            </div>

            {/* Specific Student Dropdown (appears when STUDENT mode selected) */}
            {formData.audienceType === "STUDENT" && (
              <div className="space-y-3 pt-2 border-t border-slate-200">
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Search student..."
                    value={studentSearchQuery}
                    onChange={(e) => setStudentSearchQuery(e.target.value)}
                    className="w-full h-10 px-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
                  />
                </div>

                {loadingStudents ? (
                  <div className="text-center py-3 text-sm text-slate-500">Loading students...</div>
                ) : classStudents.length === 0 ? (
                  <div className="text-center py-3 text-sm text-slate-500">No students in this class</div>
                ) : (
                  <div className="max-h-48 overflow-y-auto border border-slate-200 rounded-lg">
                    {filteredStudents.length === 0 ? (
                      <div className="p-3 text-center text-sm text-slate-500">No matching students</div>
                    ) : (
                      filteredStudents.map((student) => (
                        <button
                          key={student.id || student._id}
                          type="button"
                          onClick={() => {
                            setFormData({ ...formData, targetStudentId: student.id || student._id });
                            setStudentSearchQuery("");
                          }}
                          className={`w-full text-left px-4 py-2 text-sm border-b border-slate-100 last:border-b-0 hover:bg-indigo-50 transition-colors ${
                            formData.targetStudentId === (student.id || student._id) ? "bg-indigo-50 font-medium" : ""
                          }`}
                        >
                          <div className="font-medium text-slate-900">
                            {student.first_name} {student.last_name}
                          </div>
                          <div className="text-xs text-slate-500">{student.admission_no || student.email || "N/A"}</div>
                        </button>
                      ))
                    )}
                  </div>
                )}

                {formData.targetStudentId && (
                  <div className="p-3 bg-indigo-50 rounded-lg border border-indigo-100">
                    <div className="text-xs font-bold text-indigo-900">
                      Selected: {classStudents.find(s => (s.id || s._id) === formData.targetStudentId)?.first_name}{" "}
                      {classStudents.find(s => (s.id || s._id) === formData.targetStudentId)?.last_name}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <Input
              label="Start Date & Time"
              type="datetime-local"
              required
              value={formData.startTime}
              onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
              className="h-14 text-base rounded-2xl px-4"
            />
            <Input
              label="End Date & Time"
              type="datetime-local"
              required
              value={formData.endTime}
              onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
              className="h-14 text-base rounded-2xl px-4"
            />
          </div>

          <div className="bg-blue-50 rounded-3xl p-6 border border-blue-100 flex items-start gap-4 h-[calc(100%-80px)]">
            <div className="h-10 w-10 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center shrink-0">
               <AppIcon name="Video" />
            </div>
            <div>
               <h4 className="text-sm font-bold text-blue-900 normal-case tracking-tight">Live Class Session</h4>
               <p className="mt-2 text-xs text-blue-700/70 leading-relaxed font-medium">
                  A unique meeting link will be automatically generated. {formData.audienceType === "CLASS" ? "All students in the selected class" : "Only the selected student"} will see this session in their portal.
               </p>
            </div>
          </div>
        </div>
      </div>

      <div className="flex justify-end gap-4 pt-6 border-t border-slate-100">
        <Button
          type="button"
          variant="secondary"
          onClick={() => window.history.back()}
          className="h-14 px-8 rounded-2xl text-[11px] font-bold normal-case "
        >
          Cancel
        </Button>
        <Button
          type="submit"
          disabled={loading}
          className="h-14 px-12 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl shadow-xl shadow-indigo-600/20 text-[11px] font-bold normal-case  active:scale-95 transition-all"
        >
          {loading ? "Scheduling..." : "Schedule Live Session"}
        </Button>
      </div>
    </form>
  );
}
