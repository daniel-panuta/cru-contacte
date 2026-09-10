import { useState } from 'react'
import api from '../lib/api'

const TOKEN_KEY = 'token'
const USER_KEY = 'user'

function readStoredUser() {
  const raw = localStorage.getItem(USER_KEY)
  if (!raw) {
    return null
  }

  try {
    return JSON.parse(raw)
  } catch {
    localStorage.removeItem(USER_KEY)
    return null
  }
}

export default function useAuth() {
  const [token, setToken] = useState(() => localStorage.getItem(TOKEN_KEY))
  const [user, setUser] = useState(() => readStoredUser())
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const login = async (email, password) => {
    setLoading(true)
    try {
      const response = await api.post('/auth/login', { email, password })
      const { access_token: accessToken, user: loggedInUser } = response.data

      localStorage.setItem(TOKEN_KEY, accessToken)
      localStorage.setItem(USER_KEY, JSON.stringify(loggedInUser))

      setToken(accessToken)
      setUser(loggedInUser)
      setError(null)

      return response.data
    } catch (err) {
      const message = err.response?.data?.detail || 'Login failed'
      setError(message)
      throw err
    } finally {
      setLoading(false)
    }
  }

  const logout = () => {
    localStorage.removeItem(TOKEN_KEY)
    localStorage.removeItem(USER_KEY)
    setToken(null)
    setUser(null)
    setError(null)
  }

  return {
    token,
    user,
    loading,
    error,
    isAuthenticated: Boolean(token),
    login,
    logout,
  }
}
