import { createContext, useContext, useState, useEffect } from 'react'
import client from '../api/client'

const AuthContext = createContext(null)

/**
 * Authentication context provider managing user sessions and JWT tokens.
 *
 * @param {Object} props - Component properties.
 * @param {React.ReactNode} props.children - Child nodes to wrap.
 * @return {JSX.Element} AuthContext Provider tree.
 */
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [token, setToken] = useState(() => localStorage.getItem('vitalismed_token'))
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadUser() {
      const storedToken = localStorage.getItem('vitalismed_token')
      if (!storedToken) {
        setLoading(false)
        return
      }

      try {
        const response = await client.get('/auth/me')
        setUser(response.data)
      } catch {
        localStorage.removeItem('vitalismed_token')
        setUser(null)
        setToken(null)
      } finally {
        setLoading(false)
      }
    }

    loadUser()
  }, [])

  /**
   * Authenticate user credentials and store session token.
   *
   * @param {string} email - Account email.
   * @param {string} password - Account password.
   * @return {Promise<Object>} Authenticated user profile.
   */
  const login = async (email, password) => {
    const response = await client.post('/auth/login', { email, password })
    const { access_token } = response.data

    localStorage.setItem('vitalismed_token', access_token)
    setToken(access_token)

    const profileResponse = await client.get('/auth/me')
    setUser(profileResponse.data)
    return profileResponse.data
  }

  /**
   * Register a new patient account.
   *
   * @param {Object} userData - Patient registration payload.
   * @return {Promise<Object>} Created user record.
   */
  const register = async (userData) => {
    const response = await client.post('/auth/register', userData)
    return response.data
  }

  /**
   * Terminate active user session and clear local storage.
   *
   * @return {void}
   */
  const logout = () => {
    localStorage.removeItem('vitalismed_token')
    setToken(null)
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, token, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

/**
 * Custom hook to access authentication context values.
 *
 * @return {Object} Authentication state and handler functions.
 */
export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
