import { AppIcon } from "shared/ui/AppIcon";
/**
 * Global Question Bank — Super Admin page.
 *
 * Super Admin can:
 * - Select Class → Subject → Chapter (cascading filters)
 * - Create chapters for any class/subject combo
 * - Create/Edit/Delete questions (MCQ, Short, Long)
 * - All data uses school_id="__global__" and is visible to ALL schools
 *
 * NO page reloads. All actions are optimistic with toast.
 */

import { useState, useEffect, useCallback, useMemo } from 'react'
import { apiRequest } from '@/lib/api'

// ─── Types ───────────────────────────────────────────────────────────────

interface ClassItem { _id: string; name: string }
interface SubjectItem { _id: string; name: string; code?: string }
interface ChapterItem { _id: string; title: string; chapter_number: number; class_id: string; subject_id: string; class_name?: string; subject_name?: string }
interface QuestionItem {
  _id: string
  class_id: string; class_name?: string
  subject_id: string; subject_name?: string
  chapter_id: string; chapter_name?: string
  type: string; difficulty: string
  question_html: string; options?: string
  marks: number; is_global: boolean
  created_at: string
}
interface Stats { total: number; mcq: number; short: number; long: number; easy: number; medium: number; hard: number; chapters: number }

type TabView = 'questions' | 'chapters'

// ─── Toast ───────────────────────────────────────────────────────────────

function toast(msg: string) {
  const el = document.createElement('div')
  el.className = 'fixed bottom-4 right-4 bg-slate-900 text-white px-4 py-2.5 rounded-lg text-sm font-medium shadow-lg z-[9999] animate-[slideUp_0.3s_ease]'
  el.textContent = msg
  document.body.appendChild(el)
  setTimeout(() => { el.style.opacity = '0'; el.style.transition = 'opacity 0.3s'; setTimeout(() => el.remove(), 300) }, 2500)
}

// ─── Main Page ───────────────────────────────────────────────────────────

