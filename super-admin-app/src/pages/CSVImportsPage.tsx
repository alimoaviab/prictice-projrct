import React, { useState, useEffect, useRef, useCallback } from 'react'
import { apiRequest } from '@/lib/api'
import { AppIcon } from "shared/ui/AppIcon"

// --- Types ---
interface RowPreview {
  row_number: number
  status: 'valid' | 'invalid' | 'duplicate'
  errors: string[]
  data: string[]
}

interface ValidationResponse {
  temp_file_id: string
  file_name: string
  total_rows: number
  valid_rows: number
  invalid_rows: number
  duplicate_rows: number
  preview: RowPreview[]
}

interface ImportLog {
  _id: string
  school_id: string
  uploaded_by: string
  file_name: string
  total_rows: number
  success_rows: number
  failed_rows: number
  duplicates: number
  duration: number
  status: 'processing' | 'completed' | 'failed'
  created_at: string
  updated_at: string
}

interface BoardItem { _id: string; name: string }
interface ClassItem { _id: string; name: string }
interface SubjectItem { _id: string; name: string }
interface ChapterItem { _id: string; title: string; name?: string }

// --- Toast helper ---
function toast(msg: string) {
  const el = document.createElement('div')
  el.className = 'fixed bottom-4 right-4 bg-slate-900 text-white px-4 py-2.5 rounded-lg text-sm font-medium shadow-lg z-[9999] animate-[slideUp_0.3s_ease]'
  el.textContent = msg
  document.body.appendChild(el)
  setTimeout(() => {
    el.style.opacity = '0'
    el.style.transition = 'opacity 0.3s'
    setTimeout(() => el.remove(), 300)
  }, 2500)
}

