import { useState } from 'react'
import { supabase } from '../lib/supabase'
import './Auth.css'

export default function Auth({ errorMessage }) {
  const [mode, setMode] = useState('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState(null)
  const [error, setError] = useState(null)

  async function handleSubmit(e) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setMessage(null)

    if (mode === 'login') {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) setError('Forkert e-mail eller adgangskode.')
    } else if (mode === 'signup') {
      const { error } = await supabase.auth.signUp({ email, password })
      if (error) setError(error.message)
      else setMessage('Tjek din e-mail for at bekræfte din konto.')
    } else {
      const { error } = await supabase.auth.resetPasswordForEmail(email)
      if (error) setError(error.message)
      else setMessage('Nulstillingslink sendt til din e-mail.')
    }
    setLoading(false)
  }

  return (
    <div className="auth-wrap">
      <div className="auth-card">
        <div className="auth-logo">
          <div className="auth-icon">A</div>
          <h1 className="auth-title">ADHD Dagbog</h1>
          <p className="auth-sub">Din personlige ADHD-journal</p>
        </div>

        <div className="auth-tabs">
          <button className={`auth-tab ${mode === 'login' ? 'active' : ''}`} onClick={() => { setMode('login'); setError(null); setMessage(null) }}>Log ind</button>
          <button className={`auth-tab ${mode === 'signup' ? 'active' : ''}`} onClick={() => { setMode('signup'); setError(null); setMessage(null) }}>Opret konto</button>
        </div>

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="field-group">
            <label className="field-label">E-mail</label>
            <input
              className="field-input"
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="din@email.dk"
              required
              autoComplete="email"
            />
          </div>
          {mode !== 'reset' && (
            <div className="field-group">
              <label className="field-label">Adgangskode</label>
              <input
                className="field-input"
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="Min. 6 tegn"
                required
                minLength={6}
                autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
              />
            </div>
          )}

          {errorMessage {error && <div className="auth-error">{error}</div>}{error && <div className="auth-error">{error}</div>} <div className="auth-error">{errorMessage}</div>}
          {error && <div className="auth-error">{error}</div>}
          {message && <div className="auth-message">{message}</div>}

          <button className="auth-btn" type="submit" disabled={loading}>
            {loading ? 'Vent…' : mode === 'login' ? 'Log ind' : mode === 'signup' ? 'Opret konto' : 'Send nulstillingslink'}
          </button>
        </form>

        {mode === 'login' && (
          <button className="auth-link" onClick={() => { setMode('reset'); setError(null); setMessage(null) }}>
            Glemt adgangskode?
          </button>
        )}
        {mode === 'reset' && (
          <button className="auth-link" onClick={() => { setMode('login'); setError(null); setMessage(null) }}>
            Tilbage til login
          </button>
        )}
      </div>
    </div>
  )
}