export function GlobalQuestionBankPage() {
  const [tab, setTab] = useState<TabView>('questions')
  const [classes, setClasses] = useState<ClassItem[]>([])
  const [subjects, setSubjects] = useState<SubjectItem[]>([])
  const [chapters, setChapters] = useState<ChapterItem[]>([])
  const [questions, setQuestions] = useState<QuestionItem[]>([])
  const [stats, setStats] = useState<Stats>({ total: 0, mcq: 0, short: 0, long: 0, easy: 0, medium: 0, hard: 0, chapters: 0 })

  // Filters
  const [classFilter, setClassFilter] = useState('')
  const [subjectFilter, setSubjectFilter] = useState('')
  const [chapterFilter, setChapterFilter] = useState('')
  const [typeFilter, setTypeFilter] = useState('')
  const [difficultyFilter, setDifficultyFilter] = useState('')
  const [search, setSearch] = useState('')

  // Drawers
  const [showAddQuestion, setShowAddQuestion] = useState(false)
  const [showAddChapter, setShowAddChapter] = useState(false)
  const [editQuestion, setEditQuestion] = useState<QuestionItem | null>(null)

  const [loading, setLoading] = useState(false)

  // ─── Load Data ─────────────────────────────────────────────────────────

  useEffect(() => {
    apiRequest<ClassItem[]>('/api/super-admin/global-bank/classes').then(r => {
      if (r.ok && r.data) setClasses(Array.isArray(r.data) ? r.data : [])
    })
    apiRequest<SubjectItem[]>('/api/super-admin/global-bank/subjects').then(r => {
      if (r.ok && r.data) setSubjects(Array.isArray(r.data) ? r.data : [])
    })
  }, [])

  const loadChapters = useCallback(async () => {
    const params = new URLSearchParams()
    if (classFilter) params.set('class_id', classFilter)
    if (subjectFilter) params.set('subject_id', subjectFilter)
    const r = await apiRequest<ChapterItem[]>(`/api/super-admin/global-bank/chapters?${params}`)
    if (r.ok && r.data) setChapters(Array.isArray(r.data) ? r.data : [])
  }, [classFilter, subjectFilter])

  const loadQuestions = useCallback(async () => {
    setLoading(true)
    const params = new URLSearchParams()
    if (classFilter) params.set('class_id', classFilter)
    if (subjectFilter) params.set('subject_id', subjectFilter)
    if (chapterFilter) params.set('chapter_id', chapterFilter)
    if (typeFilter) params.set('type', typeFilter)
    if (difficultyFilter) params.set('difficulty', difficultyFilter)
    if (search) params.set('search', search)
    const r = await apiRequest<QuestionItem[]>(`/api/super-admin/global-bank/questions?${params}`)
    if (r.ok && r.data) setQuestions(Array.isArray(r.data) ? r.data : [])
    setLoading(false)
  }, [classFilter, subjectFilter, chapterFilter, typeFilter, difficultyFilter, search])

  const loadStats = useCallback(async () => {
    const r = await apiRequest<Stats>('/api/super-admin/global-bank/stats')
    if (r.ok && r.data) setStats(r.data)
  }, [])

  useEffect(() => { loadChapters() }, [loadChapters])
  useEffect(() => { loadQuestions() }, [loadQuestions])
  useEffect(() => { loadStats() }, [loadStats])

  // ─── Actions ───────────────────────────────────────────────────────────

  async function deleteQuestion(id: string) {
    if (!confirm('Delete this question permanently?')) return
    const r = await apiRequest(`/api/super-admin/global-bank/questions/${id}`, { method: 'DELETE' })
    if (r.ok) {
      setQuestions(prev => prev.filter(q => q._id !== id))
      toast('Question deleted')
      loadStats()
    }
  }

  async function deleteChapter(id: string) {
    if (!confirm('Delete this chapter?')) return
    const r = await apiRequest(`/api/super-admin/global-bank/chapters/${id}`, { method: 'DELETE' })
    if (r.ok) {
      setChapters(prev => prev.filter(c => c._id !== id))
      toast('Chapter deleted')
      loadStats()
    }
  }

  // ─── Helpers ───────────────────────────────────────────────────────────

  const selectedClassName = useMemo(() => classes.find(c => c._id === classFilter)?.name || '', [classes, classFilter])
  const selectedSubjectName = useMemo(() => subjects.find(s => s._id === subjectFilter)?.name || '', [subjects, subjectFilter])

  // ─── Render ────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Global Question Bank</h1>
          <p className="text-sm text-slate-500 mt-0.5">Manage questions visible to all schools. Add classes, chapters, and questions here.</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatCard label="Total Questions" value={stats.total} accent="violet" icon="quiz" />
        <StatCard label="MCQ" value={stats.mcq} accent="indigo" icon="check_circle" />
        <StatCard label="Short Answer" value={stats.short} accent="amber" icon="short_text" />
        <StatCard label="Chapters" value={stats.chapters} accent="emerald" icon="menu_book" />
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg w-fit">
        <button onClick={() => setTab('questions')} className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${tab === 'questions' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
          📝 Questions
        </button>
        <button onClick={() => setTab('chapters')} className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${tab === 'chapters' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
          📖 Chapters
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <FilterSelect label="Class" value={classFilter} onChange={v => { setClassFilter(v); setSubjectFilter(''); setChapterFilter('') }} options={classes.map(c => ({ value: c._id, label: c.name }))} />
        <FilterSelect label="Subject" value={subjectFilter} onChange={v => { setSubjectFilter(v); setChapterFilter('') }} options={subjects.map(s => ({ value: s._id, label: s.name }))} />
        {tab === 'questions' && chapters.length > 0 && (
          <FilterSelect label="Chapter" value={chapterFilter} onChange={setChapterFilter} options={chapters.map(c => ({ value: c._id, label: c.title }))} />
        )}
        {tab === 'questions' && (
          <>
            <FilterSelect label="Type" value={typeFilter} onChange={setTypeFilter} options={[{ value: 'mcq', label: 'MCQ' }, { value: 'short', label: 'Short' }, { value: 'long', label: 'Long' }]} />
            <FilterSelect label="Difficulty" value={difficultyFilter} onChange={setDifficultyFilter} options={[{ value: 'easy', label: 'Easy' }, { value: 'medium', label: 'Medium' }, { value: 'hard', label: 'Hard' }]} />
          </>
        )}
        {tab === 'questions' && (
          <input
            type="text"
            placeholder="Search questions..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="h-9 px-3 rounded-lg border border-slate-200 text-sm w-48 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400"
          />
        )}
        <div className="ml-auto flex gap-2">
          {tab === 'chapters' && (
            <button onClick={() => setShowAddChapter(true)} className="h-9 px-4 rounded-lg bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-700 transition-colors flex items-center gap-1.5">
              <AppIcon name="Plus" size={14} /> Add Chapter
            </button>
          )}
          {tab === 'questions' && (
            <button onClick={() => setShowAddQuestion(true)} className="h-9 px-4 rounded-lg bg-blue-600 text-white text-xs font-bold hover:bg-blue-700 transition-colors flex items-center gap-1.5">
              <AppIcon name="Plus" size={14} /> Add Question
            </button>
          )}
        </div>
      </div>

      {/* Content */}
      {tab === 'questions' && (
        <QuestionsTab
          questions={questions}
          loading={loading}
          onDelete={deleteQuestion}
          onEdit={q => setEditQuestion(q)}
        />
      )}
      {tab === 'chapters' && (
        <ChaptersTab chapters={chapters} onDelete={deleteChapter} />
      )}

      {/* Add Question Drawer */}
      {(showAddQuestion || editQuestion) && (
        <AddQuestionDrawer
          classes={classes}
          subjects={subjects}
          chapters={chapters}
          defaultClassId={classFilter}
          defaultSubjectId={subjectFilter}
          defaultChapterId={chapterFilter}
          editData={editQuestion}
          onClose={() => { setShowAddQuestion(false); setEditQuestion(null) }}
          onSaved={() => { loadQuestions(); loadStats() }}
          onChaptersChanged={loadChapters}
          selectedClassName={selectedClassName}
          selectedSubjectName={selectedSubjectName}
        />
      )}

      {/* Add Chapter Drawer */}
      {showAddChapter && (
        <AddChapterDrawer
          classes={classes}
          subjects={subjects}
          defaultClassId={classFilter}
          defaultSubjectId={subjectFilter}
          selectedClassName={selectedClassName}
          selectedSubjectName={selectedSubjectName}
          onClose={() => setShowAddChapter(false)}
          onSaved={() => { loadChapters(); loadStats() }}
        />
      )}
    </div>
  )
}

// ─── Sub Components ──────────────────────────────────────────────────────

function StatCard({ label, value, accent, icon }: { label: string; value: number; accent: string; icon: string }) {
  const colors: Record<string, string> = {
    violet: 'bg-violet-50 text-violet-600 border-violet-100',
    indigo: 'bg-indigo-50 text-indigo-600 border-indigo-100',
    amber: 'bg-amber-50 text-amber-600 border-amber-100',
    emerald: 'bg-emerald-50 text-emerald-600 border-emerald-100',
  }
  return (
    <div className={`rounded-xl border p-4 ${colors[accent] || colors.violet}`}>
      <div className="flex items-center gap-2 mb-1">
        <AppIcon name={icon} size={18} />
        <span className="text-[10px] font-bold uppercase tracking-wide opacity-70">{label}</span>
      </div>
      <p className="text-2xl font-bold">{value}</p>
    </div>
  )
}

function FilterSelect({ label, value, onChange, options }: { label: string; value: string; onChange: (v: string) => void; options: { value: string; label: string }[] }) {
  return (
    <select
      value={value}
      onChange={e => onChange(e.target.value)}
      className="h-9 px-3 pr-8 rounded-lg border border-slate-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 appearance-none"
    >
      <option value="">All {label}s</option>
      {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
    </select>
  )
}

// ─── Questions Tab ───────────────────────────────────────────────────────

function QuestionsTab({ questions, loading, onDelete, onEdit }: { questions: QuestionItem[]; loading: boolean; onDelete: (id: string) => void; onEdit: (q: QuestionItem) => void }) {
  if (loading) return (
    <div className="space-y-3">
      {[1, 2, 3].map(i => <div key={i} className="h-28 bg-slate-100 rounded-xl animate-pulse" />)}
    </div>
  )

  if (questions.length === 0) return (
    <div className="text-center py-16 bg-white rounded-xl border border-slate-200">
      <p className="text-3xl mb-3">📭</p>
      <p className="text-sm font-medium text-slate-600">No global questions yet. Add your first question above.</p>
    </div>
  )

  return (
    <div className="space-y-3">
      {questions.map(q => (
        <div key={q._id} className="bg-white rounded-xl border border-slate-200 p-4 hover:border-slate-300 transition-colors">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <div className="text-sm text-slate-800 font-medium leading-relaxed" dangerouslySetInnerHTML={{ __html: q.question_html }} />

              {/* MCQ Options */}
              {q.type === 'mcq' && q.options && (() => {
                try {
                  const opts = JSON.parse(q.options)
                  if (Array.isArray(opts)) return (
                    <div className="mt-2 grid grid-cols-2 gap-2">
                      {opts.map((opt: any, i: number) => (
                        <div key={i} className={`text-xs px-3 py-1.5 rounded-lg border ${opt.is_correct ? 'bg-emerald-50 border-emerald-200 text-emerald-700 font-bold' : 'bg-slate-50 border-slate-100 text-slate-600'}`}>
                          ({String.fromCharCode(65 + i)}) {opt.option_text} {opt.is_correct && '✓'}
                        </div>
                      ))}
                    </div>
                  )
                } catch { /* ignore */ }
                return null
              })()}

              {/* Meta */}
              <div className="flex flex-wrap items-center gap-2 mt-2.5">
                <span className="text-[10px] font-bold text-violet-600 bg-violet-50 px-2 py-0.5 rounded">{q.type.toUpperCase()}</span>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${q.difficulty === 'easy' ? 'bg-emerald-50 text-emerald-600' : q.difficulty === 'hard' ? 'bg-red-50 text-red-600' : 'bg-amber-50 text-amber-600'}`}>{q.difficulty}</span>
                {q.marks > 0 && <span className="text-[10px] text-slate-500 bg-slate-50 px-2 py-0.5 rounded">{q.marks} marks</span>}
                {q.subject_name && <span className="text-[10px] text-blue-600 bg-blue-50 px-2 py-0.5 rounded">{q.subject_name}</span>}
                {q.chapter_name && <span className="text-[10px] text-slate-500 bg-slate-50 px-2 py-0.5 rounded">{q.chapter_name}</span>}
                {q.class_name && <span className="text-[10px] text-slate-400">{q.class_name}</span>}
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-1.5 shrink-0">
              <button onClick={() => onEdit(q)} className="h-8 w-8 rounded-lg border border-slate-200 flex items-center justify-center text-slate-500 hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200 transition-colors" title="Edit">
                <AppIcon name="Pencil" size={16} />
              </button>
              <button onClick={() => onDelete(q._id)} className="h-8 w-8 rounded-lg border border-slate-200 flex items-center justify-center text-slate-500 hover:bg-red-50 hover:text-red-600 hover:border-red-200 transition-colors" title="Delete">
                <AppIcon name="Trash2" size={16} />
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

// ─── Chapters Tab ────────────────────────────────────────────────────────

function ChaptersTab({ chapters, onDelete }: { chapters: ChapterItem[]; onDelete: (id: string) => void }) {
  if (chapters.length === 0) return (
    <div className="text-center py-16 bg-white rounded-xl border border-slate-200">
      <p className="text-3xl mb-3">📖</p>
      <p className="text-sm font-medium text-slate-600">No chapters yet. Select a class & subject, then add chapters.</p>
    </div>
  )

  return (
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-slate-50 border-b border-slate-200">
            <th className="text-left px-4 py-3 font-semibold text-slate-600">#</th>
            <th className="text-left px-4 py-3 font-semibold text-slate-600">Chapter Title</th>
            <th className="text-left px-4 py-3 font-semibold text-slate-600">Class</th>
            <th className="text-left px-4 py-3 font-semibold text-slate-600">Subject</th>
            <th className="text-right px-4 py-3 font-semibold text-slate-600">Actions</th>
          </tr>
        </thead>
        <tbody>
          {chapters.map(ch => (
            <tr key={ch._id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50/50">
              <td className="px-4 py-3 text-slate-500 font-mono text-xs">{ch.chapter_number}</td>
              <td className="px-4 py-3 font-medium text-slate-800">{ch.title}</td>
              <td className="px-4 py-3 text-slate-500">{ch.class_name || ch.class_id}</td>
              <td className="px-4 py-3 text-slate-500">{ch.subject_name || ch.subject_id}</td>
              <td className="px-4 py-3 text-right">
                <button onClick={() => onDelete(ch._id)} className="h-7 w-7 rounded border border-slate-200 inline-flex items-center justify-center text-slate-400 hover:bg-red-50 hover:text-red-600 hover:border-red-200 transition-colors">
                  <AppIcon name="Trash2" size={14} />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}


// ─── Add Question Drawer ─────────────────────────────────────────────────

function AddQuestionDrawer({
  classes, subjects, chapters,
  defaultClassId, defaultSubjectId, defaultChapterId,
  editData, onClose, onSaved, onChaptersChanged,
  selectedClassName, selectedSubjectName,
}: {
  classes: ClassItem[]; subjects: SubjectItem[]; chapters: ChapterItem[]
  defaultClassId: string; defaultSubjectId: string; defaultChapterId: string
  editData: QuestionItem | null
  onClose: () => void; onSaved: () => void; onChaptersChanged: () => void
  selectedClassName: string; selectedSubjectName: string
}) {
  const [classId, setClassId] = useState(editData?.class_id || defaultClassId)
  const [subjectId, setSubjectId] = useState(editData?.subject_id || defaultSubjectId)
  const [chapterId, setChapterId] = useState(editData?.chapter_id || defaultChapterId)
  const [type, setType] = useState(editData?.type || 'short')
  const [difficulty, setDifficulty] = useState(editData?.difficulty || 'medium')
  const [questionHtml, setQuestionHtml] = useState(editData?.question_html || '')
  const [marks, setMarks] = useState(editData?.marks || 2)
  const [options, setOptions] = useState<{ option_text: string; is_correct: boolean }[]>(() => {
    if (editData?.options) {
      try { return JSON.parse(editData.options) } catch { /* ignore */ }
    }
    return [{ option_text: '', is_correct: true }, { option_text: '', is_correct: false }, { option_text: '', is_correct: false }, { option_text: '', is_correct: false }]
  })
  const [saving, setSaving] = useState(false)

  const className = useMemo(() => classes.find(c => c._id === classId)?.name || selectedClassName, [classes, classId, selectedClassName])
  const subjectName = useMemo(() => subjects.find(s => s._id === subjectId)?.name || selectedSubjectName, [subjects, subjectId, selectedSubjectName])

  async function handleSave() {
    if (!questionHtml.trim() || !classId) {
      toast('Question text and class are required')
      return
    }
    setSaving(true)

    const payload: any = {
      class_id: classId,
      class_name: className,
      subject_id: subjectId,
      subject_name: subjectName,
      chapter_id: chapterId,
      type,
      difficulty,
      question_html: questionHtml,
      marks,
    }
    if (type === 'mcq') {
      payload.options = options.filter(o => o.option_text.trim())
    }

    let r
    if (editData) {
      r = await apiRequest(`/api/super-admin/global-bank/questions/${editData._id}`, { method: 'PUT', body: JSON.stringify(payload) })
    } else {
      r = await apiRequest('/api/super-admin/global-bank/questions', { method: 'POST', body: JSON.stringify(payload) })
    }

    if (r.ok) {
      toast(editData ? 'Question updated' : 'Question created')
      onSaved()
      onClose()
    } else {
      toast(r.message || 'Failed to save')
    }
    setSaving(false)
  }

  return (
    <div className="fixed inset-0 z-50 flex">
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />
      <div className="ml-auto w-full max-w-lg bg-white h-full overflow-y-auto relative shadow-2xl">
        <div className="sticky top-0 bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between z-10">
          <h2 className="text-lg font-bold text-slate-900">{editData ? 'Edit Question' : 'Add Global Question'}</h2>
          <button onClick={onClose} className="h-8 w-8 rounded-lg border border-slate-200 flex items-center justify-center text-slate-500 hover:bg-slate-50">
            <AppIcon name="X" size={18} />
          </button>
        </div>

        <div className="p-6 space-y-5">
          {/* Class */}
          <div>
            <label className="text-xs font-semibold text-slate-600 mb-1.5 block">Class *</label>
            <select value={classId} onChange={e => setClassId(e.target.value)} className="w-full h-10 px-3 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400">
              <option value="">Select class</option>
              {classes.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
            </select>
          </div>

          {/* Subject */}
          <div>
            <label className="text-xs font-semibold text-slate-600 mb-1.5 block">Subject</label>
            <select value={subjectId} onChange={e => setSubjectId(e.target.value)} className="w-full h-10 px-3 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400">
              <option value="">Select subject</option>
              {subjects.map(s => <option key={s._id} value={s._id}>{s.name}</option>)}
            </select>
          </div>

          {/* Chapter */}
          <div>
            <label className="text-xs font-semibold text-slate-600 mb-1.5 block">Chapter</label>
            <select value={chapterId} onChange={e => setChapterId(e.target.value)} className="w-full h-10 px-3 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400">
              <option value="">Select chapter</option>
              {chapters.filter(c => (!classId || c.class_id === classId) && (!subjectId || c.subject_id === subjectId)).map(c => <option key={c._id} value={c._id}>{c.title}</option>)}
            </select>
          </div>

          {/* Type & Difficulty */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-slate-600 mb-1.5 block">Type</label>
              <select value={type} onChange={e => setType(e.target.value)} className="w-full h-10 px-3 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400">
                <option value="mcq">MCQ</option>
                <option value="short">Short Answer</option>
                <option value="long">Long Answer</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-600 mb-1.5 block">Difficulty</label>
              <select value={difficulty} onChange={e => setDifficulty(e.target.value)} className="w-full h-10 px-3 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400">
                <option value="easy">Easy</option>
                <option value="medium">Medium</option>
                <option value="hard">Hard</option>
              </select>
            </div>
          </div>

          {/* Marks */}
          <div>
            <label className="text-xs font-semibold text-slate-600 mb-1.5 block">Marks</label>
            <input type="number" min={1} max={50} value={marks} onChange={e => setMarks(+e.target.value)} className="w-full h-10 px-3 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400" />
          </div>

          {/* Question Text */}
          <div>
            <label className="text-xs font-semibold text-slate-600 mb-1.5 block">Question *</label>
            <textarea
              value={questionHtml}
              onChange={e => setQuestionHtml(e.target.value)}
              rows={4}
              placeholder="Enter question text..."
              className="w-full px-3 py-2.5 rounded-lg border border-slate-200 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400"
            />
          </div>

          {/* MCQ Options */}
          {type === 'mcq' && (
            <div>
              <label className="text-xs font-semibold text-slate-600 mb-1.5 block">Options</label>
              <div className="space-y-2">
                {options.map((opt, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="correct_option"
                      checked={opt.is_correct}
                      onChange={() => setOptions(prev => prev.map((o, j) => ({ ...o, is_correct: j === i })))}
                      className="h-4 w-4 text-emerald-600"
                    />
                    <input
                      type="text"
                      value={opt.option_text}
                      onChange={e => setOptions(prev => prev.map((o, j) => j === i ? { ...o, option_text: e.target.value } : o))}
                      placeholder={`Option ${String.fromCharCode(65 + i)}`}
                      className="flex-1 h-9 px-3 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400"
                    />
                  </div>
                ))}
              </div>
              <p className="text-[10px] text-slate-400 mt-1">Select the correct answer with the radio button</p>
            </div>
          )}

          {/* Save Button */}
          <button
            onClick={handleSave}
            disabled={saving}
            className="w-full h-11 rounded-lg bg-blue-600 text-white font-bold text-sm hover:bg-blue-700 disabled:opacity-50 transition-colors"
          >
            {saving ? 'Saving...' : editData ? 'Update Question' : 'Publish Question (Global)'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Add Chapter Drawer ──────────────────────────────────────────────────

function AddChapterDrawer({
  classes, subjects, defaultClassId, defaultSubjectId,
  selectedClassName, selectedSubjectName,
  onClose, onSaved,
}: {
  classes: ClassItem[]; subjects: SubjectItem[]
  defaultClassId: string; defaultSubjectId: string
  selectedClassName: string; selectedSubjectName: string
  onClose: () => void; onSaved: () => void
}) {
  const [classId, setClassId] = useState(defaultClassId)
  const [subjectId, setSubjectId] = useState(defaultSubjectId)
  const [title, setTitle] = useState('')
  const [chapterNumber, setChapterNumber] = useState(1)
  const [saving, setSaving] = useState(false)

  // Bulk add mode
  const [bulkMode, setBulkMode] = useState(false)
  const [bulkText, setBulkText] = useState('')

  const className = useMemo(() => classes.find(c => c._id === classId)?.name || selectedClassName, [classes, classId, selectedClassName])
  const subjectName = useMemo(() => subjects.find(s => s._id === subjectId)?.name || selectedSubjectName, [subjects, subjectId, selectedSubjectName])

  async function handleSave() {
    if (!classId) { toast('Class is required'); return }

    setSaving(true)

    if (bulkMode) {
      // Parse bulk text (one chapter per line)
      const lines = bulkText.split('\n').map(l => l.trim()).filter(Boolean)
      let count = 0
      for (let i = 0; i < lines.length; i++) {
        const r = await apiRequest('/api/super-admin/global-bank/chapters', {
          method: 'POST',
          body: JSON.stringify({
            class_id: classId,
            class_name: className,
            subject_id: subjectId,
            subject_name: subjectName,
            title: lines[i],
            chapter_number: i + 1,
          }),
        })
        if (r.ok) count++
      }
      toast(`${count} chapters created`)
    } else {
      if (!title.trim()) { toast('Title is required'); setSaving(false); return }
      const r = await apiRequest('/api/super-admin/global-bank/chapters', {
        method: 'POST',
        body: JSON.stringify({
          class_id: classId,
          class_name: className,
          subject_id: subjectId,
          subject_name: subjectName,
          title,
          chapter_number: chapterNumber,
        }),
      })
      if (r.ok) {
        toast('Chapter created')
      } else {
        toast(r.message || 'Failed')
        setSaving(false)
        return
      }
    }

    onSaved()
    onClose()
    setSaving(false)
  }

  return (
    <div className="fixed inset-0 z-50 flex">
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />
      <div className="ml-auto w-full max-w-md bg-white h-full overflow-y-auto relative shadow-2xl">
        <div className="sticky top-0 bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between z-10">
          <h2 className="text-lg font-bold text-slate-900">Add Global Chapter</h2>
          <button onClick={onClose} className="h-8 w-8 rounded-lg border border-slate-200 flex items-center justify-center text-slate-500 hover:bg-slate-50">
            <AppIcon name="X" size={18} />
          </button>
        </div>

        <div className="p-6 space-y-5">
          {/* Class */}
          <div>
            <label className="text-xs font-semibold text-slate-600 mb-1.5 block">Class *</label>
            <select value={classId} onChange={e => setClassId(e.target.value)} className="w-full h-10 px-3 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400">
              <option value="">Select class</option>
              {classes.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
            </select>
          </div>

          {/* Subject */}
          <div>
            <label className="text-xs font-semibold text-slate-600 mb-1.5 block">Subject</label>
            <select value={subjectId} onChange={e => setSubjectId(e.target.value)} className="w-full h-10 px-3 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400">
              <option value="">Select subject</option>
              {subjects.map(s => <option key={s._id} value={s._id}>{s.name}</option>)}
            </select>
          </div>

          {/* Mode Toggle */}
          <div className="flex items-center gap-3">
            <button onClick={() => setBulkMode(false)} className={`text-xs font-bold px-3 py-1.5 rounded-lg transition-colors ${!bulkMode ? 'bg-blue-100 text-blue-700' : 'text-slate-500 hover:bg-slate-100'}`}>Single</button>
            <button onClick={() => setBulkMode(true)} className={`text-xs font-bold px-3 py-1.5 rounded-lg transition-colors ${bulkMode ? 'bg-blue-100 text-blue-700' : 'text-slate-500 hover:bg-slate-100'}`}>Bulk (one per line)</button>
          </div>

          {!bulkMode ? (
            <>
              <div>
                <label className="text-xs font-semibold text-slate-600 mb-1.5 block">Chapter Title *</label>
                <input type="text" value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. Chapter 1: Introduction" className="w-full h-10 px-3 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400" />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-600 mb-1.5 block">Chapter Number</label>
                <input type="number" min={1} value={chapterNumber} onChange={e => setChapterNumber(+e.target.value)} className="w-full h-10 px-3 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400" />
              </div>
            </>
          ) : (
            <div>
              <label className="text-xs font-semibold text-slate-600 mb-1.5 block">Chapters (one per line)</label>
              <textarea
                value={bulkText}
                onChange={e => setBulkText(e.target.value)}
                rows={10}
                placeholder={"Chapter 1: Numbers\nChapter 2: Algebra\nChapter 3: Geometry\n..."}
                className="w-full px-3 py-2.5 rounded-lg border border-slate-200 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 font-mono"
              />
              <p className="text-[10px] text-slate-400 mt-1">{bulkText.split('\n').filter(l => l.trim()).length} chapters will be created</p>
            </div>
          )}

          <button
            onClick={handleSave}
            disabled={saving}
            className="w-full h-11 rounded-lg bg-emerald-600 text-white font-bold text-sm hover:bg-emerald-700 disabled:opacity-50 transition-colors"
          >
            {saving ? 'Creating...' : bulkMode ? 'Create All Chapters' : 'Create Chapter'}
          </button>
        </div>
      </div>
    </div>
  )
}
