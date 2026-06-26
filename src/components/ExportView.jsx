import { useState } from 'react'
import { supabase } from '../lib/supabase'
import { DAYS, SYMPTOMS, HABITS, PATTERNS, dayDateKey, formatWeekRange, getMondayOfWeek } from '../lib/constants'
import './ExportView.css'

export default function ExportView({ user }) {
  const [dayWkOff, setDayWkOff] = useState(0)
  const [dayIdx, setDayIdx] = useState(0)
  const [weekWkOff, setWeekWkOff] = useState(0)
  const [exporting, setExporting] = useState(null)

  async function exportDay() {
    setExporting('day')
    const dk = dayDateKey(dayWkOff, dayIdx)
    const { data } = await supabase
      .from('daily_entries').select('*')
      .eq('user_id', user.id).eq('entry_date', dk).maybeSingle()
    setExporting(null)

    const d = data || {}
    let html = `<html><head><meta charset="UTF-8"><style>
      body{font-family:system-ui,sans-serif;padding:28px;max-width:620px;margin:0 auto;color:#111;font-size:14px}
      h1{font-size:20px;margin:0 0 4px}
      .meta{color:#666;font-size:13px;margin-bottom:24px}
      table{width:100%;border-collapse:collapse;margin-bottom:20px}
      td,th{padding:7px 10px;border:1px solid #e0e0e0;font-size:13px}
      th{background:#f5f5f5;font-weight:500;text-align:left}
      .sec{margin-bottom:18px}
      .sec-title{font-weight:600;font-size:11px;color:#999;letter-spacing:.06em;text-transform:uppercase;margin-bottom:6px}
      .sec-val{background:#f8f8f8;padding:10px 12px;border-radius:6px;min-height:30px;font-size:14px;line-height:1.5}
      .habits{display:flex;flex-wrap:wrap;gap:6px}
      .chip{padding:4px 12px;border-radius:20px;font-size:12px}
      .chip.on{background:#eafaf1;color:#1e8449}
      .chip.off{background:#f5f5f5;color:#aaa}
    </style></head><body>
    <h1>ADHD Dagbog — ${DAYS[dayIdx]} ${dk}</h1>
    <div class="meta">Søvn: ${d.sleep ? parseFloat(d.sleep).toFixed(1) : '–'} timer</div>`

    html += `<div class="sec"><div class="sec-title">Symptomscorer</div><table><tr><th>Symptom</th><th>Score</th></tr>`
    SYMPTOMS.forEach(s => {
      html += `<tr><td>${s.l}</td><td>${d.scores?.[s.k] ?? '–'}/10</td></tr>`
    })
    html += `</table></div>`

    html += `<div class="sec"><div class="sec-title">Gode vaner</div><div class="habits">`
    HABITS.forEach(h => {
      const on = d.habits?.[h.k]
      html += `<div class="chip ${on ? 'on' : 'off'}">${on ? '✓ ' : ''}${h.l}</div>`
    })
    html += `</div></div>`

    const fields = [
      ['flow', 'Fokus / flow'], ['hyper', 'Hyperfokus'],
      ['energy_src', 'Energi / dopamin'], ['drain', 'Energidræn'],
      ['overstim', 'Overstimulering'], ['helped', 'Hvad hjalp'], ['tomorrow', 'Justering til i morgen'],
    ]
    fields.forEach(([id, lbl]) => {
      if (d[id]) html += `<div class="sec"><div class="sec-title">${lbl}</div><div class="sec-val">${d[id]}</div></div>`
    })
    html += `</body></html>`

    const w = window.open('', '_blank')
    if (w) { w.document.write(html); w.document.close(); setTimeout(() => w.print(), 500) }
  }

  async function exportWeek() {
    setExporting('week')
    const weekStart = getMondayOfWeek(weekWkOff).toISOString().slice(0, 10)
    const dates = Array.from({ length: 6 }, (_, i) => dayDateKey(weekWkOff, i))
    const [{ data: daily }, { data: weekly }] = await Promise.all([
      supabase.from('daily_entries').select('*').eq('user_id', user.id).in('entry_date', dates),
      supabase.from('weekly_reflections').select('*').eq('user_id', user.id).eq('week_start', weekStart).maybeSingle(),
    ])
    setExporting(null)

    const map = {}
    daily?.forEach(r => { map[r.entry_date] = r })
    const ddata = dates.map(d => map[d] || null)
    const wdata = weekly || {}

    let html = `<html><head><meta charset="UTF-8"><style>
      body{font-family:system-ui,sans-serif;padding:28px;max-width:700px;margin:0 auto;color:#111;font-size:14px}
      h1{font-size:20px;margin:0 0 4px}
      .meta{color:#666;font-size:13px;margin-bottom:24px}
      table{width:100%;border-collapse:collapse;margin-bottom:20px;table-layout:fixed}
      td,th{padding:6px 8px;border:1px solid #e0e0e0;font-size:12px;text-align:center}
      th{background:#f5f5f5;font-weight:500}
      td:first-child,th:first-child{text-align:left;width:140px}
      .sec{margin-bottom:18px}
      .sec-title{font-weight:600;font-size:11px;color:#999;letter-spacing:.06em;text-transform:uppercase;margin-bottom:6px}
      .sec-val{background:#f8f8f8;padding:10px 12px;border-radius:6px;font-size:14px;line-height:1.5}
      .pat{font-size:13px;padding:4px 0}
    </style></head><body>
    <h1>ADHD Uge-Refleksion</h1>
    <div class="meta">${formatWeekRange(weekWkOff)}</div>`

    html += `<div class="sec"><div class="sec-title">Symptomscorer</div><table><tr><th>Symptom</th>`
    DAYS.slice(0, 6).forEach(d => { html += `<th>${d}</th>` })
    html += `<th>Snit</th></tr>`
    SYMPTOMS.forEach(s => {
      const vals = ddata.map(d => d?.scores?.[s.k])
      const filled = vals.filter(v => v != null)
      const avg = filled.length ? (filled.reduce((a, b) => a + b, 0) / filled.length).toFixed(1) : '–'
      html += `<tr><td>${s.l}</td>`
      vals.forEach(v => { html += `<td>${v ?? '–'}</td>` })
      html += `<td><strong>${avg}</strong></td></tr>`
    })
    html += `</table></div>`

    html += `<div class="sec"><div class="sec-title">Gode vaner</div><table><tr><th>Vane</th>`
    DAYS.slice(0, 6).forEach(d => { html += `<th>${d}</th>` })
    html += `<th>Total</th></tr>`
    HABITS.forEach(h => {
      let count = 0
      html += `<tr><td>${h.l}</td>`
      ddata.forEach(d => {
        const on = d?.habits?.[h.k]
        if (on) count++
        html += `<td>${on ? '✓' : '–'}</td>`
      })
      html += `<td>${count}/6</td></tr>`
    })
    html += `</table></div>`

    const textFields = [
      ['best', 'Hvad fungerede bedst'], ['drain', 'Hvad drænede mig mest'],
      ['best_moments', 'Bedste ADHD-øjeblikke'], ['challenges', 'Største udfordringer'],
      ['experiment', 'Eksperiment til næste uge'],
    ]
    textFields.forEach(([id, lbl]) => {
      if (wdata[id]) html += `<div class="sec"><div class="sec-title">${lbl}</div><div class="sec-val">${wdata[id]}</div></div>`
    })

    const activePatterns = PATTERNS.filter(p => wdata.patterns?.[p.k])
    if (activePatterns.length) {
      html += `<div class="sec"><div class="sec-title">Mønstre opdaget</div>`
      activePatterns.forEach(p => { html += `<div class="pat">✓ ${p.l}</div>` })
      html += `</div>`
    }

    if (wdata.overall_score) {
      html += `<div class="sec"><div class="sec-title">Ugens samlede score</div><div class="sec-val" style="font-size:28px;font-weight:600">${wdata.overall_score}/10</div></div>`
    }

    html += `</body></html>`
    const w = window.open('', '_blank')
    if (w) { w.document.write(html); w.document.close(); setTimeout(() => w.print(), 500) }
  }

  return (
    <div className="export-wrap">
      <div className="export-card">
        <div className="export-card-title">Daglig dagbog</div>
        <p className="export-card-desc">Eksporter én dags noter med scorer, vaner og refleksioner.</p>

        <div className="mini-nav">
          <button className="nav-arrow" onClick={() => setDayWkOff(w => w - 1)}>←</button>
          <span className="mini-week">{formatWeekRange(dayWkOff)}</span>
          <button className="nav-arrow" onClick={() => setDayWkOff(w => w + 1)}>→</button>
        </div>

        <div className="day-chips">
          {DAYS.slice(0, 6).map((name, i) => (
            <button key={i} className={`day-chip ${i === dayIdx ? 'active' : ''}`} onClick={() => setDayIdx(i)}>
              {name}
            </button>
          ))}
        </div>

        <button className="btn-export" onClick={exportDay} disabled={exporting === 'day'}>
          {exporting === 'day' ? 'Henter…' : '↓ Eksporter dag'}
        </button>
      </div>

      <div className="export-card">
        <div className="export-card-title">Ugerefleksion</div>
        <p className="export-card-desc">Eksporter ugens opsummering med tabeller og refleksioner.</p>

        <div className="mini-nav">
          <button className="nav-arrow" onClick={() => setWeekWkOff(w => w - 1)}>←</button>
          <span className="mini-week">{formatWeekRange(weekWkOff)}</span>
          <button className="nav-arrow" onClick={() => setWeekWkOff(w => w + 1)}>→</button>
        </div>

        <button className="btn-export" onClick={exportWeek} disabled={exporting === 'week'}>
          {exporting === 'week' ? 'Henter…' : '↓ Eksporter uge'}
        </button>
      </div>
    </div>
  )
}
