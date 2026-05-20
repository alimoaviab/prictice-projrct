/**
 * Chapters Management — Admin can add/archive/reorder chapters per subject.
 */

import { useState, useEffect, useCallback } from "react";
import { SchoolShell } from "@/layouts/SchoolShell";
import { Card, Button, Skeleton, DataState } from "@/components/ui";
import { useSafeAsync } from "@/hooks/useSafeAsync";
import { serviceRequest } from "@/services/service-client";
import * as chapterService from "@/modules/chapters/services/chapter.service";
import { showToast } from "@/utils/toast";

interface ClassRow { _id: string; id?: string; name: string; }
interface SubjectRow { _id: string; id?: string; name: string; }

export function AdminChaptersPage() {
  const [classId, setClassId] = useState("");
  const [subjectId, setSubjectId] = useState("");
  const [newTitle, setNewTitle] = useState("");
  const [saving, setSaving] = useState(false);

  // Classes
  const { state: classState, run: runClasses } = useSafeAsync<ClassRow[]>();
  useEffect(() => {
    void runClasses(async () => {
      const r = await serviceRequest<any>("/api/classes");
      if (!r.ok) return [];
      const raw = r.data;
      return Array.isArray(raw) ? raw : raw?.data || raw?.items || [];
    });
  }, [runClasses]);

  // Subjects
  const { state: subjectState, run: runSubjects } = useSafeAsync<SubjectRow[]>();
  useEffect(() => {
    void runSubjects(async () => {
      const r = await serviceRequest<any>("/api/subjects");
      if (!r.ok) return [];
      const raw = r.data;
      return Array.isArray(raw) ? raw : raw?.data || raw?.items || [];
    });
  }, [runSubjects]);

  // Chapters
  const { state: chapterState, run: runChapters } = useSafeAsync<chapterService.Chapter[]>();
  const loadChapters = useCallback(() => {
    if (!classId) return;
    return runChapters(async () => {
      const r = await chapterService.listChapters({ class_id: classId, subject_id: subjectId || undefined });
      if (!r.ok) throw new Error(r.error?.message || "Failed");
      return r.data ?? [];
    });
  }, [runChapters, classId, subjectId]);

  useEffect(() => {
    if (classId) void loadChapters();
  }, [classId, subjectId, loadChapters]);

  const classes = classState.data || [];
  const subjects = subjectState.data || [];
  const chapters = chapterState.data || [];

  async function handleAdd() {
    if (!newTitle.trim() || !classId) return;
    setSaving(true);
    const selectedSubject = subjects.find((s) => (s._id || s.id) === subjectId);
    await chapterService.createChapter({
      class_id: classId,
      subject_id: subjectId,
      subject_name: selectedSubject?.name || "",
      title: newTitle.trim(),
    });
    showToast("Chapter added.", "success");
    setNewTitle("");
    await loadChapters();
    setSaving(false);
  }

  async function handleArchive(id: string) {
    await chapterService.archiveChapter(id);
    showToast("Chapter archived.", "success");
    await loadChapters();
  }

  return (
    <SchoolShell eyebrow="Academic" title="Chapters">
      <div className="max-w-4xl mx-auto space-y-5">
        {/* Filters */}
        <Card className="p-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-500">Class</label>
              <select value={classId} onChange={(e) => setClassId(e.target.value)} className="w-full h-10 rounded-lg border border-slate-200 px-3 text-sm bg-white focus:border-blue-500 outline-none">
                <option value="">Select Class</option>
                {classes.map((c) => <option key={c._id || c.id} value={c._id || c.id}>{c.name}</option>)}
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-500">Subject</label>
              <select value={subjectId} onChange={(e) => setSubjectId(e.target.value)} className="w-full h-10 rounded-lg border border-slate-200 px-3 text-sm bg-white focus:border-blue-500 outline-none">
                <option value="">All Subjects</option>
                {subjects.map((s) => <option key={s._id || s.id} value={s._id || s.id}>{s.name}</option>)}
              </select>
            </div>
          </div>
        </Card>

        {/* Add Chapter */}
        {classId && (
          <Card className="p-5">
            <div className="flex items-end gap-3">
              <div className="flex-1 space-y-1">
                <label className="text-[11px] font-bold text-slate-500">New Chapter Title</label>
                <input
                  type="text"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="e.g. Introduction to Biology"
                  className="w-full h-10 rounded-lg border border-slate-200 px-3 text-sm focus:border-blue-500 outline-none placeholder:text-slate-300"
                  onKeyDown={(e) => e.key === "Enter" && handleAdd()}
                />
              </div>
              <Button onClick={handleAdd} disabled={saving || !newTitle.trim()}>
                {saving ? "Adding..." : "Add Chapter"}
              </Button>
            </div>
          </Card>
        )}

        {/* Chapter List */}
        {!classId ? (
          <div className="text-center py-12 text-sm text-slate-400">Select a class to view chapters</div>
        ) : chapterState.status === "loading" ? (
          <div className="space-y-2">{[1, 2, 3].map((i) => <Skeleton key={i} className="h-14 w-full rounded-lg" />)}</div>
        ) : chapters.length === 0 ? (
          <DataState variant="empty" title="No chapters" message="Add chapters for this class and subject." />
        ) : (
          <div className="space-y-2">
            {chapters.map((ch) => (
              <div key={ch._id} className="flex items-center gap-3 bg-white rounded-lg border border-slate-200 px-4 py-3 hover:border-slate-300 transition-colors">
                <span className="text-xs font-bold text-slate-400 w-8">#{ch.chapter_number}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-slate-900 truncate">{ch.title}</p>
                  {ch.subject_name && <p className="text-[10px] text-slate-400">{ch.subject_name}</p>}
                </div>
                <button
                  onClick={() => handleArchive(ch._id)}
                  className="text-[10px] font-bold text-slate-400 hover:text-red-600 transition-colors"
                >
                  Archive
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </SchoolShell>
  );
}
