"use client";

import { useState, useMemo } from "react";
import { ClassFormInput, ClassRow, GradeThreshold, ClassSubject } from "../types/class.types";
import { Badge } from "../../../components/ui";

interface ClassFormWizardProps {
  initialData?: ClassRow;
  onSubmit: (data: ClassFormInput) => Promise<boolean>;
  onCancel: () => void;
  onAddSubject?: (name: string, code: string) => Promise<void>;
  onDeleteSubject?: (id: string) => Promise<void>;
  onUpdateSubject?: (id: string, name: string) => Promise<void>;
  academicYearOptions: { id: string; label: string }[];
  subjectOptions: { id: string; label: string }[];
  isSaving?: boolean;
}

export function ClassFormWizard({
  initialData,
  onSubmit,
  onCancel,
  onAddSubject,
  onDeleteSubject,
  onUpdateSubject,
  academicYearOptions,
  subjectOptions,
  isSaving = false,
}: ClassFormWizardProps) {
  const [step, setStep] = useState(1);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newSubject, setNewSubject] = useState({ name: "", code: "" });
  const [isAddingSubject, setIsAddingSubject] = useState(false);
  
  const [editingSubjectId, setEditingSubjectId] = useState<string | null>(null);
  const [editingSubjectName, setEditingSubjectName] = useState("");
  const [isUpdatingSubject, setIsUpdatingSubject] = useState(false);
  
  const [formData, setFormData] = useState<Partial<ClassFormInput>>({
    name: initialData?.name || "",
    academic_year_id: initialData?.academic_year_id || "",
    section: initialData?.section || "",
    code: initialData?.code || "",
    display_order: initialData?.display_order || 1,
    subject_ids: initialData?.subject_ids || [],
    subjects: initialData?.subjects || [],
    capacity: initialData?.capacity || 40,
    passing_percentage: initialData?.passing_percentage || 33,
    room_number: initialData?.room_number || "",
    description: initialData?.description || "",
    status: (initialData?.status as any) || "active",
    grade_thresholds: initialData?.grade_thresholds || [
      { grade: "A+", min_score: 90, max_score: 100, description: "Outstanding Performance" },
      { grade: "A", min_score: 80, max_score: 89, description: "Excellent" },
      { grade: "B", min_score: 70, max_score: 79, description: "Very Good" },
      { grade: "C", min_score: 60, max_score: 69, description: "Good" },
      { grade: "D", min_score: 50, max_score: 59, description: "Satisfactory" },
      { grade: "E", min_score: 33, max_score: 49, description: "Needs Improvement" },
      { grade: "F", min_score: 0, max_score: 32, description: "Fail" },
    ],
  });

  const steps = [
    { id: 1, title: "Identity", subtitle: "Institutional Setup", icon: "badge" },
    { id: 2, title: "Subjects", subtitle: "Curriculum Mapping", icon: "menu_book" },
    { id: 3, title: "Evaluation", subtitle: "Marks & Grading", icon: "analytics" },
  ];

  const updateField = (field: keyof ClassFormInput, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const updateGradeThreshold = (index: number, field: keyof GradeThreshold, value: any) => {
    const next = [...(formData.grade_thresholds || [])];
    next[index] = { ...next[index], [field]: value };
    updateField("grade_thresholds", next);
  };

  const updateSubjectMarks = (id: string, field: keyof ClassSubject, value: any) => {
    const currentSubjects = [...(formData.subjects || [])];
    const index = currentSubjects.findIndex(s => (s as any)._id === id || s.name === id);
    if (index !== -1) {
      currentSubjects[index] = { ...currentSubjects[index], [field]: value };
      updateField("subjects", currentSubjects);
    } else {
      const subjectDetail = subjectOptions.find(o => o.id === id);
      if (subjectDetail) {
        currentSubjects.push({ 
          name: subjectDetail.label, 
          total_marks: 100, 
          passing_marks: 33,
          [field]: value 
        });
        updateField("subjects", currentSubjects);
      }
    }
  };

  const handleNext = () => {
    if (step < 3) setStep(step + 1);
  };

  const handleBack = () => {
    if (step > 1) setStep(step - 1);
  };

  const handleSubmit = () => {
    onSubmit(formData as ClassFormInput);
  };

  const handleQuickAddSubject = async () => {
    if (!newSubject.name.trim() || !onAddSubject) return;
    setIsAddingSubject(true);
    try {
      const code = newSubject.code.trim() || newSubject.name.substring(0, 3).toUpperCase();
      await onAddSubject(newSubject.name.trim(), code);
      setNewSubject({ name: "", code: "" });
      setShowAddModal(false);
    } finally {
      setIsAddingSubject(false);
    }
  };

  const handleInitializeDefaults = async () => {
    if (!onAddSubject) return;
    const defaults = ["English", "Urdu", "Islamiyat", "Pak Study", "Computer", "Math", "Chemistry", "Physics"];
    setIsAddingSubject(true);
    try {
      for (const name of defaults) {
        await onAddSubject(name, name.substring(0, 3).toUpperCase());
      }
    } finally {
      setIsAddingSubject(false);
    }
  };

  const handleUpdateSubject = async () => {
    if (!editingSubjectId || !editingSubjectName.trim() || !onUpdateSubject) return;
    setIsUpdatingSubject(true);
    try {
      await onUpdateSubject(editingSubjectId, editingSubjectName.trim());
      setEditingSubjectId(null);
    } finally {
      setIsUpdatingSubject(false);
    }
  };

  const handleDeleteSubject = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!onDeleteSubject) return;
    if (confirm("Are you sure you want to remove this subject from the institutional curriculum?")) {
      await onDeleteSubject(id);
    }
  };

  const mappedSubjects = useMemo(() => {
    return (formData.subject_ids || []).map(id => {
      const opt = subjectOptions.find(o => o.id === id);
      const detail = (formData.subjects || []).find((s: any) => s._id === id || s.name === opt?.label);
      return {
        id,
        name: opt?.label || "Unknown",
        total_marks: detail?.total_marks || 100,
        passing_marks: detail?.passing_marks || 33
      };
    });
  }, [formData.subject_ids, formData.subjects, subjectOptions]);

  const isStepValid = useMemo(() => {
    if (step === 1) return !!formData.name && !!formData.academic_year_id;
    if (step === 2) return (formData.subject_ids || []).length > 0;
    if (step === 3) return true;
    return true;
  }, [step, formData.name, formData.academic_year_id, formData.subject_ids]);

  return (
    <div className="flex flex-col lg:flex-row gap-8 items-start relative">
      {/* 70% Form Area */}
      <div className="w-full lg:w-[70%] space-y-8">
        {/* Step Indicator */}
        <div className="flex items-center justify-between mb-8 px-4">
          {steps.map((s, i) => (
            <div key={s.id} className="flex items-center flex-1 last:flex-none">
              <div className="flex flex-col items-center gap-2 relative">
                <div 
                  className={`h-10 w-10 rounded-xl flex items-center justify-center transition-all duration-500 border-2 ${
                    step >= s.id 
                    ? "bg-blue-600 border-blue-600 text-white shadow-lg shadow-blue-600/20" 
                    : "bg-white border-slate-200 text-slate-400"
                  }`}
                >
                  <span className="material-symbols-outlined font-bold text-xl">{s.icon}</span>
                </div>
                <div className="text-center absolute -bottom-10 whitespace-nowrap">
                  <p className={`text-[10px] font-bold uppercase tracking-wider ${step === s.id ? "text-blue-600" : "text-slate-400"}`}>{s.title}</p>
                </div>
              </div>
              {i < steps.length - 1 && (
                <div className={`flex-1 h-[2px] mx-4 rounded-full transition-all duration-1000 ${step > s.id ? "bg-blue-600" : "bg-slate-100"}`} />
              )}
            </div>
          ))}
        </div>

        {/* Content Section */}
        <div className="premium-card bg-white p-8 border-slate-200/60 shadow-xl shadow-slate-200/40 rounded-3xl mt-12">
          {step === 1 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-slate-400 uppercase px-1">Class Name <span className="text-red-500">*</span></label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => updateField("name", e.target.value)}
                    placeholder="e.g. Grade 10-A"
                    className="w-full h-12 rounded-xl border border-slate-200 px-4 text-sm font-bold text-slate-900 focus:ring-4 focus:ring-blue-600/5 focus:border-blue-600 outline-none transition-all placeholder:text-slate-300"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-slate-400 uppercase px-1">Academic Session <span className="text-red-500">*</span></label>
                  <select
                    value={formData.academic_year_id}
                    onChange={(e) => updateField("academic_year_id", e.target.value)}
                    className="w-full h-12 rounded-xl border border-slate-200 px-4 text-sm font-bold text-slate-900 focus:ring-4 focus:ring-blue-600/5 focus:border-blue-600 outline-none transition-all"
                  >
                    <option value="">Select Session</option>
                    {academicYearOptions.map(opt => <option key={opt.id} value={opt.id}>{opt.label}</option>)}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-slate-400 uppercase px-1">Section (Optional)</label>
                  <input
                    type="text"
                    value={formData.section}
                    onChange={(e) => updateField("section", e.target.value)}
                    placeholder="A, B, C..."
                    className="w-full h-12 rounded-xl border border-slate-200 px-4 text-sm font-bold text-slate-900 focus:ring-4 focus:ring-blue-600/5 focus:border-blue-600 outline-none transition-all"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-slate-400 uppercase px-1">Unit Code</label>
                  <input
                    type="text"
                    value={formData.code}
                    onChange={(e) => updateField("code", e.target.value)}
                    placeholder="G10A"
                    className="w-full h-12 rounded-xl border border-slate-200 px-4 text-sm font-bold text-slate-900 focus:ring-4 focus:ring-blue-600/5 focus:border-blue-600 outline-none transition-all"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-slate-400 uppercase px-1">Sequence Order</label>
                  <input
                    type="number"
                    value={formData.display_order}
                    onChange={(e) => updateField("display_order", parseInt(e.target.value))}
                    className="w-full h-12 rounded-xl border border-slate-200 px-4 text-sm font-bold text-slate-900 focus:ring-4 focus:ring-blue-600/5 focus:border-blue-600 outline-none transition-all"
                  />
                </div>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="space-y-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 px-1">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <label className="text-[10px] font-bold text-slate-400 uppercase">Curriculum Mapping <span className="text-red-500">*</span></label>
                      <Badge variant="secondary" className="bg-blue-50 text-blue-600 border-blue-100 text-[8px] font-bold uppercase tracking-wider">Institutional Syllabus</Badge>
                    </div>
                    <p className="text-[11px] text-slate-400 font-medium leading-tight">Map the specific academic subjects required for this class unit.</p>
                  </div>
                  
                  {onAddSubject && (
                    <button
                      type="button"
                      onClick={() => setShowAddModal(true)}
                      className="h-10 px-6 rounded-xl bg-blue-600 text-white text-[10px] font-bold uppercase tracking-wider hover:bg-blue-700 transition-all shadow-lg shadow-blue-600/20 active:scale-95 flex items-center justify-center gap-2"
                    >
                      <span className="material-symbols-outlined text-base font-bold">add</span>
                      Direct Subject Registration
                    </button>
                  )}
                </div>

                {subjectOptions.length === 0 ? (
                  <div className="py-12 flex flex-col items-center text-center border-2 border-dashed border-slate-100 rounded-2xl bg-slate-50/30">
                    <div className="h-12 w-12 rounded-xl bg-white border border-slate-100 flex items-center justify-center text-slate-300 mb-4 shadow-sm">
                      <span className="material-symbols-outlined text-2xl font-bold">menu_book</span>
                    </div>
                    <h4 className="text-xs font-bold text-slate-900 mb-1">Institutional Syllabus is Empty</h4>
                    <p className="text-[10px] text-slate-400 max-w-[200px] font-medium leading-relaxed mb-6">Your institutional curriculum hasn't been initialized yet.</p>
                    <button
                      type="button"
                      onClick={handleInitializeDefaults}
                      disabled={isAddingSubject}
                      className="h-10 px-6 rounded-xl bg-blue-600 text-white text-[10px] font-bold uppercase tracking-widest hover:bg-blue-700 transition-all shadow-lg shadow-blue-600/20 active:scale-95 disabled:opacity-50"
                    >
                      Initialize 8 Default Subjects
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 max-h-[400px] overflow-y-auto p-1 custom-scrollbar">
                    {subjectOptions.map(subject => {
                      const isSelected = (formData.subject_ids || []).includes(subject.id);
                      const isEditing = editingSubjectId === subject.id;
                      
                      return (
                        <div
                          key={subject.id}
                          onClick={() => {
                            if (isEditing) return;
                            const current = [...(formData.subject_ids || [])];
                            if (isSelected) updateField("subject_ids", current.filter(id => id !== subject.id));
                            else updateField("subject_ids", [...current, subject.id]);
                          }}
                          className={`group p-3 rounded-xl border transition-all relative overflow-hidden cursor-pointer min-h-[54px] flex items-center ${
                            isSelected 
                            ? "bg-blue-600 border-blue-600 shadow-lg shadow-blue-600/10" 
                            : "bg-white border-slate-100 hover:border-blue-200 hover:bg-blue-50/30"
                          }`}
                        >
                          {isEditing ? (
                            <div className="flex-1 flex items-center gap-1" onClick={e => e.stopPropagation()}>
                              <input
                                autoFocus
                                value={editingSubjectName}
                                onChange={e => setEditingSubjectName(e.target.value)}
                                className="w-full bg-transparent border-b border-white text-[10px] font-bold text-white outline-none"
                              />
                              <button onClick={handleUpdateSubject} disabled={isUpdatingSubject} className="text-white hover:scale-110">
                                <span className="material-symbols-outlined text-sm font-bold">check</span>
                              </button>
                              <button onClick={() => setEditingSubjectId(null)} className="text-white/70 hover:scale-110">
                                <span className="material-symbols-outlined text-sm font-bold">close</span>
                              </button>
                            </div>
                          ) : (
                            <p className={`text-[10px] font-bold truncate flex-1 pr-12 ${isSelected ? "text-white" : "text-slate-600"}`}>
                              {subject.label}
                            </p>
                          )}

                          {!isEditing && (
                            <div className={`absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1 transition-all ${isSelected ? "opacity-100" : "opacity-0 group-hover:opacity-100"}`}>
                              <button 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setEditingSubjectId(subject.id);
                                  setEditingSubjectName(subject.label);
                                }}
                                className={`h-6 w-6 rounded-md flex items-center justify-center transition-colors ${isSelected ? "bg-white/10 hover:bg-white/20 text-white" : "bg-blue-50 hover:bg-blue-100 text-blue-600"}`}
                                title="Edit Name"
                              >
                                <span className="material-symbols-outlined text-[14px] font-bold">edit</span>
                              </button>
                              <button 
                                onClick={(e) => handleDeleteSubject(subject.id, e)}
                                className={`h-6 w-6 rounded-md flex items-center justify-center transition-colors ${isSelected ? "bg-white/10 hover:bg-white/20 text-white" : "bg-red-50 hover:bg-red-100 text-red-500"}`}
                                title="Remove Curriculum"
                              >
                                <span className="material-symbols-outlined text-[14px] font-bold">delete</span>
                              </button>
                            </div>
                          )}

                          {isSelected && !isEditing && (
                            <div className="absolute top-0 right-0 h-3 w-3 bg-white flex items-center justify-center text-blue-600">
                              <span className="material-symbols-outlined text-[8px] font-bold">check</span>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="space-y-6">
                <div className="flex items-center justify-between px-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase">Academic Evaluation</label>
                  <Badge variant="secondary" className="text-[8px] font-bold uppercase">Mapped Subjects</Badge>
                </div>
                
                <div className="grid grid-cols-1 gap-3">
                  {mappedSubjects.map(subject => (
                    <div key={subject.id} className="flex flex-col md:flex-row md:items-center justify-between p-4 rounded-2xl bg-slate-50 border border-slate-100 gap-4 group hover:border-blue-200 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-lg bg-white border border-slate-100 flex items-center justify-center text-blue-600 shadow-sm group-hover:bg-blue-600 group-hover:text-white transition-all">
                          <span className="material-symbols-outlined text-sm font-bold">menu_book</span>
                        </div>
                        <h4 className="text-[11px] font-bold text-slate-700 uppercase tracking-tight">{subject.name}</h4>
                      </div>
                      
                      <div className="flex items-center gap-6">
                        <div className="space-y-1">
                          <label className="text-[8px] font-bold text-slate-400 uppercase block">Total Marks</label>
                          <input
                            type="number"
                            value={subject.total_marks}
                            onChange={(e) => updateSubjectMarks(subject.id, "total_marks", parseInt(e.target.value))}
                            className="w-20 h-8 rounded-lg bg-white border border-slate-100 px-2 text-[10px] font-bold text-slate-900 focus:border-blue-500 outline-none shadow-sm"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[8px] font-bold text-slate-400 uppercase block">Passing Marks</label>
                          <input
                            type="number"
                            value={subject.passing_marks}
                            onChange={(e) => updateSubjectMarks(subject.id, "passing_marks", parseInt(e.target.value))}
                            className="w-20 h-8 rounded-lg bg-white border border-slate-100 px-2 text-[10px] font-bold text-slate-900 focus:border-blue-500 outline-none shadow-sm"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-4 pt-6 border-t border-slate-50">
                 <div className="flex items-center justify-between px-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase">Institutional Grade Thresholds</label>
                  <Badge variant="secondary" className="text-[8px] font-bold uppercase">System Policy</Badge>
                </div>
                <div className="overflow-hidden rounded-2xl border border-slate-100 shadow-sm">
                  <table className="w-full text-left border-collapse">
                    <thead className="bg-slate-50 border-b border-slate-100">
                      <tr>
                        <th className="px-4 py-2 text-[9px] font-bold text-slate-400 uppercase tracking-widest">Grade</th>
                        <th className="px-4 py-2 text-[9px] font-bold text-slate-400 uppercase tracking-widest">Min %</th>
                        <th className="px-4 py-2 text-[9px] font-bold text-slate-400 uppercase tracking-widest">Max %</th>
                        <th className="px-4 py-2 text-[9px] font-bold text-slate-400 uppercase tracking-widest">Annotation</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50 bg-white">
                      {(formData.grade_thresholds || []).map((gt, i) => (
                        <tr key={gt.grade}>
                          <td className="px-4 py-2 text-[10px] font-bold text-slate-900">{gt.grade}</td>
                          <td className="px-4 py-2">
                            <input
                              type="number"
                              value={gt.min_score}
                              onChange={(e) => updateGradeThreshold(i, "min_score", parseInt(e.target.value))}
                              className="w-16 h-8 rounded-lg border border-slate-100 px-2 text-[10px] font-bold focus:border-blue-500 outline-none"
                            />
                          </td>
                          <td className="px-4 py-2">
                            <input
                              type="number"
                              value={gt.max_score}
                              onChange={(e) => updateGradeThreshold(i, "max_score", parseInt(e.target.value))}
                              className="w-16 h-8 rounded-lg border border-slate-100 px-2 text-[10px] font-bold focus:border-blue-500 outline-none"
                            />
                          </td>
                          <td className="px-4 py-2">
                            <input
                              type="text"
                              value={gt.description}
                              onChange={(e) => updateGradeThreshold(i, "description", e.target.value)}
                              className="w-full h-8 rounded-lg border border-slate-100 px-2 text-[9px] font-medium focus:border-blue-500 outline-none"
                            />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-slate-400 uppercase px-1">Unit Capacity</label>
                  <div className="relative">
                    <input
                      type="number"
                      value={formData.capacity}
                      onChange={(e) => updateField("capacity", parseInt(e.target.value))}
                      className="w-full h-12 rounded-xl border border-slate-200 pl-4 pr-12 text-sm font-bold text-slate-900 focus:ring-4 focus:ring-blue-600/5 focus:border-blue-600 outline-none transition-all"
                    />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[9px] font-bold text-slate-400 uppercase">Pax</span>
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-slate-400 uppercase px-1">Passing Threshold</label>
                  <div className="relative">
                    <input
                      type="number"
                      value={formData.passing_percentage}
                      onChange={(e) => updateField("passing_percentage", parseInt(e.target.value))}
                      className="w-full h-12 rounded-xl border border-slate-200 pl-4 pr-12 text-sm font-bold text-slate-900 focus:ring-4 focus:ring-blue-600/5 focus:border-blue-600 outline-none transition-all"
                    />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-bold text-slate-400">%</span>
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-slate-400 uppercase px-1">Room Allocation</label>
                  <input
                    type="text"
                    value={formData.room_number}
                    onChange={(e) => updateField("room_number", e.target.value)}
                    placeholder="Room 102"
                    className="w-full h-12 rounded-xl border border-slate-200 px-4 text-sm font-bold text-slate-900 focus:ring-4 focus:ring-blue-600/5 focus:border-blue-600 outline-none transition-all"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-bold text-slate-400 uppercase px-1">Operational Description</label>
                <textarea
                  rows={3}
                  value={formData.description}
                  onChange={(e) => updateField("description", e.target.value)}
                  placeholder="Notes about infrastructure, pedagogical goals, or specific unit requirements..."
                  className="w-full rounded-2xl border border-slate-200 p-4 text-sm font-bold text-slate-900 focus:ring-4 focus:ring-blue-600/5 focus:border-blue-600 outline-none transition-all placeholder:text-slate-300 resize-none"
                />
              </div>
            </div>
          )}

          {/* Action Footer */}
          <div className="mt-12 flex items-center justify-between pt-6 border-t border-slate-100">
            <button
              type="button"
              onClick={step === 1 ? onCancel : handleBack}
              className="h-11 px-6 rounded-xl border border-slate-200 text-[10px] font-bold uppercase tracking-wider text-slate-500 hover:bg-slate-50 transition-all active:scale-95"
            >
              {step === 1 ? "Discard Changes" : "Previous Stage"}
            </button>
            <div className="flex items-center gap-3">
              {step < 3 ? (
                <button
                  type="button"
                  disabled={!isStepValid}
                  onClick={handleNext}
                  className="h-11 px-8 rounded-xl bg-blue-600 text-white text-[10px] font-bold uppercase tracking-wider hover:bg-blue-700 transition-all shadow-lg shadow-blue-600/20 active:scale-95 disabled:opacity-40"
                >
                  Continue to Stage 3
                </button>
              ) : (
                <button
                  type="button"
                  disabled={isSaving}
                  onClick={handleSubmit}
                  className="h-11 px-8 rounded-xl bg-blue-600 text-white text-[10px] font-bold uppercase tracking-wider hover:bg-blue-700 transition-all shadow-lg shadow-blue-600/20 active:scale-95 disabled:opacity-50"
                >
                  {isSaving ? "Finalizing Node..." : initialData ? "Synchronize Unit" : "Initialize Class"}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 30% Sidebar Area */}
      <div className="w-full lg:w-[30%] space-y-6">
        <div className="premium-card bg-slate-900 p-6 border-slate-800 shadow-2xl rounded-3xl sticky top-24">
          <div className="flex items-center gap-3 mb-6">
            <div className="h-10 w-10 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-lg shadow-blue-600/20">
              <span className="material-symbols-outlined font-bold">info</span>
            </div>
            <div>
              <p className="text-[9px] font-bold text-blue-400 uppercase tracking-widest leading-none mb-1">Contextual Guide</p>
              <h3 className="text-sm font-bold text-white tracking-tight">Deployment Strategy</h3>
            </div>
          </div>

          <div className="space-y-6">
            <div className="space-y-3">
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider px-1">Phase Instructions</p>
              <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-2">
                <p className="text-[11px] font-bold text-white leading-relaxed">
                  {step === 1 ? "Identity Definition" : step === 2 ? "Curriculum Mapping" : "Evaluation Engine"}
                </p>
                <p className="text-[10px] text-slate-400 leading-relaxed font-medium">
                  {step === 1 
                    ? "Assign a unique identity to this academic unit. Ensure the name reflects the grade and section clearly for report generation."
                    : step === 2
                    ? "Define the subjects covered in this unit cycle. This mapping determines which results and attendance logs can be generated."
                    : "Finalize the grading thresholds and subject marks. These rules will automate grade calculation institutional-wide."
                  }
                </p>
              </div>
            </div>

            <div className="space-y-3">
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider px-1">Live Manifest</p>
              <div className="space-y-2">
                {[
                  { label: "Unit", value: formData.name || "Undefined", icon: "door_front" },
                  { label: "Session", value: academicYearOptions.find(o => o.id === formData.academic_year_id)?.label || "Not Mapped", icon: "calendar_today" },
                  { label: "Subjects", value: `${(formData.subject_ids || []).length} Mapped`, icon: "menu_book" },
                  { label: "Grades", value: `${(formData.grade_thresholds || []).length} Levels`, icon: "analytics" },
                ].map((item, i) => (
                  <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-white/5 hover:bg-white/[0.08] transition-colors group">
                    <div className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-slate-500 text-base group-hover:text-blue-400 transition-colors">{item.icon}</span>
                      <span className="text-[10px] font-bold text-slate-400">{item.label}</span>
                    </div>
                    <span className="text-[10px] font-bold text-white">{item.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Add Subject Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-950/40 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl border border-slate-200 p-8 space-y-6 scale-in-center animate-in zoom-in-95 duration-300">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                  <span className="material-symbols-outlined font-bold">add_box</span>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-blue-600 uppercase tracking-wider leading-none mb-1">New Subject</p>
                  <h3 className="text-lg font-black text-slate-900">Syllabus Registration</h3>
                </div>
              </div>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-slate-600">
                <span className="material-symbols-outlined font-bold">close</span>
              </button>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-slate-400 uppercase px-1">Subject Name</label>
                <input
                  type="text"
                  value={newSubject.name}
                  onChange={(e) => setNewSubject({ ...newSubject, name: e.target.value })}
                  placeholder="e.g. Physics"
                  className="w-full h-12 rounded-xl border border-slate-200 px-4 text-sm font-bold text-slate-900 focus:ring-4 focus:ring-blue-600/5 focus:border-blue-600 outline-none transition-all placeholder:text-slate-300"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-slate-400 uppercase px-1">Subject Code</label>
                <input
                  type="text"
                  value={newSubject.code}
                  onChange={(e) => setNewSubject({ ...newSubject, code: e.target.value })}
                  placeholder="PHY101"
                  className="w-full h-12 rounded-xl border border-slate-200 px-4 text-sm font-bold text-slate-900 focus:ring-4 focus:ring-blue-600/5 focus:border-blue-600 outline-none transition-all placeholder:text-slate-300"
                />
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="flex-1 h-12 rounded-xl border border-slate-200 text-[10px] font-bold uppercase tracking-wider text-slate-500 hover:bg-slate-50 transition-all"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleQuickAddSubject}
                disabled={!newSubject.name.trim() || isAddingSubject}
                className="flex-1 h-12 rounded-xl bg-blue-600 text-white text-[10px] font-bold uppercase tracking-wider hover:bg-blue-700 transition-all shadow-lg shadow-blue-600/20 active:scale-95 disabled:opacity-50"
              >
                {isAddingSubject ? "Registering..." : "Confirm Registration"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
