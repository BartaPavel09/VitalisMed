import { useState, useEffect, useRef } from 'react'
import { Plus, UserCheck, UserX, Stethoscope, Mail, Phone, Clock, Trash2, X, Edit3, AlertCircle, ChevronDown } from 'lucide-react'
import client from '../../api/client'
import { formatTime } from '../../utils/dateFormat'

const DAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']

const HALF_HOUR_OPTIONS = Array.from({ length: 48 }, (_, index) => {
  const hours = String(Math.floor(index / 2)).padStart(2, '0')
  const minutes = index % 2 === 0 ? '00' : '30'
  return `${hours}:${minutes}`
})

const sanitizePhoneInput = (value) => value.replace(/[^0-9+\-\s()]/g, '')

/**
 * Compact 24-hour 30-minute interval time picker popover.
 *
 * @param {object} props Component props.
 * @param {string} props.value Selected time in HH:MM format.
 * @param {function} props.onChange Callback invoked with selected HH:MM string.
 * @return {JSX.Element} Compact time picker button and popover.
 */
function CompactTimePicker({ value, onChange }) {
  const [open, setOpen] = useState(false)
  const containerRef = useRef(null)

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOpen(false)
      }
    }
    if (open) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [open])

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="flex w-full items-center justify-between rounded-lg border border-slate-200 bg-white px-2.5 py-2 text-xs font-mono text-slate-800 hover:border-blue-500 focus:border-blue-600 focus:outline-none"
      >
        <span>{formatTime(value)}</span>
        <ChevronDown className="h-3.5 w-3.5 text-slate-400" />
      </button>

      {open && (
        <div className="absolute left-0 z-50 mt-1.5 w-60 rounded-xl border border-slate-200 bg-white p-2 shadow-xl">
          <div className="grid max-h-52 grid-cols-4 gap-1 overflow-y-auto">
            {HALF_HOUR_OPTIONS.map((slot) => (
              <button
                key={slot}
                type="button"
                onClick={() => {
                  onChange(slot)
                  setOpen(false)
                }}
                className={`rounded-lg py-1.5 text-xs font-mono transition ${
                  slot === value
                    ? 'bg-blue-600 font-semibold text-white'
                    : 'text-slate-700 hover:bg-blue-50 hover:text-blue-700'
                }`}
              >
                {formatTime(slot)}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

/**
 * Admin portal view for managing clinic doctors, specialties, licenses, and weekly shifts.
 *
 * @return {JSX.Element} Doctor management interface.
 */
export default function ManageDoctors() {
  const [doctors, setDoctors] = useState([])
  const [specialties, setSpecialties] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showAddModal, setShowAddModal] = useState(false)
  const [editingDoctor, setEditingDoctor] = useState(null)
  const [selectedDoctorForShifts, setSelectedDoctorForShifts] = useState(null)
  const [shifts, setShifts] = useState([])
  const [shiftError, setShiftError] = useState('')
  const [modalError, setModalError] = useState('')

  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    phone: '',
    specialtyId: '',
    licenseNumber: '',
    bio: ''
  })

  const [editFormData, setEditFormData] = useState({
    fullName: '',
    phone: '',
    specialtyId: '',
    licenseNumber: '',
    bio: ''
  })

  const [shiftForm, setShiftForm] = useState({
    dayOfWeek: 'monday',
    startTime: '08:00',
    endTime: '16:00'
  })

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    setLoading(true)
    setError('')
    try {
      const [docsRes, specsRes] = await Promise.all([
        client.get('/admin/doctors'),
        client.get('/admin/specialties')
      ])
      setDoctors(docsRes.data)
      setSpecialties(specsRes.data)
    } catch {
      setError('Failed to load clinic records.')
    } finally {
      setLoading(false)
    }
  }

  const handleCreateDoctor = async (e) => {
    e.preventDefault()
    setError('')
    setModalError('')
    try {
      await client.post('/admin/doctors', {
        full_name: formData.fullName,
        email: formData.email,
        password: formData.password,
        phone_number: formData.phone || null,
        specialty_id: parseInt(formData.specialtyId, 10),
        license_number: formData.licenseNumber,
        bio: formData.bio || null
      })
      setShowAddModal(false)
      setFormData({
        fullName: '',
        email: '',
        password: '',
        phone: '',
        specialtyId: '',
        licenseNumber: '',
        bio: ''
      })
      fetchData()
    } catch (err) {
      const detail = err.response?.data?.detail
      setModalError(Array.isArray(detail) ? detail[0]?.msg || 'Invalid doctor input.' : detail || 'Failed to register doctor.')
    }
  }

  const openEditModal = (doc) => {
    setModalError('')
    setEditingDoctor(doc)
    setEditFormData({
      fullName: doc.full_name,
      phone: doc.phone_number || '',
      specialtyId: doc.specialty_id || '',
      licenseNumber: doc.license_number,
      bio: doc.bio || ''
    })
  }

  const handleUpdateDoctor = async (e) => {
    e.preventDefault()
    setError('')
    setModalError('')
    try {
      await client.put(`/admin/doctors/${editingDoctor.id}`, {
        full_name: editFormData.fullName,
        phone_number: editFormData.phone || null,
        specialty_id: editFormData.specialtyId ? parseInt(editFormData.specialtyId, 10) : null,
        license_number: editFormData.licenseNumber,
        bio: editFormData.bio || null
      })
      setEditingDoctor(null)
      fetchData()
    } catch (err) {
      const detail = err.response?.data?.detail
      setModalError(Array.isArray(detail) ? detail[0]?.msg || 'Invalid doctor input.' : detail || 'Failed to update doctor details.')
    }
  }

  const handleToggleStatus = async (doctorId) => {
    try {
      await client.patch(`/admin/doctors/${doctorId}/status`)
      fetchData()
    } catch {
      setError('Failed to update doctor status.')
    }
  }

  const openShiftsModal = async (doctor) => {
    setSelectedDoctorForShifts(doctor)
    setShiftError('')
    try {
      const res = await client.get(`/admin/doctors/${doctor.id}/shifts`)
      setShifts(res.data)
    } catch {
      setError('Failed to load doctor shifts.')
    }
  }

  const handleAddShift = async (e) => {
    e.preventDefault()
    setShiftError('')
    try {
      await client.post('/admin/shifts', {
        doctor_id: selectedDoctorForShifts.id,
        day_of_week: shiftForm.dayOfWeek,
        start_time: shiftForm.startTime,
        end_time: shiftForm.endTime
      })
      const res = await client.get(`/admin/doctors/${selectedDoctorForShifts.id}/shifts`)
      setShifts(res.data)
    } catch (err) {
      setShiftError(err.response?.data?.detail || 'Failed to add shift schedule.')
    }
  }

  const handleDeleteShift = async (shiftId) => {
    setShiftError('')
    try {
      await client.delete(`/admin/shifts/${shiftId}`)
      setShifts(shifts.filter((s) => s.id !== shiftId))
    } catch {
      setShiftError('Failed to remove shift.')
    }
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-slate-50 py-10">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
              Doctor Management
            </h1>
            <p className="mt-1 text-sm text-slate-500">
              Register medical specialists, maintain active practice credentials, and schedule hospital shifts.
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
            Add New Doctor
          </button>
        </div>

        {error && (
          <div className="mb-6 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
            {error}
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
                  <th className="px-6 py-4">Doctor</th>
                  <th className="px-6 py-4">Specialty</th>
                  <th className="px-6 py-4">Medical License</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {doctors.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="px-6 py-12 text-center text-slate-500">
                      No doctors registered yet. Click &quot;Add New Doctor&quot; to enroll your first doctor.
                    </td>
                  </tr>
                ) : (
                  doctors.map((doc) => (
                    <tr key={doc.id} className="hover:bg-slate-50/50 transition">
                      <td className="px-6 py-4">
                        <div className="font-semibold text-slate-900">{doc.full_name}</div>
                        <div className="flex items-center gap-3 text-xs text-slate-500 mt-1">
                          <span className="flex items-center gap-1"><Mail className="h-3 w-3" />{doc.email}</span>
                          {doc.phone_number && (
                            <span className="flex items-center gap-1"><Phone className="h-3 w-3" />{doc.phone_number}</span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center gap-1.5 rounded-lg bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-700 border border-blue-100">
                          <Stethoscope className="h-3.5 w-3.5" />
                          {doc.specialty_name || 'General'}
                        </span>
                      </td>
                      <td className="px-6 py-4 font-mono text-xs text-slate-600">
                        {doc.license_number}
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                            doc.is_active
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : 'bg-rose-50 text-rose-700 border border-rose-200'
                          }`}
                        >
                          {doc.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => openEditModal(doc)}
                            className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-100 transition"
                          >
                            <Edit3 className="h-3.5 w-3.5" />
                            Edit
                          </button>
                          <button
                            onClick={() => openShiftsModal(doc)}
                            className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-100 transition"
                          >
                            <Clock className="h-3.5 w-3.5" />
                            Shifts
                          </button>
                          <button
                            onClick={() => handleToggleStatus(doc.id)}
                            className={`inline-flex items-center gap-1 rounded-lg border px-3 py-1.5 text-xs font-medium transition ${
                              doc.is_active
                                ? 'border-rose-200 text-rose-700 hover:bg-rose-50'
                                : 'border-emerald-200 text-emerald-700 hover:bg-emerald-50'
                            }`}
                          >
                            {doc.is_active ? (
                              <>
                                <UserX className="h-3.5 w-3.5" /> Deactivate
                              </>
                            ) : (
                              <>
                                <UserCheck className="h-3.5 w-3.5" /> Activate
                              </>
                            )}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Modal: Add Doctor */}
        {showAddModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
            <div className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-6 shadow-xl">
              <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                <h3 className="text-lg font-bold text-slate-900">Enroll Medical Specialist</h3>
                <button
                  onClick={() => setShowAddModal(false)}
                  className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <form onSubmit={handleCreateDoctor} className="mt-4 space-y-4">
                {modalError && (
                  <div className="flex items-start gap-2 rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700">
                    <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                    <span>{modalError}</span>
                  </div>
                )}
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Full Name</label>
                  <input
                    type="text"
                    required
                    value={formData.fullName}
                    onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                    placeholder="Dr. Gregory House"
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-blue-600 focus:outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">Email</label>
                    <input
                      type="email"
                      required
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      placeholder="doctor@vitalismed.com"
                      className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-blue-600 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">Password</label>
                    <input
                      type="password"
                      required
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      placeholder="••••••••"
                      className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-blue-600 focus:outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">Specialty</label>
                    <select
                      required
                      value={formData.specialtyId}
                      onChange={(e) => setFormData({ ...formData, specialtyId: e.target.value })}
                      className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-blue-600 focus:outline-none bg-white"
                    >
                      <option value="">Select Specialty</option>
                      {specialties.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">Medical License / Parafă #</label>
                    <input
                      type="text"
                      required
                      value={formData.licenseNumber}
                      onChange={(e) => setFormData({ ...formData, licenseNumber: e.target.value })}
                      placeholder="LIC-12345"
                      className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-blue-600 focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Phone Number</label>
                  <input
                    type="tel"
                    inputMode="tel"
                    pattern="^\+?[\d\s\-()]{7,20}$"
                    title="Enter 7-15 digits (e.g. +40 700 000 000)"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: sanitizePhoneInput(e.target.value) })}
                    placeholder="+40 700 000 000"
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-blue-600 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Biography / Credentials</label>
                  <textarea
                    rows="2"
                    value={formData.bio}
                    onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                    placeholder="Clinical qualifications, residency history, subspecialty areas..."
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-blue-600 focus:outline-none"
                  ></textarea>
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 shadow-sm shadow-blue-500/20"
                  >
                    Save Doctor
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal: Edit Doctor Credentials & Specialty */}
        {editingDoctor && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
            <div className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-6 shadow-xl">
              <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                <div>
                  <h3 className="text-lg font-bold text-slate-900">Edit Doctor Profile & License</h3>
                  <p className="text-xs text-slate-500">{editingDoctor.email}</p>
                </div>
                <button
                  onClick={() => setEditingDoctor(null)}
                  className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <form onSubmit={handleUpdateDoctor} className="mt-4 space-y-4">
                {modalError && (
                  <div className="flex items-start gap-2 rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700">
                    <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                    <span>{modalError}</span>
                  </div>
                )}
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Full Name</label>
                  <input
                    type="text"
                    required
                    value={editFormData.fullName}
                    onChange={(e) => setEditFormData({ ...editFormData, fullName: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-blue-600 focus:outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">Specialty</label>
                    <select
                      required
                      value={editFormData.specialtyId}
                      onChange={(e) => setEditFormData({ ...editFormData, specialtyId: e.target.value })}
                      className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-blue-600 focus:outline-none bg-white"
                    >
                      <option value="">Select Specialty</option>
                      {specialties.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">Medical License / Parafă #</label>
                    <input
                      type="text"
                      required
                      value={editFormData.licenseNumber}
                      onChange={(e) => setEditFormData({ ...editFormData, licenseNumber: e.target.value })}
                      className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-blue-600 focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Phone Number</label>
                  <input
                    type="tel"
                    inputMode="tel"
                    pattern="^\+?[\d\s\-()]{7,20}$"
                    title="Enter 7-15 digits (e.g. +40 700 000 000)"
                    value={editFormData.phone}
                    onChange={(e) => setEditFormData({ ...editFormData, phone: sanitizePhoneInput(e.target.value) })}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-blue-600 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Biography / Credentials</label>
                  <textarea
                    rows="2"
                    value={editFormData.bio}
                    onChange={(e) => setEditFormData({ ...editFormData, bio: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-blue-600 focus:outline-none"
                  ></textarea>
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setEditingDoctor(null)}
                    className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 shadow-sm shadow-blue-500/20"
                  >
                    Save Changes
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal: Weekly Shifts with Labor Code Rest Rules */}
        {selectedDoctorForShifts && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
            <div className="w-full max-w-xl rounded-2xl border border-slate-200 bg-white p-6 shadow-xl">
              <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                <div>
                  <h3 className="text-lg font-bold text-slate-900">
                    Weekly Shifts: {selectedDoctorForShifts.full_name}
                  </h3>
                  <p className="text-xs text-slate-500">{selectedDoctorForShifts.specialty_name}</p>
                </div>
                <button
                  onClick={() => setSelectedDoctorForShifts(null)}
                  className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {shiftError && (
                <div className="mt-4 flex items-start gap-2 rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700">
                  <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                  <span>{shiftError}</span>
                </div>
              )}

              {/* Form to add a shift */}
              <form onSubmit={handleAddShift} className="mt-4 flex flex-wrap items-end gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200">
                <div className="flex-1 min-w-[130px]">
                  <label className="block text-xs font-medium text-slate-700 mb-1">Day</label>
                  <div className="relative">
                    <select
                      value={shiftForm.dayOfWeek}
                      onChange={(e) => setShiftForm({ ...shiftForm, dayOfWeek: e.target.value })}
                      className="w-full appearance-none rounded-lg border border-slate-200 px-2.5 py-2 pr-8 text-xs bg-white capitalize focus:border-blue-600 focus:outline-none"
                    >
                      {DAYS.map((d) => (
                        <option key={d} value={d} className="capitalize">
                          {d}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
                  </div>
                </div>

                <div className="w-28">
                  <label className="block text-xs font-medium text-slate-700 mb-1">Start Time</label>
                  <CompactTimePicker
                    value={shiftForm.startTime}
                    onChange={(val) => setShiftForm({ ...shiftForm, startTime: val })}
                  />
                </div>

                <div className="w-28">
                  <label className="block text-xs font-medium text-slate-700 mb-1">End Time</label>
                  <CompactTimePicker
                    value={shiftForm.endTime}
                    onChange={(val) => setShiftForm({ ...shiftForm, endTime: val })}
                  />
                </div>

                <button
                  type="submit"
                  className="rounded-lg bg-blue-600 px-3.5 py-2 text-xs font-semibold text-white hover:bg-blue-700 transition"
                >
                  Add Shift
                </button>
              </form>

              {/* Shifts list */}
              <div className="mt-4 max-h-60 overflow-y-auto space-y-2">
                {shifts.length === 0 ? (
                  <p className="text-center py-6 text-xs text-slate-500">
                    No recurring shifts assigned yet.
                  </p>
                ) : (
                  shifts.map((s) => (
                    <div
                      key={s.id}
                      className="flex items-center justify-between rounded-lg border border-slate-100 bg-white p-3 shadow-xs"
                    >
                      <div className="flex items-center gap-3">
                        <span className="font-semibold text-xs capitalize text-slate-800 w-24">
                          {s.day_of_week}
                        </span>
                        <span className="text-xs text-slate-600 font-mono">
                          {formatTime(s.start_time)} - {formatTime(s.end_time)}
                        </span>
                      </div>
                      <button
                        onClick={() => handleDeleteShift(s.id)}
                        className="text-slate-400 hover:text-rose-600 transition p-1"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
