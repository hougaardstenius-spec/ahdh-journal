import { useState, useEffect, useCallback, useRef } from 'react'
import { supabase } from '../lib/supabase'
import { DAYS, SYMPTOMS, HABITS, dayDateKey, formatWeekRange } from '../lib/constants'
import { XP_REWARDS } from '../lib/gamification'
import XPBar from './XPBar'
import DailySpin from './DailySpin'
import SundayView from './SundayView'
import './DayView.css'

const EVENING_GREETINGS = [
  'Hvordan var din dag?',
  'Tid til at reflektere.',
  'Log dagen — du fortjener det.',
  'Et minut nu giver indsigt i morgen.',
  'Din hjerne vil takke dig.',
  'Afslut dagen med bevidsthed.',
]

const STREAK_MESSAGES = [
  [30, 'En måned. Du er ikke til at stoppe 👑'],
  [14, 'To uger! Du er seriøs 🚀'],
  [7,  'En hel uge — imponerende 🔥'],
  [3,  'Tre dage i træk — du bygger en vane 💪'],
  [1,  'Første dag — godt begyndt!'],
  [0,  'Start din streak i dag 🌱'],
]

function getStreakMessage(streak) {
  return (STREAK_MESSAGES.find(([k]) => streak >= k) || STREAK_MESSAGES[STREAK_MESSAGES.length - 1])[1]
}

function getGreeting(name) {
  const h = new Date().getHours()
  const suffix = name ? `, ${name}` : ''
  if (h < 10) return `God morgen${suffix} ☀️`
  if (h < 14) return `God middag${suffix} 🌤`
  if (h < 18) return `God eftermiddag${suffix} 🌅`
  return `God aften${suffix} 🌙`
}

function QuickLog({ data, onSave, saving, loggedToday }) {
  const habitCount = Object.values(data.habits || {}).filter(Boolean).length
  const scoreCount = Object.keys(data.scores || {}).length
  const allDone = habitCount === HABITS.length

  return (
    <div className={`quick-log ${loggedToday ? 'done' : ''}`}>
      <div className="ql-header">
        <span className="ql-title">{loggedToday ? '✓ Dagen er logget' : 'Log dagens dag'}</span>
        <div className="ql-chips">
          <span className={`ql-chip ${scoreCount > 0 ? 'filled' : ''}`}>{scoreCount}/{SYMPTOMS.length} symptomer</span>
          <span className={`ql-chip ${habitCount > 0 ? 'filled' : ''}`}>{habitCount}/{HABITS.length} vaner</span>
        </div>
      </div>
      {!loggedToday && (
        <button className={`ql-save-btn ${allDone ? 'all-done' : ''}`} onClick={onSave} disabled={saving}>
          {saving ? 'Gemmer…' : allDone ? '🎯 Gem perfekt dag!' : 'Gem dag'}
        </button>
      )}
    </div>
  )
}

