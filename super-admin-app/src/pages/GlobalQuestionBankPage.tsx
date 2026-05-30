import DOMPurify from "dompurify";
import { AppIcon } from "shared/ui/AppIcon";
/**
 * Global Question Bank — Super Admin page.
 *
 * Super Admin can:
 * - Select Board → Class → Subject → Chapter → Topic (cascading filters)
 * - Create/Edit/Delete questions
 * - Bulk select questions to Approve, Reject, Archive, Delete
 * - Paginate results
 * - All data uses school_id="__global__" and is visible to ALL schools
 *
 * NO page reloads. All actions are optimistic with toast.
 */

import { useState, useEffect, useCallback, useMemo } from 'react'
import { apiRequest } from '@/lib/api'

// ─── Types ───────────────────────────────────────────────────────────────

interface BoardItem { _id: string; name: string; code: string }
interface ClassItem { _id: string; board_id: string; name: string }
interface SubjectItem { _id: string; class_id: string; name: string; code?: string }
interface ChapterItem { _id: string; title: string; chapter_number: number; class_id: string; subject_id: string; class_name?: string; subject_name?: string }
interface TopicItem { _id: string; chapter_id: string; name: string; code: string }

interface QuestionItem {
  _id: string
  board_id?: string
  class_id: string; class_name?: string
  subject_id: string; subject_name?: string
  chapter_id: string; chapter_name?: string
  topic_id?: string
  type: string; difficulty: string
  question_html: string; options?: string
  marks: number; is_global: boolean
  status: string
  approval_status: string
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
  
  // Lists
  const [boards, setBoards] = useState<BoardItem[]>([])
  const [classes, setClasses] = useState<ClassItem[]>([])
  const [subjects, setSubjects] = useState<SubjectItem[]>([])
  const [chapters, setChapters] = useState<ChapterItem[]>([])
  const [topics, setTopics] = useState<TopicItem[]>([])
  const [questions, setQuestions] = useState<QuestionItem[]>([])
  const [stats, setStats] = useState<Stats>({ total: 0, mcq: 0, short: 0, long: 0, easy: 0, medium: 0, hard: 0, chapters: 0 })

