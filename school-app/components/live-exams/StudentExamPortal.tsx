"use client";

import { useState, useEffect } from "react";

export function StudentExamPortal({ examId }: { examId: string }) {
  const [exam, setExam] = useState<any>(null);
  const [submission, setSubmission] = useState<any>(null);
  const [remainingTime, setRemainingTime] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    // Fetch exam details and current submission status
    const loadExam = async () => {
      try {
        const res = await fetch(`/api/live-exams/${examId}`);
        const data = await res.json();
        if (data.ok) {
          setExam(data.data);
          // Set initial time if not started yet, or remaining time if started
        } else {
          setError(data.error.message || "Failed to load exam");
        }
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    loadExam();
  }, [examId]);

  const handleStart = async () => {
    try {
      const res = await fetch(`/api/live-exams/${examId}/start`, { method: "POST" });
      const data = await res.json();
      if (data.ok) {
        setSubmission(data.data);
        setRemainingTime(data.data.remaining_time);

        // Enter fullscreen when exam starts
        if (document.documentElement.requestFullscreen) {
            document.documentElement.requestFullscreen().catch(e => console.error("Could not enter fullscreen", e));
        }
      } else {
        setError(data.error.message || "Failed to start exam");
      }
    } catch (err: any) {
      setError(err.message);
    }
  };

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (submission && submission.status === "in_progress" && remainingTime > 0) {
      timer = setInterval(() => {
        setRemainingTime((prev) => {
          if (prev <= 1) {
             handleAutoSubmit();
             return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [submission, remainingTime]);

  // Autosave every 30 seconds
  useEffect(() => {
    let saveTimer: NodeJS.Timeout;
    if (submission && submission.status === "in_progress") {
        saveTimer = setInterval(() => {
            fetch(`/api/live-exams/submissions/${submission._id}/save`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ answers: submission.answers || [], remainingTime })
            });
        }, 30000);
    }
    return () => clearInterval(saveTimer);
  }, [submission, remainingTime]);


  const handleAutoSubmit = async () => {
    try {
       const res = await fetch(`/api/live-exams/submissions/${submission._id}/submit`, {
           method: "POST",
           headers: { "Content-Type": "application/json" },
           body: JSON.stringify({ isAutoSubmit: true })
       });
       const data = await res.json();
       if (data.ok) setSubmission(data.data);
    } catch (err) {
       console.error("Auto submit failed", err);
    }
  };

  const handleSubmit = async () => {
    if (!confirm("Are you sure you want to submit your exam?")) return;
    try {
       const res = await fetch(`/api/live-exams/submissions/${submission._id}/submit`, {
           method: "POST",
           headers: { "Content-Type": "application/json" },
           body: JSON.stringify({ isAutoSubmit: false })
       });
       const data = await res.json();
       if (data.ok) setSubmission(data.data);

       if (document.fullscreenElement) {
           document.exitFullscreen().catch(err => console.error("Error exiting fullscreen:", err));
       }
    } catch (err) {
       console.error("Submit failed", err);
    }
  }

  // Anti-cheat: tab switch detection & fullscreen enforcement
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden && submission && submission.status === "in_progress") {
         fetch(`/api/live-exams/violations`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                exam_id: examId,
                student_id: submission.student_id,
                violation_type: "tab_switch",
                details: "Student switched tabs or minimized window."
            })
         });
         alert("Warning: Tab switching is recorded as an exam violation.");
      }
    };

    const handleFullscreenChange = () => {
        if (!document.fullscreenElement && submission && submission.status === "in_progress") {
           fetch(`/api/live-exams/violations`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                  exam_id: examId,
                  student_id: submission.student_id,
                  violation_type: "fullscreen_exit",
                  details: "Student exited fullscreen mode."
              })
           });
           alert("Warning: Exiting fullscreen is recorded as an exam violation.");
        }
    }

    document.addEventListener("visibilitychange", handleVisibilityChange);
    document.addEventListener("fullscreenchange", handleFullscreenChange);

    return () => {
        document.removeEventListener("visibilitychange", handleVisibilityChange);
        document.removeEventListener("fullscreenchange", handleFullscreenChange);
    };
  }, [submission, examId]);

  if (loading) return <div>Loading exam...</div>;
  if (error) return <div className="text-red-500">{error}</div>;
  if (!exam) return <div>Exam not found</div>;

  return (
    <div className="p-6 bg-white rounded-xl shadow-md space-y-6">
      <div className="flex justify-between items-center border-b pb-4">
        <h2 className="text-2xl font-bold">{exam.title}</h2>
        {submission && submission.status === "in_progress" && (
            <div className={`text-xl font-mono px-4 py-2 rounded-lg ${remainingTime < 300 ? 'bg-red-100 text-red-700' : 'bg-slate-100'}`}>
                {Math.floor(remainingTime / 60)}:{String(remainingTime % 60).padStart(2, '0')}
            </div>
        )}
      </div>

      {!submission ? (
        <div className="text-center py-10 space-y-4">
           <p className="text-slate-600">Duration: {exam.duration} minutes</p>
           <p className="text-slate-600">Total Marks: {exam.total_marks}</p>
           <button
             onClick={handleStart}
             className="bg-violet-600 hover:bg-violet-700 text-white px-8 py-3 rounded-full font-bold text-lg transition"
           >
             Start Exam Now
           </button>
        </div>
      ) : submission.status === "in_progress" ? (
        <div className="space-y-8">
            <div className="bg-amber-50 border border-amber-200 text-amber-800 p-4 rounded-lg text-sm">
                <strong>Important:</strong> Do not switch tabs, exit fullscreen, or refresh the page. Such actions will be logged. The exam will automatically submit when time is up.
            </div>

            {/* Exam questions placeholder */}
            <div className="border p-6 rounded-lg space-y-4">
                <p className="text-slate-500 italic">Questions will appear here...</p>
            </div>

            <div className="flex justify-end pt-4">
                <button
                    onClick={handleSubmit}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-2 rounded-lg font-semibold transition"
                >
                    Submit Exam
                </button>
            </div>
        </div>
      ) : (
         <div className="text-center py-10 space-y-4">
             <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 mb-4">
                 <span className="material-symbols-outlined text-3xl">check_circle</span>
             </div>
             <h3 className="text-2xl font-bold text-slate-800">Exam Submitted</h3>
             <p className="text-slate-600">Your responses have been recorded successfully.</p>
         </div>
      )}
    </div>
  );
}
