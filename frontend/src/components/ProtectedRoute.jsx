import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

/**
 * Route guard restricting access to authenticated users with specified roles.
 *
 * @param {Object} props - Component properties.
 * @param {React.ReactNode} props.children - Child elements to display when authorized.
 * @param {string[]} [props.allowedRoles] - Optional list of authorized roles.
 * @return {JSX.Element} Protected component or navigation redirect.
 */
export default function ProtectedRoute({ children, allowedRoles = [] }) {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-blue-600 border-t-transparent"></div>
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/login" replace />
  }

  if (allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
    return <Navigate to="/" replace />
  }

  return children
}
