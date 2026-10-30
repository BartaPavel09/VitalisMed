import { Link, useNavigate } from 'react-router-dom'
import { Activity, LogOut, User as UserIcon } from 'lucide-react'
import { useAuth } from '../context/AuthContext'

/**
 * Top application navigation bar with role-based links and session actions.
 *
 * @return {JSX.Element} Rendered navigation header.
 */
export default function Navbar() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const roleBadgeColor = {
    admin: 'bg-purple-100 text-purple-700 border-purple-200',
    doctor: 'bg-emerald-100 text-emerald-700 border-emerald-200',
    patient: 'bg-blue-100 text-blue-700 border-blue-200'
  }

  return (
    <header className="sticky top-0 z-50 border-b border-slate-200 bg-white/95 backdrop-blur-sm">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link to="/" className="flex items-center gap-2.5 font-bold text-xl tracking-tight text-slate-900">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 text-white shadow-sm shadow-blue-500/20">
            <Activity className="h-6 w-6" />
          </span>
          <span>
            Vitalis<span className="text-blue-600">Med</span>
          </span>
        </Link>

        <nav className="flex items-center gap-6">
          {user ? (
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2.5 rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5">
                <UserIcon className="h-4 w-4 text-slate-500" />
                <span className="text-sm font-medium text-slate-800">{user.full_name}</span>
                <span
                  className={`rounded-full border px-2 py-0.5 text-xs font-semibold capitalize ${
                    roleBadgeColor[user.role] || 'bg-slate-100 text-slate-600'
                  }`}
                >
                  {user.role}
                </span>
              </div>

              <button
                onClick={handleLogout}
                className="flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-sm font-medium text-slate-600 transition hover:bg-slate-100 hover:text-slate-900"
              >
                <LogOut className="h-4 w-4" />
                <span>Logout</span>
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <Link
                to="/login"
                className="rounded-lg px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100 hover:text-slate-900"
              >
                Sign In
              </Link>
              <Link
                to="/register"
                className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm shadow-blue-500/20 transition hover:bg-blue-700"
              >
                Create Account
              </Link>
            </div>
          )}
        </nav>
      </div>
    </header>
  )
}
