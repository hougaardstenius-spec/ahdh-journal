import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { SYMPTOMS, HABITS, PATTERNS, dayDateKey, getMondayOfWeek, DAYS } from '../lib/constants'
import './SundayView.css'

function SundayDayForm({ data, saving, saved, onScore, onHabit, onField, onSave }) {
  return (
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
                  onChange={e => {
                    const sy = window.scrollY
                    onScore(s.k, parseInt(e.target.value))
                    requestAnimationFrame(() => window.scrollTo({ top: sy, behavior: 'instant' }))
                  }} />
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
              <div key={h.k} className={`hab-item ${on ? 'on' : ''}`} onClick={() => onHabit(h.k)}>
                <div className="hab-cb">{on ? '✓' : ''}</div>
                <span className="hab-name">{h.l}</span>
              </div>
            )
          })}
        </div>
      </section>

      {[
        ['flow', 'Hvornår havde jeg bedst fokus / flow?', 'F.eks. om morgenen…'],
        ['hyper', 'Muligt hyperfokus – hvad opslugte mig?', '…'],
        ['energy_src', 'Hvad gav mig mest energi / dopamin?', '…'],
        ['drain', 'Hvad drænede min energi?', '…'],
        ['overstim', 'Overstimulering (støj, krav, mennesker)?', '…'],
        ['helped', 'Noget der faktisk hjalp min hjerne?', '…'],
        ['tomorrow', 'En lille justering jeg vil prøve i den kommende uge?', '…'],
      ].map(([id, lbl, ph]) => (
        <section key={id} className="section">
          <div className="sec-label">{lbl}</div>
          <textarea
            className="text-field"
            placeholder={ph}
            rows={2}
            value={data[id] || ''}
            onChange={e => onField(id, e.target.value)}
          />
        </section>
      ))}

      <section className="section">
        <div className="sec-label">Søvn</div>
        <div className="sleep-row">
          <input type="range" min="3" max="12" step="0.5"
            value={data.sleep ?? 7}
            onChange={e => {
              const sy = window.scrollY
              onField('sleep', parseFloat(e.target.value))
              requestAnimationFrame(() => window.scrollTo({ top: sy, behavior: 'instant' }))
            }}
            style={{ flex: 1 }} />
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
  )
}

