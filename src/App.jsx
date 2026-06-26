import { useState, useEffect } from 'react'
import { supabase } from './lib/supabase'
import Auth from './components/Auth'
import DayView from './components/DayView'
import WeekView from './components/WeekView'
import TrendsView from './components/TrendsView'
import ExportView from './components/ExportView'
import './App.css'

const TABS = [
  { id: 'day', label: 'Dag', icon: '📓' },
  { id: 'week', label: 'Uge', icon: '📅' },
  { id: 'trends', label: 'Grafer', icon: '📈' },
  { id: 'export', label: 'Eksport', icon: '⬇' },
]

export default function App() {
  const [session, setSession] = useState(undefined)
  const [tab, setTab] = useState('day')

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session))
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
    })
    return () => subscription.unsubscribe()
  }, [])

  if (session === undefined) {
    return <div className="loading">Indlæser…</div>
  }

  if (!session) {
    return <Auth />
  }

  return (
    <div className="app">
      <header className="app-header">
        <span className="app-header-title">ADHD Dagbog</span>
        <button className="signout-btn" onClick={() => supabase.auth.signOut()}>Log ud</button>
      </header>

      <main className="app-main">
        {tab === 'day' && <DayView user={session.user} />}
        {tab === 'week' && <WeekView user={session.user} />}
        {tab === 'trends' && <TrendsView user={session.user} />}
        {tab === 'export' && <ExportView user={session.user} />}
      </main>

      <nav className="bottom-nav">
        {TABS.map(t => (
          <button
            key={t.id}
            className={`bnav-btn ${tab === t.id ? 'active' : ''}`}
            onClick={() => setTab(t.id)}
          >
            <span className="bnav-icon">{t.icon}</span>
            <span className="bnav-label">{t.label}</span>
          </button>
        ))}
      </nav>
    </div>
  )
}
