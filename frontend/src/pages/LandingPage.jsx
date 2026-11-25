import { Link } from 'react-router-dom'
import { Brain, FileText, CalendarCheck } from 'lucide-react'
import { useAuth } from '../context/AuthContext'

/**
 * Public portal landing page showcasing clinical features and patient entry points.
 *
 * @return {JSX.Element} Rendered landing page.
 */
export default function LandingPage() {
  const { user } = useAuth()

  return (
    <div className="bg-slate-50">
      {/* Hero Section */}
      <section className="relative overflow-hidden border-b border-slate-200 bg-white py-14 lg:py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-3xl text-center">
            <h1 className="text-4xl font-extrabold tracking-tight text-slate-900 sm:text-5xl lg:text-6xl">
              Intelligent Healthcare with <span className="text-blue-600">AI </span>
            </h1>
            <p className="mt-6 text-lg leading-relaxed text-slate-600">
              VitalisMed makes healthcare feel effortless. From figuring out what hurts to deciphering doctor handwriting and booking visits without the headache, we’ve got your back.
            </p>
            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
              {user ? (
                <Link
                  to="/dashboard"
                  className="w-full rounded-xl bg-blue-600 px-6 py-3.5 text-base font-semibold text-white shadow-sm shadow-blue-500/20 transition hover:bg-blue-700 sm:w-auto"
                >
                  Go to Dashboard
                </Link>
              ) : (
                <>
                  <Link
                    to="/register"
                    className="w-full rounded-xl bg-blue-600 px-6 py-3.5 text-base font-semibold text-white shadow-sm shadow-blue-500/20 transition hover:bg-blue-700 sm:w-auto"
                  >
                    Register as Patient
                  </Link>
                  <Link
                    to="/login"
                    className="w-full rounded-xl border border-slate-200 bg-white px-6 py-3.5 text-base font-semibold text-slate-700 transition hover:bg-slate-50 sm:w-auto"
                  >
                    Sign In
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Feature Grid */}
      <section className="py-10 lg:py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-8 md:grid-cols-3">
            <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm transition hover:shadow-md">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                <Brain className="h-6 w-6" />
              </div>
              <h3 className="mt-6 text-xl font-bold text-slate-900">Smart Symptom Checker</h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-600">
                Just tell us what’s bugging you in your own words. We’ll help pinpoint what kind of specialist you need and how urgently you should be seen-in seconds.
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm transition hover:shadow-md">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                <FileText className="h-6 w-6" />
              </div>
              <h3 className="mt-6 text-xl font-bold text-slate-900">Doctor Handwriting? Solved.</h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-600">
                Can’t read your doctor's scribbles? Snap a photo of your paper prescription and we’ll turn it into crystal-clear digital notes, backed by top-tier scan accuracy.
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm transition hover:shadow-md">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-purple-50 text-purple-600">
                <CalendarCheck className="h-6 w-6" />
              </div>
              <h3 className="mt-6 text-xl font-bold text-slate-900">Stress-Free Booking</h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-600">
                Schedule or reschedule your visits with zero hassle. Doctors stay organized, and you get clear reminders just give us a 24 hour heads-up if plans change!
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
