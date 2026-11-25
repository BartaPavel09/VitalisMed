import { Link } from 'react-router-dom'
import { Users, Stethoscope, Clock } from 'lucide-react'

/**
 * Dedicated administrative portal dashboard.
 *
 * @return {JSX.Element} Admin dashboard view.
 */
export default function AdminDashboard() {
  return (
    <div className="min-h-[calc(100vh-4rem)] bg-slate-50 py-10">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
            Admin Dashboard
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Manage doctors, schedules, and clinical operations.
          </p>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:shadow-md">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-purple-50 text-purple-600">
              <Users className="h-6 w-6" />
            </div>
            <h3 className="mt-4 font-bold text-slate-900">Doctor Directory</h3>
            <p className="mt-1 text-sm text-slate-500">
              Enroll doctors, maintain license numbers, edit credentials, and schedule weekly shifts.
            </p>
            <Link
              to="/admin/doctors"
              className="mt-4 inline-block rounded-xl bg-purple-600 px-4 py-2 text-xs font-semibold text-white transition hover:bg-purple-700 shadow-sm shadow-purple-500/20"
            >
              Manage Doctors
            </Link>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:shadow-md">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
              <Clock className="h-6 w-6" />
            </div>
            <h3 className="mt-4 font-bold text-slate-900">Vacation Requests</h3>
            <p className="mt-1 text-sm text-slate-500">
              Review and approve or reject clinical staff vacation requests.
            </p>
            <Link
              to="/admin/vacations"
              className="mt-4 inline-block rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              Review Requests
            </Link>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:shadow-md">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
              <Stethoscope className="h-6 w-6" />
            </div>
            <h3 className="mt-4 font-bold text-slate-900">Clinical Specialties</h3>
            <p className="mt-1 text-sm text-slate-500">
              Create and manage medical specialties available across the clinic.
            </p>
            <Link
              to="/admin/specialties"
              className="mt-4 inline-block rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              Manage Specialties
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
