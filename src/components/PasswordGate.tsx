import { useState, useEffect, ReactNode } from 'react'

const APP_PASSWORD = import.meta.env.VITE_APP_PASSWORD || ''
const SESSION_KEY = 'app_authenticated_v2'

interface PasswordGateProps {
  children: ReactNode
}

export default function PasswordGate({ children }: PasswordGateProps) {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const storedAuth = sessionStorage.getItem(SESSION_KEY)
    if (storedAuth === 'true') {
      setIsAuthenticated(true)
    }
    setIsLoading(false)
  }, [])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (password === APP_PASSWORD) {
      sessionStorage.setItem(SESSION_KEY, 'true')
      setIsAuthenticated(true)
      setError('')
    } else {
      setError('Incorrect password')
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    )
  }

  if (isAuthenticated) {
    return <>{children}</>
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="bg-white p-8 rounded-2xl shadow-lg w-full max-w-sm">
        <div className="text-center mb-6">
          <img src="/td-icon.svg" alt="Logo" className="w-12 h-12 mx-auto mb-4" />
          <h1 className="text-xl font-medium text-gray-900">Welcome</h1>
          <p className="text-sm text-gray-500 mt-1">Enter password to continue</p>
        </div>

        <form onSubmit={handleSubmit}>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password"
            className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-center"
            autoFocus
          />

          {error && (
            <p className="text-red-500 text-sm text-center mt-2">{error}</p>
          )}

          <button
            type="submit"
            className="w-full mt-4 py-3 bg-blue-500 text-white rounded-lg font-medium hover:bg-blue-600 transition-colors"
          >
            Enter
          </button>
        </form>
      </div>
    </div>
  )
}