export default function SundayView({ user, wkOff }) {
  const [dayData, setDayData] = useState({})
  const [daySaving, setDaySaving] = useState(false)
  const [daySaved, setDaySaved] = useState(false)
  const [ddata, setDdata] = useState(Array(7).fill(null))
  const [wdata, setWdata] = useState({})
  const [wSaving, setWSaving] = useState(false)
  const [wSaved, setWSaved] = useState(false)

  const weekStart = getMondayOfWeek(wkOff).toISOString().slice(0, 10)
  const sundayKey = dayDateKey(wkOff, 6)

  const load = useCallback(async () => {
    const dates = Array.from({ length: 7 }, (_, i) => dayDateKey(wkOff, i))
    const [{ data: daily }, { data: weekly }, { data: sunday }] = await Promise.all([
      supabase.from('daily_entries').select('*').eq('user_id', user.id).in('entry_date', dates),
      supabase.from('weekly_reflections').select('*').eq('user_id', user.id).eq('week_start', weekStart).maybeSingle(),
      supabase.from('daily_entries').select('*').eq('user_id', user.id).eq('entry_date', sundayKey).maybeSingle(),
    ])
    const map = {}
    daily?.forEach(r => { map[r.entry_date] = r })
    setDdata(dates.map(d => map[d] || null))
    setWdata(weekly || {})
    setDayData(sunday || {})
  }, [user.id, wkOff, weekStart, sundayKey])

  useEffect(() => { load() }, [load])

  function setDayField(key, val) { setDayData(prev => ({ ...prev, [key]: val })) }
  function setDayScore(symptom, val) { setDayData(prev => ({ ...prev, scores: { ...(prev.scores || {}), [symptom]: val } })) }
  function toggleDayHabit(k) { setDayData(prev => ({ ...prev, habits: { ...(prev.habits || {}), [k]: !(prev.habits?.[k]) } })) }

  async function saveDay() {
    setDaySaving(true)
    const payload = {
      user_id: user.id, entry_date: sundayKey,
      scores: dayData.scores || {}, habits: dayData.habits || {},
      sleep: dayData.sleep || 7,
      flow: dayData.flow || null, hyper: dayData.hyper || null,
      energy_src: dayData.energy_src || null, drain: dayData.drain || null,
      overstim: dayData.overstim || null, helped: dayData.helped || null,
      tomorrow: dayData.tomorrow || null,
    }
    await supabase.from('daily_entries').upsert(payload, { onConflict: 'user_id,entry_date' })
    setDaySaving(false); setDaySaved(true)
    setTimeout(() => setDaySaved(false), 2000)
    load()
  }

  function setWField(key, val) { setWdata(prev => ({ ...prev, [key]: val })) }
  function togglePattern(k) { setWdata(prev => ({ ...prev, patterns: { ...(prev.patterns || {}), [k]: !(prev.patterns?.[k]) } })) }

  async function saveWeek() {
    setWSaving(true)
    const payload = {
      user_id: user.id, week_start: weekStart,
      best: wdata.best || null, drain: wdata.drain || null,
      best_moments: wdata.best_moments || null, challenges: wdata.challenges || null,
      experiment: wdata.experiment || null, patterns: wdata.patterns || {},
      exp_outcome: wdata.exp_outcome || null, overall_score: wdata.overall_score || null,
    }
    await supabase.from('weekly_reflections').upsert(payload, { onConflict: 'user_id,week_start' })
    setWSaving(false); setWSaved(true)
    setTimeout(() => setWSaved(false), 2000)
  }

  function avg(symptomKey) {
    const vals = ddata.map(d => d?.scores?.[symptomKey]).filter(v => v != null)
    return vals.length ? (vals.reduce((a, b) => a + b, 0) / vals.length).toFixed(1) : '–'
  }

  const daysLogged = ddata.filter(d => d !== null).length

  return (
    <div className="sun-wrap">
      <div className="sun-section-header">
        <span className="sun-section-icon">📓</span>
        <span className="sun-section-title">Søndagens log</span>
      </div>

      <SundayDayForm
        data={dayData}
        saving={daySaving}
        saved={daySaved}
        onScore={setDayScore}
        onHabit={toggleDayHabit}
        onField={setDayField}
        onSave={saveDay}
      />

      <div className="sun-divider"><span>Ugens opsummering</span></div>

      <div className="sun-summary-note">{daysLogged} af 7 dage logget denne uge</div>

      <section className="section">
        <div className="sec-label">Ugens gennemsnit – symptomer</div>
        {SYMPTOMS.map(s => {
          const a = avg(s.k)
          const num = parseFloat(a)
          const color = isNaN(num) ? '#aaa' : num >= 7 ? '#27ae60' : num >= 5 ? '#378ADD' : '#e34948'
          return (
            <div key={s.k} className="sun-metric">
              <div className="sun-metric-row">
                <span className="sun-metric-name">{s.l}</span>
                <span className="sun-metric-avg" style={{ color }}>{a}</span>
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
                  <div className="sun-hab-fill" style={{ width: `${pct}%`, background: pct >= 85 ? '#27ae60' : pct >= 50 ? '#378ADD' : '#e34948' }} />
                </div>
              </div>
            )
          })}
        </div>
      </section>

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
            value={wdata[id] || ''} onChange={e => setWField(id, e.target.value)} />
        </section>
      ))}

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

      <section className="section">
        <div className="sec-label">Lykkedes sidste uges eksperiment?</div>
        <div className="sun-exp-row">
          {[['ja', 'Ja ✓'], ['delvist', 'Delvist ~'], ['nej', 'Nej ✗']].map(([val, lbl]) => (
            <div key={val} className={`sun-exp-opt ${val} ${wdata.exp_outcome === val ? 'on' : ''}`}
              onClick={() => setWField('exp_outcome', val)}>{lbl}</div>
          ))}
        </div>
      </section>

      <section className="section">
        <div className="sec-label">Ugens samlede score (1–10)</div>
        <div className="sun-score-row">
          {Array.from({ length: 10 }, (_, i) => i + 1).map(n => (
            <div key={n} className={`sun-snum ${wdata.overall_score === n ? 'on' : ''}`}
              onClick={() => setWField('overall_score', n)}>{n}</div>
          ))}
        </div>
      </section>

      <div className="save-row">
        {wSaved && <span className="saved-lbl">Gemt ✓</span>}
        <button className="btn-save" onClick={saveWeek} disabled={wSaving}>
          {wSaving ? 'Gemmer…' : 'Gem ugerefleksion'}
        </button>
      </div>
    </div>
  )
}
