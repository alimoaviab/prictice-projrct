"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { SchoolShell } from "../../../../../layouts/SchoolShell";

export default function ExamQuestionsPage() {
  const { id } = useParams();
  const router = useRouter();
  const [exam, setExam] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [questions, setQuestions] = useState<any[]>([]);

  useEffect(() => {
    fetch(`/api/live-exams/${id}`)
      .then(res => res.json())
      .then(json => {
        if (json.ok) {
          setExam(json.data);
          setQuestions(json.data.questions || []);
        }
        setLoading(false);
      });
  }, [id]);

  const addQuestion = () => {
    setQuestions([...questions, {
      question_text: "",
      options: ["", "", "", ""],
      correct_option_index: 0,
      marks: 5
    }]);
  };

  const updateQuestion = (index: number, field: string, value: any) => {
    const newQuestions = [...questions];
    newQuestions[index][field] = value;
    setQuestions(newQuestions);
  };

  const updateOption = (qIndex: number, oIndex: number, value: string) => {
    const newQuestions = [...questions];
    newQuestions[qIndex].options[oIndex] = value;
    setQuestions(newQuestions);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch(`/api/live-exams/${id}/questions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ questions }),
      });
      if (res.ok) {
        alert("Questions saved successfully");
        router.push("/teacher/live-exam");
      }
    } catch (error) {
      console.error(error);
      alert("Failed to save questions");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <SchoolShell title="Exam Questions" eyebrow="Teacher">Loading...</SchoolShell>;
  if (!exam) return <SchoolShell title="Exam Questions" eyebrow="Teacher">Exam not found</SchoolShell>;

  return (
    <SchoolShell title={exam.title} eyebrow="Question Management">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
            <button onClick={() => router.back()} className="flex items-center gap-2 text-slate-500 hover:text-slate-800 transition-colors">
                <span className="material-symbols-outlined">arrow_back</span>
                Back
            </button>
            <div className="flex gap-3">
                <button 
                    onClick={addQuestion}
                    className="flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
                >
                    <span className="material-symbols-outlined text-[20px]">add</span>
                    Add Question
                </button>
                <button 
                    onClick={handleSave}
                    disabled={saving}
                    className="flex items-center gap-2 rounded-xl bg-slate-900 px-6 py-2 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-50 transition-colors"
                >
                    <span className="material-symbols-outlined text-[20px]">save</span>
                    {saving ? "Saving..." : "Save Questions"}
                </button>
            </div>
        </div>

        <div className="space-y-4">
            {questions.map((q, qIndex) => (
                <div key={qIndex} className="rounded-[2rem] border border-slate-200 bg-white p-8 shadow-sm">
                    <div className="flex items-start justify-between gap-4 mb-6">
                        <div className="flex-1">
                            <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Question {qIndex + 1}</label>
                            <textarea 
                                className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-slate-900 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
                                rows={2}
                                placeholder="Enter your question here..."
                                value={q.question_text}
                                onChange={(e) => updateQuestion(qIndex, 'question_text', e.target.value)}
                            />
                        </div>
                        <div className="w-24">
                             <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Marks</label>
                             <input 
                                type="number"
                                className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-slate-900"
                                value={q.marks}
                                onChange={(e) => updateQuestion(qIndex, 'marks', Number(e.target.value))}
                             />
                        </div>
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2">
                        {q.options.map((opt: string, oIndex: number) => (
                            <div key={oIndex} className="relative">
                                <div className="flex items-center gap-3">
                                    <input 
                                        type="radio"
                                        name={`correct-${qIndex}`}
                                        checked={q.correct_option_index === oIndex}
                                        onChange={() => updateQuestion(qIndex, 'correct_option_index', oIndex)}
                                        className="h-5 w-5 text-indigo-600 focus:ring-indigo-500"
                                    />
                                    <input 
                                        type="text"
                                        className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm focus:border-indigo-500 transition-all"
                                        placeholder={`Option ${oIndex + 1}`}
                                        value={opt}
                                        onChange={(e) => updateOption(qIndex, oIndex, e.target.value)}
                                    />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            ))}

            {questions.length === 0 && (
                <div className="rounded-[2rem] border-2 border-dashed border-slate-200 p-12 text-center">
                    <p className="text-slate-500 mb-4">No questions added yet.</p>
                    <button 
                        onClick={addQuestion}
                        className="rounded-xl bg-indigo-50 px-6 py-2 text-sm font-bold text-indigo-700 hover:bg-indigo-100 transition-colors"
                    >
                        Add your first question
                    </button>
                </div>
            )}
        </div>
      </div>
    </SchoolShell>
  );
}
