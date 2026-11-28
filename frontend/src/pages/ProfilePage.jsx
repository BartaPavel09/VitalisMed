import { useState, useEffect } from 'react'
import { ArrowLeft, User as UserIcon, Mail, Phone, Shield, Calendar, CheckCircle2, AlertCircle } from 'lucide-react'
import { Link } from 'react-router-dom'
import client from '../api/client'
import { useAuth } from '../context/AuthContext'

const sanitizePhoneInput = (value) => value.replace(/[^0-9+\-\s()]/g, '')

/**
 * Shared profile page for all authenticated roles (admin, doctor, patient).
 *
 * @return {JSX.Element} User profile view and edit form.
 */
export default function ProfilePage() {
  const { user } = useAuth()
  const [profile, setProfile] = useState(null)
  const [fullName, setFullName] = useState('')
  const [phoneNumber, setPhoneNumber] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  useEffect(() => {
    fetchProfile()
  }, [])

  const fetchProfile = async () => {
    setLoading(true)
    setError('')
    try {
      const res = await client.get('/auth/me')
      setProfile(res.data)
      setFullName(res.data.full_name || '')
      setPhoneNumber(res.data.phone_number || '')
    } catch {
      setError('Failed to load profile details.')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)
    setError('')
    setSuccess('')
    try {
      const res = await client.put('/auth/me', {
        full_name: fullName.trim(),
        phone_number: phoneNumber.trim() || null
      })
      setProfile(res.data)
      setFullName(res.data.full_name || '')
      setPhoneNumber(res.data.phone_number || '')
      setSuccess('Profile updated successfully.')
    } catch (err) {
      const detail = err.response?.data?.detail
      setError(Array.isArray(detail) ? detail[0]?.msg || 'Invalid profile input.' : detail || 'Failed to update profile.')
    } finally {
      setSaving(false)
    }
  }

  const roleBadgeColor = {
    admin: 'bg-purple-100 text-purple-700 border-purple-200',
    doctor: 'bg-emerald-100 text-emerald-700 border-emerald-200',
    patient: 'bg-blue-100 text-blue-700 border-blue-200'
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-slate-50 py-10">
      <div className="mx-auto max-w-2xl px-4 sm:px-6 lg:px-8">
        <Link
          to="/dashboard"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-900 mb-6"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> Back to Dashboard
        </Link>

        <div className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8 shadow-sm">
          <div className="flex items-center justify-between pb-6 border-b border-slate-100">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                <UserIcon className="h-6 w-6" />
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
                  My Profile
                </h1>
                <p className="text-xs text-slate-500">
                  Manage your personal account details
                </p>
              </div>
            </div>
            {(profile?.role || user?.role) && (
              <span
                className={`rounded-full border px-3 py-1 text-xs font-semibold capitalize ${
                  roleBadgeColor[profile?.role || user?.role] || 'bg-slate-100 text-slate-600'
                }`}
              >
                {profile?.role || user?.role}
              </span>
            )}
          </div>

          {loading ? (
            <div className="flex h-48 items-center justify-center">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent"></div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="mt-6 space-y-5">
              {error && (
                <div className="flex items-start gap-2 rounded-xl border border-rose-200 bg-rose-50 p-3.5 text-sm text-rose-700">
                  <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}

              {success && (
                <div className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 p-3.5 text-sm text-emerald-700">
                  <CheckCircle2 className="h-4 w-4 shrink-0" />
                  <span>{success}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                  Full Name
                </label>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm text-slate-900 focus:border-blue-600 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                  Email Address
                </label>
                <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-500">
                  <Mail className="h-4 w-4 text-slate-400" />
                  <span>{profile?.email}</span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                  Phone Number
                </label>
                <div className="relative">
                  <Phone className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input
                    type="tel"
                    inputMode="tel"
                    pattern="^\+?[\d\s\-()]{7,20}$"
                    title="Enter 7-15 digits (e.g. +40 700 000 000)"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(sanitizePhoneInput(e.target.value))}
                    placeholder="+40 700 000 000"
                    className="w-full rounded-xl border border-slate-200 pl-10 pr-3.5 py-2.5 text-sm text-slate-900 focus:border-blue-600 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 pt-2">
                <div className="rounded-xl border border-slate-100 bg-slate-50 p-3.5">
                  <div className="flex items-center gap-1.5 text-xs font-medium text-slate-500">
                    <Shield className="h-3.5 w-3.5" /> Account Status
                  </div>
                  <div className="mt-1 text-sm font-semibold text-slate-800">
                    {profile?.is_active ? 'Active' : 'Inactive'}
                  </div>
                </div>
                <div className="rounded-xl border border-slate-100 bg-slate-50 p-3.5">
                  <div className="flex items-center gap-1.5 text-xs font-medium text-slate-500">
                    <Calendar className="h-3.5 w-3.5" /> Member Since
                  </div>
                  <div className="mt-1 text-sm font-semibold text-slate-800">
                    {profile?.created_at ? new Date(profile.created_at).toLocaleDateString() : '—'}
                  </div>
                </div>
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  type="submit"
                  disabled={saving}
                  className="rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm shadow-blue-500/20 transition hover:bg-blue-700 disabled:opacity-50"
                >
                  {saving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
