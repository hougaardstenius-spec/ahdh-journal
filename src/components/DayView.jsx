import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { DAYS, SYMPTOMS, HABITS, dayDateKey, formatWeekRange } from '../lib/constants'
import SundayView from './SundayView'
import './DayView.css'

export default function DayView({ user }) {
  const [wkOff, setWkOff] = useState(0)
  const [dayIdx, setDayIdx] = useState(() => {
    const d = new Date().getDay()
    return d === 0 ? 6 : d - 1
  })
  const [data, setData] = useState({})
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  const dateKey = dayDateKey(wkOff, dayIdx)

  const load = useCallback(async () => {
    const { data: row } = await supabase
      .from('daily_entries')
      .select('*')
      .eq('user_id', user.id)
      .eq('entry_date', dateKey)
      .maybeSingle()
    setData(row || {})
  }, [user.id, dateKey])

  useEffect(() => { load() }, [load])

  function setField(key, val) {
    setData(prev => ({ ...prev, [key]: val }))
  }

  function setScore(symptom, val) {
    setData(prev => ({
      ...prev,
      scores: { ...(prev.scores || {}), [symptom]: val }
    }))
  }

  function toggleHabit(k) {
    setData(prev => ({
      ...prev,
      habits: { ...(prev.habits || {}), [k]: !(prev.habits?.[k]) }
    }))
  }

  async function save() {
    setSaving(true)
    const payload = {
      user_id: user.id,
      entry_date: dateKey,
      scores: data.scores || {},
      habits: data.habits || {},
      sleep: data.sleep || 7,
      flow: data.flow || null,
      hyper: data.hyper || null,
      energy_src: data.energy_src || null,
      drain: data.drain || null,
      overstim: data.overstim || null,
      helped: data.helped || null,
      tomorrow: data.tomorrow || null,
    }
    await supabase.from('daily_entries').upsert(payload, { onConflict: 'user_id,entry_date' })
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  const DayForm = () => (
    <>
      <section className="section">
        <div className="sec-label">Symptomer (1–10)</div>
        {SYMPTOMS.map(s => {
          const val = data.scores?.[s.k] ?? 5
          return (
            <div key={s.k} className="sym-card">
              <div className="sym-row">
                <span className="sym-name">{s.l}</span>
                <input type="range" min="1" max="10" step="1" value={val}
                  onChange={e => setScore(s.k, parseInt(e.target.value))} />
                <span className="sym-val">{val}</span>
              </div>
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
              <div key={h.k} className={`hab-item ${on ? 'on' : ''}`} onClick={() => toggleHabit(h.k)}>
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
        ['tomorrow', dayIdx === 6 ? 'En lille justering jeg vil prøve i den kommende uge?' : 'En lille justering jeg vil prøve i morgen?', '…'],
      ].map(([id, lbl, ph]) => (
        <section key={id} className="section">
          <div className="sec-label">{lbl}</div>
          <textarea className="text-field" placeholder={ph} rows={2}
            value={data[id] || ''} onChange={e => setField(id, e.target.value)} />
        </section>
      ))}

      <section className="section">
        <div className="sec-label">Søvn</div>
        <div className="sleep-row">
          <input type="range" min="3" max="12" step="0.5"
            value={data.sleep ?? 7}
            onChange={e => setField('sleep', parseFloat(e.target.value))}
            style={{ flex: 1 }} />
          <span className="sleep-val">{parseFloat(data.sleep ?? 7).toFixed(1)}</span>
          <span className="sleep-unit">timer</span>
        </div>
      </section>

      <div className="save-row">
        {saved && <span className="saved-lbl">Gemt ✓</span>}
        <button className="btn-save" onClick={save} disabled={saving}>
          {saving ? 'Gemmer…' : 'Gem dag'}
        </button>
      </div>
    </>
  )

  return (
    <div className="day-wrap">
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
        <SundayView user={user} wkOff={wkOff} DayForm={DayForm} />
      ) : (
        <DayForm />
      )}
    </div>
  )
}