function DayForm({ data, dayIdx, saving, saved, onScore, onHabit, onField, onSave, isToday }) {
  const textRefs = useRef({})
  const [openInfo, setOpenInfo] = useState(null)
  const [expanded, setExpanded] = useState(!isToday)

  function handleSlider(k, val) {
    const sy = window.scrollY
    onScore(k, val)
    requestAnimationFrame(() => window.scrollTo({ top: sy, behavior: 'instant' }))
  }

  return (
    <div className="day-form-wrap">
      {isToday && (
        <button className="day-form-toggle" onClick={() => setExpanded(e => !e)}>
          {expanded ? 'Skjul detaljeret log ↑' : 'Udfyld detaljeret log ↓'}
        </button>
      )}

      {(!isToday || expanded) && (
        <>
          <section className="section">
            <div className="sec-label">Symptomer (1–10)</div>
            {SYMPTOMS.map(s => {
              const val = data.scores?.[s.k] ?? 5
              const isOpen = openInfo === s.k
              return (
                <div key={s.k} className="sym-card">
                  <div className="sym-row">
                    <span className="sym-name">{s.l}</span>
                    <button className="sym-info-btn" onClick={() => setOpenInfo(isOpen ? null : s.k)}>ⓘ</button>
                    <input type="range" min="1" max="10" step="1" value={val}
                      onChange={e => handleSlider(s.k, parseInt(e.target.value))} />
                    <span className="sym-val">{val}</span>
                  </div>
                  {isOpen && <div className="sym-info-box">{s.desc}</div>}
                </div>
              )
            })}
          </section>

          <section className="section">
            <div className="sec-label">Gode vaner</div>
            <div className="hab-grid">
              {HABITS.map(h => {
                const on = data.habits?.[h.k]
                return (
                  <div key={h.k} className={`hab-item ${on ? 'on' : ''}`} onClick={() => onHabit(h.k)}>
                    <div className="hab-cb">{on ? '✓' : ''}</div>
                    <span className="hab-name">{h.l}</span>
                  </div>
                )
              })}
            </div>
          </section>

          {[
            ['flow', 'Hvornår havde jeg bedst fokus / flow?', 'F.eks. om morgenen efter kaffe…'],
            ['hyper', 'Muligt hyperfokus – hvad opslugte mig?', '…'],
            ['energy_src', 'Hvad gav mig mest energi / dopamin?', '…'],
            ['drain', 'Hvad drænede min energi?', '…'],
            ['overstim', 'Overstimulering (støj, krav, mennesker)?', '…'],
            ['helped', 'Noget der faktisk hjalp min hjerne?', '…'],
            ['tomorrow', dayIdx === 6 ? 'En justering til den kommende uge?' : 'En lille justering jeg vil prøve i morgen?', '…'],
          ].map(([id, lbl, ph]) => (
            <section key={id} className="section">
              <div className="sec-label">{lbl}</div>
              <textarea ref={el => textRefs.current[id] = el} className="text-field"
                placeholder={ph} rows={2} value={data[id] || ''}
                onChange={e => onField(id, e.target.value)} />
            </section>
          ))}

          <section className="section">
            <div className="sec-label">Søvn</div>
            <div className="sleep-row">
              <input type="range" min="3" max="12" step="0.5" value={data.sleep ?? 7}
                onChange={e => {
                  const sy = window.scrollY
                  onField('sleep', parseFloat(e.target.value))
                  requestAnimationFrame(() => window.scrollTo({ top: sy, behavior: 'instant' }))
                }} style={{ flex: 1 }} />
              <span className="sleep-val">{parseFloat(data.sleep ?? 7).toFixed(1)}</span>
              <span className="sleep-unit">timer</span>
            </div>
          </section>

          <div className="save-row">
            {saved && <span className="saved-lbl">Gemt ✓</span>}
            <button className="btn-save" onClick={onSave} disabled={saving}>
              {saving ? 'Gemmer…' : 'Gem dag'}
            </button>
          </div>
        </>
      )}
    </div>
  )
}

