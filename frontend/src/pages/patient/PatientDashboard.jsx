import { useState, useEffect } from 'react'
import { Calendar, Plus, Clock, FileText, AlertCircle, X, ChevronRight, Stethoscope } from 'lucide-react'
import { Link } from 'react-router-dom'
import client from '../../api/client'

/**
 * Patient personal dashboard displaying appointments history, prescriptions, and cancellation actions.
 *
 * @return {JSX.Element} Patient dashboard view.
 */
export default function PatientDashboard() {
  const [appointments, setAppointments] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [actionMessage, setActionMessage] = useState('')
  const [viewPrescription, setViewPrescription] = useState(null)

  useEffect(() => {
    fetchAppointments()
  }, [])

  const fetchAppointments = async () => {
    setLoading(true)
    setError('')
    try {
      const res = await client.get('/patient/appointments')
      setAppointments(res.data)
    } catch {
      setError('Failed to load patient appointments.')
    } finally {
      setLoading(false)
    }
  }

  const handleCancel = async (id) => {
    setError('')
    setActionMessage('')
    try {
      await client.patch(`/patient/appointments/${id}/cancel`)
      setActionMessage('Appointment cancelled successfully.')
      fetchAppointments()
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to cancel appointment.')
    }
  }

  const statusBadge = {
    pending: 'bg-amber-50 text-amber-700 border-amber-200',
    accepted: 'bg-blue-50 text-blue-700 border-blue-200',
    declined: 'bg-rose-50 text-rose-700 border-rose-200',
    completed: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    cancelled: 'bg-slate-100 text-slate-600 border-slate-200'
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-slate-50 py-10">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
              Patient Dashboard
            </h1>
            <p className="mt-1 text-sm text-slate-500">
              View upcoming appointments, clinical history, and digital prescriptions.
            </p>
          </div>
          <Link
            to="/patient/book"
            className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm shadow-blue-500/20 transition hover:bg-blue-700"
          >
            <Plus className="h-4 w-4" />
            Book Appointment
          </Link>
        </div>

        {error && (
          <div className="mb-6 flex items-start gap-2 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
            <AlertCircle className="h-5 w-5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {actionMessage && (
          <div className="mb-6 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700">
            {actionMessage}
          </div>
        )}

        {loading ? (
          <div className="flex h-64 items-center justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent"></div>
          </div>
        ) : (
          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-blue-600" />
                <h2 className="font-bold text-slate-900">Your Scheduled Appointments</h2>
              </div>
              <span className="text-xs text-slate-500">Cancellation deadline: 24h in advance</span>
            </div>

            <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
              <thead className="bg-slate-50 text-xs font-semibold uppercase tracking-wider text-slate-500">
                <tr>
                  <th className="px-6 py-4">Doctor & Specialty</th>
                  <th className="px-6 py-4">Appointment Date</th>
                  <th className="px-6 py-4">Symptoms</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {appointments.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="px-6 py-12 text-center text-slate-500">
                      You have no appointments booked. Click &quot;Book Appointment&quot; to schedule your appointment.
                    </td>
                  </tr>
                ) : (
                  appointments.map((a) => (
                    <tr key={a.id} className="hover:bg-slate-50/50 transition">
                      <td className="px-6 py-4">
                        <div className="font-semibold text-slate-900">{a.doctor_name}</div>
                        <div className="inline-flex items-center gap-1 text-xs text-blue-600 mt-0.5">
                          <Stethoscope className="h-3 w-3" /> {a.specialty_name}
                        </div>
                      </td>
                      <td className="px-6 py-4 font-medium text-slate-800">
                        {new Date(a.appointment_date).toLocaleString([], {
                          dateStyle: 'medium',
                          timeStyle: 'short'
                        })}
                      </td>
                      <td className="px-6 py-4 text-xs text-slate-600 max-w-xs truncate">
                        {a.symptoms || 'None specified'}
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
                          {a.has_prescription && (
                            <button
                              onClick={() => setViewPrescription(a)}
                              className="inline-flex items-center gap-1 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-700 px-3 py-1.5 text-xs font-medium hover:bg-emerald-100 transition"
                            >
                              <FileText className="h-3.5 w-3.5" /> View Prescription
                            </button>
                          )}

                          {a.can_cancel ? (
                            <button
                              onClick={() => handleCancel(a.id)}
                              className="inline-flex items-center gap-1 rounded-lg border border-rose-200 text-rose-700 px-3 py-1.5 text-xs font-medium hover:bg-rose-50 transition"
                            >
                              <X className="h-3.5 w-3.5" /> Cancel
                            </button>
                          ) : a.status === 'pending' || a.status === 'accepted' ? (
                            <span className="text-xs text-slate-400" title="Cannot cancel less than 24h prior">
                              Cancellation locked (&lt;24h)
                            </span>
                          ) : null}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Modal: View Digital Prescription */}
        {viewPrescription && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
            <div className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-6 shadow-xl">
              <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                <div>
                  <h3 className="text-lg font-bold text-slate-900">Medical Prescription</h3>
                  <p className="text-xs text-slate-500">
                    Dr. {viewPrescription.doctor_name} • {viewPrescription.specialty_name}
                  </p>
                </div>
                <button
                  onClick={() => setViewPrescription(null)}
                  className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="mt-4 space-y-4">
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">Diagnosis</h4>
                  <p className="mt-1 text-sm text-slate-800 bg-slate-50 p-3 rounded-xl border border-slate-100 font-medium">
                    {viewPrescription.diagnosis || 'No formal diagnosis noted.'}
                  </p>
                </div>

                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                    Medication & Administration Instructions
                  </h4>
                  <p className="mt-1 text-sm text-slate-800 bg-slate-50 p-3 rounded-xl border border-slate-100 whitespace-pre-line">
                    {viewPrescription.medication_instructions || 'No prescription instructions.'}
                  </p>
                </div>

                <div className="rounded-xl border border-blue-100 bg-blue-50/70 p-3 text-xs text-blue-700">
                  Notice: This digital prescription view is provided for patient treatment adherence and medication schedule tracking.
                </div>
              </div>

              <div className="mt-6 flex justify-end">
                <button
                  onClick={() => setViewPrescription(null)}
                  className="rounded-xl bg-slate-900 px-4 py-2 text-xs font-semibold text-white hover:bg-slate-800"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
