import { useState, useEffect, useCallback } from 'react'
import { supabase } from './lib/supabase'
import { XP_REWARDS, getXPLevel } from './lib/gamification'
import Auth from './components/Auth'
import DayView from './components/DayView'
import WeekView from './components/WeekView'
import TrendsView from './components/TrendsView'
import ExportView from './components/ExportView'
import TrainingView from './components/TrainingView'
import ProfileView from './components/ProfileView'
import Confetti from './components/Confetti'
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
  const [gamification, setGamification] = useState(null)
  const [confetti, setConfetti] = useState(false)
  const [xpGain, setXpGain] = useState(0)

  const today = new Date().toISOString().slice(0, 10)

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

  const loadGamification = useCallback(async (userId) => {
    const { data } = await supabase
      .from('gamification')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle()

    if (!data) {
      const init = {
        user_id: userId,
        total_xp: 0,
        current_streak: 0,
        longest_streak: 0,
        last_log_date: null,
        spin_date: null,
      }
      await supabase.from('gamification').insert(init)
      setGamification(init)
    } else {
      setGamification(data)
    }
  }, [])

  useEffect(() => {
    if (session?.user) loadGamification(session.user.id)
  }, [session, loadGamification])

  async function awardXP(amount, celebrate = false) {
    if (!session?.user || !gamification) return
    const newXP = (gamification.total_xp || 0) + amount
    const before = getXPLevel(gamification.total_xp || 0)
    const after = getXPLevel(newXP)
    const didLevelUp = after.current.level > before.current.level

    // Compute streak
    const lastLog = gamification.last_log_date
    let newStreak = gamification.current_streak || 0
    const yesterday = new Date(); yesterday.setDate(yesterday.getDate() - 1)
    const yesterdayKey = yesterday.toISOString().slice(0, 10)

    if (lastLog === today) {
      // Already logged today, just add XP
    } else if (lastLog === yesterdayKey) {
      newStreak += 1
    } else if (lastLog !== today) {
      newStreak = 1
    }

    const newLongest = Math.max(newStreak, gamification.longest_streak || 0)

    const upd = {
      total_xp: newXP,
      current_streak: newStreak,
      longest_streak: newLongest,
      last_log_date: today,
    }

    await supabase.from('gamification').update(upd).eq('user_id', session.user.id)
    setGamification(prev => ({ ...prev, ...upd }))
    setXpGain(amount)
    setTimeout(() => setXpGain(0), 2000)

    if (celebrate || didLevelUp || newStreak % 7 === 0) {
      setConfetti(true)
    }
  }

  async function awardSpin(outcome) {
    await awardXP(outcome.xp, outcome.rarity === 'legendary')
    await supabase.from('gamification').update({ spin_date: today }).eq('user_id', session.user.id)
    setGamification(prev => ({ ...prev, spin_date: today }))
  }

  if (session === undefined) return <div className="loading">Indlæser…</div>
  if (!session) return <Auth errorMessage={confirmMsg} />

  const spunToday = gamification?.spin_date === today
  const loggedToday = gamification?.last_log_date === today

  const sharedProps = {
    user: session.user,
    gamification,
    onAwardXP: awardXP,
    onSpin: awardSpin,
    spunToday,
    loggedToday,
    today,
  }

  return (
    <div className="app">
      <Confetti active={confetti} onDone={() => setConfetti(false)} />

      <header className="app-header">
        <span className="app-header-title">ADHD Dagbog</span>
        <button className="signout-btn" onClick={() => supabase.auth.signOut()}>Log ud</button>
      </header>

      <main className="app-main">
        {tab === 'day'      && <DayView      {...sharedProps} />}
        {tab === 'week'     && <WeekView     {...sharedProps} />}
        {tab === 'training' && <TrainingView {...sharedProps} />}
        {tab === 'trends'   && <TrendsView   {...sharedProps} />}
        {tab === 'profile'  && <ProfileView  {...sharedProps} xpGain={xpGain} />}
      </main>

      <nav className="bottom-nav">
        {TABS.map(t => (
          <button key={t.id} className={`bnav-btn ${tab === t.id ? 'active' : ''}`} onClick={() => setTab(t.id)}>
            <span className="bnav-icon">{t.icon}</span>
            <span className="bnav-label">{t.label}</span>
          </button>
        ))}
      </nav>
    </div>
  )
}
