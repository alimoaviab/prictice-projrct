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
  });
  const [subjectOptions, setSubjectOptions] = useState<Array<{ label: string; value: string }>>([]);
  const [loadingSubjects, setLoadingSubjects] = useState(false);
  const selectedClass = classes.find(c => c.id === formData.classId || c._id === formData.classId);

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
    
    console.log("Submitting live class form with data:", formData);
    await onSubmit(formData);
  };

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
               <span className="material-symbols-outlined">video_camera_front</span>
            </div>
            <div>
               <h4 className="text-sm font-bold text-blue-900 normal-case tracking-tight">Live Class Session</h4>
               <p className="mt-2 text-xs text-blue-700/70 leading-relaxed font-medium">
                  A unique meeting link will be automatically generated and shared with students of the selected class once you save this session.
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