export default function DayView({ user, gamification, onAwardXP, onSpin, spunToday, loggedToday, today }) {
  const [wkOff, setWkOff] = useState(0)
  const [dayIdx, setDayIdx] = useState(() => {
    const d = new Date().getDay()
    return d === 0 ? 6 : d - 1
  })
  const [data, setData] = useState({})
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [profile, setProfile] = useState(null)

  const dateKey = dayDateKey(wkOff, dayIdx)
  const isToday = dateKey === today

  const load = useCallback(async () => {
    const [{ data: row }, { data: prof }] = await Promise.all([
      supabase.from('daily_entries').select('*').eq('user_id', user.id).eq('entry_date', dateKey).maybeSingle(),
      supabase.from('user_profiles').select('display_name, avatar').eq('user_id', user.id).maybeSingle(),
    ])
    setData(row || {})
    setProfile(prof)
  }, [user.id, dateKey])

  useEffect(() => { load() }, [load])

  function setField(key, val) { setData(prev => ({ ...prev, [key]: val })) }
  function setScore(symptom, val) { setData(prev => ({ ...prev, scores: { ...(prev.scores || {}), [symptom]: val } })) }
  function toggleHabit(k) { setData(prev => ({ ...prev, habits: { ...(prev.habits || {}), [k]: !(prev.habits?.[k]) } })) }

  async function save() {
    setSaving(true)
    const payload = {
      user_id: user.id, entry_date: dateKey,
      scores: data.scores || {}, habits: data.habits || {},
      sleep: data.sleep || 7,
      flow: data.flow || null, hyper: data.hyper || null,
      energy_src: data.energy_src || null, drain: data.drain || null,
      overstim: data.overstim || null, helped: data.helped || null,
      tomorrow: data.tomorrow || null,
    }
    await supabase.from('daily_entries').upsert(payload, { onConflict: 'user_id,entry_date' })
    if (isToday && onAwardXP && !loggedToday) {
      const habitCount = Object.values(data.habits || {}).filter(Boolean).length
      const allHabits = habitCount === HABITS.length
      const xp = XP_REWARDS.log_day + (habitCount * XP_REWARDS.habit_each) + (allHabits ? XP_REWARDS.all_habits_bonus : 0)
      await onAwardXP(xp, allHabits)
    }
    setSaving(false); setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  // Show hero whenever we're on the current week — regardless of gamification load state
  const showHero = wkOff === 0 && dayIdx !== 6

  const streak = gamification?.current_streak ?? 0
  const totalXP = gamification?.total_xp ?? 0

  return (
    <div className="day-wrap">

      {showHero && (
        <div className="day-hero">
          <div className="day-hero-top">
            <div>
              <div className="day-hero-greeting">{getGreeting(profile?.display_name)}</div>
              <div className="day-hero-sub">{EVENING_GREETINGS[new Date().getDate() % EVENING_GREETINGS.length]}</div>
            </div>
            {profile?.avatar && (
              <div className="day-hero-avatar">{profile.avatar}</div>
            )}
          </div>

          {streak > 0 && (
            <div className="day-hero-streak">
              <span className="day-hero-streak-fire">🔥</span>
              <div>
                <div className="day-hero-streak-num">{streak} {streak === 1 ? 'dag' : 'dage'} i træk</div>
                <div className="day-hero-streak-msg">{getStreakMessage(streak)}</div>
              </div>
            </div>
          )}

          {streak === 0 && (
            <div className="day-hero-streak">
              <span className="day-hero-streak-fire">🌱</span>
              <div>
                <div className="day-hero-streak-num">Ingen streak endnu</div>
                <div className="day-hero-streak-msg">Log dagens dag for at starte din streak</div>
              </div>
            </div>
          )}

          <XPBar totalXP={totalXP} />
        </div>
      )}

      {showHero && onSpin && (
        <DailySpin today={today} spunToday={spunToday ?? false} onSpin={onSpin} />
      )}

      <div className="week-nav">
        <button className="nav-arrow" onClick={() => setWkOff(w => w - 1)}>←</button>
        <span className="week-label">{formatWeekRange(wkOff)}</span>
        <button className="nav-arrow" onClick={() => setWkOff(w => w + 1)}>→</button>
      </div>

      <div className="day-chips">
        {DAYS.map((name, i) => (
          <button key={i} className={`day-chip ${i === dayIdx ? 'active' : ''}`} onClick={() => setDayIdx(i)}>
            {name}
          </button>
        ))}
      </div>

      {dayIdx === 6 ? (
        <SundayView user={user} wkOff={wkOff} onAwardXP={onAwardXP} loggedToday={loggedToday} today={today} />
      ) : (
        <>
          {isToday && (
            <QuickLog data={data} onSave={save} saving={saving} loggedToday={loggedToday ?? false} />
          )}
          <DayForm
            data={data} dayIdx={dayIdx} saving={saving} saved={saved}
            onScore={setScore} onHabit={toggleHabit} onField={setField} onSave={save}
            isToday={isToday}
          />
        </>
      )}
    </div>
  )
}
