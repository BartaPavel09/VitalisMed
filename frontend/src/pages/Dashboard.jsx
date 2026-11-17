import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

/**
 * Smart role-based dashboard router directing users to their dedicated workspace.
 *
 * @return {JSX.Element} Navigation redirect to role-specific dashboard.
 */
export default function Dashboard() {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center bg-slate-50">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent"></div>
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/login" replace />
  }

  if (user.role === 'doctor') {
    return <Navigate to="/doctor/dashboard" replace />
  }

  if (user.role === 'admin') {
    return <Navigate to="/admin/dashboard" replace />
  }

  return <Navigate to="/patient/dashboard" replace />
}