  // Filters
  const [boardFilter, setBoardFilter] = useState('')
  const [classFilter, setClassFilter] = useState('')
  const [subjectFilter, setSubjectFilter] = useState('')
  const [chapterFilter, setChapterFilter] = useState('')
  const [topicFilter, setTopicFilter] = useState('')
  const [typeFilter, setTypeFilter] = useState('')
  const [difficultyFilter, setDifficultyFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('active')
  const [approvalStatusFilter, setApprovalStatusFilter] = useState('')
  const [search, setSearch] = useState('')

  // Pagination states
  const [page, setPage] = useState(1)
  const [limit] = useState(10)
  const [totalItems, setTotalItems] = useState(0)

  // Selection states (for bulk operations)
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [bulkActionRunning, setBulkActionRunning] = useState(false)

  // Drawers
  const [showAddQuestion, setShowAddQuestion] = useState(false)
  const [showAddChapter, setShowAddChapter] = useState(false)
  const [editQuestion, setEditQuestion] = useState<QuestionItem | null>(null)

  const [loading, setLoading] = useState(false)

  // ─── Load Initial / Filtered Data ───────────────────────────────────────

  // Load boards on mount
  useEffect(() => {
    apiRequest<BoardItem[]>('/api/super-admin/global-bank/boards?all=true').then(r => {
      if (r.ok && r.data) setBoards(Array.isArray(r.data) ? r.data : [])
    })
  }, [])

  // Cascade 1: Load classes when board changes
  useEffect(() => {
    setClassFilter('')
    setSubjectFilter('')
    setChapterFilter('')
    setTopicFilter('')
    setClasses([])
    setPage(1)
    if (boardFilter) {
      apiRequest<ClassItem[]>(`/api/super-admin/global-bank/classes?all=true&board_id=${boardFilter}`).then(r => {
        if (r.ok && r.data) setClasses(Array.isArray(r.data) ? r.data : [])
      })
    } else {
      setClasses([])
    }
  }, [boardFilter])

  // Cascade 2: Load subjects when class changes
  useEffect(() => {
    setSubjectFilter('')
    setChapterFilter('')
    setTopicFilter('')
    setSubjects([])
    setPage(1)
    if (classFilter) {
      apiRequest<SubjectItem[]>(`/api/super-admin/global-bank/subjects?all=true&class_id=${classFilter}`).then(r => {
        if (r.ok && r.data) setSubjects(Array.isArray(r.data) ? r.data : [])
      })
    } else {
      setSubjects([])
    }
  }, [classFilter])

  // Cascade 3: Load chapters when subject changes
  const loadChapters = useCallback(async () => {
    setChapterFilter('')
    setTopicFilter('')
    setChapters([])
    setPage(1)
    if (classFilter && subjectFilter) {
      const r = await apiRequest<ChapterItem[]>(`/api/super-admin/global-bank/chapters?class_id=${classFilter}&subject_id=${subjectFilter}`)
      if (r.ok && r.data) setChapters(Array.isArray(r.data) ? r.data : [])
    } else {
      setChapters([])
    }
  }, [classFilter, subjectFilter])

  useEffect(() => { loadChapters() }, [loadChapters])

  // Cascade 4: Load topics when chapter changes
  useEffect(() => {
    setTopicFilter('')
    setTopics([])
    setPage(1)
    if (chapterFilter) {
      apiRequest<TopicItem[]>(`/api/super-admin/global-bank/topics?all=true&chapter_id=${chapterFilter}`).then(r => {
        if (r.ok && r.data) setTopics(Array.isArray(r.data) ? r.data : [])
      })
    } else {
      setTopics([])
    }
  }, [chapterFilter])

  // Reset pagination on other filter changes
  useEffect(() => {
    setPage(1)
  }, [typeFilter, difficultyFilter, statusFilter, approvalStatusFilter, search])

  // Fetch Questions
  const loadQuestions = useCallback(async () => {
    setLoading(true)
    const params = new URLSearchParams()
    if (boardFilter) params.set('board_id', boardFilter)
    if (classFilter) params.set('class_id', classFilter)
    if (subjectFilter) params.set('subject_id', subjectFilter)
    if (chapterFilter) params.set('chapter_id', chapterFilter)
    if (topicFilter) params.set('topic_id', topicFilter)
    if (typeFilter) params.set('type', typeFilter)
    if (difficultyFilter) params.set('difficulty', difficultyFilter)
    if (statusFilter) params.set('status', statusFilter)
    if (approvalStatusFilter) params.set('approval_status', approvalStatusFilter)
    if (search) params.set('search', search)
    
    // Pagination parameters
    params.set('page', String(page))
    params.set('limit', String(limit))

    const r = await apiRequest<{ items: QuestionItem[]; total: number } | QuestionItem[]>(`/api/super-admin/global-bank/questions?${params}`)
    if (r.ok && r.data) {
      if ('items' in r.data && Array.isArray(r.data.items)) {
        setQuestions(r.data.items)
        setTotalItems(r.data.total)
      } else if (Array.isArray(r.data)) {
        setQuestions(r.data)
        setTotalItems(r.data.length)
      }
    }
    setLoading(false)
  }, [boardFilter, classFilter, subjectFilter, chapterFilter, topicFilter, typeFilter, difficultyFilter, statusFilter, approvalStatusFilter, search, page, limit])

  // Fetch Stats
  const loadStats = useCallback(async () => {
    const r = await apiRequest<Stats>('/api/super-admin/global-bank/stats')
    if (r.ok && r.data) setStats(r.data)
  }, [])

  useEffect(() => { loadQuestions() }, [loadQuestions])
  useEffect(() => { loadStats() }, [loadStats])

  // Reset selection when questions list updates
  useEffect(() => {
    setSelectedIds([])
  }, [questions])

  // ─── Actions ───────────────────────────────────────────────────────────

  async function deleteQuestion(id: string) {
    if (!confirm('Delete this question permanently?')) return
    const r = await apiRequest(`/api/super-admin/global-bank/questions/${id}`, { method: 'DELETE' })
    if (r.ok) {
      setQuestions(prev => prev.filter(q => q._id !== id))
      toast('Question deleted')
      loadStats()
      loadQuestions()
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

  // ─── Bulk Action Helpers ────────────────────────────────────────────────

  const toggleSelectAll = () => {
    if (selectedIds.length === questions.length) {
      setSelectedIds([])
    } else {
      setSelectedIds(questions.map(q => q._id))
    }
  }

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])
  }

  const handleBulkAction = async (action: 'approve' | 'reject' | 'archive' | 'delete') => {
    if (selectedIds.length === 0) return
    if (action === 'delete' && !confirm(`Delete all ${selectedIds.length} selected questions permanently?`)) return
    
    setBulkActionRunning(true)
    const res = await apiRequest(`/api/super-admin/global-bank/questions/bulk/${action}`, {
      method: 'POST',
      body: JSON.stringify({ ids: selectedIds })
    })
    
    if (res.ok) {
      toast(`Successfully completed bulk ${action} action on ${selectedIds.length} items`)
      setSelectedIds([])
      loadQuestions()
      loadStats()
    } else {
      toast(res.message || `Failed to perform bulk ${action}`)
    }
    setBulkActionRunning(false)
  }

  // ─── Helpers ───────────────────────────────────────────────────────────

  const selectedClassName = useMemo(() => classes.find(c => c._id === classFilter)?.name || '', [classes, classFilter])
  const selectedSubjectName = useMemo(() => subjects.find(s => s._id === subjectFilter)?.name || '', [subjects, subjectFilter])
  
  const totalPages = Math.ceil(totalItems / limit) || 1

