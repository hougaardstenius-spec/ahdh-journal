import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { LEVELS, LEVEL_ICONS, getCurrentProgram, getSetsReps } from '../lib/training'
import { MOBILITY_LEVELS, MOBILITY_LEVEL_TRAITS, DAILY_FOUNDATION, BONUS_CHALLENGES, getCurrentMobilityBlock, getTodayBonus } from '../lib/mobility'
import { getMondayOfWeek } from '../lib/constants'
import './TrainingView.css'

export default function TrainingView({ user }) {
  const [strengthState, setStrengthState] = useState(null)
  const [mobilityState, setMobilityState] = useState(null)
  const [questData, setQuestData] = useState({})
  const [section, setSection] = useState('today')
  const [completing, setCompleting] = useState(null)
  const [justCompleted, setJustCompleted] = useState(null)

  const weekStart = getMondayOfWeek(0).toISOString().slice(0, 10)
  const today = new Date().toISOString().slice(0, 10)

  const load = useCallback(async () => {
    const [{ data: ss }, { data: ms }] = await Promise.all([
      supabase.from('training_state').select('*').eq('user_id', user.id).maybeSingle(),
      supabase.from('mobility_state').select('*').eq('user_id', user.id).maybeSingle(),
    ])

    if (!ss) {
      const init = { user_id: user.id, current_level: 1, current_program_idx: 0, level_start_date: today, total_workouts: 0, last_workout_date: null }
      await supabase.from('training_state').insert(init)
      setStrengthState(init)
    } else setStrengthState(ss)

    if (!ms) {
      const init = { user_id: user.id, current_level: 1, current_block_idx: 0, block_start_date: today, total_sessions: 0, last_session_date: null }
      await supabase.from('mobility_state').insert(init)
      setMobilityState(init)
    } else setMobilityState(ms)
  }, [user.id, today])

  useEffect(() => { load() }, [load])

  if (!strengthState || !mobilityState) return <div className="tr-loading">Indlæser…</div>

  const sState = { currentLevel: strengthState.current_level, currentProgramIdx: strengthState.current_program_idx }
  const { level: sLevel, program } = getCurrentProgram(sState)
  const sLevelIcon = LEVEL_ICONS[(strengthState.current_level - 1) % LEVEL_ICONS.length]

  const mState = { currentLevel: mobilityState.current_level, currentBlockIdx: mobilityState.current_block_idx, totalSessions: mobilityState.total_sessions }
  const { level: mLevel, block } = getCurrentMobilityBlock(mState)
  const bonus = getTodayBonus(mState)

  const strengthDoneToday = strengthState.last_workout_date === today
  const mobilityDoneToday = mobilityState.last_session_date === today

  // Days since block start
  const blockStart = new Date(mobilityState.block_start_date)
  const daysInBlock = Math.floor((new Date() - blockStart) / 86400000)
  const blockProgress = Math.min((daysInBlock / 14) * 100, 100)
  const blockDaysLeft = Math.max(14 - daysInBlock, 0)

  const levelStart = new Date(strengthState.level_start_date)
  const daysInLevel = Math.floor((new Date() - levelStart) / 86400000)
  const levelProgress = Math.min((daysInLevel / 28) * 100, 100)
  const levelDaysLeft = Math.max(28 - daysInLevel, 0)

  async function completeStrength() {
    setCompleting('strength')
    const newIdx = (strengthState.current_program_idx + 1) % 4
    let newLevel = strengthState.current_level
    let newStart = strengthState.level_start_date
    if (daysInLevel >= 28 && strengthState.current_level < 10) { newLevel++; newStart = today }
    const upd = { current_level: newLevel, current_program_idx: newIdx, level_start_date: newStart, total_workouts: (strengthState.total_workouts || 0) + 1, last_workout_date: today }
    await supabase.from('training_state').update(upd).eq('user_id', user.id)
    setStrengthState(p => ({ ...p, ...upd }))
    setCompleting(null); setJustCompleted('strength')
    setTimeout(() => setJustCompleted(null), 3000)
  }

  async function completeMobility() {
    setCompleting('mobility')
    const newIdx = (mobilityState.current_block_idx + 1) % 4
    let newLevel = mobilityState.current_level
    let newStart = mobilityState.block_start_date
    if (daysInBlock >= 14) { 
      if (newIdx === 0 && mobilityState.current_level < 10) { newLevel++ }
      newStart = today 
    }
    const upd = { current_level: newLevel, current_block_idx: newIdx, block_start_date: newStart, total_sessions: (mobilityState.total_sessions || 0) + 1, last_session_date: today }
    await supabase.from('mobility_state').update(upd).eq('user_id', user.id)
    setMobilityState(p => ({ ...p, ...upd }))
    setCompleting(null); setJustCompleted('mobility')
    setTimeout(() => setJustCompleted(null), 3000)
  }

  return (
    <div className="tr-wrap">
      <div className="tr-tabs">
        {[['today','I dag'],['progress','Progression']].map(([id,lbl]) => (
          <button key={id} className={`tr-tab ${section===id?'active':''}`} onClick={() => setSection(id)}>{lbl}</button>
        ))}
      </div>

      {section === 'today' && (
        <div className="tr-today">

          {/* MOBILITY */}
          <div className="tr-block-header">
            <span className="tr-block-icon">🌊</span>
            <div>
              <div className="tr-block-title">Mobilitet · {mLevel.name}</div>
              <div className="tr-block-sub">{block.name} · {block.weeks}. uge</div>
            </div>
            <div className="tr-block-time">5–8 min</div>
          </div>

          <div className="tr-program-card">
            <div className="tr-program-label">Dagligt fundament</div>
            {DAILY_FOUNDATION.map(ex => (
              <div key={ex.name} className="tr-exercise">
                <div className="tr-ex-content foundation">
                  <div className="tr-ex-name">{ex.name}</div>
                  <div className="tr-ex-sets">{ex.dose}</div>
                </div>
              </div>
            ))}

            <div className="tr-program-label" style={{marginTop:10}}>Dagens blok — {block.name}</div>
            <div className="tr-block-goal">{block.goal}</div>
            {block.exercises.map(ex => (
              <div key={ex.name} className="tr-exercise">
                <div className="tr-ex-content">
                  <div className="tr-ex-name">{ex.name}</div>
                  <div className="tr-ex-sets">{ex.dose}</div>
                </div>
              </div>
            ))}
          </div>

          {justCompleted === 'mobility' ? (
            <div className="tr-completed-msg">
              <span className="tr-completed-icon">🌊</span>
              <div><div className="tr-completed-title">Mobilitet gennemført!</div></div>
            </div>
          ) : mobilityDoneToday ? (
            <div className="tr-done-today">✓ Mobilitet lavet i dag</div>
          ) : (
            <button className="tr-complete-btn mobility" onClick={completeMobility} disabled={completing==='mobility'}>
              {completing==='mobility' ? 'Gemmer…' : '✓ Mobilitet gennemført'}
            </button>
          )}

          <div className="tr-progress-wrap">
            <div className="tr-progress-meta">
              <span>{block.name}</span>
              <span className="tr-progress-days">{blockDaysLeft > 0 ? `${blockDaysLeft} dage til ny blok` : '🔓 Ny blok klar!'}</span>
            </div>
            <div className="tr-progress-bar"><div className="tr-progress-fill mobility" style={{width:`${blockProgress}%`}} /></div>
          </div>

          {/* DIVIDER */}
          <div className="tr-section-divider"><span>Styrketræning</span></div>

          {/* STRENGTH */}
          <div className="tr-block-header">
            <span className="tr-block-icon">{sLevelIcon}</span>
            <div>
              <div className="tr-block-title">Styrke · {sLevel.name}</div>
              <div className="tr-block-sub">{sLevel.trait}</div>
            </div>
            <div className="tr-block-time">10–20 min</div>
          </div>

          <div className="tr-program-card">
            <div className="tr-program-label">Program {program.id}{program.complex ? ' — Komplex' : ''}</div>
            <div className="tr-block-goal">{sLevel.focus}</div>
            {program.exercises.map((ex, i) => (
              <div key={ex} className="tr-exercise">
                {program.complex && i > 0 && <div className="tr-arrow">↓</div>}
                <div className="tr-ex-content">
                  <div className="tr-ex-name">{ex}</div>
                  <div className="tr-ex-sets">{getSetsReps(strengthState.current_level, ex)}</div>
                </div>
              </div>
            ))}
          </div>

          {justCompleted === 'strength' ? (
            <div className="tr-completed-msg">
              <span className="tr-completed-icon">💪</span>
              <div><div className="tr-completed-title">Styrketræning gennemført!</div></div>
            </div>
          ) : strengthDoneToday ? (
            <div className="tr-done-today">✓ Styrketræning lavet i dag</div>
          ) : (
            <button className="tr-complete-btn" onClick={completeStrength} disabled={completing==='strength'}>
              {completing==='strength' ? 'Gemmer…' : '✓ Styrketræning gennemført'}
            </button>
          )}

          <div className="tr-progress-wrap">
            <div className="tr-progress-meta">
              <span>Level {strengthState.current_level}</span>
              <span className="tr-progress-days">{levelDaysLeft > 0 ? `${levelDaysLeft} dage til næste level` : '🔓 Nyt level klar!'}</span>
            </div>
            <div className="tr-progress-bar"><div className="tr-progress-fill" style={{width:`${levelProgress}%`}} /></div>
          </div>

          {/* DIVIDER */}
          <div className="tr-section-divider"><span>Bonus</span></div>

          {/* BONUS */}
          <div className="tr-bonus-card">
            <div className="tr-bonus-header">
              <span className="tr-bonus-icon">{bonus.icon}</span>
              <div>
                <div className="tr-bonus-name">{bonus.name}</div>
                <div className="tr-bonus-desc">{bonus.desc}</div>
              </div>
              <span className="tr-bonus-time">1–2 min</span>
            </div>
            <div className="tr-bonus-note">Valgfri — men du ved hvad den gør for dig 😉</div>
          </div>

          {/* STATS */}
          <div className="tr-stats-row">
            <div className="tr-stat"><div className="tr-stat-val">{mobilityState.total_sessions||0}</div><div className="tr-stat-lbl">Mob. sessioner</div></div>
            <div className="tr-stat"><div className="tr-stat-val">{strengthState.total_workouts||0}</div><div className="tr-stat-lbl">Styrke sessioner</div></div>
            <div className="tr-stat"><div className="tr-stat-val">{strengthState.current_level}</div><div className="tr-stat-lbl">Styrke level</div></div>
          </div>
        </div>
      )}

      {section === 'progress' && (
        <div className="tr-progress-view">
          <div className="tr-prog-section">
            <div className="tr-prog-label">🌊 Mobilitet — levels</div>
            {MOBILITY_LEVEL_TRAITS.map((trait, i) => {
              const lv = i + 1
              const isCurrent = mobilityState.current_level === lv
              const isDone = mobilityState.current_level > lv
              return (
                <div key={lv} className={`tr-level-row ${isCurrent?'current':''} ${isDone?'done':''}`}>
                  <div className="tr-level-row-num">{lv}</div>
                  <div className="tr-level-row-info">
                    <div className="tr-level-row-name">{trait}</div>
                    {isCurrent && block && <div className="tr-level-row-sub">Nu: {block.name}</div>}
                  </div>
                  <div className="tr-level-row-status">{isDone?'✓':isCurrent?'▶':'🔒'}</div>
                </div>
              )
            })}
          </div>

          <div className="tr-prog-section">
            <div className="tr-prog-label">💪 Styrke — levels</div>
            {LEVELS.map((lv, i) => {
              const isCurrent = strengthState.current_level === lv.level
              const isDone = strengthState.current_level > lv.level
              return (
                <div key={lv.level} className={`tr-level-row ${isCurrent?'current':''} ${isDone?'done':''}`}>
                  <div className="tr-level-row-num">{LEVEL_ICONS[i]}</div>
                  <div className="tr-level-row-info">
                    <div className="tr-level-row-name">{lv.name}</div>
                    <div className="tr-level-row-sub">{lv.trait}</div>
                  </div>
                  <div className="tr-level-row-status">{isDone?'✓':isCurrent?'▶':'🔒'}</div>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
