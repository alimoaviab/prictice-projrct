/**
 * Community Moderation — Super Admin reviews teacher-submitted questions.
 * Approve → question becomes globally visible to all schools.
 * Reject → question stays private to creator teacher.
 */

import { useState, useEffect, useMemo } from 'react'
import { apiRequest } from '@/lib/api'

type ApprovalTab = 'pending' | 'approved' | 'rejected'

interface BankQuestion {
  _id: string
  school_id: string
  created_by: string
  created_by_name: string
  school_name: string
  board: string
  class_name: string
  subject: string
  chapter: string
  type: string
  difficulty: string
  question_html: string
  options?: { option_text: string; is_correct: boolean }[]
  visibility: string
  approval_status: string
  created_at: string
}

export function ModerationPage() {
  const [tab, setTab] = useState<ApprovalTab>('pending')
  const [questions, setQuestions] = useState<BankQuestion[]>([])
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  async function loadQuestions() {
    setLoading(true)
    const result = await apiRequest<BankQuestion[]>(`/api/question-bank/moderation?approval_status=${tab}`)
    if (result.ok && result.data) {
      const data = Array.isArray(result.data) ? result.data : (result.data as any)?.data || []
      setQuestions(data)
    } else {
      setQuestions([])
    }
    setLoading(false)
  }

  useEffect(() => {
    loadQuestions()
  }, [tab])

  async function handleApprove(id: string) {
    setActionLoading(id)
    const result = await apiRequest(`/api/question-bank/${id}/approve`, { method: 'POST' })
    if (result.ok) {
      setQuestions((prev) => prev.filter((q) => q._id !== id))
    }
    setActionLoading(null)
  }

  async function handleReject(id: string) {
    setActionLoading(id)
    const result = await apiRequest(`/api/question-bank/${id}/reject`, { method: 'POST' })
    if (result.ok) {
      setQuestions((prev) => prev.filter((q) => q._id !== id))
    }
    setActionLoading(null)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Community Moderation</h1>
          <p className="text-sm text-slate-500 mt-0.5">Review and approve teacher-submitted questions for the global question bank.</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg w-fit">
        {([
          { key: 'pending', label: '🟡 Pending', count: tab === 'pending' ? questions.length : null },
          { key: 'approved', label: '🟢 Approved', count: null },
          { key: 'rejected', label: '🔴 Rejected', count: null },
        ] as { key: ApprovalTab; label: string; count: number | null }[]).map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              tab === t.key ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            {t.label}
            {t.count !== null && t.count > 0 && (
              <span className="ml-1.5 bg-amber-100 text-amber-700 text-xs font-bold px-1.5 py-0.5 rounded-full">{t.count}</span>
            )}
          </button>
        ))}
      </div>

      {/* Loading */}
      {loading && (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-32 bg-slate-100 rounded-xl animate-pulse" />
          ))}
        </div>
      )}

      {/* Empty */}
      {!loading && questions.length === 0 && (
        <div className="text-center py-16 bg-white rounded-xl border border-slate-200">
          <p className="text-3xl mb-3">{tab === 'pending' ? '✅' : tab === 'approved' ? '📚' : '📭'}</p>
          <p className="text-sm font-medium text-slate-600">
            {tab === 'pending' ? 'No questions pending review' : tab === 'approved' ? 'No approved questions yet' : 'No rejected questions'}
          </p>
        </div>
      )}

      {/* Question Cards */}
      {!loading && questions.length > 0 && (
        <div className="space-y-4">
          {questions.map((q) => (
            <div key={q._id} className="bg-white rounded-xl border border-slate-200 p-5 hover:border-slate-300 transition-colors">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  {/* Question text */}
                  <div
                    className="text-sm text-slate-800 font-medium leading-relaxed"
                    dangerouslySetInnerHTML={{ __html: q.question_html }}
                  />

                  {/* MCQ options */}
                  {q.type === 'mcq' && q.options && q.options.length > 0 && (
                    <div className="mt-3 grid grid-cols-2 gap-2">
                      {q.options.map((opt, i) => (
                        <div
                          key={i}
                          className={`text-xs px-3 py-2 rounded-lg border ${
                            opt.is_correct ? 'bg-emerald-50 border-emerald-200 text-emerald-700 font-bold' : 'bg-slate-50 border-slate-100 text-slate-600'
                          }`}
                        >
                          ({String.fromCharCode(65 + i)}) {opt.option_text}
                          {opt.is_correct && <span className="ml-1">✓</span>}
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Meta */}
                  <div className="flex flex-wrap items-center gap-2 mt-3">
                    <span className="text-[10px] font-bold text-violet-600 bg-violet-50 px-2 py-0.5 rounded">{q.type.toUpperCase()}</span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${q.difficulty === 'easy' ? 'bg-emerald-50 text-emerald-600' : q.difficulty === 'hard' ? 'bg-red-50 text-red-600' : 'bg-amber-50 text-amber-600'}`}>{q.difficulty}</span>
                    {q.class_name && <span className="text-[10px] text-slate-500 bg-slate-50 px-2 py-0.5 rounded">{q.class_name}</span>}
                    {q.subject && <span className="text-[10px] text-slate-500">· {q.subject}</span>}
                    {q.chapter && <span className="text-[10px] text-slate-400">· {q.chapter}</span>}
                  </div>

                  {/* Teacher info */}
                  <div className="flex items-center gap-2 mt-2 text-[10px] text-slate-400">
                    <span>By: {q.created_by_name || 'Teacher'}</span>
                    {q.school_name && <span>· {q.school_name}</span>}
                    <span>· {new Date(q.created_at).toLocaleDateString()}</span>
                  </div>
                </div>

                {/* Actions */}
                {tab === 'pending' && (
                  <div className="flex flex-col gap-2 shrink-0">
                    <button
                      onClick={() => handleApprove(q._id)}
                      disabled={actionLoading === q._id}
                      className="h-9 px-4 rounded-lg bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-700 disabled:opacity-50 transition-colors"
                    >
                      ✅ Approve
                    </button>
                    <button
                      onClick={() => handleReject(q._id)}
                      disabled={actionLoading === q._id}
                      className="h-9 px-4 rounded-lg bg-red-50 text-red-600 text-xs font-bold border border-red-200 hover:bg-red-100 disabled:opacity-50 transition-colors"
                    >
                      ❌ Reject
                    </button>
                  </div>
                )}

                {tab === 'approved' && (
                  <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded">Global</span>
                )}

                {tab === 'rejected' && (
                  <span className="text-[10px] font-bold text-red-600 bg-red-50 px-2 py-1 rounded">Private</span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