  // ─── Render ────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6 pb-20 relative">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Global Question Bank</h1>
          <p className="text-sm text-slate-500 mt-0.5 font-medium">Manage and moderate questions visible to all schools.</p>
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
      <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg w-fit border border-slate-200">
        <button onClick={() => setTab('questions')} className={`px-4 py-2 rounded-md text-sm font-semibold transition-all ${tab === 'questions' ? 'bg-white text-slate-900 shadow-sm border border-slate-200/50' : 'text-slate-500 hover:text-slate-700'}`}>
          📝 Questions
        </button>
        <button onClick={() => setTab('chapters')} className={`px-4 py-2 rounded-md text-sm font-semibold transition-all ${tab === 'chapters' ? 'bg-white text-slate-900 shadow-sm border border-slate-200/50' : 'text-slate-500 hover:text-slate-700'}`}>
          📖 Chapters
        </button>
      </div>

      {/* 5-Tier Cascading Filters */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 space-y-3 shadow-sm">
        <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">Curriculum Path Filters</div>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          <FilterSelect label="Board" value={boardFilter} onChange={setBoardFilter} options={boards.map(b => ({ value: b._id, label: b.name }))} />
          <FilterSelect label="Class" value={classFilter} onChange={setClassFilter} disabled={!boardFilter} options={classes.map(c => ({ value: c._id, label: c.name }))} />
          <FilterSelect label="Subject" value={subjectFilter} onChange={setSubjectFilter} disabled={!classFilter} options={subjects.map(s => ({ value: s._id, label: s.name }))} />
          <FilterSelect label="Chapter" value={chapterFilter} onChange={setChapterFilter} disabled={!subjectFilter} options={chapters.map(c => ({ value: c._id, label: c.title }))} />
          <FilterSelect label="Topic" value={topicFilter} onChange={setTopicFilter} disabled={!chapterFilter} options={topics.map(t => ({ value: t._id, label: t.name }))} />
        </div>

        {tab === 'questions' && (
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3 pt-2 border-t border-slate-100">
            <FilterSelect label="Type" value={typeFilter} onChange={setTypeFilter} options={[{ value: 'mcq', label: 'MCQ' }, { value: 'short', label: 'Short' }, { value: 'long', label: 'Long' }, { value: 'true_false', label: 'True/False' }]} />
            <FilterSelect label="Difficulty" value={difficultyFilter} onChange={setDifficultyFilter} options={[{ value: 'easy', label: 'Easy' }, { value: 'medium', label: 'Medium' }, { value: 'hard', label: 'Hard' }]} />
            <FilterSelect label="Status" value={statusFilter} onChange={setStatusFilter} options={[{ value: 'active', label: 'Active' }, { value: 'archived', label: 'Archived' }]} />
            <FilterSelect label="Moderation" value={approvalStatusFilter} onChange={setApprovalStatusFilter} options={[{ value: 'pending', label: 'Pending Approval' }, { value: 'approved', label: 'Approved' }, { value: 'rejected', label: 'Rejected' }]} />
            <div className="relative">
              <input
                type="text"
                placeholder="Search questions..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="h-9 pl-8 pr-3 rounded-lg border border-slate-200 text-xs w-full focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 bg-white"
              />
              <div className="absolute left-2.5 top-2.5 text-slate-400">
                <AppIcon name="search" size={14} />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Tab actions */}
      <div className="flex justify-end gap-2">
        {tab === 'chapters' && (
          <button onClick={() => setShowAddChapter(true)} className="h-9 px-4 rounded-lg bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-700 transition-colors flex items-center gap-1.5 shadow-sm">
            <AppIcon name="Plus" size={14} /> Add Chapter
          </button>
        )}
        {tab === 'questions' && (
          <button onClick={() => setShowAddQuestion(true)} className="h-9 px-4 rounded-lg bg-blue-600 text-white text-xs font-bold hover:bg-blue-700 transition-colors flex items-center gap-1.5 shadow-sm">
            <AppIcon name="Plus" size={14} /> Add Question
          </button>
        )}
      </div>

      {/* Content */}
      {tab === 'questions' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={questions.length > 0 && selectedIds.length === questions.length}
                onChange={toggleSelectAll}
                className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-xs font-bold text-slate-600">Select All Page Rows</span>
            </div>
            <span className="text-xs text-slate-400 font-medium">Showing {questions.length} of {totalItems} questions</span>
          </div>

          <QuestionsTab
            questions={questions}
            loading={loading}
            selectedIds={selectedIds}
            onSelect={toggleSelect}
            onDelete={deleteQuestion}
            onEdit={q => setEditQuestion(q)}
            boards={boards}
          />

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between bg-white border border-slate-200 px-4 py-3 rounded-xl shadow-sm">
              <button
                onClick={() => setPage(p => Math.max(p - 1, 1))}
                disabled={page === 1}
                className="h-8 px-3 rounded-lg border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 disabled:opacity-50 flex items-center gap-1 transition-all"
              >
                <AppIcon name="arrow_back" size={14} /> Prev
              </button>
              <span className="text-xs font-semibold text-slate-600">
                Page {page} of {totalPages}
              </span>
              <button
                onClick={() => setPage(p => Math.min(p + 1, totalPages))}
                disabled={page === totalPages}
                className="h-8 px-3 rounded-lg border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 disabled:opacity-50 flex items-center gap-1 transition-all"
              >
                Next <AppIcon name="arrow_forward" size={14} />
              </button>
            </div>
          )}
        </div>
      )}
      {tab === 'chapters' && (
        <ChaptersTab chapters={chapters} onDelete={deleteChapter} />
      )}

      {/* Floating Bulk Actions Bar */}
      {selectedIds.length > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-slate-900/95 text-white backdrop-blur-md px-6 py-4 rounded-xl shadow-2xl flex items-center gap-6 border border-slate-800 animate-[slideUp_0.2s_ease-out] z-[40]">
          <div className="flex items-center gap-2">
            <div className="h-5 w-5 bg-blue-600 rounded-full flex items-center justify-center text-[10px] font-bold">
              {selectedIds.length}
            </div>
            <span className="text-xs font-bold text-slate-300">selected</span>
          </div>
          <div className="h-4 w-px bg-slate-800" />
          <div className="flex items-center gap-2">
            <button
              onClick={() => handleBulkAction('approve')}
              disabled={bulkActionRunning}
              className="h-8 px-3 rounded bg-emerald-600 text-white text-[11px] font-bold hover:bg-emerald-700 transition-colors flex items-center gap-1 disabled:opacity-50"
            >
              <AppIcon name="check" size={12} /> Approve
            </button>
            <button
              onClick={() => handleBulkAction('reject')}
              disabled={bulkActionRunning}
              className="h-8 px-3 rounded bg-red-600 text-white text-[11px] font-bold hover:bg-red-700 transition-colors flex items-center gap-1 disabled:opacity-50"
            >
              <AppIcon name="cancel" size={12} /> Reject
            </button>
            <button
              onClick={() => handleBulkAction('archive')}
              disabled={bulkActionRunning}
              className="h-8 px-3 rounded bg-slate-700 text-white text-[11px] font-bold hover:bg-slate-600 transition-colors flex items-center gap-1 disabled:opacity-50"
            >
              <AppIcon name="archive" size={12} /> Archive
            </button>
            <button
              onClick={() => handleBulkAction('delete')}
              disabled={bulkActionRunning}
              className="h-8 px-3 rounded bg-red-950 text-red-200 border border-red-900 hover:bg-red-900/80 hover:text-white transition-all text-[11px] font-bold flex items-center gap-1 disabled:opacity-50"
            >
              <AppIcon name="delete" size={12} /> Delete
            </button>
          </div>
        </div>
      )}

      {/* Add Question Drawer */}
      {(showAddQuestion || editQuestion) && (
        <AddQuestionDrawer
          boards={boards}
          classes={classes}
          subjects={subjects}
          chapters={chapters}
          defaultBoardId={boardFilter}
          defaultClassId={classFilter}
          defaultSubjectId={subjectFilter}
          defaultChapterId={chapterFilter}
          defaultTopicId={topicFilter}
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
    <div className={`rounded-xl border p-4 shadow-sm ${colors[accent] || colors.violet}`}>
      <div className="flex items-center gap-2 mb-1">
        <AppIcon name={icon} size={18} />
        <span className="text-[10px] font-bold uppercase tracking-wide opacity-70">{label}</span>
      </div>
      <p className="text-2xl font-bold">{value}</p>
    </div>
  )
}

