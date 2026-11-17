import { useState, useEffect } from 'react'
import { Calendar, Clock, Star, AlertCircle, Plus, Send, CheckCircle2, XCircle, ArrowRight } from 'lucide-react'
import { Link } from 'react-router-dom'
import client from '../../api/client'

/**
 * Doctor personal dashboard displaying aggregate rating, weekly shifts, vacation requests, and recent appointments.
 *
 * @return {JSX.Element} Doctor dashboard view.
 */
export default function DoctorDashboard() {
  const [profile, setProfile] = useState(null)
  const [shifts, setShifts] = useState([])
  const [vacations, setVacations] = useState([])
  const [appointments, setAppointments] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showVacationModal, setShowVacationModal] = useState(false)
  const [vacationForm, setVacationForm] = useState({
    startDate: '',
    endDate: '',
    reason: ''
  })

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    setLoading(true)
    setError('')
    try {
      const [profileRes, shiftsRes, vacationsRes, apptsRes] = await Promise.all([
        client.get('/doctor/profile'),
        client.get('/doctor/shifts'),
        client.get('/doctor/vacations'),
        client.get('/doctor/appointments')
      ])
      setProfile(profileRes.data)
      setShifts(shiftsRes.data)
      setVacations(vacationsRes.data)
      setAppointments(apptsRes.data.slice(0, 5))
    } catch {
      setError('Failed to load doctor practice data.')
    } finally {
      setLoading(false)
    }
  }

  const handleVacationSubmit = async (e) => {
    e.preventDefault()
    setError('')
    try {
      await client.post('/doctor/vacations', {
        start_date: vacationForm.startDate,
        end_date: vacationForm.endDate,
        reason: vacationForm.reason || null
      })
      setShowVacationModal(false)
      setVacationForm({ startDate: '', endDate: '', reason: '' })
      fetchDashboardData()
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to submit vacation request.')
    }
  }

  const vacationStatusBadge = {
    pending: 'bg-amber-50 text-amber-700 border-amber-200',
    approved: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    rejected: 'bg-rose-50 text-rose-700 border-rose-200'
  }

  const appointmentStatusBadge = {
    pending: 'bg-amber-50 text-amber-700 border-amber-200',
    accepted: 'bg-blue-50 text-blue-700 border-blue-200',
    declined: 'bg-rose-50 text-rose-700 border-rose-200',
    completed: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    cancelled: 'bg-slate-100 text-slate-600 border-slate-200'
  }

  if (loading) {
    return (
      <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center bg-slate-50">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-emerald-600 border-t-transparent"></div>
      </div>
    )
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-slate-50 py-10">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Header with Personal Rating */}
        <div className="mb-8 rounded-2xl border border-slate-200 bg-white p-6 sm:p-8 shadow-sm">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
                  {profile?.full_name}
                </h1>
                <span className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-0.5 text-xs font-semibold text-emerald-700">
                  {profile?.specialty_name || 'Specialist'}
                </span>
              </div>
              <p className="mt-1 text-sm text-slate-500">
                Medical License: <span className="font-mono text-slate-700">{profile?.license_number}</span>
              </p>
            </div>

            {/* Personal Rating Card */}
            <div className="flex items-center gap-4 rounded-xl border border-slate-100 bg-slate-50/80 p-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-100 text-amber-600">
                <Star className="h-6 w-6 fill-amber-400 stroke-amber-500" />
              </div>
              <div>
                <div className="flex items-baseline gap-1">
                  <span className="text-2xl font-extrabold text-slate-900">
                    {profile?.average_rating > 0 ? profile.average_rating.toFixed(1) : 'N/A'}
                  </span>
                  <span className="text-xs text-slate-400">/ 5.0</span>
                </div>
                <p className="text-xs text-slate-500">
                  {profile?.total_ratings} patient {profile?.total_ratings === 1 ? 'review' : 'reviews'}
                </p>
              </div>
            </div>
          </div>

          <div className="mt-6 flex flex-wrap gap-3 border-t border-slate-100 pt-6">
            <Link
              to="/doctor/appointments"
              className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-semibold text-white shadow-sm shadow-emerald-500/20 transition hover:bg-emerald-700"
            >
              <Calendar className="h-4 w-4" />
              Manage Appointments
            </Link>
            <button
              onClick={() => setShowVacationModal(true)}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              <Plus className="h-4 w-4" />
              Request Vacation
            </button>
          </div>
        </div>

        {error && (
          <div className="mb-6 flex items-start gap-2 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
            <AlertCircle className="h-5 w-5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Recent Appointments Section */}
        <div className="mb-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100">
            <div className="flex items-center gap-2.5">
              <Calendar className="h-5 w-5 text-emerald-600" />
              <h2 className="font-bold text-slate-900">Upcoming Appointments</h2>
            </div>
            <Link
              to="/doctor/appointments"
              className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 hover:text-emerald-800"
            >
              View All Appointments <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          <div className="mt-4 divide-y divide-slate-100">
            {appointments.length === 0 ? (
              <p className="py-6 text-center text-sm text-slate-500">
                No scheduled appointments. When patients book consultations, they will appear here.
              </p>
            ) : (
              appointments.map((a) => (
                <Link
                  key={a.id}
                  to="/doctor/appointments"
                  className="flex items-center justify-between py-3 hover:bg-slate-50/70 px-2 rounded-lg transition"
                >
                  <div>
                    <div className="font-semibold text-sm text-slate-900">{a.patient_name}</div>
                    <div className="text-xs text-slate-500 mt-0.5">
                      {new Date(a.appointment_date).toLocaleString([], {
                        dateStyle: 'medium',
                        timeStyle: 'short'
                      })}
                      {a.symptoms && ` • Symptoms: ${a.symptoms}`}
                    </div>
                  </div>
                  <span
                    className={`inline-block rounded-full border px-2.5 py-0.5 text-xs font-semibold capitalize ${
                      appointmentStatusBadge[a.status] || 'bg-slate-100 text-slate-700'
                    }`}
                  >
                    {a.status}
                  </span>
                </Link>
              ))
            )}
          </div>
        </div>

        <div className="grid gap-8 lg:grid-cols-2">
          {/* Assigned Weekly Shifts */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <Clock className="h-5 w-5 text-emerald-600" />
                <h2 className="font-bold text-slate-900">Weekly Shifts</h2>
              </div>
              <span className="text-xs text-slate-500">Recurring Schedule</span>
            </div>

            <div className="mt-4 divide-y divide-slate-100">
              {shifts.length === 0 ? (
                <p className="py-8 text-center text-sm text-slate-500">
                  No shifts scheduled. Contact administration to assign weekly clinical hours.
                </p>
              ) : (
                shifts.map((s) => (
                  <div key={s.id} className="flex items-center justify-between py-3">
                    <span className="font-semibold text-sm capitalize text-slate-800">
                      {s.day_of_week}
                    </span>
                    <span className="font-mono text-xs rounded-md bg-slate-100 px-2.5 py-1 text-slate-700">
                      {s.start_time.slice(0, 5)} - {s.end_time.slice(0, 5)}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Vacation Requests */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <Calendar className="h-5 w-5 text-blue-600" />
                <h2 className="font-bold text-slate-900">Vacation Requests</h2>
              </div>
              <button
                onClick={() => setShowVacationModal(true)}
                className="text-xs font-semibold text-blue-600 hover:text-blue-700"
              >
                + New Request
              </button>
            </div>

            <div className="mt-4 divide-y divide-slate-100 max-h-80 overflow-y-auto">
              {vacations.length === 0 ? (
                <p className="py-8 text-center text-sm text-slate-500">
                  No vacation requests submitted yet.
                </p>
              ) : (
                vacations.map((v) => (
                  <div key={v.id} className="py-3 flex items-start justify-between gap-4">
                    <div>
                      <div className="text-sm font-semibold text-slate-800">
                        {v.start_date} → {v.end_date}
                      </div>
                      {v.reason && (
                        <p className="mt-0.5 text-xs text-slate-500">{v.reason}</p>
                      )}
                    </div>
                    <span
                      className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-semibold capitalize ${
                        vacationStatusBadge[v.status] || 'bg-slate-100 text-slate-700'
                      }`}
                    >
                      {v.status === 'approved' && <CheckCircle2 className="h-3 w-3" />}
                      {v.status === 'rejected' && <XCircle className="h-3 w-3" />}
                      {v.status}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Modal: New Vacation Request */}
        {showVacationModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
            <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-xl">
              <h3 className="text-lg font-bold text-slate-900 pb-3 border-b border-slate-100">
                Submit Vacation Request
              </h3>

              <form onSubmit={handleVacationSubmit} className="mt-4 space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">Start Date</label>
                    <input
                      type="date"
                      required
                      value={vacationForm.startDate}
                      onChange={(e) => setVacationForm({ ...vacationForm, startDate: e.target.value })}
                      className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-emerald-600 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">End Date</label>
                    <input
                      type="date"
                      required
                      value={vacationForm.endDate}
                      onChange={(e) => setVacationForm({ ...vacationForm, endDate: e.target.value })}
                      className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-emerald-600 focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Reason (Optional)</label>
                  <textarea
                    rows="3"
                    value={vacationForm.reason}
                    onChange={(e) => setVacationForm({ ...vacationForm, reason: e.target.value })}
                    placeholder="Annual rest, academic conference attendance..."
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-emerald-600 focus:outline-none"
                  ></textarea>
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowVacationModal(false)}
                    className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 shadow-sm shadow-emerald-500/20"
                  >
                    <Send className="h-4 w-4" />
                    Submit Request
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
