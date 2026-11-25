import { useState, useEffect } from 'react'
import { Calendar, Clock, Stethoscope, AlertCircle, ArrowLeft, CheckCircle2 } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import client from '../../api/client'

const WEEKDAY_NAMES = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']

const getLocalTodayString = () => {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

const timeToMinutes = (timeStr) => {
  const [hours, minutes] = timeStr.slice(0, 5).split(':').map(Number)
  return hours * 60 + minutes
}

const minutesToTime = (totalMinutes) => {
  const hours = String(Math.floor(totalMinutes / 60)).padStart(2, '0')
  const minutes = String(totalMinutes % 60).padStart(2, '0')
  return `${hours}:${minutes}`
}

/**
 * Appointment booking workflow allowing patients to filter by specialty, review doctor shifts, and schedule visits.
 *
 * @return {JSX.Element} Appointment booking interface.
 */
export default function BookAppointment() {
  const [specialties, setSpecialties] = useState([])
  const [doctors, setDoctors] = useState([])
  const [selectedSpecialty, setSelectedSpecialty] = useState('')
  const [selectedDoctorId, setSelectedDoctorId] = useState('')
  const [appointmentDate, setAppointmentDate] = useState('')
  const [appointmentTime, setAppointmentTime] = useState('')
  const [symptoms, setSymptoms] = useState('')
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  const navigate = useNavigate()

  useEffect(() => {
    fetchSpecialtiesAndDoctors()
  }, [])

  const fetchSpecialtiesAndDoctors = async (specId = '') => {
    setLoading(true)
    setError('')
    try {
      const [specRes, docRes] = await Promise.all([
        client.get('/patient/specialties'),
        client.get(specId ? `/patient/doctors?specialty_id=${specId}` : '/patient/doctors')
      ])
      setSpecialties(specRes.data)
      setDoctors(docRes.data)
    } catch {
      setError('Failed to load clinic doctor directories.')
    } finally {
      setLoading(false)
    }
  }

  const handleSpecialtyChange = (e) => {
    const specId = e.target.value
    setSelectedSpecialty(specId)
    setSelectedDoctorId('')
    fetchSpecialtiesAndDoctors(specId)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!appointmentTime) {
      setError('Please select an available 30-minute appointment time slot.')
      return
    }
    setError('')
    setSubmitting(true)

    try {
      const combinedDateTime = `${appointmentDate}T${appointmentTime}:00`

      await client.post('/patient/appointments', {
        doctor_id: parseInt(selectedDoctorId, 10),
        appointment_date: combinedDateTime,
        symptoms: symptoms || null
      })

      setSuccess(true)
      setTimeout(() => {
        navigate('/patient/dashboard')
      }, 1500)
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to book appointment.')
    } finally {
      setSubmitting(false)
    }
  }

  const selectedDoctor = doctors.find((d) => d.id === parseInt(selectedDoctorId, 10))

  const getAvailableSlots = () => {
    if (!selectedDoctor || !appointmentDate) return { slots: [], statusMessage: '' }

    const isOnVacation = (selectedDoctor.vacations || []).some(
      (v) => appointmentDate >= v.start_date && appointmentDate <= v.end_date
    )
    if (isOnVacation) {
      return { slots: [], statusMessage: 'Doctor is on approved vacation on this date.' }
    }

    const [year, month, day] = appointmentDate.split('-').map(Number)
    const weekdayName = WEEKDAY_NAMES[new Date(year, month - 1, day).getDay()]
    const dayShifts = (selectedDoctor.shifts || []).filter((s) => s.day_of_week === weekdayName)

    if (dayShifts.length === 0) {
      return {
        slots: [],
        statusMessage: `Doctor has no clinical shift hours on ${weekdayName.charAt(0).toUpperCase() + weekdayName.slice(1)}.`
      }
    }

    const slotSet = new Set()
    const todayStr = getLocalTodayString()
    const now = new Date()
    const nowMinutes = now.getHours() * 60 + now.getMinutes()

    dayShifts.forEach((shift) => {
      const startMin = timeToMinutes(shift.start_time)
      const endMin = timeToMinutes(shift.end_time)
      for (let m = startMin; m + 30 <= endMin; m += 30) {
        if (appointmentDate === todayStr && m <= nowMinutes) {
          continue
        }
        slotSet.add(minutesToTime(m))
      }
    })

    const slots = Array.from(slotSet).sort()
    if (slots.length === 0) {
      return { slots: [], statusMessage: 'No remaining 30-minute time slots available for this date.' }
    }
    return { slots, statusMessage: '' }
  }

  const { slots: availableSlots, statusMessage: slotStatusMessage } = getAvailableSlots()

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-slate-50 py-10">
      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
        <Link
          to="/patient/dashboard"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-900 mb-6"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> Back to Dashboard
        </Link>

        <div className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8 shadow-sm">
          <div className="mb-6">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              Schedule Medical Appointment
            </h1>
            <p className="mt-1 text-sm text-slate-500">
              Choose a medical specialty, select your doctor, and schedule an appointment within their active clinic hours.
            </p>
          </div>

          {error && (
            <div className="mb-6 flex items-start gap-2 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
              <AlertCircle className="h-5 w-5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="mb-6 flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700">
              <CheckCircle2 className="h-5 w-5 shrink-0" />
              <span>Appointment booked successfully! Redirecting to dashboard...</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
                1. Select Medical Specialty
              </label>
              <select
                value={selectedSpecialty}
                onChange={handleSpecialtyChange}
                className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm bg-white focus:border-blue-600 focus:outline-none"
              >
                <option value="">All Clinical Specialties</option>
                {specialties.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
                2. Choose Doctor
              </label>
              {loading ? (
                <div className="py-4 text-center text-xs text-slate-400">Loading doctors...</div>
              ) : (
                <select
                  required
                  value={selectedDoctorId}
                  onChange={(e) => {
                    setSelectedDoctorId(e.target.value)
                    setAppointmentTime('')
                  }}
                  className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm bg-white focus:border-blue-600 focus:outline-none"
                >
                  <option value="">Select Doctor</option>
                  {doctors.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.full_name} ({d.specialty_name})
                    </option>
                  ))}
                </select>
              )}
            </div>

            {/* Doctor Shift Schedule Display */}
            {selectedDoctor && (
              <div className="rounded-xl border border-blue-100 bg-blue-50/50 p-4 text-xs">
                <div className="font-semibold text-slate-800 flex items-center gap-1.5 mb-2">
                  <Clock className="h-4 w-4 text-blue-600" />
                  Doctor Working Hours:
                </div>
                {selectedDoctor.shifts.length === 0 ? (
                  <p className="text-slate-500">No recurring shifts posted for this doctor.</p>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {selectedDoctor.shifts.map((s) => (
                      <span key={s.id} className="rounded-md bg-white border border-blue-200 px-2.5 py-1 text-slate-700 font-mono">
                        <strong className="capitalize">{s.day_of_week}</strong>: {s.start_time.slice(0, 5)} - {s.end_time.slice(0, 5)}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
                  3. Appointment Date
                </label>
                <input
                  type="date"
                  required
                  min={getLocalTodayString()}
                  value={appointmentDate}
                  onChange={(e) => {
                    setAppointmentDate(e.target.value)
                    setAppointmentTime('')
                  }}
                  className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm bg-white focus:border-blue-600 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
                  Time Slot (30-min intervals, 24h)
                </label>
                {!selectedDoctor || !appointmentDate ? (
                  <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 p-3.5 text-xs text-slate-500">
                    Select a doctor and appointment date to view available 30-minute time slots.
                  </div>
                ) : availableSlots.length === 0 ? (
                  <div className="rounded-xl border border-amber-200 bg-amber-50 p-3.5 text-xs text-amber-800">
                    {slotStatusMessage}
                  </div>
                ) : (
                  <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
                    {availableSlots.map((slot) => {
                      const isSelected = appointmentTime === slot
                      return (
                        <button
                          key={slot}
                          type="button"
                          onClick={() => setAppointmentTime(slot)}
                          className={`rounded-xl border py-2 text-xs font-mono font-semibold transition ${
                            isSelected
                              ? 'border-blue-600 bg-blue-600 text-white shadow-sm shadow-blue-500/20'
                              : 'border-slate-200 bg-white text-slate-700 hover:border-blue-300 hover:bg-blue-50'
                          }`}
                        >
                          {slot}
                        </button>
                      )
                    })}
                  </div>
                )}
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
                4. Primary Symptoms or Reason for Appointment
              </label>
              <textarea
                rows="3"
                value={symptoms}
                onChange={(e) => setSymptoms(e.target.value)}
                placeholder="Describe what you are experiencing (e.g. sharp headache, persistent cough for 4 days)..."
                className="w-full rounded-xl border border-slate-200 p-3.5 text-sm focus:border-blue-600 focus:outline-none"
              ></textarea>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full rounded-xl bg-blue-600 py-3 text-sm font-semibold text-white shadow-sm shadow-blue-500/20 transition hover:bg-blue-700 disabled:opacity-60"
            >
              {submitting ? 'Verifying & Booking...' : 'Confirm Booking'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