function FilterSelect({
  label,
  value,
  onChange,
  options,
  disabled
}: {
  label: string
  value: string
  onChange: (v: string) => void
  options: { value: string; label: string }[]
  disabled?: boolean
}) {
  return (
    <div className="relative">
      <select
        value={value}
        onChange={e => onChange(e.target.value)}
        disabled={disabled}
        className="h-9 w-full px-3 pr-8 rounded-lg border border-slate-200 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 appearance-none disabled:bg-slate-50 disabled:text-slate-400 transition-all font-semibold text-slate-700"
      >
        <option value="">All {label}s</option>
        {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
      <div className="absolute right-2.5 top-2.5 text-slate-400 pointer-events-none">
        <AppIcon name="chevron_down" size={14} />
      </div>
    </div>
  )
}

// ─── Questions Tab ───────────────────────────────────────────────────────

function QuestionsTab({
  questions,
  loading,
  selectedIds,
  onSelect,
  onDelete,
  onEdit,
  boards
}: {
  questions: QuestionItem[]
  loading: boolean
  selectedIds: string[]
  onSelect: (id: string) => void
  onDelete: (id: string) => void
  onEdit: (q: QuestionItem) => void
  boards: BoardItem[]
}) {
  if (loading) return (
    <div className="space-y-3">
      {[1, 2, 3].map(i => <div key={i} className="h-28 bg-slate-100 rounded-xl animate-pulse" />)}
    </div>
  )

  if (questions.length === 0) return (
    <div className="text-center py-16 bg-white rounded-xl border border-slate-200">
      <p className="text-3xl mb-3">📭</p>
      <p className="text-sm font-medium text-slate-600">No global questions found. Add your first question above.</p>
    </div>
  )

  return (
    <div className="space-y-3">
      {questions.map(q => {
        const approvalColors: Record<string, string> = {
          pending: 'bg-amber-100 text-amber-800 border-amber-200',
          approved: 'bg-emerald-100 text-emerald-800 border-emerald-200',
          rejected: 'bg-red-100 text-red-800 border-red-200'
        }
        
        const boardName = boards.find(b => b._id === q.board_id)?.name || ''

        return (
          <div
            key={q._id}
            className={`bg-white rounded-xl border p-4 hover:border-slate-300 transition-colors flex items-start gap-4 ${
              selectedIds.includes(q._id) ? 'border-blue-300 bg-blue-50/10' : 'border-slate-200'
            }`}
          >
            {/* Custom Checkbox */}
            <div className="pt-1 select-none shrink-0">
              <input
                type="checkbox"
                checked={selectedIds.includes(q._id)}
                onChange={() => onSelect(q._id)}
                className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
              />
            </div>

            <div className="flex-1 min-w-0">
              {/* Question HTML */}
              <div className="text-xs text-slate-800 font-semibold leading-relaxed" dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(q.question_html) }} />

              {/* MCQ Options */}
              {q.type === 'mcq' && q.options && (() => {
                try {
                  const opts = JSON.parse(q.options)
                  if (Array.isArray(opts)) return (
                    <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {opts.map((opt: any, i: number) => (
                        <div key={i} className={`text-[11px] px-3 py-1.5 rounded-lg border flex items-center justify-between ${opt.is_correct ? 'bg-emerald-50 border-emerald-200 text-emerald-700 font-bold' : 'bg-slate-50 border-slate-100 text-slate-600 font-medium'}`}>
                          <span>({String.fromCharCode(65 + i)}) {opt.option_text}</span>
                          {opt.is_correct && <AppIcon name="check" size={12} />}
                        </div>
                      ))}
                    </div>
                  )
                } catch { /* ignore */ }
                return null
              })()}

              {/* True/False Indicator */}
              {q.type === 'true_false' && q.options && (
                <div className="mt-2 text-xs font-bold text-slate-600">
                  Correct Answer: <span className="text-blue-600 capitalize">{q.options}</span>
                </div>
              )}

              {/* Metadata Badges */}
              <div className="flex flex-wrap items-center gap-1.5 mt-3.5">
                <span className="text-[9px] font-bold text-violet-600 bg-violet-50 px-2 py-0.5 rounded border border-violet-100">{q.type.toUpperCase()}</span>
                <span className={`text-[9px] font-bold px-2 py-0.5 rounded border ${q.difficulty === 'easy' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : q.difficulty === 'hard' ? 'bg-red-50 text-red-600 border-red-100' : 'bg-amber-50 text-amber-600 border-amber-100'}`}>{q.difficulty}</span>
                <span className="text-[9px] font-bold text-slate-500 bg-slate-50 px-2 py-0.5 rounded border border-slate-200">{q.marks} marks</span>
                {boardName && <span className="text-[9px] font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100">{boardName}</span>}
                {q.subject_name && <span className="text-[9px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded border border-blue-100">{q.subject_name}</span>}
                {q.chapter_name && <span className="text-[9px] font-semibold text-slate-500 bg-slate-50 px-2 py-0.5 rounded border border-slate-100">{q.chapter_name}</span>}
                {q.class_name && <span className="text-[9px] font-medium text-slate-400">{q.class_name}</span>}

                {/* Moderation & status badges */}
                <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full border ml-auto capitalize ${approvalColors[q.approval_status] || 'bg-slate-100 text-slate-800'}`}>
                  {q.approval_status}
                </span>
                {q.status === 'archived' && (
                  <span className="text-[9px] font-bold bg-slate-100 text-slate-600 border border-slate-200 px-2 py-0.5 rounded-full capitalize">
                    Archived
                  </span>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-1.5 shrink-0 select-none">
              <button onClick={() => onEdit(q)} className="h-8 w-8 rounded-lg border border-slate-200 flex items-center justify-center text-slate-500 hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200 transition-colors bg-white shadow-sm" title="Edit">
                <AppIcon name="Pencil" size={14} />
              </button>
              <button onClick={() => onDelete(q._id)} className="h-8 w-8 rounded-lg border border-slate-200 flex items-center justify-center text-slate-500 hover:bg-red-50 hover:text-red-600 hover:border-red-200 transition-colors bg-white shadow-sm" title="Delete">
                <AppIcon name="Trash2" size={14} />
              </button>
            </div>
          </div>
        )
      })}
    </div>
  )
}

// ─── Chapters Tab ────────────────────────────────────────────────────────

function ChaptersTab({ chapters, onDelete }: { chapters: ChapterItem[]; onDelete: (id: string) => void }) {
  if (chapters.length === 0) return (
    <div className="text-center py-16 bg-white rounded-xl border border-slate-200">
      <p className="text-3xl mb-3">📖</p>
      <p className="text-sm font-medium text-slate-600">No chapters found. Select class & subject and add chapters.</p>
    </div>
  )

  return (
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-slate-50 border-b border-slate-200">
            <th className="text-left px-4 py-3 font-bold text-slate-500 text-xs">#</th>
            <th className="text-left px-4 py-3 font-bold text-slate-500 text-xs">Chapter Title</th>
            <th className="text-left px-4 py-3 font-bold text-slate-500 text-xs">Class</th>
            <th className="text-left px-4 py-3 font-bold text-slate-500 text-xs">Subject</th>
            <th className="text-right px-4 py-3 font-bold text-slate-500 text-xs">Actions</th>
          </tr>
        </thead>
        <tbody>
          {chapters.map(ch => (
            <tr key={ch._id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50/50">
              <td className="px-4 py-3 text-slate-500 font-mono text-xs">{ch.chapter_number}</td>
              <td className="px-4 py-3 font-semibold text-slate-800">{ch.title}</td>
              <td className="px-4 py-3 text-slate-500">{ch.class_name || ch.class_id}</td>
              <td className="px-4 py-3 text-slate-500">{ch.subject_name || ch.subject_id}</td>
              <td className="px-4 py-3 text-right">
                <button onClick={() => onDelete(ch._id)} className="h-7 w-7 rounded border border-slate-200 inline-flex items-center justify-center text-slate-400 hover:bg-red-50 hover:text-red-600 hover:border-red-200 transition-colors shadow-sm bg-white">
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
  boards, classes, subjects, chapters,
  defaultBoardId, defaultClassId, defaultSubjectId, defaultChapterId, defaultTopicId,
  editData, onClose, onSaved, onChaptersChanged,
  selectedClassName, selectedSubjectName,
}: {
  boards: BoardItem[]; classes: ClassItem[]; subjects: SubjectItem[]; chapters: ChapterItem[]
  defaultBoardId: string; defaultClassId: string; defaultSubjectId: string; defaultChapterId: string; defaultTopicId: string
  editData: QuestionItem | null
  onClose: () => void; onSaved: () => void; onChaptersChanged: () => void
  selectedClassName: string; selectedSubjectName: string
}) {
  const [boardId, setBoardId] = useState(editData?.board_id || defaultBoardId)
  const [classId, setClassId] = useState(editData?.class_id || defaultClassId)
  const [subjectId, setSubjectId] = useState(editData?.subject_id || defaultSubjectId)
  const [chapterId, setChapterId] = useState(editData?.chapter_id || defaultChapterId)
  const [topicId, setTopicId] = useState(editData?.topic_id || defaultTopicId)
  const [type, setType] = useState(editData?.type || 'short')
  const [difficulty, setDifficulty] = useState(editData?.difficulty || 'medium')
  const [questionHtml, setQuestionHtml] = useState(editData?.question_html || '')
  const [marks, setMarks] = useState(editData?.marks || 2)
  const [options, setOptions] = useState<{ option_text: string; is_correct: boolean }[]>(() => {
    if (editData?.options) {
      try {
        const parsed = JSON.parse(editData.options)
        if (Array.isArray(parsed)) return parsed
      } catch { /* ignore */ }
    }
    return [{ option_text: '', is_correct: true }, { option_text: '', is_correct: false }, { option_text: '', is_correct: false }, { option_text: '', is_correct: false }]
  })
  
  // Local list states for drawer cascading
  const [drawerClasses, setDrawerClasses] = useState<ClassItem[]>([])
  const [drawerSubjects, setDrawerSubjects] = useState<SubjectItem[]>([])
  const [drawerChapters, setDrawerChapters] = useState<ChapterItem[]>([])
  const [drawerTopics, setDrawerTopics] = useState<TopicItem[]>([])
  const [saving, setSaving] = useState(false)

  // Drawer Cascades
  useEffect(() => {
    if (boardId) {
      apiRequest<ClassItem[]>(`/api/super-admin/global-bank/classes?all=true&board_id=${boardId}`).then(r => {
        if (r.ok && r.data) setDrawerClasses(r.data)
      })
    } else {
      setDrawerClasses([])
    }
  }, [boardId])

  useEffect(() => {
    if (classId) {
      apiRequest<SubjectItem[]>(`/api/super-admin/global-bank/subjects?all=true&class_id=${classId}`).then(r => {
        if (r.ok && r.data) setDrawerSubjects(r.data)
      })
    } else {
      setDrawerSubjects([])
    }
  }, [classId])

  useEffect(() => {
    if (classId && subjectId) {
      apiRequest<ChapterItem[]>(`/api/super-admin/global-bank/chapters?class_id=${classId}&subject_id=${subjectId}`).then(r => {
        if (r.ok && r.data) setDrawerChapters(r.data)
      })
    } else {
      setDrawerChapters([])
    }
  }, [classId, subjectId])

  useEffect(() => {
    if (chapterId) {
      apiRequest<TopicItem[]>(`/api/super-admin/global-bank/topics?all=true&chapter_id=${chapterId}`).then(r => {
        if (r.ok && r.data) setDrawerTopics(r.data)
      })
    } else {
      setDrawerTopics([])
    }
  }, [chapterId])

  const className = useMemo(() => classes.find(c => c._id === classId)?.name || selectedClassName, [classes, classId, selectedClassName])
  const subjectName = useMemo(() => subjects.find(s => s._id === subjectId)?.name || selectedSubjectName, [subjects, subjectId, selectedSubjectName])

  async function handleSave() {
    if (!questionHtml.trim() || !classId) {
      toast('Question text and class are required')
      return
    }
    setSaving(true)

    const payload: any = {
      board_id: boardId,
      class_id: classId,
      class_name: className,
      subject_id: subjectId,
      subject_name: subjectName,
      chapter_id: chapterId,
      topic_id: topicId,
      type,
      difficulty,
      question_html: questionHtml,
      marks: Number(marks),
    }

    if (type === 'mcq') {
      payload.options = options.filter(o => o.option_text.trim())
    } else if (type === 'true_false') {
      // True false correct answer stored as string in options
      const tfVal = options.find(o => o.is_correct)?.option_text || 'true'
      payload.options = tfVal
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
      <div className="absolute inset-0 bg-black/45 backdrop-blur-sm" onClick={onClose} />
      <div className="ml-auto w-full max-w-lg bg-white h-full overflow-y-auto relative shadow-2xl animate-[slideLeft_0.2s_ease-out]">
        <div className="sticky top-0 bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between z-10">
          <h2 className="text-base font-bold text-slate-900">{editData ? 'Edit Question' : 'Add Global Question'}</h2>
          <button onClick={onClose} className="h-8 w-8 rounded-lg border border-slate-200 flex items-center justify-center text-slate-500 hover:bg-slate-50">
            <AppIcon name="close" size={18} />
          </button>
        </div>

        <div className="p-6 space-y-4">
          {/* Board */}
          <div>
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1 block">Board *</label>
            <select value={boardId} onChange={e => { setBoardId(e.target.value); setClassId(''); setSubjectId(''); setChapterId(''); setTopicId('') }} className="w-full h-10 px-3 rounded-lg border border-slate-200 text-xs font-semibold text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400">
              <option value="">Select Board</option>
              {boards.map(b => <option key={b._id} value={b._id}>{b.name}</option>)}
            </select>
          </div>

          {/* Class */}
          <div>
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1 block">Class *</label>
            <select value={classId} onChange={e => { setClassId(e.target.value); setSubjectId(''); setChapterId(''); setTopicId('') }} disabled={!boardId} className="w-full h-10 px-3 rounded-lg border border-slate-200 text-xs font-semibold text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400">
              <option value="">Select class</option>
              {drawerClasses.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
            </select>
          </div>

          {/* Subject */}
          <div>
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1 block">Subject</label>
            <select value={subjectId} onChange={e => { setSubjectId(e.target.value); setChapterId(''); setTopicId('') }} disabled={!classId} className="w-full h-10 px-3 rounded-lg border border-slate-200 text-xs font-semibold text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400">
              <option value="">Select subject</option>
              {drawerSubjects.map(s => <option key={s._id} value={s._id}>{s.name}</option>)}
            </select>
          </div>

          {/* Chapter */}
          <div>
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1 block">Chapter</label>
            <select value={chapterId} onChange={e => { setChapterId(e.target.value); setTopicId('') }} disabled={!subjectId} className="w-full h-10 px-3 rounded-lg border border-slate-200 text-xs font-semibold text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400">
              <option value="">Select chapter</option>
              {drawerChapters.map(c => <option key={c._id} value={c._id}>Ch {c.chapter_number}: {c.title}</option>)}
            </select>
          </div>

          {/* Topic */}
          <div>
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1 block">Topic</label>
            <select value={topicId} onChange={e => setTopicId(e.target.value)} disabled={!chapterId} className="w-full h-10 px-3 rounded-lg border border-slate-200 text-xs font-semibold text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400">
              <option value="">Select topic</option>
              {drawerTopics.map(t => <option key={t._id} value={t._id}>{t.name}</option>)}
            </select>
          </div>

          {/* Type & Difficulty */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1 block">Type</label>
              <select value={type} onChange={e => setType(e.target.value)} className="w-full h-10 px-3 rounded-lg border border-slate-200 text-xs font-semibold text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400">
                <option value="mcq">MCQ</option>
                <option value="short">Short Answer</option>
                <option value="long">Long Answer</option>
                <option value="true_false">True/False</option>
              </select>
            </div>
            <div>
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1 block">Difficulty</label>
              <select value={difficulty} onChange={e => setDifficulty(e.target.value)} className="w-full h-10 px-3 rounded-lg border border-slate-200 text-xs font-semibold text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400">
                <option value="easy">Easy</option>
                <option value="medium">Medium</option>
                <option value="hard">Hard</option>
              </select>
            </div>
          </div>

          {/* Marks */}
          <div>
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1 block">Marks</label>
            <input type="number" min={1} max={50} value={marks} onChange={e => setMarks(+e.target.value)} className="w-full h-10 px-3 rounded-lg border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 bg-white" />
          </div>

          {/* Question Text */}
          <div>
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1 block">Question HTML/Text *</label>
            <textarea
              value={questionHtml}
              onChange={e => setQuestionHtml(e.target.value)}
              rows={4}
              placeholder="Enter question text or html..."
              className="w-full px-3 py-2 rounded-lg border border-slate-200 text-xs resize-none focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 bg-white"
            />
          </div>

          {/* MCQ Options */}
          {type === 'mcq' && (
            <div>
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1 block">Options</label>
              <div className="space-y-2">
                {options.map((opt, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="correct_option"
                      checked={opt.is_correct}
                      onChange={() => setOptions(prev => prev.map((o, j) => ({ ...o, is_correct: j === i })))}
                      className="h-4 w-4 text-emerald-600 cursor-pointer"
                    />
                    <input
                      type="text"
                      value={opt.option_text}
                      onChange={e => setOptions(prev => prev.map((o, j) => j === i ? { ...o, option_text: e.target.value } : o))}
                      placeholder={`Option ${String.fromCharCode(65 + i)}`}
                      className="flex-1 h-9 px-3 rounded-lg border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 bg-white"
                    />
                  </div>
                ))}
              </div>
              <p className="text-[9px] text-slate-400 mt-1">Select the correct answer option using the radio check circles</p>
            </div>
          )}

          {/* True / False Options */}
          {type === 'true_false' && (
            <div>
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1 block">Correct True/False Answer</label>
              <div className="flex gap-4">
                <label className="flex items-center gap-1.5 text-xs font-semibold cursor-pointer">
                  <input
                    type="radio"
                    name="tf_correct"
                    checked={options[0]?.is_correct === true}
                    onChange={() => setOptions([{ option_text: 'true', is_correct: true }, { option_text: 'false', is_correct: false }])}
                    className="h-4 w-4 text-blue-600"
                  />
                  True
                </label>
                <label className="flex items-center gap-1.5 text-xs font-semibold cursor-pointer">
                  <input
                    type="radio"
                    name="tf_correct"
                    checked={options[1]?.is_correct === true}
                    onChange={() => setOptions([{ option_text: 'true', is_correct: false }, { option_text: 'false', is_correct: true }])}
                    className="h-4 w-4 text-blue-600"
                  />
                  False
                </label>
              </div>
            </div>
          )}

          {/* Save Button */}
          <button
            onClick={handleSave}
            disabled={saving}
            className="w-full h-11 rounded-lg bg-blue-600 text-white font-bold text-xs hover:bg-blue-700 disabled:opacity-50 transition-colors shadow-sm"
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
      <div className="absolute inset-0 bg-black/45 backdrop-blur-sm" onClick={onClose} />
      <div className="ml-auto w-full max-w-md bg-white h-full overflow-y-auto relative shadow-2xl animate-[slideLeft_0.2s_ease-out]">
        <div className="sticky top-0 bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between z-10">
          <h2 className="text-base font-bold text-slate-900">Add Global Chapter</h2>
          <button onClick={onClose} className="h-8 w-8 rounded-lg border border-slate-200 flex items-center justify-center text-slate-500 hover:bg-slate-50">
            <AppIcon name="close" size={18} />
          </button>
        </div>

        <div className="p-6 space-y-4">
          {/* Class */}
          <div>
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1 block">Class *</label>
            <select value={classId} onChange={e => setClassId(e.target.value)} className="w-full h-10 px-3 rounded-lg border border-slate-200 text-xs font-semibold text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400">
              <option value="">Select class</option>
              {classes.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
            </select>
          </div>

          {/* Subject */}
          <div>
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1 block">Subject</label>
            <select value={subjectId} onChange={e => setSubjectId(e.target.value)} className="w-full h-10 px-3 rounded-lg border border-slate-200 text-xs font-semibold text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400">
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
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1 block">Chapter Title *</label>
                <input type="text" value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. Chapter 1: Introduction" className="w-full h-10 px-3 rounded-lg border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 bg-white" />
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1 block">Chapter Number</label>
                <input type="number" min={1} value={chapterNumber} onChange={e => setChapterNumber(+e.target.value)} className="w-full h-10 px-3 rounded-lg border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 bg-white" />
              </div>
            </>
          ) : (
            <div>
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1 block">Chapters (one per line)</label>
              <textarea
                value={bulkText}
                onChange={e => setBulkText(e.target.value)}
                rows={10}
                placeholder={"Chapter 1: Numbers\nChapter 2: Algebra\nChapter 3: Geometry\n..."}
                className="w-full px-3 py-2.5 rounded-lg border border-slate-200 text-xs resize-none focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 font-mono bg-white"
              />
              <p className="text-[9px] text-slate-400 mt-1">{bulkText.split('\n').filter(l => l.trim()).length} chapters will be created</p>
            </div>
          )}

          <button
            onClick={handleSave}
            disabled={saving}
            className="w-full h-11 rounded-lg bg-emerald-600 text-white font-bold text-xs hover:bg-emerald-700 disabled:opacity-50 transition-colors shadow-sm"
          >
            {saving ? 'Creating...' : bulkMode ? 'Create All Chapters' : 'Create Chapter'}
          </button>
        </div>
      </div>
    </div>
  )
}
