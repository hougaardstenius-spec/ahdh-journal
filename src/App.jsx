import { useState, useEffect, useCallback } from 'react'
import { NotebookPen, CalendarDays, Dumbbell, PawPrint, LineChart, CircleUserRound } from 'lucide-react'
import { supabase } from './lib/supabase'
import { XP_REWARDS, getXPLevel } from './lib/gamification'
import { applyEngagementGain, applyHappinessDecay, resolveActivity, getPetStage } from './lib/pet'
import Auth from './components/Auth'
import DayView from './components/DayView'
import WeekView from './components/WeekView'
import TrendsView from './components/TrendsView'
import ExportView from './components/ExportView'
import TrainingView from './components/TrainingView'
import ProfileView from './components/ProfileView'
import PetView from './components/PetView'
import Confetti from './components/Confetti'
import './App.css'

const TABS = [
  { id: 'day',      label: 'Dag',     Icon: NotebookPen },
  { id: 'week',     label: 'Uge',     Icon: CalendarDays },
  { id: 'training', label: 'Træning', Icon: Dumbbell },
  { id: 'pet',      label: 'Kæledyr', Icon: PawPrint },
  { id: 'trends',   label: 'Grafer',  Icon: LineChart },
  { id: 'profile',  label: 'Profil',  Icon: CircleUserRound },
]

export default function App() {
  const [session, setSession] = useState(undefined)
  const [tab, setTab] = useState('day')
  const [confirmMsg, setConfirmMsg] = useState(null)
  const [gamification, setGamification] = useState(null)
  const [pet, setPet] = useState(null)
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
      return init
    } else {
      setGamification(data)
      return data
    }
  }, [])

  const loadPet = useCallback(async (userId, gamificationData) => {
    const { data } = await supabase
      .from('pets')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle()

    if (!data) { setPet(null); return }

    const decay = applyHappinessDecay(data, gamificationData, today)
    if (decay) {
      await supabase.from('pets').update(decay).eq('user_id', userId)
      setPet({ ...data, ...decay })
    } else {
      setPet(data)
    }
  }, [today])

  useEffect(() => {
    if (session?.user) {
      loadGamification(session.user.id).then(g => loadPet(session.user.id, g))
    }
  }, [session, loadGamification, loadPet])

  // App-ikon badge: viser en prik når kæledyret savner opmærksomhed
  useEffect(() => {
    if (!('setAppBadge' in navigator)) return
    if (pet && pet.happiness < 50) {
      navigator.setAppBadge(1).catch(() => {})
    } else {
      navigator.clearAppBadge().catch(() => {})
    }
  }, [pet])

  async function awardXP(amount, celebrate = false, { affectsStreak = true, feedsPet = true } = {}) {
    if (!session?.user || !gamification) return
    const newXP = (gamification.total_xp || 0) + amount
    const before = getXPLevel(gamification.total_xp || 0)
    const after = getXPLevel(newXP)
    const didLevelUp = after.current.level > before.current.level

    const upd = { total_xp: newXP }
    let newStreak = gamification.current_streak || 0

    if (affectsStreak) {
      const lastLog = gamification.last_log_date
      const yesterday = new Date(); yesterday.setDate(yesterday.getDate() - 1)
      const yesterdayKey = yesterday.toISOString().slice(0, 10)

      if (lastLog === today) {
        // Already logged today, just add XP
      } else if (lastLog === yesterdayKey) {
        newStreak += 1
      } else if (lastLog !== today) {
        newStreak = 1
      }

      upd.current_streak = newStreak
      upd.longest_streak = Math.max(newStreak, gamification.longest_streak || 0)
      upd.last_log_date = today
    }

    await supabase.from('gamification').update(upd).eq('user_id', session.user.id)
    setGamification(prev => ({ ...prev, ...upd }))
    setXpGain(amount)
    setTimeout(() => setXpGain(0), 2000)

    if (feedsPet && pet) {
      const gain = applyEngagementGain(pet, amount)
      await supabase.from('pets').update(gain).eq('user_id', session.user.id)
      setPet(prev => ({ ...prev, ...gain }))
    }

    if (celebrate || didLevelUp || (affectsStreak && newStreak % 7 === 0)) {
      setConfetti(true)
    }
  }

  async function awardSpin(outcome) {
    await awardXP(outcome.xp, outcome.rarity === 'legendary')
    await supabase.from('gamification').update({ spin_date: today }).eq('user_id', session.user.id)
    setGamification(prev => ({ ...prev, spin_date: today }))
  }

  async function setupPet(species, name) {
    if (!session?.user) return
    const init = {
      user_id: session.user.id,
      species,
      name,
      energy: 50,
      happiness: 70,
      total_activities: 0,
      last_happiness_check_date: today,
    }
    await supabase.from('pets').insert(init)
    setPet(init)
  }

  async function claimPetActivity() {
    if (!session?.user || !pet) return
    const result = resolveActivity(pet)
    if (!result) return

    const before = getPetStage(pet.total_activities || 0)
    const after = getPetStage(result.total_activities)

    const upd = {
      energy: result.energy,
      happiness: result.happiness,
      total_activities: result.total_activities,
    }
    await supabase.from('pets').update(upd).eq('user_id', session.user.id)
    setPet(prev => ({ ...prev, ...upd }))
    await awardXP(result.xpReward, false, { affectsStreak: false, feedsPet: false })

    if (after.stageIdx > before.stageIdx) setConfetti(true)
    return result
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
    pet,
    onSetupPet: setupPet,
    onClaimActivity: claimPetActivity,
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
        {tab === 'pet'      && <PetView      {...sharedProps} />}
        {tab === 'trends'   && <TrendsView   {...sharedProps} />}
        {tab === 'profile'  && <ProfileView  {...sharedProps} xpGain={xpGain} />}
      </main>

      <nav className="bottom-nav">
        {TABS.map(t => (
          <button key={t.id} className={`bnav-btn ${tab === t.id ? 'active' : ''}`} onClick={() => setTab(t.id)}>
            <span className="bnav-icon"><t.Icon size={22} strokeWidth={tab === t.id ? 2.4 : 2} /></span>
            <span className="bnav-label">{t.label}</span>
          </button>
        ))}
      </nav>
    </div>
  )
}
