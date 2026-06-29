import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { DAYS, SYMPTOMS, HABITS, PATTERNS, dayDateKey, formatWeekRange, getMondayOfWeek } from '../lib/constants'
import './WeekView.css'

export default function WeekView({ user }) {
  const [wkOff, setWkOff] = useState(0)
  const [wdata, setWdata] = useState({})
  const [ddata, setDdata] = useState(Array(7).fill(null))
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

  async function save() {
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

  return (
    <div className="week-wrap">
      <div className="week-nav">
        <button className="nav-arrow" onClick={() => setWkOff(w => w - 1)}>←</button>
        <span className="week-label">{formatWeekRange(wkOff)}</span>
        <button className="nav-arrow" onClick={() => setWkOff(w => w + 1)}>→</button>
      </div>

      <section className="section">
        <div className="sec-label">Ugens gennemsnit</div>
        {SYMPTOMS.map(s => (
          <div key={s.k} className="wk-metric">
            <div className="wk-mrow">
              <span className="wk-mname">{s.l}</span>
              <span className="wk-mavg">{avg(s.k)}</span>
            </div>
            <div className="dots-row">
              {DAYS.map((d, i) => {
                const val = ddata[i]?.scores?.[s.k]
                return (
                  <div key={i} className={`ddot ${val ? 'on' : ''}`}>
                    <span className="ddot-v">{val || d[0]}</span>
                    {val && <span className="ddot-l">{d}</span>}
                  </div>
                )
              })}
            </div>
          </div>
        ))}
      </section>

      <section className="section">
        <div className="sec-label">Gode vaner – ugetotal</div>
        <div className="hab-summary">
          {HABITS.map(h => {
            const count = ddata.filter(d => d?.habits?.[h.k]).length
            return (
              <div key={h.k} className="hs-item">
                <div className="hs-count">{count}/7</div>
                <div className="hs-name">{h.l}</div>
              </div>
            )
          })}
        </div>
      </section>

      {[
        ['best', 'Hvad fungerede bedst?'],
        ['drain', 'Hvad drænede mig mest?'],
        ['best_moments', 'Mine bedste ADHD-øjeblikke'],
        ['challenges', 'Mine største udfordringer'],
        ['experiment', 'Eksperiment til næste uge'],
      ].map(([id, lbl]) => (
        <section key={id} className="section">
          <div className="sec-label">{lbl}</div>
          <textarea
            className="text-field"
            placeholder="…"
            rows={2}
            value={wdata[id] || ''}
            onChange={e => setField(id, e.target.value)}
          />
        </section>
      ))}

      <section className="section">
        <div className="sec-label">Mønstre jeg har opdaget</div>
        <div className="patt-list">
          {PATTERNS.map(p => {
            const on = wdata.patterns?.[p.k]
            return (
              <div key={p.k} className={`patt-item ${on ? 'on' : ''}`} onClick={() => togglePattern(p.k)}>
                <div className="patt-cb">{on ? '✓' : ''}</div>
                <span className="patt-txt">{p.l}</span>
              </div>
            )
          })}
        </div>
      </section>

      <section className="section">
        <div className="sec-label">Lykkedes sidste uges eksperiment?</div>
        <div className="exp-row">
          {[['ja', 'Ja'], ['delvist', 'Delvist'], ['nej', 'Nej']].map(([val, lbl]) => (
            <div
              key={val}
              className={`exp-opt ${val} ${wdata.exp_outcome === val ? 'on' : ''}`}
              onClick={() => setField('exp_outcome', val)}
            >
              {lbl}
            </div>
          ))}
        </div>
      </section>

      <section className="section">
        <div className="sec-label">Ugens samlede score (1–10)</div>
        <div className="score-row">
          {Array.from({ length: 10 }, (_, i) => i + 1).map(n => (
            <div
              key={n}
              className={`snum ${wdata.overall_score === n ? 'on' : ''}`}
              onClick={() => setField('overall_score', n)}
            >
              {n}
            </div>
          ))}
        </div>
      </section>

      <div className="save-row">
        {saved && <span className="saved-lbl">Gemt ✓</span>}
        <button className="btn-save" onClick={save} disabled={saving}>
          {saving ? 'Gemmer…' : 'Gem ugerefleksion'}
        </button>
      </div>
    </div>
  )
}
