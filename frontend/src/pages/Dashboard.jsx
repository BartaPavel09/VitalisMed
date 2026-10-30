import { useAuth } from '../context/AuthContext'
import { Calendar, Users, Stethoscope, FileText, Brain, Shield, Clock, Star } from 'lucide-react'

/**
 * Role-aware portal dashboard rendering contextual cards for Patient, Doctor, or Admin.
 *
 * @return {JSX.Element} Rendered user dashboard.
 */
export default function Dashboard() {
  const { user } = useAuth()

  const roleBadgeStyle = {
    admin: 'bg-purple-100 text-purple-700 border-purple-200',
    doctor: 'bg-emerald-100 text-emerald-700 border-emerald-200',
    patient: 'bg-blue-100 text-blue-700 border-blue-200'
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-slate-50 py-10">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Welcome Banner */}
        <div className="mb-8 rounded-2xl border border-slate-200 bg-white p-6 sm:p-8 shadow-sm">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
                  Welcome back, {user?.full_name}!
                </h1>
                <span
                  className={`rounded-full border px-3 py-0.5 text-xs font-semibold capitalize ${
                    roleBadgeStyle[user?.role] || 'bg-slate-100 text-slate-700'
                  }`}
                >
                  {user?.role}
                </span>
              </div>
              <p className="mt-1 text-sm text-slate-500">
                Connected account: <span className="font-medium text-slate-700">{user?.email}</span>
              </p>
            </div>
          </div>
        </div>

        {/* Role Content */}
        {user?.role === 'patient' && (
          <div>
            <h2 className="mb-4 text-lg font-bold text-slate-900">Patient Services</h2>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:shadow-md">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                  <Brain className="h-6 w-6" />
                </div>
                <h3 className="mt-4 font-bold text-slate-900">AI Symptom Triage</h3>
                <p className="mt-1 text-sm text-slate-500">
                  Describe symptoms to get an automated recommendation for the required medical specialty and urgency level.
                </p>
                <button className="mt-4 rounded-xl bg-blue-600 px-4 py-2 text-xs font-semibold text-white transition hover:bg-blue-700">
                  Start Symptom Check
                </button>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:shadow-md">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
                  <Calendar className="h-6 w-6" />
                </div>
                <h3 className="mt-4 font-bold text-slate-900">Book Appointment</h3>
                <p className="mt-1 text-sm text-slate-500">
                  Schedule consultations with clinic doctors. Note: Cancellations are accepted up to 24 hours in advance.
                </p>
                <button className="mt-4 rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-50">
                  View Available Slots
                </button>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:shadow-md">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                  <FileText className="h-6 w-6" />
                </div>
                <h3 className="mt-4 font-bold text-slate-900">Prescriptions & History</h3>
                <p className="mt-1 text-sm text-slate-500">
                  Access digital watermarked prescriptions, medication administration schedules, and completed consultations.
                </p>
                <button className="mt-4 rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-50">
                  View Records
                </button>
              </div>
            </div>
          </div>
        )}

        {user?.role === 'doctor' && (
          <div>
            <h2 className="mb-4 text-lg font-bold text-slate-900">Doctor Practice Management</h2>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:shadow-md">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                  <Calendar className="h-6 w-6" />
                </div>
                <h3 className="mt-4 font-bold text-slate-900">Consultation Requests</h3>
                <p className="mt-1 text-sm text-slate-500">
                  Review upcoming patient appointments. Accept or decline requests up to 24 hours before consultation.
                </p>
                <button className="mt-4 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-semibold text-white transition hover:bg-emerald-700">
                  Manage Appointments
                </button>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:shadow-md">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                  <FileText className="h-6 w-6" />
                </div>
                <h3 className="mt-4 font-bold text-slate-900">Prescription Digitizer</h3>
                <p className="mt-1 text-sm text-slate-500">
                  Scan handwritten prescriptions. Comparative OCR extracts diagnosis and medication instructions for review.
                </p>
                <button className="mt-4 rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-50">
                  Upload & Scan
                </button>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:shadow-md">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-purple-50 text-purple-600">
                  <Clock className="h-6 w-6" />
                </div>
                <h3 className="mt-4 font-bold text-slate-900">Weekly Shifts & Leave</h3>
                <p className="mt-1 text-sm text-slate-500">
                  View your assigned weekly schedule and submit vacation requests for administrator approval.
                </p>
                <button className="mt-4 rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-50">
                  View Schedule
                </button>
              </div>
            </div>
          </div>
        )}

        {user?.role === 'admin' && (
          <div>
            <h2 className="mb-4 text-lg font-bold text-slate-900">Clinic Administration</h2>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:shadow-md">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-purple-50 text-purple-600">
                  <Users className="h-6 w-6" />
                </div>
                <h3 className="mt-4 font-bold text-slate-900">Doctor Directory</h3>
                <p className="mt-1 text-sm text-slate-500">Add, edit, or deactivate doctor profiles and licenses.</p>
                <button className="mt-4 rounded-xl bg-purple-600 px-4 py-2 text-xs font-semibold text-white transition hover:bg-purple-700">
                  Manage Doctors
                </button>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:shadow-md">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                  <Stethoscope className="h-6 w-6" />
                </div>
                <h3 className="mt-4 font-bold text-slate-900">Specialties</h3>
                <p className="mt-1 text-sm text-slate-500">Configure medical specialties and department descriptions.</p>
                <button className="mt-4 rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-50">
                  Manage Specialties
                </button>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:shadow-md">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
                  <Clock className="h-6 w-6" />
                </div>
                <h3 className="mt-4 font-bold text-slate-900">Vacation Requests</h3>
                <p className="mt-1 text-sm text-slate-500">Review pending doctor leave requests and approve/decline.</p>
                <button className="mt-4 rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-50">
                  Review Requests
                </button>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:shadow-md">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                  <Star className="h-6 w-6" />
                </div>
                <h3 className="mt-4 font-bold text-slate-900">Clinic Analytics</h3>
                <p className="mt-1 text-sm text-slate-500">View appointments by specialty and aggregate doctor ratings.</p>
                <button className="mt-4 rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-50">
                  View Analytics
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
