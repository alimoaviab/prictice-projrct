import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { PageHeader } from '../components/PageHeader'

interface Expense {
  _id: string
  title: string
  amount: number
  expense_type: string
  note: string
  created_by: string
  created_at: string
  updated_at: string
}

export function ExpensesPage() {
  const navigate = useNavigate()
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [typeFilter, setTypeFilter] = useState<string>('')
  const [formData, setFormData] = useState({
    title: '',
    amount: '',
    expense_type: 'mutual',
    note: '',
  })

  useEffect(() => {
    fetchExpenses()
  }, [typeFilter])

  const fetchExpenses = async () => {
    try {
      const { apiRequest } = await import('../lib/api')
      const url = typeFilter 
        ? `/api/super-admin/expenses?type=${typeFilter}`
        : '/api/super-admin/expenses'

      const response = await apiRequest(url)

      if (!response.ok) {
        throw new Error(response.message || 'Failed to fetch expenses')
      }

      setExpenses(response.data?.items || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const { apiRequest } = await import('../lib/api')
      const response = await apiRequest('/api/super-admin/expenses', {
        method: 'POST',
        body: JSON.stringify({
          title: formData.title,
          amount: parseFloat(formData.amount),
          expense_type: formData.expense_type,
          note: formData.note,
        }),
      })

      if (!response.ok) {
        throw new Error(response.message || 'Failed to create expense')
      }

      setShowForm(false)
      setFormData({
        title: '',
        amount: '',
        expense_type: 'mutual',
        note: '',
      })
      fetchExpenses()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    }
  }

  const expenseTypes = [
    { value: 'mutual', label: 'Mutual Expenses' },
    { value: 'ali', label: 'Ali Expenses' },
    { value: 'abdul_rehman', label: 'Abdul Rehman Expenses' },
  ]

  const getExpenseTypeColor = (type: string) => {
    switch (type) {
      case 'mutual':
        return 'bg-blue-100 text-blue-700'
      case 'ali':
        return 'bg-orange-100 text-orange-700'
      case 'abdul_rehman':
        return 'bg-purple-100 text-purple-700'
      default:
        return 'bg-slate-100 text-slate-700'
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="h-8 w-8 border-2 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <PageHeader
          title="Expense Management"
          description="Track and manage all expenses"
        />
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
        >
          <span className="material-symbols-outlined">add</span>
          New Expense
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
          {error}
        </div>
      )}

      {/* Form */}
      {showForm && (
        <div className="bg-white rounded-lg border border-slate-200 p-6">
          <h3 className="text-lg font-semibold text-slate-900 mb-4">Add New Expense</h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Expense Title
                </label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., AWS Server Renewal"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Amount ($)
                </label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="0.00"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Expense Type
                </label>
                <select
                  value={formData.expense_type}
                  onChange={(e) => setFormData({ ...formData, expense_type: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {expenseTypes.map((type) => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Notes
              </label>
              <textarea
                value={formData.note}
                onChange={(e) => setFormData({ ...formData, note: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Additional details..."
                rows={3}
              />
            </div>
            <div className="flex gap-2">
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
              >
                Add Expense
              </button>
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="px-4 py-2 bg-slate-200 text-slate-700 rounded-lg hover:bg-slate-300 transition-colors font-medium"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Filters */}
      <div className="flex gap-2">
        <button
          onClick={() => setTypeFilter('')}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            typeFilter === ''
              ? 'bg-blue-600 text-white'
              : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
          }`}
        >
          All
        </button>
        {expenseTypes.map((type) => (
          <button
            key={type.value}
            onClick={() => setTypeFilter(type.value)}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              typeFilter === type.value
                ? 'bg-blue-600 text-white'
                : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
            }`}
          >
            {type.label}
          </button>
        ))}
      </div>

      {/* Expenses List */}
      <div className="space-y-3">
        {expenses.map((expense) => (
          <div
            key={expense._id}
            className="bg-white rounded-lg border border-slate-200 p-4 hover:shadow-md transition-shadow"
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h4 className="font-semibold text-slate-900">{expense.title}</h4>
                  <span
                    className={`px-2 py-1 rounded-full text-xs font-semibold ${getExpenseTypeColor(
                      expense.expense_type
                    )}`}
                  >
                    {expenseTypes.find((t) => t.value === expense.expense_type)?.label}
                  </span>
                </div>
                {expense.note && (
                  <p className="text-sm text-slate-600 mb-2">{expense.note}</p>
                )}
                <p className="text-xs text-slate-400">
                  {new Date(expense.created_at).toLocaleDateString()}
                </p>
              </div>
              <div className="text-right">
                <p className="text-lg font-bold text-slate-900">
                  ${expense.amount.toFixed(2)}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {expenses.length === 0 && (
        <div className="text-center py-12 text-slate-500">
          <span className="material-symbols-outlined text-4xl mb-2 block opacity-50">
            receipt_long
          </span>
          No expenses found. Add one to get started.
        </div>
      )}
    </div>
  )
}
