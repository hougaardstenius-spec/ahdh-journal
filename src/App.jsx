import { useState, useEffect } from 'react'
import { supabase } from './lib/supabase'
import Auth from './components/Auth'
import DayView from './components/DayView'
import WeekView from './components/WeekView'
import TrendsView from './components/TrendsView'
import ExportView from './components/ExportView'
import TrainingView from './components/TrainingView'
import ProfileView from './components/ProfileView'
import './App.css'

const TABS = [
  { id: 'day',      label: 'Dag',     icon: '📓' },
  { id: 'week',     label: 'Uge',     icon: '📅' },
  { id: 'training', label: 'Træning', icon: '🏋️' },
  { id: 'trends',   label: 'Grafer',  icon: '📈' },
  { id: 'profile',  label: 'Profil',  icon: '👤' },
]

export default function App() {
  const [session, setSession] = useState(undefined)
  const [tab, setTab] = useState('day')
  const [confirmMsg, setConfirmMsg] = useState(null)

  useEffect(() => {
    const hash = window.location.hash
    if (hash && hash.includes('access_token')) {
      supabase.auth.getSession().then(({ data }) => {
        setSession(data.session)
        window.location.hash = ''
      })
      return
    }
    const params = new URLSearchParams(window.location.search)
    const tokenHash = params.get('token_hash')
    const type = params.get('type')
    if (tokenHash && type) {
      supabase.auth.verifyOtp({ token_hash: tokenHash, type }).then(({ data, error }) => {
        if (error) setConfirmMsg('Bekræftelseslinket er udløbet. Prøv igen.')
        else { setSession(data.session); setConfirmMsg(null) }
        window.history.replaceState({}, '', window.location.pathname)
      })
      return
    }
    supabase.auth.getSession().then(({ data }) => setSession(data.session))
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, s) => setSession(s))
    return () => subscription.unsubscribe()
  }, [])

  if (session === undefined) return <div className="loading">Indlæser…</div>
  if (!session) return <Auth errorMessage={confirmMsg} />

  return (
    <div className="app">
      <header className="app-header">
        <span className="app-header-title">ADHD Dagbog</span>
        <button className="signout-btn" onClick={() => supabase.auth.signOut()}>Log ud</button>
      </header>
      <main className="app-main">
        {tab === 'day'      && <DayView      user={session.user} />}
        {tab === 'week'     && <WeekView     user={session.user} />}
        {tab === 'training' && <TrainingView user={session.user} />}
        {tab === 'trends'   && <TrendsView   user={session.user} />}
        {tab === 'profile'  && <ProfileView  user={session.user} />}
      </main>
      <nav className="bottom-nav">
        {TABS.map(t => (
          <button key={t.id} className={`bnav-btn ${tab===t.id?'active':''}`} onClick={() => setTab(t.id)}>
            <span className="bnav-icon">{t.icon}</span>
            <span className="bnav-label">{t.label}</span>
          </button>
        ))}
      </nav>
    </div>
  )
}
