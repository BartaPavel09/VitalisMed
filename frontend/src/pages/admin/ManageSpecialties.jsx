import { useState, useEffect } from 'react'
import { Plus, Stethoscope, Trash2, X, AlertCircle, ArrowLeft } from 'lucide-react'
import { Link } from 'react-router-dom'
import client from '../../api/client'

/**
 * Admin portal view for viewing, creating, and removing clinical specialties.
 *
 * @return {JSX.Element} Specialty management interface.
 */
export default function ManageSpecialties() {
  const [specialties, setSpecialties] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showAddModal, setShowAddModal] = useState(false)
  const [modalError, setModalError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    description: ''
  })

  useEffect(() => {
    fetchSpecialties()
  }, [])

  const fetchSpecialties = async () => {
    setLoading(true)
    setError('')
    try {
      const res = await client.get('/admin/specialties')
      setSpecialties(res.data)
    } catch {
      setError('Failed to load clinical specialties.')
    } finally {
      setLoading(false)
    }
  }

  const handleCreateSpecialty = async (e) => {
    e.preventDefault()
    setModalError('')
    setSubmitting(true)
    try {
      await client.post('/admin/specialties', {
        name: formData.name.trim(),
        description: formData.description.trim() || null
      })
      setShowAddModal(false)
      setFormData({ name: '', description: '' })
      fetchSpecialties()
    } catch (err) {
      const detail = err.response?.data?.detail
      setModalError(Array.isArray(detail) ? detail[0]?.msg || 'Invalid specialty input.' : detail || 'Failed to create specialty.')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDeleteSpecialty = async (id) => {
    setError('')
    try {
      await client.delete(`/admin/specialties/${id}`)
      setSpecialties(specialties.filter((s) => s.id !== id))
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to delete specialty.')
    }
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-slate-50 py-10">
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
        <Link
          to="/admin/dashboard"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-900 mb-6"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> Back to Dashboard
        </Link>

        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
              Clinical Specialties
            </h1>
            <p className="mt-1 text-sm text-slate-500">
              Create and manage medical specialties available across the clinic.
            </p>
          </div>
          <button
            onClick={() => {
              setModalError('')
              setShowAddModal(true)
            }}
            className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm shadow-blue-500/20 transition hover:bg-blue-700"
          >
            <Plus className="h-4 w-4" />
            Add Specialty
          </button>
        </div>

        {error && (
          <div className="mb-6 flex items-start gap-2 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
            <AlertCircle className="h-5 w-5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {loading ? (
          <div className="flex h-64 items-center justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent"></div>
          </div>
        ) : (
          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
              <thead className="bg-slate-50 text-xs font-semibold uppercase tracking-wider text-slate-500">
                <tr>
                  <th className="px-6 py-4">Specialty</th>
                  <th className="px-6 py-4">Description</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {specialties.length === 0 ? (
                  <tr>
                    <td colSpan="3" className="px-6 py-12 text-center text-slate-500">
                      No specialties registered yet. Click &quot;Add Specialty&quot; to create one.
                    </td>
                  </tr>
                ) : (
                  specialties.map((s) => (
                    <tr key={s.id} className="hover:bg-slate-50/50 transition">
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center gap-2 font-semibold text-slate-900">
                          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                            <Stethoscope className="h-4 w-4" />
                          </span>
                          {s.name}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-slate-600">
                        {s.description || <span className="text-slate-400 italic">No description</span>}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={() => handleDeleteSpecialty(s.id)}
                          className="inline-flex items-center gap-1 rounded-lg border border-rose-200 px-3 py-1.5 text-xs font-medium text-rose-700 hover:bg-rose-50 transition"
                        >
                          <Trash2 className="h-3.5 w-3.5" /> Delete
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Modal: Add Specialty */}
        {showAddModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
            <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-xl">
              <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                <h3 className="text-lg font-bold text-slate-900">Add Clinical Specialty</h3>
                <button
                  onClick={() => setShowAddModal(false)}
                  className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <form onSubmit={handleCreateSpecialty} className="mt-4 space-y-4">
                {modalError && (
                  <div className="flex items-start gap-2 rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700">
                    <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                    <span>{modalError}</span>
                  </div>
                )}

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Specialty Name</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g. Cardiology"
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-blue-600 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Description (Optional)</label>
                  <textarea
                    rows="3"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Brief overview of the clinical specialty..."
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-blue-600 focus:outline-none"
                  ></textarea>
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    disabled={submitting}
                    className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 shadow-sm shadow-blue-500/20 disabled:opacity-50"
                  >
                    {submitting ? 'Saving...' : 'Save Specialty'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
