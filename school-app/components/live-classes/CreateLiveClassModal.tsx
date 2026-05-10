"use client";

import React, { useState } from "react";

interface CreateLiveClassModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  classes: any[];
  subjects: any[];
  teachers?: any[];
  showTeacherField?: boolean;
  defaultTeacherId?: string;
}

export const CreateLiveClassModal: React.FC<CreateLiveClassModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  classes,
  subjects,
  teachers = [],
  showTeacherField = false,
  defaultTeacherId = ""
}) => {
  const [formData, setFormData] = useState({
    title: "",
    teacherId: defaultTeacherId,
    classId: "",
    subjectId: "",
    startTime: "",
    endTime: "",
  });
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (showTeacherField && !formData.teacherId) {
      alert("Please select a teacher.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/live/classes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      if (res.ok) {
        onSuccess();
        onClose();
      } else {
        const error = await res.json();
        alert(`Error: ${error.error}`);
      }
    } catch (err) {
      console.error(err);
      alert("An error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-xl bg-white p-5 shadow-xl">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-slate-900">Schedule Live Class</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-slate-700" htmlFor="title">Title</label>
            <input
              id="title"
              type="text"
              required
              className="mt-1 w-full rounded-xl border border-slate-300 px-4 py-2"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            />
          </div>

          {showTeacherField && (
            <div>
              <label className="block text-sm font-semibold text-slate-700" htmlFor="teacherId">Teacher</label>
              <select
                id="teacherId"
                required
                className="mt-1 w-full rounded-xl border border-slate-300 px-4 py-2"
                value={formData.teacherId}
                onChange={(e) => setFormData({ ...formData, teacherId: e.target.value })}
              >
                <option value="">Select...</option>
                {teachers.map((teacher) => {
                  const fullName = `${teacher.first_name || ""} ${teacher.last_name || ""}`.trim() || teacher.name || teacher.email || "Teacher";
                  return (
                    <option key={teacher._id} value={teacher._id}>
                      {fullName}
                    </option>
                  );
                })}
              </select>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-slate-700" htmlFor="classId">Class</label>
              <select
                id="classId"
                required
                className="mt-1 w-full rounded-xl border border-slate-300 px-4 py-2"
                value={formData.classId}
                onChange={(e) => setFormData({ ...formData, classId: e.target.value })}
              >
                <option value="">Select...</option>
                {classes.map(c => <option key={c.id || c._id} value={c.id || c._id}>{c.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700" htmlFor="subjectId">Subject</label>
              <select
                id="subjectId"
                required
                className="mt-1 w-full rounded-xl border border-slate-300 px-4 py-2"
                value={formData.subjectId}
                onChange={(e) => setFormData({ ...formData, subjectId: e.target.value })}
              >
                <option value="">Select...</option>
                {subjects.map(s => <option key={s.id || s._id} value={s.id || s._id}>{s.name}</option>)}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-slate-700" htmlFor="startTime">Start Time</label>
              <input
                id="startTime"
                type="datetime-local"
                required
                className="mt-1 w-full rounded-xl border border-slate-300 px-4 py-2"
                value={formData.startTime}
                onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700" htmlFor="endTime">End Time</label>
              <input
                id="endTime"
                type="datetime-local"
                required
                className="mt-1 w-full rounded-xl border border-slate-300 px-4 py-2"
                value={formData.endTime}
                onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
              />
            </div>
          </div>

          <div className="mt-8 flex justify-end gap-3">
            <button type="button" onClick={onClose} className="rounded-xl px-4 py-2 font-semibold text-slate-600 hover:bg-slate-100">
              Cancel
            </button>
            <button type="submit" disabled={loading} className="rounded-xl bg-indigo-600 px-6 py-2 font-semibold text-white hover:bg-indigo-700 disabled:opacity-50">
              {loading ? "Scheduling..." : "Schedule Class"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
