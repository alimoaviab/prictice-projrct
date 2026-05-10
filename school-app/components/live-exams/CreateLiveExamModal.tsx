"use client";

import React, { useState } from "react";

interface CreateLiveExamModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  classes: any[];
  subjects: any[];
}

export const CreateLiveExamModal: React.FC<CreateLiveExamModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  classes,
  subjects,
}) => {
  const [formData, setFormData] = useState({
    title: "",
    class_id: "",
    subject_id: "",
    duration: 60,
    total_marks: 100,
    passing_marks: 40,
    start_time: "",
    end_time: "",
    randomize_questions: false,
    randomize_options: false,
  });
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch("/api/live-exams", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            ...formData,
            duration: Number(formData.duration),
            total_marks: Number(formData.total_marks),
            passing_marks: Number(formData.passing_marks),
        }),
      });
      const result = await res.json();
      if (result.ok) {
        onSuccess();
        onClose();
      } else {
        alert(`Error: ${result.error.message || "Failed to create exam"}`);
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
      <div className="w-full max-w-2xl rounded-xl bg-white p-5 shadow-xl overflow-y-auto max-h-[90vh]">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-slate-900">Schedule Live Exam</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-slate-700" htmlFor="title">Exam Title</label>
            <input
              id="title"
              type="text"
              required
              placeholder="e.g. Mid-Term Mathematics 2024"
              className="mt-1 w-full rounded-xl border border-slate-300 px-4 py-2"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-slate-700" htmlFor="class_id">Class</label>
              <select
                id="class_id"
                required
                className="mt-1 w-full rounded-xl border border-slate-300 px-4 py-2"
                value={formData.class_id}
                onChange={(e) => setFormData({ ...formData, class_id: e.target.value })}
              >
                <option value="">Select Class...</option>
                {classes.map(c => <option key={c.id || c._id} value={c.id || c._id}>{c.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700" htmlFor="subject_id">Subject</label>
              <select
                id="subject_id"
                required
                className="mt-1 w-full rounded-xl border border-slate-300 px-4 py-2"
                value={formData.subject_id}
                onChange={(e) => setFormData({ ...formData, subject_id: e.target.value })}
              >
                <option value="">Select Subject...</option>
                {subjects.map(s => <option key={s.id || s._id} value={s.id || s._id}>{s.name}</option>)}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-semibold text-slate-700" htmlFor="duration">Duration (Min)</label>
              <input
                id="duration"
                type="number"
                required
                className="mt-1 w-full rounded-xl border border-slate-300 px-4 py-2"
                value={formData.duration}
                onChange={(e) => setFormData({ ...formData, duration: Number(e.target.value) })}
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700" htmlFor="total_marks">Total Marks</label>
              <input
                id="total_marks"
                type="number"
                required
                className="mt-1 w-full rounded-xl border border-slate-300 px-4 py-2"
                value={formData.total_marks}
                onChange={(e) => setFormData({ ...formData, total_marks: Number(e.target.value) })}
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700" htmlFor="passing_marks">Passing Marks</label>
              <input
                id="passing_marks"
                type="number"
                required
                className="mt-1 w-full rounded-xl border border-slate-300 px-4 py-2"
                value={formData.passing_marks}
                onChange={(e) => setFormData({ ...formData, passing_marks: Number(e.target.value) })}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-slate-700" htmlFor="start_time">Start Time</label>
              <input
                id="start_time"
                type="datetime-local"
                required
                className="mt-1 w-full rounded-xl border border-slate-300 px-4 py-2"
                value={formData.start_time}
                onChange={(e) => setFormData({ ...formData, start_time: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700" htmlFor="end_time">End Time</label>
              <input
                id="end_time"
                type="datetime-local"
                required
                className="mt-1 w-full rounded-xl border border-slate-300 px-4 py-2"
                value={formData.end_time}
                onChange={(e) => setFormData({ ...formData, end_time: e.target.value })}
              />
            </div>
          </div>

          <div className="flex gap-6 pt-2">
            <label className="flex items-center gap-2 cursor-pointer">
                <input
                    type="checkbox"
                    className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-600"
                    checked={formData.randomize_questions}
                    onChange={(e) => setFormData({ ...formData, randomize_questions: e.target.checked })}
                />
                <span className="text-sm font-medium text-slate-700">Randomize Questions</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
                <input
                    type="checkbox"
                    className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-600"
                    checked={formData.randomize_options}
                    onChange={(e) => setFormData({ ...formData, randomize_options: e.target.checked })}
                />
                <span className="text-sm font-medium text-slate-700">Randomize Options</span>
            </label>
          </div>

          <div className="mt-8 flex justify-end gap-3 pt-4 border-t border-slate-100">
            <button type="button" onClick={onClose} className="rounded-xl px-4 py-2 font-semibold text-slate-600 hover:bg-slate-100">
              Cancel
            </button>
            <button type="submit" disabled={loading} className="rounded-xl bg-cyan-600 px-6 py-2 font-semibold text-white hover:bg-cyan-700 disabled:opacity-50 transition-colors">
              {loading ? "Scheduling..." : "Create Exam"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
