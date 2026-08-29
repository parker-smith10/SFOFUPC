import { useState } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function Login() {
  const { session, signIn } = useAuth()
  const location = useLocation()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  if (session) {
    const to = location.state?.from?.pathname || '/picks'
    return <Navigate to={to} replace />
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSubmitting(true)
    const { error } = await signIn(email, password)
    setSubmitting(false)
    if (error) setError('Incorrect email or password.')
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-osu-black px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <div className="font-display text-3xl text-osu-orange">Smith Family</div>
          <div className="font-display text-2xl text-osu-paper">
            OSU Football Uniform Prediction Competition
          </div>
        </div>

        <form
          onSubmit={handleSubmit}
          className="rounded-2xl border border-osu-orange/20 bg-osu-ink p-6 shadow-xl"
        >
          <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-osu-paper/60">
            Email
          </label>
          <input
            type="email"
            required
            autoComplete="username"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="mb-4 w-full rounded-lg border border-osu-paper/15 bg-osu-black px-3 py-2.5 text-osu-paper outline-none focus:border-osu-orange"
          />

          <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-osu-paper/60">
            Password
          </label>
          <input
            type="password"
            required
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="mb-4 w-full rounded-lg border border-osu-paper/15 bg-osu-black px-3 py-2.5 text-osu-paper outline-none focus:border-osu-orange"
          />

          {error && <p className="mb-4 text-sm font-medium text-red-400">{error}</p>}

          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-lg bg-osu-orange py-2.5 font-display text-sm tracking-wide text-white transition-opacity hover:opacity-90 disabled:opacity-50"
          >
            {submitting ? 'Signing in…' : 'Sign In'}
          </button>
        </form>

        <p className="mt-6 text-center text-xs text-osu-paper/40">
          Accounts are created by the commissioner. No self sign-up.
        </p>
      </div>
    </div>
  )
}
