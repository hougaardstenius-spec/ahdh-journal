import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { LEVELS, LEVEL_ICONS } from '../lib/training'
import { BADGES, computeUnlocked } from '../lib/badges'
import { SYMPTOMS, HABITS, getMondayOfWeek, dayDateKey } from '../lib/constants'
import { getXPLevel } from '../lib/gamification'
import XPBar from './XPBar'
import './ProfileView.css'

const AVATARS = ['🧠','⚡','🔥','🦁','🐺','🦊','🐉','🌊','🌪️','🎯','💎','🚀']

export default function ProfileView({ user, gamification, xpGain }) {
  const [profile, setProfile] = useState(null)
  const [stats, setStats] = useState(null)
  const [editing, setEditing] = useState(false)
  const [editName, setEditName] = useState('')
  const [editAvatar, setEditAvatar] = useState('🧠')
  const [saving, setSaving] = useState(false)
  const [weekData, setWeekData] = useState([])
  const [trainingState, setTrainingState] = useState(null)
  const [newBadge, setNewBadge] = useState(null)

  const load = useCallback(async () => {
    const dates = Array.from({ length: 7 }, (_, i) => dayDateKey(0, i))
    const [
      { data: prof },
      { data: ts },
      { data: dailyAll },
      { data: weeklyAll },
      { data: questsAll },
      { data: thisWeek },
    ] = await Promise.all([
      supabase.from('user_profiles').select('*').eq('user_id', user.id).maybeSingle(),
      supabase.from('training_state').select('*').eq('user_id', user.id).maybeSingle(),
      supabase.from('daily_entries').select('entry_date, scores, habits').eq('user_id', user.id),
      supabase.from('weekly_reflections').select('id').eq('user_id', user.id),
      supabase.from('quest_progress').select('completed').eq('user_id', user.id).eq('completed', true),
      supabase.from('daily_entries').select('scores, habits').eq('user_id', user.id).in('entry_date', dates),
    ])

    setProfile(prof)
    setTrainingState(ts)
    setWeekData(thisWeek || [])
    if (prof) { setEditName(prof.display_name || ''); setEditAvatar(prof.avatar || '🧠') }

    const allDates = (dailyAll || []).map(d => d.entry_date).sort()
    const total_logs = allDates.length
    let streak = 0
    const check = new Date()
    while (true) {
      const dk = check.toISOString().slice(0, 10)
      if (allDates.includes(dk)) { streak++; check.setDate(check.getDate() - 1) } else break
    }
    const HABIT_KEYS = HABITS.map(h => h.k)
    const perfect_habit_days = (dailyAll || []).filter(d => d.habits && HABIT_KEYS.every(k => d.habits[k])).length
    const habit_counts = {}
    HABIT_KEYS.forEach(k => { habit_counts[k] = (dailyAll || []).filter(d => d.habits?.[k]).length })

    const computedStats = {
      total_logs,
      current_streak: gamification?.current_streak || streak,
      longest_streak: gamification?.longest_streak || streak,
      perfect_habit_days,
      habit_counts,
      total_workouts: ts?.total_workouts || 0,
      training_level: ts?.current_level || 1,
      completed_quests: (questsAll || []).length,
      total_weekly: (weeklyAll || []).length,
    }
    setStats(computedStats)
  }, [user.id, gamification])

  useEffect(() => { load() }, [load])

  // Detect newly unlocked badges
  useEffect(() => {
    if (!stats || !profile) return
    const unlocked = computeUnlocked(stats)
    const prev = profile.seen_badges || []
    const newest = unlocked.find(id => !prev.includes(id))
    if (newest) {
      setNewBadge(BADGES.find(b => b.id === newest))
      // Mark as seen
      const updated = [...prev, newest]
      supabase.from('user_profiles').update({ seen_badges: updated }).eq('user_id', user.id)
    }
  }, [stats, profile])

  async function saveProfile() {
    setSaving(true)
    const payload = { user_id: user.id, display_name: editName, avatar: editAvatar }
    if (profile) await supabase.from('user_profiles').update(payload).eq('user_id', user.id)
    else await supabase.from('user_profiles').insert(payload)
    setSaving(false); setEditing(false); load()
  }

  if (!stats) return <div className="pf-loading">Indlæser profil…</div>

  const unlocked = computeUnlocked(stats)
  const level = LEVELS[Math.min((trainingState?.current_level || 1) - 1, LEVELS.length - 1)]
  const levelIcon = LEVEL_ICONS[(trainingState?.current_level || 1) - 1]
  const displayName = profile?.display_name || user.email?.split('@')[0] || 'Atlet'
  const avatar = profile?.avatar || '🧠'
  const totalXP = gamification?.total_xp || 0
  const { current: xpLevel } = getXPLevel(totalXP)

  const weekAvgs = SYMPTOMS.map(s => {
    const vals = weekData.map(d => d.scores?.[s.k]).filter(v => v != null)
    return { ...s, avg: vals.length ? (vals.reduce((a, b) => a + b, 0) / vals.length) : null }
  })
  const weekHabits = HABITS.map(h => ({ ...h, count: weekData.filter(d => d.habits?.[h.k]).length }))

  return (
    <div className="pf-wrap">
      {/* New badge notification */}
      {newBadge && (
        <div className="pf-new-badge" onClick={() => setNewBadge(null)}>
          <span className="pf-new-badge-icon">{newBadge.icon}</span>
          <div>
            <div className="pf-new-badge-title">Nyt badge låst op!</div>
            <div className="pf-new-badge-name">{newBadge.name}</div>
          </div>
          <span className="pf-new-badge-close">✕</span>
        </div>
      )}

      {/* HEADER */}
      <div className="pf-header">
        <div className="pf-avatar">{avatar}</div>
        <div className="pf-identity">
          <div className="pf-name">{displayName}</div>
          <div className="pf-trait">{levelIcon} {level.trait}</div>
          <div className="pf-xp-badge">Lv.{xpLevel.level} {xpLevel.name}</div>
        </div>
        <button className="pf-edit-btn" onClick={() => setEditing(true)}>✏️</button>
      </div>

      {/* XP BAR */}
      <XPBar totalXP={totalXP} newXP={xpGain} />

      {/* QUICK STATS */}
      <div className="pf-quick-stats">
        <div className="pf-qs-item">
          <div className="pf-qs-val">{stats.current_streak}</div>
          <div className="pf-qs-lbl">Streak 🔥</div>
        </div>
        <div className="pf-qs-item">
          <div className="pf-qs-val">{stats.longest_streak}</div>
          <div className="pf-qs-lbl">Rekord</div>
        </div>
        <div className="pf-qs-item">
          <div className="pf-qs-val">{totalXP}</div>
          <div className="pf-qs-lbl">Total XP</div>
        </div>
        <div className="pf-qs-item">
          <div className="pf-qs-val">{unlocked.length}</div>
          <div className="pf-qs-lbl">Badges</div>
        </div>
      </div>

      {/* THIS WEEK */}
      <div className="pf-section">
        <div className="pf-section-label">Denne uge — symptomer</div>
        <div className="pf-week-grid">
          {weekAvgs.map(s => (
            <div key={s.k} className="pf-week-item">
              <div className="pf-week-bar-wrap">
                <div className="pf-week-bar-fill" style={{
                  height: s.avg ? `${(s.avg / 10) * 100}%` : '0%',
                  background: s.avg >= 7 ? '#27ae60' : s.avg >= 5 ? '#378ADD' : s.avg ? '#e34948' : '#eee'
                }} />
              </div>
              <div className="pf-week-val">{s.avg ? s.avg.toFixed(1) : '–'}</div>
              <div className="pf-week-lbl">{s.l.split(' ')[0].split('/')[0]}</div>
            </div>
          ))}
        </div>
      </div>

      {/* HABITS */}
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
            const isNew = newBadge?.id === b.id
            return (
              <div key={b.id} className={`pf-badge ${isUnlocked ? 'on' : 'locked'} ${isNew ? 'new' : ''}`}>
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
              <input className="pf-field-input" value={editName} onChange={e => setEditName(e.target.value)} placeholder="Dit navn eller alias…" maxLength={24} />
            </div>
            <div className="pf-field-group">
              <label className="pf-field-label">Avatar</label>
              <div className="pf-avatar-grid">
                {AVATARS.map(av => (
                  <div key={av} className={`pf-avatar-opt ${editAvatar === av ? 'selected' : ''}`} onClick={() => setEditAvatar(av)}>{av}</div>
                ))}
              </div>
            </div>
            <div className="pf-modal-btns">
              <button className="pf-modal-cancel" onClick={() => setEditing(false)}>Annuller</button>
              <button className="pf-modal-save" onClick={saveProfile} disabled={saving || !editName.trim()}>{saving ? 'Gemmer…' : 'Gem'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
