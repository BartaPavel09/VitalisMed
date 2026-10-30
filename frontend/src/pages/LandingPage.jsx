import { Link } from 'react-router-dom'
import { Activity, Brain, FileText, CalendarCheck, ShieldCheck } from 'lucide-react'
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
      <section className="relative overflow-hidden border-b border-slate-200 bg-white py-20 lg:py-28">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-3xl text-center">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
              <Activity className="h-3.5 w-3.5" /> Modern Medical Management
            </span>
            <h1 className="mt-6 text-4xl font-extrabold tracking-tight text-slate-900 sm:text-5xl lg:text-6xl">
              Intelligent Healthcare with <span className="text-blue-600">AI Triage</span> & Prescription OCR
            </h1>
            <p className="mt-6 text-lg leading-relaxed text-slate-600">
              VitalisMed bridges advanced Natural Language Processing for automated patient symptom triage with comparative OCR handwriting digitization for seamless clinical prescriptions.
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
      <section className="py-16 lg:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-8 md:grid-cols-3">
            <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm transition hover:shadow-md">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                <Brain className="h-6 w-6" />
              </div>
              <h3 className="mt-6 text-xl font-bold text-slate-900">NLP Symptom Triage</h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-600">
                Patients describe symptoms naturally. Our neural model identifies the medical specialty and urgency level instantly.
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm transition hover:shadow-md">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                <FileText className="h-6 w-6" />
              </div>
              <h3 className="mt-6 text-xl font-bold text-slate-900">Comparative Prescription OCR</h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-600">
                Digitize handwritten prescriptions with automated watermarking and benchmark EasyOCR, Tesseract, and PaddleOCR accuracy.
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm transition hover:shadow-md">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-purple-50 text-purple-600">
                <CalendarCheck className="h-6 w-6" />
              </div>
              <h3 className="mt-6 text-xl font-bold text-slate-900">Clinical Scheduling & Auditing</h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-600">
                Manage doctor shifts, vacation requests, and enforce a strict 24-hour advance appointment cancellation policy.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
