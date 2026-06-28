import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { SYMPTOMS, HABITS, PATTERNS, dayDateKey, getMondayOfWeek, DAYS } from '../lib/constants'
import './SundayView.css'

export default function SundayView({ user, wkOff, DayForm }) {
  const [ddata, setDdata] = useState(Array(7).fill(null))
  const [wdata, setWdata] = useState({})
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  const weekStart = getMondayOfWeek(wkOff).toISOString().slice(0, 10)

  const load = useCallback(async () => {
    const dates = Array.from({ length: 7 }, (_, i) => dayDateKey(wkOff, i))
    const [{ data: daily }, { data: weekly }] = await Promise.all([
      supabase.from('daily_entries').select('*').eq('user_id', user.id).in('entry_date', dates),
      supabase.from('weekly_reflections').select('*').eq('user_id', user.id).eq('week_start', weekStart).maybeSingle(),
    ])
    const map = {}
    daily?.forEach(r => { map[r.entry_date] = r })
    setDdata(dates.map(d => map[d] || null))
    setWdata(weekly || {})
  }, [user.id, wkOff, weekStart])

  useEffect(() => { load() }, [load])

  function setField(key, val) {
    setWdata(prev => ({ ...prev, [key]: val }))
  }

  function togglePattern(k) {
    setWdata(prev => ({
      ...prev,
      patterns: { ...(prev.patterns || {}), [k]: !(prev.patterns?.[k]) }
    }))
  }

  async function saveWeek() {
    setSaving(true)
    const payload = {
      user_id: user.id,
      week_start: weekStart,
      best: wdata.best || null,
      drain: wdata.drain || null,
      best_moments: wdata.best_moments || null,
      challenges: wdata.challenges || null,
      experiment: wdata.experiment || null,
      patterns: wdata.patterns || {},
      exp_outcome: wdata.exp_outcome || null,
      overall_score: wdata.overall_score || null,
    }
    await supabase.from('weekly_reflections').upsert(payload, { onConflict: 'user_id,week_start' })
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  function avg(symptomKey) {
    const vals = ddata.map(d => d?.scores?.[symptomKey]).filter(v => v != null)
    return vals.length ? (vals.reduce((a, b) => a + b, 0) / vals.length).toFixed(1) : '–'
  }

  const daysLogged = ddata.filter(d => d !== null).length

  return (
    <div className="sun-wrap">
      {/* Daily log for Sunday */}
      <div className="sun-section-header">
        <span className="sun-section-icon">📓</span>
        <span className="sun-section-title">Søndagens log</span>
      </div>
      <DayForm />

      {/* Divider */}
      <div className="sun-divider">
        <span>Ugens opsummering</span>
      </div>

      {/* Auto summary */}
      <div className="sun-summary-note">
        {daysLogged} af 7 dage logget denne uge
      </div>

      {/* Symptom averages - all 7 days */}
      <section className="section">
        <div className="sec-label">Ugens gennemsnit – symptomer</div>
        {SYMPTOMS.map(s => {
          const a = avg(s.k)
          const num = parseFloat(a)
          const color = isNaN(num) ? '#eee' : num >= 7 ? '#27ae60' : num >= 5 ? '#378ADD' : '#e34948'
          return (
            <div key={s.k} className="sun-metric">
              <div className="sun-metric-row">
                <span className="sun-metric-name">{s.l}</span>
                <span className="sun-metric-avg" style={{ color: isNaN(num) ? '#aaa' : color }}>{a}</span>
              </div>
              <div className="sun-dots-row">
                {DAYS.map((d, i) => {
                  const val = ddata[i]?.scores?.[s.k]
                  return (
                    <div key={i} className={`sun-dot ${val ? 'on' : ''}`}>
                      <span className="sun-dot-v">{val || d[0]}</span>
                      {val && <span className="sun-dot-l">{d}</span>}
                    </div>
                  )
                })}
              </div>
            </div>
          )
        })}
      </section>

      {/* Habit summary - all 7 days */}
      <section className="section">
        <div className="sec-label">Gode vaner – ugetotal</div>
        <div className="sun-hab-summary">
          {HABITS.map(h => {
            const count = ddata.filter(d => d?.habits?.[h.k]).length
            const pct = (count / 7) * 100
            return (
              <div key={h.k} className="sun-hab-item">
                <div className="sun-hab-top">
                  <span className="sun-hab-name">{h.l}</span>
                  <span className="sun-hab-count">{count}/7</span>
                </div>
                <div className="sun-hab-bar">
                  <div className="sun-hab-fill" style={{
                    width: `${pct}%`,
                    background: pct >= 85 ? '#27ae60' : pct >= 50 ? '#378ADD' : '#e34948'
                  }} />
                </div>
              </div>
            )
          })}
        </div>
      </section>

      {/* Reflection fields */}
      {[
        ['best', 'Hvad fungerede bedst denne uge?'],
        ['drain', 'Hvad drænede mig mest?'],
        ['best_moments', 'Mine bedste ADHD-øjeblikke'],
        ['challenges', 'Mine største udfordringer'],
        ['experiment', 'Eksperiment til næste uge'],
      ].map(([id, lbl]) => (
        <section key={id} className="section">
          <div className="sec-label">{lbl}</div>
          <textarea className="text-field" placeholder="…" rows={2}
            value={wdata[id] || ''} onChange={e => setField(id, e.target.value)} />
        </section>
      ))}

      {/* Patterns */}
      <section className="section">
        <div className="sec-label">Mønstre jeg har opdaget</div>
        <div className="sun-patt-list">
          {PATTERNS.map(p => {
            const on = wdata.patterns?.[p.k]
            return (
              <div key={p.k} className={`sun-patt-item ${on ? 'on' : ''}`} onClick={() => togglePattern(p.k)}>
                <div className="sun-patt-cb">{on ? '✓' : ''}</div>
                <span className="sun-patt-txt">{p.l}</span>
              </div>
            )
          })}
        </div>
      </section>

      {/* Experiment outcome */}
      <section className="section">
        <div className="sec-label">Lykkedes sidste uges eksperiment?</div>
        <div className="sun-exp-row">
          {[['ja', 'Ja ✓'], ['delvist', 'Delvist ~'], ['nej', 'Nej ✗']].map(([val, lbl]) => (
            <div key={val} className={`sun-exp-opt ${val} ${wdata.exp_outcome === val ? 'on' : ''}`}
              onClick={() => setField('exp_outcome', val)}>
              {lbl}
            </div>
          ))}
        </div>
      </section>

      {/* Overall score */}
      <section className="section">
        <div className="sec-label">Ugens samlede score (1–10)</div>
        <div className="sun-score-row">
          {Array.from({ length: 10 }, (_, i) => i + 1).map(n => (
            <div key={n} className={`sun-snum ${wdata.overall_score === n ? 'on' : ''}`}
              onClick={() => setField('overall_score', n)}>
              {n}
            </div>
          ))}
        </div>
      </section>

      <div className="save-row">
        {saved && <span className="saved-lbl">Gemt ✓</span>}
        <button className="btn-save" onClick={saveWeek} disabled={saving}>
          {saving ? 'Gemmer…' : 'Gem ugerefleksion'}
        </button>
      </div>
    </div>
  )
}
