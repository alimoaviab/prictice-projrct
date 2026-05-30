import { useState, useEffect, useCallback, useMemo } from 'react'
import { apiRequest } from '@/lib/api'
import { AppIcon } from "shared/ui/AppIcon"

// --- Types ---
interface Board {
  _id: string
  name: string
  code: string
  is_active: boolean
  created_at: string
  updated_at: string
}

interface ClassItem {
  _id: string
  board_id: string
  name: string
  code: string
  grade: string
  section: string
  status: string
  is_active: boolean
  created_at: string
  updated_at: string
}

interface Subject {
  _id: string
  class_id: string
  name: string
  code: string
  status: string
  is_active: boolean
  created_at: string
  updated_at: string
}

interface Chapter {
  _id: string
  class_id: string
  class_name?: string
  subject_id: string
  subject_name?: string
  title: string
  chapter_number: number
  status: string
  created_at: string
  updated_at: string
}

interface Topic {
  _id: string
  chapter_id: string
  name: string
  code: string
  description?: string
  is_active: boolean
  created_at: string
  updated_at: string
}

interface QuestionItem {
  _id: string
  board_id?: string
  class_id: string
  class_name?: string
  subject_id: string
  subject_name?: string
  chapter_id: string
  chapter_name?: string
  topic_id?: string
  type: string
  difficulty: string
  question_html: string
  options?: string
  marks: number
  is_global: boolean
  status: string
  approval_status: string
  created_at: string
}

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

