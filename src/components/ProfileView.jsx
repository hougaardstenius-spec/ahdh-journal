import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { LEVELS, LEVEL_ICONS } from '../lib/training'
import { BADGES, computeUnlocked } from '../lib/badges'
import { SYMPTOMS, HABITS, getMondayOfWeek, dayDateKey } from '../lib/constants'
import { getPetStage } from '../lib/pet'
import './ProfileView.css'

const AVATARS = ['🧠','⚡','🔥','🦁','🐺','🦊','🐉','🌊','🌪️','🎯','💎','🚀']

export default function ProfileView({ user }) {
  const [profile, setProfile] = useState(null)
  const [stats, setStats] = useState(null)
  const [editing, setEditing] = useState(false)
  const [editName, setEditName] = useState('')
  const [editAvatar, setEditAvatar] = useState('🧠')
  const [saving, setSaving] = useState(false)
  const [weekData, setWeekData] = useState([])
  const [trainingState, setTrainingState] = useState(null)

  const load = useCallback(async () => {
    const weekStart = getMondayOfWeek(0).toISOString().slice(0, 10)
    const dates = Array.from({ length: 7 }, (_, i) => dayDateKey(0, i))
    const yesterday = new Date(); yesterday.setDate(yesterday.getDate() - 1)
    const yesterdayKey = yesterday.toISOString().slice(0, 10)

    const [
      { data: prof },
      { data: ts },
      { data: dailyAll },
      { data: weeklyAll },
      { data: questsAll },
      { data: thisWeek },
      { data: pet },
    ] = await Promise.all([
      supabase.from('user_profiles').select('*').eq('user_id', user.id).maybeSingle(),
      supabase.from('training_state').select('*').eq('user_id', user.id).maybeSingle(),
      supabase.from('daily_entries').select('entry_date, scores, habits').eq('user_id', user.id),
      supabase.from('weekly_reflections').select('id').eq('user_id', user.id),
      supabase.from('quest_progress').select('completed').eq('user_id', user.id).eq('completed', true),
      supabase.from('daily_entries').select('scores, habits').eq('user_id', user.id).in('entry_date', dates),
      supabase.from('pets').select('*').eq('user_id', user.id).maybeSingle(),
    ])

    setProfile(prof)
    setTrainingState(ts)
    setWeekData(thisWeek || [])

    if (prof) { setEditName(prof.display_name || ''); setEditAvatar(prof.avatar || '🧠') }
    else { setEditName(''); setEditAvatar('🧠') }

    // Compute stats for badges
    const allDates = (dailyAll || []).map(d => d.entry_date).sort()
    const total_logs = allDates.length

    // Streak
    let streak = 0
    const today = new Date().toISOString().slice(0, 10)
    let check = new Date()
    while (true) {
      const dk = check.toISOString().slice(0, 10)
      if (allDates.includes(dk)) { streak++; check.setDate(check.getDate() - 1) }
      else break
    }

    // Perfect habit days
    const HABIT_KEYS = HABITS.map(h => h.k)
    const perfect_habit_days = (dailyAll || []).filter(d => {
      if (!d.habits) return false
      return HABIT_KEYS.every(k => d.habits[k])
    }).length

    // Individual habit counts
    const habit_counts = {}
    HABIT_KEYS.forEach(k => {
      habit_counts[k] = (dailyAll || []).filter(d => d.habits?.[k]).length
    })

    const computedStats = {
      total_logs,
      current_streak: streak,
      perfect_habit_days,
      habit_counts,
      total_workouts: ts?.total_workouts || 0,
      training_level: ts?.current_level || 1,
      completed_quests: (questsAll || []).length,
      total_weekly: (weeklyAll || []).length,
      pet_exists: !!pet,
      pet_stage: pet ? getPetStage(pet.total_activities || 0).stageNum : 0,
      pet_total_activities: pet?.total_activities || 0,
      pet_happiness: pet?.happiness || 0,
    }
    setStats(computedStats)
  }, [user.id])

  useEffect(() => { load() }, [load])

  async function saveProfile() {
    setSaving(true)
    const payload = { user_id: user.id, display_name: editName, avatar: editAvatar }
    if (profile) {
      await supabase.from('user_profiles').update(payload).eq('user_id', user.id)
    } else {
      await supabase.from('user_profiles').insert(payload)
    }
    setSaving(false)
    setEditing(false)
    load()
  }

  if (!stats) return <div className="pf-loading">Indlæser profil…</div>

  const unlocked = computeUnlocked(stats)
  const level = LEVELS[Math.min((trainingState?.current_level || 1) - 1, LEVELS.length - 1)]
  const levelIcon = LEVEL_ICONS[(trainingState?.current_level || 1) - 1]

  // This week averages
  const weekAvgs = SYMPTOMS.map(s => {
    const vals = weekData.map(d => d.scores?.[s.k]).filter(v => v != null)
    return { ...s, avg: vals.length ? (vals.reduce((a,b) => a+b, 0) / vals.length) : null }
  })

  // This week habits
  const weekHabits = HABITS.map(h => ({
    ...h,
    count: weekData.filter(d => d.habits?.[h.k]).length
  }))

  // Daily status from yesterday's best score
  function getDailyStatus() {
    if (!weekData.length) return null
    const focusAvg = weekAvgs.find(s => s.k === 'focus')?.avg
    const energyAvg = weekAvgs.find(s => s.k === 'energy')?.avg
    if (!focusAvg) return null
    if (focusAvg >= 8) return { msg: 'Fokus er stærkt denne uge 🎯', color: '#1e8449' }
    if (focusAvg >= 6) return { msg: 'Fokus er stabilt denne uge', color: '#378ADD' }
    if (energyAvg < 4) return { msg: 'Energien er lav — hvil er også progression', color: '#888' }
    return { msg: 'Fortsæt med at logge — mønstre opstår over tid', color: '#888' }
  }

  const status = getDailyStatus()
  const displayName = profile?.display_name || user.email?.split('@')[0] || 'Atlet'
  const avatar = profile?.avatar || '🧠'

  return (
    <div className="pf-wrap">

      {/* HEADER */}
      <div className="pf-header">
        <div className="pf-avatar">{avatar}</div>
        <div className="pf-identity">
          <div className="pf-name">{displayName}</div>
          <div className="pf-trait">{levelIcon} {level.trait}</div>
          {status && <div className="pf-status" style={{ color: status.color }}>{status.msg}</div>}
        </div>
        <button className="pf-edit-btn" onClick={() => setEditing(true)}>✏️</button>
      </div>

      {/* QUICK STATS */}
      <div className="pf-quick-stats">
        <div className="pf-qs-item">
          <div className="pf-qs-val">{stats.current_streak}</div>
          <div className="pf-qs-lbl">Dages streak</div>
        </div>
        <div className="pf-qs-item">
          <div className="pf-qs-val">{stats.total_logs}</div>
          <div className="pf-qs-lbl">Dage logget</div>
        </div>
        <div className="pf-qs-item">
          <div className="pf-qs-val">{trainingState?.current_level || 1}</div>
          <div className="pf-qs-lbl">Træningslevel</div>
        </div>
        <div className="pf-qs-item">
          <div className="pf-qs-val">{unlocked.length}</div>
          <div className="pf-qs-lbl">Badges</div>
        </div>
      </div>

      {/* THIS WEEK */}
      <div className="pf-section">
        <div className="pf-section-label">Denne uge</div>
        <div className="pf-week-grid">
          {weekAvgs.map(s => (
            <div key={s.k} className="pf-week-item">
              <div className="pf-week-bar-wrap">
                <div
                  className="pf-week-bar-fill"
                  style={{
                    height: s.avg ? `${(s.avg / 10) * 100}%` : '0%',
                    background: s.avg >= 7 ? '#27ae60' : s.avg >= 5 ? '#378ADD' : s.avg ? '#e34948' : '#eee'
                  }}
                />
              </div>
              <div className="pf-week-val">{s.avg ? s.avg.toFixed(1) : '–'}</div>
              <div className="pf-week-lbl">{s.l.split(' ')[0].split('/')[0]}</div>
            </div>
          ))}
        </div>
      </div>

      {/* HABITS THIS WEEK */}
      <div className="pf-section">
        <div className="pf-section-label">Vaner denne uge</div>
        <div className="pf-habits-week">
          {weekHabits.map(h => (
            <div key={h.k} className="pf-habit-week-item">
              <div className="pf-habit-dots">
                {Array.from({ length: 7 }, (_, i) => (
                  <div key={i} className={`pf-dot ${weekData[i]?.habits?.[h.k] ? 'on' : ''}`} />
                ))}
              </div>
              <div className="pf-habit-week-name">{h.l}</div>
              <div className="pf-habit-week-count">{h.count}/7</div>
            </div>
          ))}
        </div>
      </div>

      {/* BADGES */}
      <div className="pf-section">
        <div className="pf-section-label">Badges — {unlocked.length}/{BADGES.length}</div>
        <div className="pf-badges-grid">
          {BADGES.map(b => {
            const isUnlocked = unlocked.includes(b.id)
            return (
              <div key={b.id} className={`pf-badge ${isUnlocked ? 'on' : 'locked'}`} title={b.desc}>
                <div className="pf-badge-icon">{isUnlocked ? b.icon : '🔒'}</div>
                <div className="pf-badge-name">{b.name}</div>
                {isUnlocked && <div className="pf-badge-desc">{b.desc}</div>}
              </div>
            )
          })}
        </div>
      </div>

      {/* EDIT MODAL */}
      {editing && (
        <div className="pf-modal-overlay" onClick={() => setEditing(false)}>
          <div className="pf-modal" onClick={e => e.stopPropagation()}>
            <div className="pf-modal-title">Din atletidentitet</div>

            <div className="pf-field-group">
              <label className="pf-field-label">Kaldenavn</label>
              <input
                className="pf-field-input"
                value={editName}
                onChange={e => setEditName(e.target.value)}
                placeholder="Dit navn eller alias…"
                maxLength={24}
              />
            </div>

            <div className="pf-field-group">
              <label className="pf-field-label">Avatar</label>
              <div className="pf-avatar-grid">
                {AVATARS.map(av => (
                  <div
                    key={av}
                    className={`pf-avatar-opt ${editAvatar === av ? 'selected' : ''}`}
                    onClick={() => setEditAvatar(av)}
                  >
                    {av}
                  </div>
                ))}
              </div>
            </div>

            <div className="pf-modal-btns">
              <button className="pf-modal-cancel" onClick={() => setEditing(false)}>Annuller</button>
              <button className="pf-modal-save" onClick={saveProfile} disabled={saving || !editName.trim()}>
                {saving ? 'Gemmer…' : 'Gem'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
