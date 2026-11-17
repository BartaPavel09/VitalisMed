import { useState, useEffect } from 'react'
import { Check, X, FileText, AlertCircle, Clock, ArrowLeft } from 'lucide-react'
import { Link } from 'react-router-dom'
import client from '../../api/client'

/**
 * Doctor appointment management page supporting acceptance, 24h deadline decline, and prescription handoff.
 *
 * @return {JSX.Element} Doctor appointments management view.
 */
export default function DoctorAppointments() {
  const [appointments, setAppointments] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [actionSuccess, setActionSuccess] = useState('')

  useEffect(() => {
    fetchAppointments()
  }, [])

  const fetchAppointments = async () => {
    setLoading(true)
    setError('')
    try {
      const res = await client.get('/doctor/appointments')
      setAppointments(res.data)
    } catch {
      setError('Failed to load appointments.')
    } finally {
      setLoading(false)
    }
  }

  const handleAccept = async (id) => {
    setError('')
    setActionSuccess('')
    try {
      await client.patch(`/doctor/appointments/${id}/accept`)
      setActionSuccess('Appointment accepted successfully.')
      fetchAppointments()
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to accept appointment.')
    }
  }

  const handleDecline = async (id) => {
    setError('')
    setActionSuccess('')
    try {
      await client.patch(`/doctor/appointments/${id}/decline`)
      setActionSuccess('Appointment declined successfully.')
      fetchAppointments()
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to decline appointment. Notice: decline deadline is 24 hours in advance.')
    }
  }

  const statusBadge = {
    pending: 'bg-amber-50 text-amber-700 border-amber-200',
    accepted: 'bg-blue-50 text-blue-700 border-blue-200',
    declined: 'bg-rose-50 text-rose-700 border-rose-200',
    completed: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    cancelled: 'bg-slate-100 text-slate-600 border-slate-200'
  }

  const urgencyBadge = {
    low: 'bg-slate-100 text-slate-700',
    medium: 'bg-blue-100 text-blue-800',
    high: 'bg-amber-100 text-amber-800',
    emergency: 'bg-rose-100 text-rose-800 font-bold'
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-slate-50 py-10">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <Link
              to="/doctor/dashboard"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-900 mb-2"
            >
              <ArrowLeft className="h-3.5 w-3.5" /> Back to Doctor Dashboard
            </Link>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
              Patient Appointments
            </h1>
            <p className="mt-1 text-sm text-slate-500">
              Review scheduled appointments, check symptom triage classifications, and proceed with patient appointments.
            </p>
          </div>
        </div>

        {error && (
          <div className="mb-6 flex items-start gap-2 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
            <AlertCircle className="h-5 w-5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {actionSuccess && (
          <div className="mb-6 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700">
            {actionSuccess}
          </div>
        )}

        {loading ? (
          <div className="flex h-64 items-center justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-emerald-600 border-t-transparent"></div>
          </div>
        ) : (
          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
              <thead className="bg-slate-50 text-xs font-semibold uppercase tracking-wider text-slate-500">
                <tr>
                  <th className="px-6 py-4">Patient</th>
                  <th className="px-6 py-4">Scheduled Date</th>
                  <th className="px-6 py-4">Reported Symptoms & Triage</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {appointments.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="px-6 py-12 text-center text-slate-500">
                      No appointments recorded yet.
                    </td>
                  </tr>
                ) : (
                  appointments.map((a) => {
                    const isWithin24Hours = new Date(a.appointment_date) - new Date() < 24 * 3600 * 1000

                    return (
                      <tr key={a.id} className="hover:bg-slate-50/50 transition">
                        <td className="px-6 py-4">
                          <div className="font-semibold text-slate-900">{a.patient_name}</div>
                          <div className="text-xs text-slate-500 mt-0.5">{a.patient_email}</div>
                          {a.patient_phone && (
                            <div className="text-xs text-slate-400">{a.patient_phone}</div>
                          )}
                        </td>
                        <td className="px-6 py-4 font-medium text-slate-800">
                          {new Date(a.appointment_date).toLocaleString([], {
                            dateStyle: 'medium',
                            timeStyle: 'short'
                          })}
                        </td>
                        <td className="px-6 py-4 max-w-xs">
                          <p className="text-xs text-slate-700 truncate">{a.symptoms || 'None specified'}</p>
                          {a.triage_urgency && (
                            <span
                              className={`mt-1 inline-block rounded-md px-2 py-0.5 text-xs capitalize ${
                                urgencyBadge[a.triage_urgency] || 'bg-slate-100 text-slate-700'
                              }`}
                            >
                              Urgency: {a.triage_urgency}
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <span
                            className={`inline-block rounded-full border px-2.5 py-0.5 text-xs font-semibold capitalize ${
                              statusBadge[a.status] || 'bg-slate-100 text-slate-700'
                            }`}
                          >
                            {a.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            {a.status === 'pending' && (
                              <>
                                <button
                                  onClick={() => handleAccept(a.id)}
                                  className="inline-flex items-center gap-1 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-emerald-700 transition"
                                >
                                  <Check className="h-3.5 w-3.5" /> Accept
                                </button>
                                <button
                                  onClick={() => handleDecline(a.id)}
                                  disabled={isWithin24Hours}
                                  title={isWithin24Hours ? 'Cannot decline within 24h of appointment' : ''}
                                  className="inline-flex items-center gap-1 rounded-lg border border-rose-200 px-3 py-1.5 text-xs font-medium text-rose-700 hover:bg-rose-50 transition disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                  <X className="h-3.5 w-3.5" /> Decline
                                </button>
                              </>
                            )}

                            {a.status === 'accepted' && (
                              <button
                                className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm shadow-blue-500/20 hover:bg-blue-700 transition"
                              >
                                <FileText className="h-3.5 w-3.5" />
                                Complete & Prescription
                              </button>
                            )}

                            {a.status === 'completed' && (
                              <span className="text-xs font-medium text-emerald-700 flex items-center gap-1">
                                <Clock className="h-3.5 w-3.5" /> Appointment Completed
                              </span>
                            )}
                          </div>
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