export function CSVImportsPage() {
  const [dragActive, setDragActive] = useState(false)
  const [file, setFile] = useState<File | null>(null)
  const [validating, setValidating] = useState(false)
  const [validationResult, setValidationResult] = useState<ValidationResponse | null>(null)
  const [confirming, setConfirming] = useState(false)

  // Curriculum mapping states (for custom CSV format)
  const [boards, setBoards] = useState<BoardItem[]>([])
  const [classes, setClasses] = useState<ClassItem[]>([])
  const [subjects, setSubjectItems] = useState<SubjectItem[]>([])
  const [chapters, setChapters] = useState<ChapterItem[]>([])

  const [selectedBoardId, setSelectedBoardId] = useState('')
  const [selectedClassId, setSelectedClassId] = useState('')
  const [selectedSubjectId, setSelectedSubjectId] = useState('')
  const [selectedChapterId, setSelectedChapterId] = useState('')

  // Log list
  const [logs, setLogs] = useState<ImportLog[]>([])
  const [loadingLogs, setLoadingLogs] = useState(false)

  const pollTimerRef = useRef<any>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // --- Load Curriculum Lists ---
  useEffect(() => {
    apiRequest<BoardItem[]>('/api/super-admin/global-bank/boards?all=true').then(r => {
      if (r.ok && r.data) setBoards(r.data)
    })
  }, [])

  useEffect(() => {
    setSelectedClassId('')
    setSelectedSubjectId('')
    setSelectedChapterId('')
    setClasses([])
    setSubjectItems([])
    setChapters([])
    if (selectedBoardId) {
      apiRequest<ClassItem[]>(`/api/super-admin/global-bank/classes?all=true&board_id=${selectedBoardId}`).then(r => {
        if (r.ok && r.data) setClasses(r.data)
      })
    }
  }, [selectedBoardId])

  useEffect(() => {
    setSelectedSubjectId('')
    setSelectedChapterId('')
    setSubjectItems([])
    setChapters([])
    if (selectedClassId) {
      apiRequest<SubjectItem[]>(`/api/super-admin/global-bank/subjects?all=true&class_id=${selectedClassId}`).then(r => {
        if (r.ok && r.data) setSubjectItems(r.data)
      })
    }
  }, [selectedClassId])

  useEffect(() => {
    setSelectedChapterId('')
    setChapters([])
    if (selectedClassId && selectedSubjectId) {
      apiRequest<ChapterItem[]>(`/api/super-admin/global-bank/chapters?all=true&class_id=${selectedClassId}&subject_id=${selectedSubjectId}`).then(r => {
        if (r.ok && r.data) setChapters(r.data)
      })
    }
  }, [selectedClassId, selectedSubjectId])

  // Resolve Names
  const selectedBoardName = boards.find(b => b._id === selectedBoardId)?.name || ''
  const selectedClassName = classes.find(c => c._id === selectedClassId)?.name || ''
  const selectedSubjectName = subjects.find(s => s._id === selectedSubjectId)?.name || ''
  const selectedChapterName = chapters.find(c => c._id === selectedChapterId)?.title || chapters.find(c => c._id === selectedChapterId)?.name || ''

  // --- Load Historic Logs ---
  const loadLogs = useCallback(async () => {
    setLoadingLogs(true)
    const res = await apiRequest<ImportLog[]>('/api/super-admin/global-bank/import-logs')
    if (res.ok && res.data) {
      setLogs(res.data)
    }
    setLoadingLogs(false)
  }, [])

  useEffect(() => {
    loadLogs()
  }, [loadLogs])

  // --- Polling Logic ---
  const activeProcessing = logs.some(l => l.status === 'processing')

  useEffect(() => {
    if (activeProcessing) {
      if (!pollTimerRef.current) {
        pollTimerRef.current = setInterval(async () => {
          const res = await apiRequest<ImportLog[]>('/api/super-admin/global-bank/import-logs')
          if (res.ok && res.data) {
            setLogs(res.data)
            const stillProcessing = res.data.some(l => l.status === 'processing')
            if (!stillProcessing && pollTimerRef.current) {
              clearInterval(pollTimerRef.current)
              pollTimerRef.current = null
              toast('CSV processing completed!')
            }
          }
        }, 2000)
      }
    } else {
      if (pollTimerRef.current) {
        clearInterval(pollTimerRef.current)
        pollTimerRef.current = null
      }
    }
    return () => {
      if (pollTimerRef.current) {
        clearInterval(pollTimerRef.current)
      }
    }
  }, [activeProcessing])

  // --- Drag & Drop handlers ---
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true)
    } else if (e.type === "dragleave") {
      setDragActive(false)
    }
  }

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const droppedFile = e.dataTransfer.files[0]
      if (droppedFile.name.endsWith('.csv')) {
        setFile(droppedFile)
        await validateFile(droppedFile)
      } else {
        toast('Please upload a valid .csv file')
      }
    }
  }

  const handleFileInputChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0]
      setFile(selectedFile)
      await validateFile(selectedFile)
    }
  }

  // --- Validate CSV File API Call ---
  const validateFile = async (csvFile: File) => {
    if (!selectedBoardName || !selectedClassName || !selectedSubjectName || !selectedChapterName) {
      toast('Select syllabus, class, subject, and chapter before uploading')
      setFile(null)
      return
    }
    setValidating(true)
    setValidationResult(null)

    const formData = new FormData()
    formData.append('file', csvFile)

    const queryParams = new URLSearchParams()
    if (selectedBoardName) queryParams.set('board', selectedBoardName)
    if (selectedClassName) queryParams.set('class', selectedClassName)
    if (selectedSubjectName) queryParams.set('subject', selectedSubjectName)
    if (selectedChapterName) queryParams.set('chapter', selectedChapterName)

    const token = localStorage.getItem('sa_token')
    try {
      const res = await fetch(`/api/super-admin/global-bank/import/validate?${queryParams}`, {
        method: 'POST',
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: formData
      })
      const data = await res.json()
      if (res.ok && data.ok) {
        setValidationResult(data.data)
        toast('CSV validation complete!')
      } else {
        setFile(null)
        toast(data.message || 'Validation failed. Check headers.')
      }
    } catch {
      setFile(null)
      toast('Network error during validation')
    } finally {
      setValidating(false)
    }
  }

  // --- Confirm Import API Call ---
  const handleConfirmImport = async () => {
    if (!validationResult) return
    setConfirming(true)

    const res = await apiRequest('/api/super-admin/global-bank/import/confirm', {
      method: 'POST',
      body: JSON.stringify({
        temp_file_id: validationResult.temp_file_id,
        file_name: validationResult.file_name,
        board: selectedBoardName,
        class: selectedClassName,
        subject: selectedSubjectName,
        chapter: selectedChapterName
      })
    })

    if (res.ok) {
      toast('Import queued successfully!')
      setFile(null)
      setValidationResult(null)
      loadLogs()
    } else {
      toast(res.message || 'Failed to start import')
    }
    setConfirming(false)
  }

  // --- Download Failed Rows ---
  const handleDownloadFailed = async (logId: string, fileName: string) => {
    const token = localStorage.getItem('sa_token')
    try {
      const response = await fetch(`/api/super-admin/global-bank/import-logs/${logId}/download-failed`, {
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        }
      })
      if (!response.ok) {
        toast('Could not download failed rows CSV')
        return
      }
      const text = await response.text()
      const blob = new Blob([text], { type: 'text/csv;charset=utf-8;' })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', `failed_rows_${fileName}`)
      document.body.appendChild(link)
      link.click()
      link.remove()
      toast('Downloaded failed rows CSV')
    } catch {
      toast('Error downloading file')
    }
  }

  const cancelUpload = () => {
    setFile(null)
    setValidationResult(null)
  }

  const [showDoc, setShowDoc] = useState(true)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900">CSV Import Engine</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Bulk import questions into the global question bank. Standard 19-column files or custom chapter/question files are supported.
          </p>
        </div>
        <button
          onClick={() => setShowDoc(!showDoc)}
          className="h-9 px-3.5 rounded-lg border border-slate-200 bg-white text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-all flex items-center gap-1.5 shadow-sm"
        >
          <AppIcon name={showDoc ? "VisibilityOff" : "Visibility"} size={15} />
          {showDoc ? "Hide Instructions" : "Show CSV Schema"}
        </button>
      </div>

      {/* CSV Schema Documentation Panel */}
      {showDoc && (
        <div className="bg-gradient-to-r from-blue-50/40 via-indigo-50/20 to-slate-50/60 rounded-xl border border-blue-100 p-5 space-y-4 shadow-sm animate-[fadeIn_0.3s_ease]">
          <div className="flex items-start gap-2.5">
            <div className="h-6 w-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center shrink-0 mt-0.5">
              <AppIcon name="Info" size={14} />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-800">CSV Import Format & Auto-Handling Rules</h2>
              <p className="text-xs text-slate-500 mt-0.5">
                The import engine is designed to handle your 5-column question sheets automatically. It handles deduplication, auto-assigns marks, and dynamically registers new chapters.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 text-xs">
            {/* Required/Core Columns */}
            <div className="bg-white rounded-lg border border-slate-200/80 p-3.5 space-y-2">
              <h3 className="font-bold text-slate-800 flex items-center gap-1.5 text-[11px] uppercase tracking-wider text-blue-600">
                <span>📋</span> Expected Columns (5-Column Layout)
              </h3>
              <div className="space-y-1.5 text-slate-600 leading-relaxed">
                <div><strong>Sr No:</strong> Row serial number (ignored by the importer).</div>
                <div><strong>Chapter:</strong> The chapter name. If the chapter already exists under the selected Class/Subject, it will be reused. If it is new, it will be automatically created.</div>
                <div><strong>Section:</strong> Maps to the Question Topic (e.g. <code>Past Papers</code>, <code>Exercise</code>, <code>Additional</code>). If new, it will be created automatically.</div>
                <div><strong>Question Type:</strong> Must contain <code>Short</code> or <code>Long</code> (e.g. <code>Short Question</code>, <code>Long Question</code>). Mapped automatically.</div>
                <div><strong>Question Text:</strong> The actual text/HTML of the question.</div>
              </div>
            </div>

            {/* Answer Options & Validation */}
            <div className="bg-white rounded-lg border border-slate-200/80 p-3.5 space-y-2">
              <h3 className="font-bold text-slate-800 flex items-center gap-1.5 text-[11px] uppercase tracking-wider text-amber-600">
                <span>⚡</span> Backend Auto-Handling
              </h3>
              <div className="space-y-1.5 text-slate-600 leading-relaxed">
                <div><strong>Automatic Marks:</strong> Marks are assigned automatically based on type (Short Questions = <code>2 marks</code>, Long Questions = <code>5 marks</code>).</div>
                <div><strong>Difficulty Default:</strong> Automatically sets the question difficulty to <code>medium</code>.</div>
                <div><strong>Automatic Deduplication:</strong> If a question text already exists in the database, it will be skipped automatically to avoid creating duplicates.</div>
                <div><strong>Context Mapping:</strong> Remember to select the target <strong>Board</strong>, <strong>Class</strong>, and <strong>Subject</strong> in the dropdowns below before uploading.</div>
              </div>
            </div>
          </div>

          {/* Copyable Example Block */}
          <div className="bg-slate-900 rounded-lg p-3 text-slate-300 font-mono text-[10px] space-y-1.5">
            <div className="flex items-center justify-between text-[9px] uppercase font-bold text-slate-500 border-b border-slate-800 pb-1.5 mb-1.5">
              <span>Your CSV Format Template</span>
              <button 
                onClick={() => {
                  const csvText = `Sr No,Chapter,Section,Question Type,Question Text\n1,15.1 Concepts in Homeostasis,Past Papers,Short Question,What do you mean by homeostasis?\n2,15.1 Concepts in Homeostasis,Past Papers,Short Question,Differentiate between osmoregulation and thermoregulation.\n3,15.5 Excretion in Animals,Past Papers,Long Question,Draw labeled sketch of urea cycle.`;
                  navigator.clipboard.writeText(csvText);
                  toast('Copied to clipboard!');
                }}
                className="hover:text-white transition-colors flex items-center gap-1"
              >
                Copy Template
              </button>
            </div>
            <div className="overflow-x-auto whitespace-pre">
              {"Sr No,Chapter,Section,Question Type,Question Text\n" +
               "1,15.1 Concepts in Homeostasis,Past Papers,Short Question,What do you mean by homeostasis?\n" +
               "2,15.1 Concepts in Homeostasis,Past Papers,Short Question,Differentiate between osmoregulation and thermoregulation.\n" +
               "3,15.5 Excretion in Animals,Past Papers,Long Question,Draw labeled sketch of urea cycle."}
            </div>
          </div>
        </div>
      )}

      {/* Curriculum Mapping Context Card */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 space-y-3 shadow-sm">
        <div>
          <h2 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Curriculum Context Mapping</h2>
          <p className="text-[11px] text-slate-400 mt-0.5">Select target syllabus, class, subject, and chapter before uploading a CSV.</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <div>
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1 block">Syllabus</label>
            <select value={selectedBoardId} onChange={e => setSelectedBoardId(e.target.value)} className="h-9 w-full px-3 rounded-lg border border-slate-200 text-xs font-semibold text-slate-700 bg-white focus:outline-none focus:ring-1 focus:ring-blue-500">
              <option value="">Select Syllabus</option>
              {boards.map(b => <option key={b._id} value={b._id}>{b.name}</option>)}
            </select>
          </div>
          <div>
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1 block">Class</label>
            <select value={selectedClassId} onChange={e => setSelectedClassId(e.target.value)} disabled={!selectedBoardId} className="h-9 w-full px-3 rounded-lg border border-slate-200 text-xs font-semibold text-slate-700 bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:bg-slate-50">
              <option value="">Select Class</option>
              {classes.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
            </select>
          </div>
          <div>
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1 block">Subject</label>
            <select value={selectedSubjectId} onChange={e => setSelectedSubjectId(e.target.value)} disabled={!selectedClassId} className="h-9 w-full px-3 rounded-lg border border-slate-200 text-xs font-semibold text-slate-700 bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:bg-slate-50">
              <option value="">Select Subject</option>
              {subjects.map(s => <option key={s._id} value={s._id}>{s.name}</option>)}
            </select>
          </div>
          <div>
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1 block">Chapter</label>
            <select value={selectedChapterId} onChange={e => setSelectedChapterId(e.target.value)} disabled={!selectedSubjectId} className="h-9 w-full px-3 rounded-lg border border-slate-200 text-xs font-semibold text-slate-700 bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:bg-slate-50">
              <option value="">Select Chapter</option>
              {chapters.map(c => <option key={c._id} value={c._id}>{c.title || c.name}</option>)}
            </select>
          </div>
        </div>
      </div>

      {/* Drag & Drop Upload Zone */}
      {!file && (
        <div
          onDragEnter={handleDrag}
          onDragOver={handleDrag}
          onDragLeave={handleDrag}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`border-2 border-dashed rounded-xl p-8 flex flex-col items-center justify-center cursor-pointer transition-all ${dragActive
              ? 'border-blue-500 bg-blue-50/40'
              : 'border-slate-300 bg-white hover:bg-slate-50/50 hover:border-slate-400'
            }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv"
            onChange={handleFileInputChange}
            className="hidden"
          />
          <div className="h-12 w-12 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center mb-3">
            <AppIcon name="CloudUpload" size={24} />
          </div>
          <p className="text-sm font-bold text-slate-800">Drag & drop your CSV file here</p>
          <p className="text-xs text-slate-400 mt-1">or click to browse files (maximum size 10MB)</p>
          <div className="mt-4 flex gap-2 flex-wrap justify-center text-[10px] text-slate-500 font-medium">
            <span className="bg-slate-100 px-2 py-0.5 rounded">Custom 5-column formats</span>
            <span className="bg-slate-100 px-2 py-0.5 rounded">Standard 19-column schema</span>
            <span className="bg-slate-100 px-2 py-0.5 rounded">Duplicate check</span>
          </div>
        </div>
      )}

      {/* Validating indicator */}
      {validating && (
        <div className="bg-white rounded-xl border border-slate-200 p-8 flex flex-col items-center justify-center text-center">
          <div className="h-8 w-8 border-2 border-slate-200 border-t-blue-600 rounded-full animate-spin mb-3" />
          <p className="text-sm font-medium text-slate-800">Validating CSV rows...</p>
          <p className="text-xs text-slate-400 mt-1">Parsing schema columns, identifying duplicates and verifying types.</p>
        </div>
      )}

      {/* Validation Result Preview */}
      {file && validationResult && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden animate-[fadeIn_0.2s_ease]">
          <div className="p-4 border-b border-slate-100 bg-slate-50/60 flex flex-wrap items-center justify-between gap-3">
            <div>
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Uploaded file</span>
              <span className="text-sm font-bold text-slate-800 flex items-center gap-1.5 mt-0.5">
                📄 {file.name}
              </span>
            </div>
            <div className="flex gap-2">
              <button
                onClick={cancelUpload}
                className="h-9 px-3 rounded-lg border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmImport}
                disabled={confirming || validationResult.valid_rows === 0}
                className="h-9 px-4 rounded-lg bg-blue-600 text-white text-xs font-bold hover:bg-blue-700 transition-all flex items-center gap-1.5 shadow-sm disabled:opacity-50"
              >
                {confirming ? 'Queuing...' : 'Confirm & Import'}
              </button>
            </div>
          </div>

          {/* Validation Metrics Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 border-b border-slate-100">
            <div className="p-4 border-r border-slate-100">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Total Rows</span>
              <span className="text-xl font-bold text-slate-800 mt-1 block">{validationResult.total_rows}</span>
            </div>
            <div className="p-4 border-r border-slate-100 bg-emerald-50/20">
              <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider block">Valid Rows</span>
              <span className="text-xl font-bold text-emerald-700 mt-1 block">{validationResult.valid_rows}</span>
            </div>
            <div className="p-4 border-r border-slate-100 bg-red-50/20">
              <span className="text-[10px] font-bold text-red-600 uppercase tracking-wider block">Invalid Rows</span>
              <span className="text-xl font-bold text-red-700 mt-1 block">{validationResult.invalid_rows}</span>
            </div>
            <div className="p-4 bg-amber-50/20">
              <span className="text-[10px] font-bold text-amber-600 uppercase tracking-wider block">Duplicates Found</span>
              <span className="text-xl font-bold text-amber-700 mt-1 block">{validationResult.duplicate_rows}</span>
            </div>
          </div>

          {/* Row Preview Table */}
          <div className="p-4">
            <h3 className="text-xs font-bold text-slate-800 mb-3">Row Validation Log (Previewing up to 20 rows)</h3>
            <div className="overflow-x-auto rounded-lg border border-slate-100">
              <table className="w-full text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-100 text-slate-500 font-semibold text-left">
                    <th className="px-3 py-2 w-16">Row</th>
                    <th className="px-3 py-2 w-24">Status</th>
                    <th className="px-3 py-2 w-48">Validation Errors</th>
                    <th className="px-3 py-2">Parsed Question Text</th>
                  </tr>
                </thead>
                <tbody>
                  {validationResult.preview.map((preview, i) => {
                    // Try to extract question based on index mapping (standard index is 7, custom is index 4)
                    let questionText = preview.errors.includes("question is required") ? "" : (preview.data[7] || preview.data[4] || preview.data[preview.data.length - 1] || '')
                    return (
                      <tr
                        key={i}
                        className={`border-b border-slate-50 last:border-0 hover:bg-slate-50/30 ${preview.status === 'invalid'
                            ? 'bg-red-50/15'
                            : preview.status === 'duplicate'
                              ? 'bg-amber-50/15'
                              : 'bg-emerald-50/10'
                          }`}
                      >
                        <td className="px-3 py-2.5 font-mono text-slate-500">{preview.row_number}</td>
                        <td className="px-3 py-2.5">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${preview.status === 'valid'
                                ? 'bg-emerald-100 text-emerald-700'
                                : preview.status === 'invalid'
                                  ? 'bg-red-100 text-red-700'
                                  : 'bg-amber-100 text-amber-700'
                              }`}
                          >
                            {preview.status}
                          </span>
                        </td>
                        <td className="px-3 py-2.5 font-medium text-red-600">
                          {preview.errors.join('; ') || <span className="text-emerald-600 font-normal">None</span>}
                        </td>
                        <td className="px-3 py-2.5 text-slate-600 truncate max-w-xs" title={questionText}>
                          {questionText}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Import Log History Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/55">
          <h2 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
            Import History Log
          </h2>
          <button
            onClick={loadLogs}
            disabled={loadingLogs}
            className="h-8 w-8 rounded-lg border border-slate-200 flex items-center justify-center text-slate-500 hover:bg-slate-50 transition-colors"
          >
            <AppIcon name="sync" size={14} className={loadingLogs ? 'animate-spin' : ''} />
          </button>
        </div>

        <div className="overflow-x-auto">
          {logs.length === 0 ? (
            <div className="text-center py-12 text-sm text-slate-400">
              {loadingLogs ? 'Loading import logs...' : 'No historical logs found.'}
            </div>
          ) : (
            <table className="w-full text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold text-left">
                  <th className="px-4 py-3">Date</th>
                  <th className="px-4 py-3">File Name</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-center">Total</th>
                  <th className="px-4 py-3 text-center">Success</th>
                  <th className="px-4 py-3 text-center">Duplicates</th>
                  <th className="px-4 py-3 text-center">Failed</th>
                  <th className="px-4 py-3 text-center">Time</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {logs.map(log => {
                  const statusColors = {
                    processing: 'bg-blue-100 text-blue-800 border-blue-200',
                    completed: 'bg-emerald-100 text-emerald-800 border-emerald-200',
                    failed: 'bg-red-100 text-red-800 border-red-200'
                  }
                  return (
                    <tr key={log._id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50/50">
                      <td className="px-4 py-3 text-slate-500 whitespace-nowrap">
                        {new Date(log.created_at).toLocaleString()}
                      </td>
                      <td className="px-4 py-3 font-semibold text-slate-800 max-w-[200px] truncate" title={log.file_name}>
                        {log.file_name}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border flex items-center gap-1 w-fit capitalize ${statusColors[log.status]}`}>
                          {log.status === 'processing' && <div className="h-1.5 w-1.5 bg-blue-600 rounded-full animate-ping" />}
                          {log.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center font-semibold text-slate-700">{log.total_rows}</td>
                      <td className="px-4 py-3 text-center text-emerald-600 font-bold">{log.success_rows}</td>
                      <td className="px-4 py-3 text-center text-amber-600 font-bold">{log.duplicates}</td>
                      <td className="px-4 py-3 text-center text-red-600 font-bold">{log.failed_rows}</td>
                      <td className="px-4 py-3 text-center text-slate-500 font-mono">
                        {log.duration ? `${(log.duration / 1000).toFixed(1)}s` : '-'}
                      </td>
                      <td className="px-4 py-3 text-right">
                        {log.failed_rows > 0 && (
                          <button
                            onClick={() => handleDownloadFailed(log._id, log.file_name)}
                            className="h-7 px-2.5 rounded border border-red-200 text-red-600 bg-red-50 hover:bg-red-100 text-[10px] font-bold transition-all inline-flex items-center gap-1"
                          >
                            <AppIcon name="Download" size={12} /> Download Failed Rows
                          </button>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  )
}
