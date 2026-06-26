import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { LEVELS, QUESTS, LEVEL_ICONS, getCurrentProgram, getSetsReps } from '../lib/training'
import { getMondayOfWeek } from '../lib/constants'
import './TrainingView.css'

export default function TrainingView({ user }) {
  const [state, setState] = useState(null)
  const [questData, setQuestData] = useState({})
  const [tab, setTab] = useState('today') // today | progress | quests
  const [completing, setCompleting] = useState(false)
  const [justCompleted, setJustCompleted] = useState(false)
  const [questModal, setQuestModal] = useState(null)
  const [questInput, setQuestInput] = useState('')

  const weekStart = getMondayOfWeek(0).toISOString().slice(0, 10)

  const load = useCallback(async () => {
    const [{ data: ts }, { data: qd }] = await Promise.all([
      supabase.from('training_state').select('*').eq('user_id', user.id).maybeSingle(),
      supabase.from('quest_progress').select('*').eq('user_id', user.id).eq('week_start', weekStart),
    ])

    if (!ts) {
      const initial = {
        user_id: user.id,
        current_level: 1,
        current_program_idx: 0,
        level_start_date: new Date().toISOString().slice(0, 10),
        total_workouts: 0,
        last_workout_date: null,
      }
      await supabase.from('training_state').insert(initial)
      setState(initial)
    } else {
      setState(ts)
    }

    const qmap = {}
    qd?.forEach(q => { qmap[q.quest_id] = q })
    setQuestData(qmap)
  }, [user.id, weekStart])

  useEffect(() => { load() }, [load])

  if (!state) return <div className="tr-loading">Indlæser træning…</div>

  const trainingState = {
    currentLevel: state.current_level,
    currentProgramIdx: state.current_program_idx,
  }
  const { level, program } = getCurrentProgram(trainingState)
  const levelIcon = LEVEL_ICONS[(state.current_level - 1) % LEVEL_ICONS.length]

  // Check if already done today
  const today = new Date().toISOString().slice(0, 10)
  const doneTodayAlready = state.last_workout_date === today

  // Level progress: days since level_start_date
  const levelStart = new Date(state.level_start_date)
  const daysInLevel = Math.floor((new Date() - levelStart) / 86400000)
  const levelProgressPct = Math.min((daysInLevel / 28) * 100, 100)
  const daysLeft = Math.max(28 - daysInLevel, 0)

  async function completeWorkout() {
    setCompleting(true)
    const newProgramIdx = (state.current_program_idx + 1) % 4
    let newLevel = state.current_level
    let newLevelStart = state.level_start_date

    // Check if 4 weeks passed → unlock next level
    if (daysInLevel >= 28 && state.current_level < 10) {
      newLevel = state.current_level + 1
      newLevelStart = today
    }

    const updated = {
      current_level: newLevel,
      current_program_idx: newProgramIdx,
      level_start_date: newLevelStart,
      total_workouts: (state.total_workouts || 0) + 1,
      last_workout_date: today,
    }
    await supabase.from('training_state').update(updated).eq('user_id', user.id)
    setState(prev => ({ ...prev, ...updated }))
    setCompleting(false)
    setJustCompleted(true)
    setTimeout(() => setJustCompleted(false), 3000)
  }

  async function logQuestProgress(questId, amount) {
    const existing = questData[questId]
    const current = existing?.amount || 0
    const newAmount = current + parseFloat(amount)
    const quest = QUESTS.find(q => q.id === questId)

    const payload = {
      user_id: user.id,
      quest_id: questId,
      week_start: weekStart,
      amount: newAmount,
      target: quest.target,
      completed: newAmount >= quest.target,
    }

    if (existing) {
      await supabase.from('quest_progress').update(payload).eq('id', existing.id)
    } else {
      await supabase.from('quest_progress').insert(payload)
    }
    await load()
    setQuestModal(null)
    setQuestInput('')
  }

  return (
    <div className="tr-wrap">
      <div className="tr-tabs">
        {[['today','I dag'],['progress','Progression'],['quests','Quests']].map(([id, lbl]) => (
          <button key={id} className={`tr-tab ${tab===id?'active':''}`} onClick={() => setTab(id)}>{lbl}</button>
        ))}
      </div>

      {tab === 'today' && (
        <div className="tr-today">
          <div className="tr-level-badge">
            <span className="tr-level-icon">{levelIcon}</span>
            <div>
              <div className="tr-level-name">Level {state.current_level} — {level.name}</div>
              <div className="tr-level-trait">{level.trait}</div>
            </div>
          </div>

          <div className="tr-program-card">
            <div className="tr-program-header">
              <span className="tr-program-label">Program {program.id}</span>
              {program.complex && <span className="tr-complex-badge">Komplex</span>}
            </div>

            <div className="tr-exercises">
              {program.exercises.map((ex, i) => (
                <div key={ex} className="tr-exercise">
                  {program.complex && i > 0 && <div className="tr-arrow">↓</div>}
                  <div className="tr-ex-content">
                    <div className="tr-ex-name">{ex}</div>
                    <div className="tr-ex-sets">{getSetsReps(state.current_level, ex)}</div>
                  </div>
                </div>
              ))}
            </div>

            <div className="tr-focus-note">{level.focus}</div>
          </div>

          {justCompleted ? (
            <div className="tr-completed-msg">
              <span className="tr-completed-icon">🎯</span>
              <div>
                <div className="tr-completed-title">Godt klaret!</div>
                <div className="tr-completed-sub">Næste: Program {LEVELS[state.current_level-1]?.programs[state.current_program_idx]?.id}</div>
              </div>
            </div>
          ) : doneTodayAlready ? (
            <div className="tr-done-today">
              <span>✓</span> Trænet i dag — kom igen i morgen
            </div>
          ) : (
            <button className="tr-complete-btn" onClick={completeWorkout} disabled={completing}>
              {completing ? 'Gemmer…' : '✓ Markér som gennemført'}
            </button>
          )}

          <div className="tr-level-progress">
            <div className="tr-level-progress-row">
              <span className="tr-lp-label">Level fremgang</span>
              <span className="tr-lp-days">{daysLeft > 0 ? `${daysLeft} dage til næste level` : '🔓 Nyt level klar!'}</span>
            </div>
            <div className="tr-progress-bar">
              <div className="tr-progress-fill" style={{ width: `${levelProgressPct}%` }} />
            </div>
          </div>

          <div className="tr-stats-row">
            <div className="tr-stat">
              <div className="tr-stat-val">{state.total_workouts || 0}</div>
              <div className="tr-stat-lbl">Træninger i alt</div>
            </div>
            <div className="tr-stat">
              <div className="tr-stat-val">{state.current_level}</div>
              <div className="tr-stat-lbl">Nuværende level</div>
            </div>
            <div className="tr-stat">
              <div className="tr-stat-val">{['A','B','C','D'][state.current_program_idx]}</div>
              <div className="tr-stat-lbl">Næste program</div>
            </div>
          </div>
        </div>
      )}

      {tab === 'progress' && (
        <div className="tr-progress-view">
          <div className="tr-section-label">Din rejse</div>
          <div className="tr-levels-list">
            {LEVELS.map((lv, i) => {
              const isUnlocked = state.current_level > lv.level
              const isCurrent = state.current_level === lv.level
              const icon = LEVEL_ICONS[i]
              return (
                <div key={lv.level} className={`tr-level-row ${isCurrent ? 'current' : ''} ${isUnlocked ? 'done' : ''}`}>
                  <div className="tr-level-row-icon">{icon}</div>
                  <div className="tr-level-row-info">
                    <div className="tr-level-row-name">Level {lv.level} — {lv.name}</div>
                    <div className="tr-level-row-trait">{lv.trait}</div>
                  </div>
                  <div className="tr-level-row-status">
                    {isUnlocked ? '✓' : isCurrent ? '▶' : '🔒'}
                  </div>
                </div>
              )
            })}
          </div>

          <div className="tr-section-label" style={{marginTop:'1.5rem'}}>Nuværende level — programmer</div>
          <div className="tr-mini-programs">
            {level.programs.map((prog, i) => {
              const isCurrent = i === state.current_program_idx
              const isDone = i < state.current_program_idx
              return (
                <div key={prog.id} className={`tr-mini-prog ${isCurrent ? 'current' : ''} ${isDone ? 'done' : ''}`}>
                  <div className="tr-mini-prog-id">{prog.id}</div>
                  <div className="tr-mini-prog-exercises">
                    {prog.exercises.join(' · ')}
                  </div>
                  {isCurrent && <div className="tr-mini-now">Nu</div>}
                  {isDone && <div className="tr-mini-done">✓</div>}
                </div>
              )
            })}
          </div>
        </div>
      )}

      {tab === 'quests' && (
        <div className="tr-quests-view">
          <div className="tr-section-label">Ugens quests</div>
          <p className="tr-quest-intro">Frivillige udfordringer — logger du ekstra, får du ekstra.</p>
          {QUESTS.map(q => {
            const qd = questData[q.id]
            const amount = qd?.amount || 0
            const pct = Math.min((amount / q.target) * 100, 100)
            const done = qd?.completed
            return (
              <div key={q.id} className={`tr-quest-card ${done ? 'done' : ''}`}>
                <div className="tr-quest-header">
                  <span className="tr-quest-icon">{q.icon}</span>
                  <div className="tr-quest-info">
                    <div className="tr-quest-name">{q.name}</div>
                    <div className="tr-quest-desc">{q.description}</div>
                  </div>
                  {done && <span className="tr-quest-badge">✓</span>}
                </div>
                <div className="tr-quest-progress-row">
                  <div className="tr-progress-bar">
                    <div className="tr-progress-fill quest" style={{ width: `${pct}%` }} />
                  </div>
                  <span className="tr-quest-count">{amount}/{q.target} {q.unit}</span>
                </div>
                {!done && (
                  <button className="tr-quest-log-btn" onClick={() => { setQuestModal(q); setQuestInput('') }}>
                    + Log fremgang
                  </button>
                )}
              </div>
            )
          })}
        </div>
      )}

      {questModal && (
        <div className="tr-modal-overlay" onClick={() => setQuestModal(null)}>
          <div className="tr-modal" onClick={e => e.stopPropagation()}>
            <div className="tr-modal-title">{questModal.icon} {questModal.name}</div>
            <div className="tr-modal-desc">{questModal.description}</div>
            <input
              className="tr-modal-input"
              type="number"
              min="1"
              placeholder={`Antal ${questModal.unit}…`}
              value={questInput}
              onChange={e => setQuestInput(e.target.value)}
              autoFocus
            />
            <div className="tr-modal-btns">
              <button className="tr-modal-cancel" onClick={() => setQuestModal(null)}>Annuller</button>
              <button
                className="tr-modal-confirm"
                onClick={() => questInput && logQuestProgress(questModal.id, questInput)}
                disabled={!questInput}
              >
                Gem
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