export function HierarchyPage() {
  // Lists
  const [boards, setBoards] = useState<Board[]>([])
  const [classes, setClasses] = useState<ClassItem[]>([])
  const [subjects, setSubjects] = useState<Subject[]>([])
  const [chapters, setChapters] = useState<Chapter[]>([])
  const [topics, setTopics] = useState<Topic[]>([])

  // Selection states (Cascading cascade keys)
  const [selectedBoardId, setSelectedBoardId] = useState<string>('')
  const [selectedClassId, setSelectedClassId] = useState<string>('')
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>('')
  const [selectedChapterId, setSelectedChapterId] = useState<string>('')
  const [selectedTopicId, setSelectedTopicId] = useState<string>('')

  // Search states for filtering columns locally
  const [boardSearch, setBoardSearch] = useState('')
  const [classSearch, setClassSearch] = useState('')
  const [subjectSearch, setSubjectSearch] = useState('')
  const [chapterSearch, setChapterSearch] = useState('')
  const [topicSearch, setTopicSearch] = useState('')

  // Loading states
  const [loadingBoards, setLoadingBoards] = useState(false)
  const [loadingClasses, setLoadingClasses] = useState(false)
  const [loadingSubjects, setLoadingSubjects] = useState(false)
  const [loadingChapters, setLoadingChapters] = useState(false)
  const [loadingTopics, setLoadingTopics] = useState(false)

  // Modal forms state
  const [modalType, setModalType] = useState<'board' | 'class' | 'subject' | 'chapter' | 'topic' | null>(null)
  const [modalAction, setModalAction] = useState<'create' | 'edit'>('create')
  const [editingItem, setEditingItem] = useState<any | null>(null)

  // Form Fields
  const [formName, setFormName] = useState('')
  const [formCode, setFormCode] = useState('')
  const [formIsActive, setFormIsActive] = useState(true)
  const [formGrade, setFormGrade] = useState('')
  const [formSection, setFormSection] = useState('')
  const [formTitle, setFormTitle] = useState('')
  const [formChapterNumber, setFormChapterNumber] = useState(1)
  const [formDescription, setFormDescription] = useState('')

  // Questions Preview states
  const [questions, setQuestions] = useState<QuestionItem[]>([])
  const [loadingQuestions, setLoadingQuestions] = useState(false)
  const [questionSearch, setQuestionSearch] = useState('')
  const [questionTypeFilter, setQuestionTypeFilter] = useState('')
  const [questionDifficultyFilter, setQuestionDifficultyFilter] = useState('')

  // CSV Direct Import States
  const [showImportModal, setShowImportModal] = useState(false)
  const [importFile, setImportFile] = useState<File | null>(null)
  const [importValidating, setImportValidating] = useState(false)
  const [importValidationResult, setImportValidationResult] = useState<ValidationResponse | null>(null)
  const [importConfirming, setImportConfirming] = useState(false)
  const [importStatus, setImportStatus] = useState<'idle' | 'processing' | 'completed' | 'failed'>('idle')
  const [importLogId, setImportLogId] = useState('')
  const [dragActive, setDragActive] = useState(false)

  // --- Loaders ---
  const fetchBoards = useCallback(async () => {
    setLoadingBoards(true)
    const res = await apiRequest<Board[]>('/api/super-admin/global-bank/boards?all=true')
    if (res.ok && res.data) {
      setBoards(res.data)
    }
    setLoadingBoards(false)
  }, [])

  const fetchClasses = useCallback(async (boardId: string) => {
    if (!boardId) {
      setClasses([])
      return
    }
    setLoadingClasses(true)
    const res = await apiRequest<ClassItem[]>(`/api/super-admin/global-bank/classes?all=true&board_id=${boardId}`)
    if (res.ok && res.data) {
      setClasses(res.data)
    }
    setLoadingClasses(false)
  }, [])

  const fetchSubjects = useCallback(async (classId: string) => {
    if (!classId) {
      setSubjects([])
      return
    }
    setLoadingSubjects(true)
    const res = await apiRequest<Subject[]>(`/api/super-admin/global-bank/subjects?all=true&class_id=${classId}`)
    if (res.ok && res.data) {
      setSubjects(res.data)
    }
    setLoadingSubjects(false)
  }, [])

  const fetchChapters = useCallback(async (classId: string, subjectId: string) => {
    if (!classId || !subjectId) {
      setChapters([])
      return
    }
    setLoadingChapters(true)
    const res = await apiRequest<Chapter[]>(`/api/super-admin/global-bank/chapters?class_id=${classId}&subject_id=${subjectId}`)
    if (res.ok && res.data) {
      setChapters(res.data)
    }
    setLoadingChapters(false)
  }, [])

  const fetchTopics = useCallback(async (chapterId: string) => {
    if (!chapterId) {
      setTopics([])
      return
    }
    setLoadingTopics(true)
    const res = await apiRequest<Topic[]>(`/api/super-admin/global-bank/topics?all=true&chapter_id=${chapterId}`)
    if (res.ok && res.data) {
      setTopics(res.data)
    }
    setLoadingTopics(false)
  }, [])

  const fetchQuestions = useCallback(async (chapterId: string, topicId?: string) => {
    if (!chapterId) {
      setQuestions([])
      return
    }
    setLoadingQuestions(true)
    let url = `/api/super-admin/global-bank/questions?chapter_id=${chapterId}&status=all&approval_status=all`
    if (topicId) {
      url += `&topic_id=${topicId}`
    }
    const res = await apiRequest<QuestionItem[]>(url)
    if (res.ok && res.data) {
      if (Array.isArray(res.data)) {
        setQuestions(res.data)
      } else if (res.data && 'items' in res.data && Array.isArray((res.data as any).items)) {
        setQuestions((res.data as any).items)
      } else {
        setQuestions([])
      }
    } else {
      setQuestions([])
    }
    setLoadingQuestions(false)
  }, [])

  // --- Initial Mount ---
  useEffect(() => {
    fetchBoards()
  }, [fetchBoards])

  // --- Cascading Effects ---
  useEffect(() => {
    fetchClasses(selectedBoardId)
    setSelectedClassId('')
    setClasses([])
  }, [selectedBoardId, fetchClasses])

  useEffect(() => {
    fetchSubjects(selectedClassId)
    setSelectedSubjectId('')
    setSubjects([])
  }, [selectedClassId, fetchSubjects])

  useEffect(() => {
    fetchChapters(selectedClassId, selectedSubjectId)
    setSelectedChapterId('')
    setChapters([])
  }, [selectedClassId, selectedSubjectId, fetchChapters])

  useEffect(() => {
    fetchTopics(selectedChapterId)
    setSelectedTopicId('')
    setTopics([])
  }, [selectedChapterId, fetchTopics])

  // Load questions when chapter or topic changes
  useEffect(() => {
    if (selectedChapterId) {
      fetchQuestions(selectedChapterId, selectedTopicId)
    } else {
      setQuestions([])
    }
  }, [selectedChapterId, selectedTopicId, fetchQuestions])

  // --- Toggle Active/Inactive States ---
  const toggleBoardActive = async (board: Board) => {
    const nextActive = !board.is_active
    const res = await apiRequest(`/api/super-admin/global-bank/boards/${board._id}`, {
      method: 'PUT',
      body: JSON.stringify({ is_active: nextActive })
    })
    if (res.ok) {
      setBoards(prev => prev.map(b => b._id === board._id ? { ...b, is_active: nextActive } : b))
      toast(`Board "${board.name}" is now ${nextActive ? 'Active' : 'Inactive'}`)
    } else {
      toast(res.message || 'Error updating board status')
    }
  }

  const toggleClassActive = async (cls: ClassItem) => {
    const nextStatus = cls.status === 'active' ? 'inactive' : 'active'
    const res = await apiRequest(`/api/super-admin/global-bank/classes/${cls._id}`, {
      method: 'PUT',
      body: JSON.stringify({ status: nextStatus })
    })
    if (res.ok) {
      setClasses(prev => prev.map(c => c._id === cls._id ? { ...c, status: nextStatus, is_active: nextStatus === 'active' } : c))
      toast(`Class "${cls.name}" is now ${nextStatus === 'active' ? 'Active' : 'Inactive'}`)
    } else {
      toast(res.message || 'Error updating class status')
    }
  }

  const toggleSubjectActive = async (subj: Subject) => {
    const nextStatus = subj.status === 'active' ? 'inactive' : 'active'
    const res = await apiRequest(`/api/super-admin/global-bank/subjects/${subj._id}`, {
      method: 'PUT',
      body: JSON.stringify({ status: nextStatus })
    })
    if (res.ok) {
      setSubjects(prev => prev.map(s => s._id === subj._id ? { ...s, status: nextStatus, is_active: nextStatus === 'active' } : s))
      toast(`Subject "${subj.name}" is now ${nextStatus === 'active' ? 'Active' : 'Inactive'}`)
    } else {
      toast(res.message || 'Error updating subject status')
    }
  }

  const toggleTopicActive = async (topic: Topic) => {
    const nextActive = !topic.is_active
    const res = await apiRequest(`/api/super-admin/global-bank/topics/${topic._id}`, {
      method: 'PUT',
      body: JSON.stringify({ is_active: nextActive })
    })
    if (res.ok) {
      setTopics(prev => prev.map(t => t._id === topic._id ? { ...t, is_active: nextActive } : t))
      toast(`Topic "${topic.name}" is now ${nextActive ? 'Active' : 'Inactive'}`)
    } else {
      toast(res.message || 'Error updating topic status')
    }
  }

  // --- Deletion Handlers ---
  const handleDeleteBoard = async (id: string) => {
    if (!confirm('Are you sure you want to delete this board? This will delete all cascading entries.')) return
    const res = await apiRequest(`/api/super-admin/global-bank/boards/${id}`, { method: 'DELETE' })
    if (res.ok) {
      setBoards(prev => prev.filter(b => b._id !== id))
      if (selectedBoardId === id) setSelectedBoardId('')
      toast('Board deleted successfully')
    } else {
      toast(res.message || 'Error deleting board')
    }
  }

  const handleDeleteClass = async (id: string) => {
    if (!confirm('Are you sure you want to delete this class? This will delete all subjects, chapters, and topics inside.')) return
    const res = await apiRequest(`/api/super-admin/global-bank/classes/${id}`, { method: 'DELETE' })
    if (res.ok) {
      setClasses(prev => prev.filter(c => c._id !== id))
      if (selectedClassId === id) setSelectedClassId('')
      toast('Class deleted successfully')
    } else {
      toast(res.message || 'Error deleting class')
    }
  }

  // Question Action Handlers
  const handleApproveQuestion = async (id: string) => {
    const res = await apiRequest(`/api/super-admin/global-bank/questions/${id}`, {
      method: 'PUT',
      body: JSON.stringify({ approval_status: 'approved' })
    })
    if (res.ok) {
      toast('Question approved successfully')
      fetchQuestions(selectedChapterId, selectedTopicId)
    } else {
      toast(res.message || 'Failed to approve question')
    }
  }

  const handleRejectQuestion = async (id: string) => {
    const res = await apiRequest(`/api/super-admin/global-bank/questions/${id}`, {
      method: 'PUT',
      body: JSON.stringify({ approval_status: 'rejected' })
    })
    if (res.ok) {
      toast('Question rejected successfully')
      fetchQuestions(selectedChapterId, selectedTopicId)
    } else {
      toast(res.message || 'Failed to reject question')
    }
  }

  const handleDeleteQuestion = async (id: string) => {
    if (!confirm('Are you sure you want to delete this question?')) return
    const res = await apiRequest(`/api/super-admin/global-bank/questions/${id}`, {
      method: 'DELETE'
    })
    if (res.ok) {
      toast('Question deleted successfully')
      fetchQuestions(selectedChapterId, selectedTopicId)
    } else {
      toast(res.message || 'Failed to delete question')
    }
  }

  const handleDeleteSubject = async (id: string) => {
    if (!confirm('Are you sure you want to delete this subject? This will delete all chapters and topics inside.')) return
    const res = await apiRequest(`/api/super-admin/global-bank/subjects/${id}`, { method: 'DELETE' })
    if (res.ok) {
      setSubjects(prev => prev.filter(s => s._id !== id))
      if (selectedSubjectId === id) setSelectedSubjectId('')
      toast('Subject deleted successfully')
    } else {
      toast(res.message || 'Error deleting subject')
    }
  }

  const handleDeleteChapter = async (id: string) => {
    if (!confirm('Are you sure you want to delete this chapter? This will delete all topics inside.')) return
    const res = await apiRequest(`/api/super-admin/global-bank/chapters/${id}`, { method: 'DELETE' })
    if (res.ok) {
      setChapters(prev => prev.filter(c => c._id !== id))
      if (selectedChapterId === id) setSelectedChapterId('')
      toast('Chapter deleted successfully')
    } else {
      toast(res.message || 'Error deleting chapter')
    }
  }

  const handleDeleteTopic = async (id: string) => {
    if (!confirm('Are you sure you want to delete this topic?')) return
    const res = await apiRequest(`/api/super-admin/global-bank/topics/${id}`, { method: 'DELETE' })
    if (res.ok) {
      setTopics(prev => prev.filter(t => t._id !== id))
      if (selectedTopicId === id) setSelectedTopicId('')
      toast('Topic deleted successfully')
    } else {
      toast(res.message || 'Error deleting topic')
    }
  }

  // --- Modal Open Helper ---
  const openModal = (type: typeof modalType, action: 'create' | 'edit', item?: any) => {
    setModalType(type)
    setModalAction(action)
    setEditingItem(item || null)

    // Prepopulate inputs
    if (action === 'edit' && item) {
      setFormName(item.name || item.title || '')
      setFormCode(item.code || '')
      setFormIsActive(item.is_active ?? (item.status === 'active'))
      setFormGrade(item.grade || '')
      setFormSection(item.section || '')
      setFormTitle(item.title || '')
      setFormChapterNumber(item.chapter_number || 1)
      setFormDescription(item.description || '')
    } else {
      setFormName('')
      setFormCode('')
      setFormIsActive(true)
      setFormGrade('')
      setFormSection('')
      setFormTitle('')
      setFormChapterNumber((type === 'chapter' ? chapters.length + 1 : 1))
      setFormDescription('')
    }
  }

  const closeModal = () => {
    setModalType(null)
    setEditingItem(null)
  }

  // --- Form Submit Handler ---
  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    let url = ''
    let method = 'POST'
    let body: any = {}

    // Prepare payload depending on level
    if (modalType === 'board') {
      body = { name: formName, code: formCode, is_active: formIsActive }
      if (modalAction === 'edit') {
        url = `/api/super-admin/global-bank/boards/${editingItem._id}`
        method = 'PUT'
      } else {
        url = '/api/super-admin/global-bank/boards'
      }
    } else if (modalType === 'class') {
      body = {
        board_id: selectedBoardId,
        name: formName,
        code: formCode,
        grade: formGrade || formName,
        section: formSection,
        status: formIsActive ? 'active' : 'inactive'
      }
      if (modalAction === 'edit') {
        url = `/api/super-admin/global-bank/classes/${editingItem._id}`
        method = 'PUT'
      } else {
        url = '/api/super-admin/global-bank/classes'
      }
    } else if (modalType === 'subject') {
      body = {
        class_id: selectedClassId,
        name: formName,
        code: formCode,
        status: formIsActive ? 'active' : 'inactive'
      }
      if (modalAction === 'edit') {
        url = `/api/super-admin/global-bank/subjects/${editingItem._id}`
        method = 'PUT'
      } else {
        url = '/api/super-admin/global-bank/subjects'
      }
    } else if (modalType === 'chapter') {
      const parentClass = classes.find(c => c._id === selectedClassId)
      const parentSubject = subjects.find(s => s._id === selectedSubjectId)
      body = {
        class_id: selectedClassId,
        class_name: parentClass?.name || '',
        subject_id: selectedSubjectId,
        subject_name: parentSubject?.name || '',
        title: formTitle,
        chapter_number: Number(formChapterNumber),
        status: formIsActive ? 'active' : 'inactive'
      }
      if (modalAction === 'edit') {
        url = `/api/super-admin/global-bank/chapters/${editingItem._id}`
        method = 'PUT'
      } else {
        url = '/api/super-admin/global-bank/chapters'
      }
    } else if (modalType === 'topic') {
      body = {
        chapter_id: selectedChapterId,
        name: formName,
        code: formCode,
        description: formDescription,
        is_active: formIsActive
      }
      if (modalAction === 'edit') {
        url = `/api/super-admin/global-bank/topics/${editingItem._id}`
        method = 'PUT'
      } else {
        url = '/api/super-admin/global-bank/topics'
      }
    }

    const res = await apiRequest(url, {
      method,
      body: JSON.stringify(body)
    })

    if (res.ok) {
      toast(`${modalType!.toUpperCase()} ${modalAction === 'edit' ? 'updated' : 'created'} successfully!`)
      closeModal()

      // Refresh list
      if (modalType === 'board') fetchBoards()
      else if (modalType === 'class') fetchClasses(selectedBoardId)
      else if (modalType === 'subject') fetchSubjects(selectedClassId)
      else if (modalType === 'chapter') fetchChapters(selectedClassId, selectedSubjectId)
      else if (modalType === 'topic') fetchTopics(selectedChapterId)
    } else {
      toast(res.message || 'Error processing request')
    }
  }

  // --- CSV Direct Import Drag & Drop ---
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
      const file = e.dataTransfer.files[0]
      if (file.name.endsWith('.csv')) {
        setImportFile(file)
        await validateImportFile(file)
      } else {
        toast('Please upload a valid .csv file')
      }
    }
  }

  const handleFileInputChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0]
      setImportFile(file)
      await validateImportFile(file)
    }
  }

  // --- Validate CSV Direct Import API Call ---
  const validateImportFile = async (csvFile: File) => {
    setImportValidating(true)
    setImportValidationResult(null)
    setImportStatus('idle')

    const activeBoard = boards.find(b => b._id === selectedBoardId)
    const activeClass = classes.find(c => c._id === selectedClassId)
    const activeSubject = subjects.find(s => s._id === selectedSubjectId)

    const formData = new FormData()
    formData.append('file', csvFile)

    const queryParams = new URLSearchParams()
    if (activeBoard) queryParams.set('board', activeBoard.name)
    if (activeClass) queryParams.set('class', activeClass.name)
    if (activeSubject) queryParams.set('subject', activeSubject.name)

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
        setImportValidationResult(data.data)
        toast('CSV validation complete!')
      } else {
        setImportFile(null)
        toast(data.message || 'Validation failed. Check headers.')
      }
    } catch {
      setImportFile(null)
      toast('Network error during validation')
    } finally {
      setImportValidating(false)
    }
  }

  // --- Confirm CSV Direct Import API Call ---
  const handleConfirmDirectImport = async () => {
    if (!importValidationResult) return
    setImportConfirming(true)
    setImportStatus('processing')

    const activeBoard = boards.find(b => b._id === selectedBoardId)
    const activeClass = classes.find(c => c._id === selectedClassId)
    const activeSubject = subjects.find(s => s._id === selectedSubjectId)

    const res = await apiRequest<any>('/api/super-admin/global-bank/import/confirm', {
      method: 'POST',
      body: JSON.stringify({
        temp_file_id: importValidationResult.temp_file_id,
        file_name: importValidationResult.file_name,
        board: activeBoard?.name || '',
        class: activeClass?.name || '',
        subject: activeSubject?.name || ''
      })
    })

    if (res.ok && res.data) {
      const logId = res.data._id || res.data.id
      setImportLogId(logId)
      toast('Import queued successfully!')
      // Start background status polling
      let intervalId = setInterval(async () => {
        const logsRes = await apiRequest<any[]>('/api/super-admin/global-bank/import-logs')
        if (logsRes.ok && logsRes.data) {
          const matchingLog = logsRes.data.find(l => l._id === logId || l.id === logId)
          if (matchingLog) {
            if (matchingLog.status === 'completed') {
              clearInterval(intervalId)
              setImportConfirming(false)
              setImportStatus('completed')
              toast('CSV import completed successfully!')
              fetchQuestions(selectedChapterId, selectedTopicId)
              // Auto close modal after brief delay
              setTimeout(() => {
                setShowImportModal(false)
                setImportFile(null)
                setImportValidationResult(null)
                setImportStatus('idle')
              }, 1200)
            } else if (matchingLog.status === 'failed') {
              clearInterval(intervalId)
              setImportConfirming(false)
              setImportStatus('failed')
              toast('CSV import failed. Check historical logs.')
            }
          }
        }
      }, 2000)
    } else {
      toast(res.message || 'Failed to start import')
      setImportConfirming(false)
      setImportStatus('failed')
    }
  }

  // --- Filtering columns local search ---
  const filteredBoards = boards.filter(b => b.name.toLowerCase().includes(boardSearch.toLowerCase()) || b.code.toLowerCase().includes(boardSearch.toLowerCase()))
  const filteredClasses = classes.filter(c => c.name.toLowerCase().includes(classSearch.toLowerCase()) || c.code.toLowerCase().includes(classSearch.toLowerCase()))
  const filteredSubjects = subjects.filter(s => s.name.toLowerCase().includes(subjectSearch.toLowerCase()) || s.code.toLowerCase().includes(subjectSearch.toLowerCase()))
  const filteredChapters = chapters.filter(c => c.title.toLowerCase().includes(chapterSearch.toLowerCase()))
  const filteredTopics = topics.filter(t => t.name.toLowerCase().includes(topicSearch.toLowerCase()) || t.code.toLowerCase().includes(topicSearch.toLowerCase()))

  // --- Questions filtering ---
  const filteredQuestions = useMemo(() => {
    return questions.filter(q => {
      const text = (q.question_html || '').toLowerCase()
      const matchesSearch = !questionSearch || text.includes(questionSearch.toLowerCase())
      const matchesType = !questionTypeFilter || q.type === questionTypeFilter
      const matchesDiff = !questionDifficultyFilter || q.difficulty === questionDifficultyFilter
      return matchesSearch && matchesType && matchesDiff
    })
  }, [questions, questionSearch, questionTypeFilter, questionDifficultyFilter])

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div>
        <h1 className="text-xl font-bold text-slate-900">Curriculum Hierarchy Management</h1>
        <p className="text-sm text-slate-500 mt-0.5">
          Configure the global 5-tier academic hierarchy: Board → Class → Subject → Chapter → Topic. All updates apply globally.
        </p>
      </div>

      {/* Columns Dashboard Container */}
      <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-thin scrollbar-thumb-slate-200">
        {/* TIER 1: BOARDS */}
        <div className="flex-1 min-w-[260px] max-w-[320px] bg-white rounded-xl border border-slate-200 shadow-sm flex flex-col h-[70vh]">
          <div className="p-3 border-b border-slate-100 flex items-center justify-between bg-slate-50/55 rounded-t-xl">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
              📁 Boards ({filteredBoards.length})
            </span>
            <button
              onClick={() => openModal('board', 'create')}
              className="h-6 px-2 rounded bg-blue-600 text-white text-[10px] font-bold hover:bg-blue-700 transition-colors flex items-center gap-1"
            >
              <AppIcon name="Plus" size={10} /> Add
            </button>
          </div>
          <div className="p-2 border-b border-slate-100">
            <input
              type="text"
              placeholder="Search boards..."
              value={boardSearch}
              onChange={e => setBoardSearch(e.target.value)}
              className="w-full h-8 px-2.5 rounded-lg border border-slate-200 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
          <div className="flex-1 overflow-y-auto p-2 space-y-1">
            {loadingBoards ? (
              <div className="flex justify-center py-8"><div className="h-5 w-5 border-2 border-slate-200 border-t-blue-600 rounded-full animate-spin" /></div>
            ) : filteredBoards.length === 0 ? (
              <div className="text-center py-8 text-xs text-slate-400">No boards found.</div>
            ) : (
              filteredBoards.map(b => (
                <div
                  key={b._id}
                  onClick={() => setSelectedBoardId(b._id)}
                  className={`group p-2 rounded-lg text-xs cursor-pointer transition-all border flex items-center justify-between ${
                    selectedBoardId === b._id
                      ? 'bg-blue-50/80 border-blue-200 text-blue-900 font-medium'
                      : 'border-transparent text-slate-700 hover:bg-slate-50 hover:text-slate-900'
                  }`}
                >
                  <div className="min-w-0">
                    <span className="block truncate">{b.name}</span>
                    <span className="text-[10px] text-slate-400 font-mono">{b.code}</span>
                  </div>
                  <div className="flex items-center gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={(e) => { e.stopPropagation(); toggleBoardActive(b) }}
                      className={`h-5 w-5 rounded flex items-center justify-center border transition-colors ${
                        b.is_active ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-slate-100 text-slate-400 border-transparent'
                      }`}
                      title={b.is_active ? "Deactivate" : "Activate"}
                    >
                      <AppIcon name={b.is_active ? "Check" : "X"} size={10} />
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); openModal('board', 'edit', b) }}
                      className="h-5 w-5 rounded border border-slate-200 flex items-center justify-center text-slate-500 hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200 bg-white"
                      title="Edit"
                    >
                      <AppIcon name="Pencil" size={10} />
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); handleDeleteBoard(b._id) }}
                      className="h-5 w-5 rounded border border-slate-200 flex items-center justify-center text-slate-500 hover:bg-red-50 hover:text-red-600 hover:border-red-200 bg-white"
                      title="Delete"
                    >
                      <AppIcon name="Trash2" size={10} />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* TIER 2: CLASSES */}
        <div className="flex-1 min-w-[260px] max-w-[320px] bg-white rounded-xl border border-slate-200 shadow-sm flex flex-col h-[70vh]">
          <div className="p-3 border-b border-slate-100 flex items-center justify-between bg-slate-50/55 rounded-t-xl">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
              🏫 Classes ({filteredClasses.length})
            </span>
            {selectedBoardId && (
              <button
                onClick={() => openModal('class', 'create')}
                className="h-6 px-2 rounded bg-blue-600 text-white text-[10px] font-bold hover:bg-blue-700 transition-colors flex items-center gap-1"
              >
                <AppIcon name="Plus" size={10} /> Add
              </button>
            )}
          </div>
          <div className="p-2 border-b border-slate-100">
            <input
              type="text"
              placeholder="Search classes..."
              value={classSearch}
              onChange={e => setClassSearch(e.target.value)}
              disabled={!selectedBoardId}
              className="w-full h-8 px-2.5 rounded-lg border border-slate-200 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:bg-slate-50"
            />
          </div>
          <div className="flex-1 overflow-y-auto p-2 space-y-1">
            {!selectedBoardId ? (
              <div className="text-center py-12 text-xs text-slate-400 px-4">← Select a board to view and manage classes.</div>
            ) : loadingClasses ? (
              <div className="flex justify-center py-8"><div className="h-5 w-5 border-2 border-slate-200 border-t-blue-600 rounded-full animate-spin" /></div>
            ) : filteredClasses.length === 0 ? (
              <div className="text-center py-8 text-xs text-slate-400">No classes found.</div>
            ) : (
              filteredClasses.map(c => (
                <div
                  key={c._id}
                  onClick={() => setSelectedClassId(c._id)}
                  className={`group p-2 rounded-lg text-xs cursor-pointer transition-all border flex items-center justify-between ${
                    selectedClassId === c._id
                      ? 'bg-blue-50/80 border-blue-200 text-blue-900 font-medium'
                      : 'border-transparent text-slate-700 hover:bg-slate-50 hover:text-slate-900'
                  }`}
                >
                  <div className="min-w-0">
                    <span className="block truncate">{c.name}</span>
                    <span className="text-[10px] text-slate-400 font-mono">{c.code}</span>
                  </div>
                  <div className="flex items-center gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={(e) => { e.stopPropagation(); toggleClassActive(c) }}
                      className={`h-5 w-5 rounded flex items-center justify-center border transition-colors ${
                        c.status === 'active' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-slate-100 text-slate-400 border-transparent'
                      }`}
                      title={c.status === 'active' ? "Deactivate" : "Activate"}
                    >
                      <AppIcon name={c.status === 'active' ? "Check" : "X"} size={10} />
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); openModal('class', 'edit', c) }}
                      className="h-5 w-5 rounded border border-slate-200 flex items-center justify-center text-slate-500 hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200 bg-white"
                      title="Edit"
                    >
                      <AppIcon name="Pencil" size={10} />
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); handleDeleteClass(c._id) }}
                      className="h-5 w-5 rounded border border-slate-200 flex items-center justify-center text-slate-500 hover:bg-red-50 hover:text-red-600 hover:border-red-200 bg-white"
                      title="Delete"
                    >
                      <AppIcon name="Trash2" size={10} />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* TIER 3: SUBJECTS */}
        <div className="flex-1 min-w-[260px] max-w-[320px] bg-white rounded-xl border border-slate-200 shadow-sm flex flex-col h-[70vh]">
          <div className="p-3 border-b border-slate-100 flex items-center justify-between bg-slate-50/55 rounded-t-xl">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
              📘 Subjects ({filteredSubjects.length})
            </span>
            {selectedClassId && (
              <button
                onClick={() => openModal('subject', 'create')}
                className="h-6 px-2 rounded bg-blue-600 text-white text-[10px] font-bold hover:bg-blue-700 transition-colors flex items-center gap-1"
              >
                <AppIcon name="Plus" size={10} /> Add
              </button>
            )}
          </div>
          <div className="p-2 border-b border-slate-100">
            <input
              type="text"
              placeholder="Search subjects..."
              value={subjectSearch}
              onChange={e => setSubjectSearch(e.target.value)}
              disabled={!selectedClassId}
              className="w-full h-8 px-2.5 rounded-lg border border-slate-200 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:bg-slate-50"
            />
          </div>
          <div className="flex-1 overflow-y-auto p-2 space-y-1">
            {!selectedClassId ? (
              <div className="text-center py-12 text-xs text-slate-400 px-4">← Select a class to view and manage subjects.</div>
            ) : loadingSubjects ? (
              <div className="flex justify-center py-8"><div className="h-5 w-5 border-2 border-slate-200 border-t-blue-600 rounded-full animate-spin" /></div>
            ) : filteredSubjects.length === 0 ? (
              <div className="text-center py-8 text-xs text-slate-400">No subjects found.</div>
            ) : (
              filteredSubjects.map(s => (
                <div
                  key={s._id}
                  onClick={() => setSelectedSubjectId(s._id)}
                  className={`group p-2 rounded-lg text-xs cursor-pointer transition-all border flex items-center justify-between ${
                    selectedSubjectId === s._id
                      ? 'bg-blue-50/80 border-blue-200 text-blue-900 font-medium'
                      : 'border-transparent text-slate-700 hover:bg-slate-50 hover:text-slate-900'
                  }`}
                >
                  <div className="min-w-0">
                    <span className="block truncate">{s.name}</span>
                    <span className="text-[10px] text-slate-400 font-mono">{s.code}</span>
                  </div>
                  <div className="flex items-center gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={(e) => { e.stopPropagation(); toggleSubjectActive(s) }}
                      className={`h-5 w-5 rounded flex items-center justify-center border transition-colors ${
                        s.status === 'active' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-slate-100 text-slate-400 border-transparent'
                      }`}
                      title={s.status === 'active' ? "Deactivate" : "Activate"}
                    >
                      <AppIcon name={s.status === 'active' ? "Check" : "X"} size={10} />
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); openModal('subject', 'edit', s) }}
                      className="h-5 w-5 rounded border border-slate-200 flex items-center justify-center text-slate-500 hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200 bg-white"
                      title="Edit"
                    >
                      <AppIcon name="Pencil" size={10} />
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); handleDeleteSubject(s._id) }}
                      className="h-5 w-5 rounded border border-slate-200 flex items-center justify-center text-slate-500 hover:bg-red-50 hover:text-red-600 hover:border-red-200 bg-white"
                      title="Delete"
                    >
                      <AppIcon name="Trash2" size={10} />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* TIER 4: CHAPTERS */}
        <div className="flex-1 min-w-[260px] max-w-[320px] bg-white rounded-xl border border-slate-200 shadow-sm flex flex-col h-[70vh]">
          <div className="p-3 border-b border-slate-100 flex items-center justify-between bg-slate-50/55 rounded-t-xl">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
              📖 Chapters ({filteredChapters.length})
            </span>
            {selectedSubjectId && (
              <button
                onClick={() => openModal('chapter', 'create')}
                className="h-6 px-2 rounded bg-blue-600 text-white text-[10px] font-bold hover:bg-blue-700 transition-colors flex items-center gap-1"
              >
                <AppIcon name="Plus" size={10} /> Add
              </button>
            )}
          </div>
          <div className="p-2 border-b border-slate-100">
            <input
              type="text"
              placeholder="Search chapters..."
              value={chapterSearch}
              onChange={e => setChapterSearch(e.target.value)}
              disabled={!selectedSubjectId}
              className="w-full h-8 px-2.5 rounded-lg border border-slate-200 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:bg-slate-50"
            />
          </div>
          <div className="flex-1 overflow-y-auto p-2 space-y-1">
            {!selectedSubjectId ? (
              <div className="text-center py-12 text-xs text-slate-400 px-4">← Select a subject to view and manage chapters.</div>
            ) : loadingChapters ? (
              <div className="flex justify-center py-8"><div className="h-5 w-5 border-2 border-slate-200 border-t-blue-600 rounded-full animate-spin" /></div>
            ) : filteredChapters.length === 0 ? (
              <div className="text-center py-8 text-xs text-slate-400">No chapters found.</div>
            ) : (
              filteredChapters.map(c => (
                <div
                  key={c._id}
                  onClick={() => setSelectedChapterId(c._id)}
                  className={`group p-2 rounded-lg text-xs cursor-pointer transition-all border flex items-center justify-between ${
                    selectedChapterId === c._id
                      ? 'bg-blue-50/80 border-blue-200 text-blue-900 font-medium'
                      : 'border-transparent text-slate-700 hover:bg-slate-50 hover:text-slate-900'
                  }`}
                >
                  <div className="min-w-0">
                    <span className="block truncate font-medium">Ch {c.chapter_number}</span>
                    <span className="block truncate text-[10px] text-slate-400">{c.title}</span>
                  </div>
                  <div className="flex items-center gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={(e) => { e.stopPropagation(); openModal('chapter', 'edit', c) }}
                      className="h-5 w-5 rounded border border-slate-200 flex items-center justify-center text-slate-500 hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200 bg-white"
                      title="Edit"
                    >
                      <AppIcon name="Pencil" size={10} />
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); handleDeleteChapter(c._id) }}
                      className="h-5 w-5 rounded border border-slate-200 flex items-center justify-center text-slate-500 hover:bg-red-50 hover:text-red-600 hover:border-red-200 bg-white"
                      title="Delete"
                    >
                      <AppIcon name="Trash2" size={10} />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* TIER 5: TOPICS */}
        <div className="flex-1 min-w-[260px] max-w-[320px] bg-white rounded-xl border border-slate-200 shadow-sm flex flex-col h-[70vh]">
          <div className="p-3 border-b border-slate-100 flex items-center justify-between bg-slate-50/55 rounded-t-xl">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
              📌 Topics ({filteredTopics.length})
            </span>
            {selectedChapterId && (
              <button
                onClick={() => openModal('topic', 'create')}
                className="h-6 px-2 rounded bg-blue-600 text-white text-[10px] font-bold hover:bg-blue-700 transition-colors flex items-center gap-1"
              >
                <AppIcon name="Plus" size={10} /> Add
              </button>
            )}
          </div>
          <div className="p-2 border-b border-slate-100">
            <input
              type="text"
              placeholder="Search topics..."
              value={topicSearch}
              onChange={e => setTopicSearch(e.target.value)}
              disabled={!selectedChapterId}
              className="w-full h-8 px-2.5 rounded-lg border border-slate-200 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:bg-slate-50"
            />
          </div>
          <div className="flex-1 overflow-y-auto p-2 space-y-1">
            {!selectedChapterId ? (
              <div className="text-center py-12 text-xs text-slate-400 px-4">← Select a chapter to view and manage topics.</div>
            ) : loadingTopics ? (
              <div className="flex justify-center py-8"><div className="h-5 w-5 border-2 border-slate-200 border-t-blue-600 rounded-full animate-spin" /></div>
            ) : filteredTopics.length === 0 ? (
              <div className="text-center py-8 text-xs text-slate-400">No topics found.</div>
            ) : (
              filteredTopics.map(t => (
                <div
                  key={t._id}
                  onClick={() => setSelectedTopicId(t._id)}
                  className={`group p-2 rounded-lg text-xs cursor-pointer transition-all border flex items-center justify-between ${
                    selectedTopicId === t._id
                      ? 'bg-blue-50/80 border-blue-200 text-blue-900 font-medium'
                      : 'border-transparent text-slate-700 hover:bg-slate-50 hover:text-slate-900'
                  }`}
                >
                  <div className="min-w-0">
                    <span className="block truncate">{t.name}</span>
                    <span className="text-[10px] text-slate-400 font-mono">{t.code}</span>
                  </div>
                  <div className="flex items-center gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={(e) => { e.stopPropagation(); toggleTopicActive(t) }}
                      className={`h-5 w-5 rounded flex items-center justify-center border transition-colors ${
                        t.is_active ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-slate-100 text-slate-400 border-transparent'
                      }`}
                      title={t.is_active ? "Deactivate" : "Activate"}
                    >
                      <AppIcon name={t.is_active ? "Check" : "X"} size={10} />
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); openModal('topic', 'edit', t) }}
                      className="h-5 w-5 rounded border border-slate-200 flex items-center justify-center text-slate-500 hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200 bg-white"
                      title="Edit"
                    >
                      <AppIcon name="Pencil" size={10} />
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); handleDeleteTopic(t._id) }}
                      className="h-5 w-5 rounded border border-slate-200 flex items-center justify-center text-slate-500 hover:bg-red-50 hover:text-red-600 hover:border-red-200 bg-white"
                      title="Delete"
                    >
                      <AppIcon name="Trash2" size={10} />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Chapter Details & Questions Section */}
      {selectedChapterId && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-6 animate-[fadeIn_0.3s_ease]">
          {/* Section Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
            <div>
              <div className="flex flex-wrap items-center gap-1 text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1">
                <span>Breadcrumb:</span>
                <span className="text-slate-700">{boards.find(b => b._id === selectedBoardId)?.name}</span>
                <span>•</span>
                <span className="text-slate-700">{classes.find(c => c._id === selectedClassId)?.name}</span>
                <span>•</span>
                <span className="text-slate-700">{subjects.find(s => s._id === selectedSubjectId)?.name}</span>
                <span>•</span>
                <span className="text-slate-900 font-bold">Ch {chapters.find(c => c._id === selectedChapterId)?.chapter_number}: {chapters.find(c => c._id === selectedChapterId)?.title}</span>
                {selectedTopicId && (
                  <>
                    <span>•</span>
                    <span className="text-blue-600 font-bold">Topic: {topics.find(t => t._id === selectedTopicId)?.name}</span>
                  </>
                )}
              </div>
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                {selectedTopicId 
                  ? `Questions in Topic: ${topics.find(t => t._id === selectedTopicId)?.name}`
                  : `Questions in Chapter: ${chapters.find(c => c._id === selectedChapterId)?.title}`
                }
                <span className="text-xs font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full font-mono">
                  {filteredQuestions.length} Matches
                </span>
              </h2>
            </div>
            <div>
              <button
                onClick={() => setShowImportModal(true)}
                className="h-9 px-4 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-all shadow-sm flex items-center gap-1.5"
              >
                <AppIcon name="CloudUpload" size={14} /> Upload Questions CSV
              </button>
            </div>
          </div>

          {/* Filters & Search */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex-1 min-w-[200px]">
              <input
                type="text"
                placeholder="Search question text..."
                value={questionSearch}
                onChange={e => setQuestionSearch(e.target.value)}
                className="w-full h-9 px-3 rounded-lg border border-slate-200 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
            <select
              value={questionTypeFilter}
              onChange={e => setQuestionTypeFilter(e.target.value)}
              className="h-9 px-2.5 rounded-lg border border-slate-200 text-xs bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 text-slate-600"
            >
              <option value="">All Types</option>
              <option value="mcq">MCQ</option>
              <option value="short">Short Question</option>
              <option value="long">Long Question</option>
              <option value="true_false">True/False</option>
            </select>
            <select
              value={questionDifficultyFilter}
              onChange={e => setQuestionDifficultyFilter(e.target.value)}
              className="h-9 px-2.5 rounded-lg border border-slate-200 text-xs bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 text-slate-600"
            >
              <option value="">All Difficulties</option>
              <option value="easy">Easy</option>
              <option value="medium">Medium</option>
              <option value="hard">Hard</option>
            </select>
          </div>

          {/* Questions Table */}
          <div className="border border-slate-200 rounded-xl overflow-hidden bg-slate-50/20">
            {loadingQuestions ? (
              <div className="flex flex-col items-center justify-center py-16 space-y-2">
                <div className="h-6 w-6 border-2 border-slate-200 border-t-blue-600 rounded-full animate-spin" />
                <span className="text-[11px] text-slate-400">Loading questions...</span>
              </div>
            ) : filteredQuestions.length === 0 ? (
              <div className="text-center py-12 text-slate-400 text-xs">
                No questions found in this scope. Click "Upload Questions CSV" to add data.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                      <th className="py-2.5 px-4 w-[60%]">Question</th>
                      <th className="py-2.5 px-4 w-[12%]">Type</th>
                      <th className="py-2.5 px-4 w-[12%]">Difficulty</th>
                      <th className="py-2.5 px-4 w-[8%] font-mono">Marks</th>
                      <th className="py-2.5 px-4 w-[8%] text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 bg-white text-xs text-slate-700">
                    {filteredQuestions.map((q) => {
                      const textOnly = (q.question_html || '').replace(/<[^>]*>/g, '')
                      return (
                        <tr key={q._id} className="hover:bg-slate-50/50 transition-colors">
                          <td className="py-3 px-4 font-medium min-w-0">
                            <div className="line-clamp-2" title={textOnly}>{textOnly}</div>
                            {q.topic_id && !selectedTopicId && (
                              <span className="inline-block text-[9px] font-semibold text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded mt-1 font-mono">
                                Topic: {topics.find(t => t._id === q.topic_id)?.name || 'Generic'}
                              </span>
                            )}
                          </td>
                          <td className="py-3 px-4">
                            <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold ${
                              q.type === 'mcq' ? 'bg-indigo-50 text-indigo-700' :
                              q.type === 'short' ? 'bg-amber-50 text-amber-700' :
                              q.type === 'long' ? 'bg-rose-50 text-rose-700' : 'bg-slate-100 text-slate-700'
                            }`}>
                              {q.type === 'true_false' ? 'T/F' : q.type}
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold ${
                              q.difficulty === 'easy' ? 'bg-emerald-50 text-emerald-700' :
                              q.difficulty === 'medium' ? 'bg-amber-50 text-amber-700' : 'bg-rose-50 text-rose-700'
                            }`}>
                              {q.difficulty}
                            </span>
                          </td>
                          <td className="py-3 px-4 font-mono text-slate-500">{q.marks}</td>
                          <td className="py-3 px-4 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              {q.approval_status !== 'approved' && (
                                <button
                                  onClick={() => handleApproveQuestion(q._id)}
                                  className="h-6 w-6 rounded bg-slate-50 text-slate-500 hover:bg-emerald-50 hover:text-emerald-600 hover:border-emerald-200 border border-slate-200 flex items-center justify-center transition-colors"
                                  title="Approve"
                                >
                                  <AppIcon name="Check" size={10} />
                                </button>
                              )}
                              {q.approval_status !== 'rejected' && (
                                <button
                                  onClick={() => handleRejectQuestion(q._id)}
                                  className="h-6 w-6 rounded bg-slate-50 text-slate-500 hover:bg-red-50 hover:text-red-600 hover:border-red-200 border border-slate-200 flex items-center justify-center transition-colors"
                                  title="Reject"
                                >
                                  <AppIcon name="X" size={10} />
                                </button>
                              )}
                              <button
                                onClick={() => handleDeleteQuestion(q._id)}
                                className="h-6 w-6 rounded bg-slate-50 text-slate-400 hover:bg-slate-100 hover:text-slate-800 border border-slate-200 flex items-center justify-center transition-colors"
                                title="Delete"
                              >
                                <AppIcon name="Trash2" size={10} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* CRUD POPUP DIALOG MODAL */}
      {modalType && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/45 backdrop-blur-sm" onClick={closeModal} />
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden relative z-10 animate-[zoomIn_0.2s_ease-out]">
            <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <h2 className="text-sm font-bold text-slate-800 capitalize">
                {modalAction === 'edit' ? 'Edit' : 'Create'} {modalType}
              </h2>
              <button onClick={closeModal} className="h-6 w-6 rounded hover:bg-slate-200 flex items-center justify-center text-slate-500">
                <AppIcon name="close" size={16} />
              </button>
            </div>
            <form onSubmit={handleFormSubmit} className="p-6 space-y-4">
              {modalType !== 'chapter' ? (
                <>
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1 block">Name *</label>
                    <input
                      type="text"
                      required
                      value={formName}
                      onChange={e => setFormName(e.target.value)}
                      placeholder="Name"
                      className="w-full h-10 px-3 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1 block">Code *</label>
                    <input
                      type="text"
                      required
                      value={formCode}
                      onChange={e => setFormCode(e.target.value)}
                      placeholder="e.g. PTB, CLASS_9, MATH_9"
                      className="w-full h-10 px-3 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-mono"
                    />
                  </div>
                </>
              ) : (
                <>
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1 block">Chapter Title *</label>
                    <input
                      type="text"
                      required
                      value={formTitle}
                      onChange={e => setFormTitle(e.target.value)}
                      placeholder="e.g. Quadratic Equations"
                      className="w-full h-10 px-3 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1 block">Chapter Number *</label>
                    <input
                      type="number"
                      required
                      min={1}
                      value={formChapterNumber}
                      onChange={e => setFormChapterNumber(Number(e.target.value))}
                      className="w-full h-10 px-3 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                    />
                  </div>
                </>
              )}

              {modalType === 'class' && (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1 block">Grade</label>
                    <input
                      type="text"
                      value={formGrade}
                      onChange={e => setFormGrade(e.target.value)}
                      placeholder="e.g. 9"
                      className="w-full h-10 px-3 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1 block">Section</label>
                    <input
                      type="text"
                      value={formSection}
                      onChange={e => setFormSection(e.target.value)}
                      placeholder="e.g. A"
                      className="w-full h-10 px-3 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                    />
                  </div>
                </div>
              )}

              {modalType === 'topic' && (
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1 block">Description</label>
                  <textarea
                    value={formDescription}
                    onChange={e => setFormDescription(e.target.value)}
                    placeholder="Short topic description..."
                    rows={3}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 resize-none"
                  />
                </div>
              )}

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="formIsActive"
                  checked={formIsActive}
                  onChange={e => setFormIsActive(e.target.checked)}
                  className="h-4 w-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500"
                />
                <label htmlFor="formIsActive" className="text-xs font-semibold text-slate-700">
                  Set status as Active
                </label>
              </div>

              <div className="flex justify-end gap-2 border-t border-slate-100 pt-4 mt-4">
                <button
                  type="button"
                  onClick={closeModal}
                  className="h-9 px-4 rounded-lg border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="h-9 px-4 rounded-lg bg-blue-600 text-white text-xs font-bold hover:bg-blue-700 transition-colors shadow-sm"
                >
                  {modalAction === 'edit' ? 'Save Changes' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CONTEXT-LOCKED CSV IMPORT MODAL */}
      {showImportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/45 backdrop-blur-sm" onClick={() => !importConfirming && setShowImportModal(false)} />
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xl overflow-hidden relative z-10 animate-[zoomIn_0.2s_ease-out] flex flex-col max-h-[85vh]">
            {/* Modal Header */}
            <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <div>
                <h2 className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
                  <AppIcon name="CloudUpload" size={16} className="text-blue-600" />
                  Direct Questions CSV Uploader
                </h2>
                <p className="text-[10px] text-slate-400 mt-0.5">
                  Importing to: {boards.find(b => b._id === selectedBoardId)?.name} • {classes.find(c => c._id === selectedClassId)?.name} • {subjects.find(s => s._id === selectedSubjectId)?.name}
                </p>
              </div>
              <button 
                onClick={() => !importConfirming && setShowImportModal(false)} 
                className="h-6 w-6 rounded hover:bg-slate-200 flex items-center justify-center text-slate-500 disabled:opacity-50"
                disabled={importConfirming}
              >
                <AppIcon name="close" size={16} />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 flex-1 overflow-y-auto space-y-4">
              {/* Context Lock Banner */}
              <div className="bg-blue-50 border border-blue-100 rounded-lg p-3 text-[11px] text-blue-800 flex items-start gap-2">
                <AppIcon name="info" size={14} className="mt-0.5 shrink-0" />
                <div>
                  <span className="font-bold">Automatic Curriculum Context Mapping:</span> Since you are uploading from this hierarchy scope, any missing Board, Class, or Subject values inside the CSV will be automatically defaulted to the current path!
                </div>
              </div>

              {/* Drag & Drop File Zone */}
              {!importFile && (
                <div
                  onDragEnter={handleDrag}
                  onDragOver={handleDrag}
                  onDragLeave={handleDrag}
                  onDrop={handleDrop}
                  className={`border-2 border-dashed rounded-xl p-8 text-center flex flex-col items-center justify-center cursor-pointer transition-all ${
                    dragActive 
                      ? 'border-blue-500 bg-blue-50/50' 
                      : 'border-slate-300 hover:border-blue-500 hover:bg-slate-50/50'
                  }`}
                  onClick={() => document.getElementById('direct-csv-file-input')?.click()}
                >
                  <input
                    id="direct-csv-file-input"
                    type="file"
                    accept=".csv"
                    className="hidden"
                    onChange={handleFileInputChange}
                  />
                  <div className="h-12 w-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 mb-3 shadow-inner">
                    <AppIcon name="CloudUpload" size={24} />
                  </div>
                  <span className="text-xs font-bold text-slate-700">Drag & drop your CSV file here, or click to browse</span>
                  <span className="text-[10px] text-slate-400 mt-1">Accepts standard 19-column CSV or custom 5-column format</span>
                </div>
              )}

              {/* Validation Status / Loader */}
              {importValidating && (
                <div className="flex flex-col items-center justify-center py-10 space-y-2 border border-slate-200 rounded-xl bg-slate-50">
                  <div className="h-6 w-6 border-2 border-slate-200 border-t-blue-600 rounded-full animate-spin" />
                  <span className="text-xs text-slate-500 font-medium">Validating file content against database...</span>
                </div>
              )}

              {/* Validation Result display */}
              {importValidationResult && (
                <div className="space-y-4">
                  {/* File Metadata Panel */}
                  <div className="flex items-center justify-between border border-slate-200 rounded-lg p-3 bg-slate-50 text-xs">
                    <div className="flex items-center gap-2">
                      <div className="h-8 w-8 bg-blue-100 rounded flex items-center justify-center text-blue-600">
                        <AppIcon name="FileText" size={16} />
                      </div>
                      <div className="min-w-0">
                        <span className="block font-bold text-slate-700 truncate">{importValidationResult.file_name}</span>
                        <span className="text-[10px] text-slate-400 font-mono">ID: {importValidationResult.temp_file_id}</span>
                      </div>
                    </div>
                    <button 
                      onClick={() => { setImportFile(null); setImportValidationResult(null); }}
                      className="text-[10px] font-bold text-red-600 hover:underline"
                    >
                      Clear File
                    </button>
                  </div>

                  {/* Summary Counters */}
                  <div className="grid grid-cols-4 gap-2">
                    <div className="border border-slate-100 rounded-lg p-2.5 text-center bg-white shadow-sm">
                      <span className="block text-[10px] font-semibold text-slate-400 uppercase">Total Rows</span>
                      <span className="text-base font-bold text-slate-800">{importValidationResult.total_rows}</span>
                    </div>
                    <div className="border border-emerald-100 rounded-lg p-2.5 text-center bg-emerald-50/20 shadow-sm">
                      <span className="block text-[10px] font-semibold text-emerald-600 uppercase">Valid</span>
                      <span className="text-base font-bold text-emerald-800">{importValidationResult.valid_rows}</span>
                    </div>
                    <div className="border border-red-100 rounded-lg p-2.5 text-center bg-red-50/20 shadow-sm">
                      <span className="block text-[10px] font-semibold text-red-600 uppercase">Invalid</span>
                      <span className="text-base font-bold text-red-800">{importValidationResult.invalid_rows}</span>
                    </div>
                    <div className="border border-amber-100 rounded-lg p-2.5 text-center bg-amber-50/20 shadow-sm">
                      <span className="block text-[10px] font-semibold text-amber-600 uppercase">Duplicate</span>
                      <span className="text-base font-bold text-amber-800">{importValidationResult.duplicate_rows}</span>
                    </div>
                  </div>

                  {/* Validation Error Logs */}
                  {importValidationResult.invalid_rows > 0 && (
                    <div className="space-y-1.5">
                      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Invalid Rows & Issues ({importValidationResult.invalid_rows}):</span>
                      <div className="border border-red-200 rounded-lg max-h-[160px] overflow-y-auto divide-y divide-red-100 bg-red-50/10 text-xs">
                        {importValidationResult.preview
                          .filter(p => p.status === 'invalid' || p.status === 'duplicate')
                          .map((p, idx) => (
                            <div key={idx} className="p-2.5 flex items-start gap-2">
                              <span className="font-mono text-[9px] font-bold text-red-600 bg-red-100/50 px-1 rounded mt-0.5">Row {p.row_number}</span>
                              <div className="min-w-0">
                                <p className="text-[11px] font-semibold text-slate-800 line-clamp-1">"{p.data[4] || p.data[3] || 'Empty Question'}"</p>
                                <span className="text-[10px] text-red-600 block mt-0.5 font-medium">{p.errors.join('; ')}</span>
                              </div>
                            </div>
                          ))}
                      </div>
                    </div>
                  )}

                  {/* Confirming & Processing status */}
                  {importStatus === 'processing' && (
                    <div className="border border-blue-200 rounded-lg p-4 bg-blue-50/30 flex flex-col items-center justify-center text-center space-y-2">
                      <div className="h-6 w-6 border-2 border-slate-200 border-t-blue-600 rounded-full animate-spin" />
                      <span className="text-xs font-bold text-slate-700">Ingesting questions into database...</span>
                      <span className="text-[10px] text-slate-400">Polling worker updates for Log: {importLogId}</span>
                    </div>
                  )}

                  {importStatus === 'completed' && (
                    <div className="border border-emerald-200 rounded-lg p-4 bg-emerald-50/30 flex flex-col items-center justify-center text-center space-y-1.5">
                      <div className="h-7 w-7 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center">
                        <AppIcon name="Check" size={16} />
                      </div>
                      <span className="text-xs font-bold text-emerald-800">Import completed!</span>
                      <span className="text-[10px] text-slate-400">Hierarchy updated successfully.</span>
                    </div>
                  )}

                  {importStatus === 'failed' && (
                    <div className="border border-red-200 rounded-lg p-4 bg-red-50/30 flex flex-col items-center justify-center text-center space-y-1.5">
                      <div className="h-7 w-7 rounded-full bg-red-100 text-red-600 flex items-center justify-center">
                        <AppIcon name="X" size={16} />
                      </div>
                      <span className="text-xs font-bold text-red-800">Import worker failed</span>
                      <span className="text-[10px] text-slate-400">Please verify CSV contents and check background logs.</span>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Modal Actions */}
            <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => {
                  setShowImportModal(false)
                  setImportFile(null)
                  setImportValidationResult(null)
                  setImportStatus('idle')
                }}
                disabled={importConfirming}
                className="h-9 px-4 rounded-lg border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              {importValidationResult && importValidationResult.valid_rows > 0 && importStatus === 'idle' && (
                <button
                  onClick={handleConfirmDirectImport}
                  disabled={importConfirming}
                  className="h-9 px-4 rounded-lg bg-blue-600 text-white text-xs font-bold hover:bg-blue-700 transition-colors shadow-sm disabled:opacity-50"
                >
                  {importConfirming ? 'Importing...' : 'Confirm & Ingest'}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
