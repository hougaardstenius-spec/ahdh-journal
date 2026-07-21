import { useState, useEffect } from 'react'
import { Line } from 'react-chartjs-2'
import {
  Chart as ChartJS, CategoryScale, LinearScale, PointElement,
  LineElement, Tooltip, Legend
} from 'chart.js'
import { supabase } from '../lib/supabase'
import { SYMPTOMS, TREND_COLORS } from '../lib/constants'
import './TrendsView.css'

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Legend)

const RANGES = [
  { label: '2 uger', days: 14 },
  { label: '1 måned', days: 30 },
  { label: '3 måneder', days: 90 },
]

export default function TrendsView({ user }) {
  const [range, setRange] = useState(14)
  const [metrics, setMetrics] = useState(['focus'])
  const [entries, setEntries] = useState([])
  const [isDark, setIsDark] = useState(() =>
    typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches
  )

  useEffect(() => {
    const mq = window.matchMedia('(prefers-color-scheme: dark)')
    const handler = e => setIsDark(e.matches)
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [])

  useEffect(() => {
    async function load() {
      const from = new Date()
      from.setDate(from.getDate() - range)
      const { data } = await supabase
        .from('daily_entries')
        .select('entry_date, scores')
        .eq('user_id', user.id)
        .gte('entry_date', from.toISOString().slice(0, 10))
        .order('entry_date')
      setEntries(data || [])
    }
    load()
  }, [user.id, range])

  function toggleMetric(k) {
    setMetrics(prev =>
      prev.includes(k)
        ? prev.length > 1 ? prev.filter(m => m !== k) : prev
        : [...prev, k]
    )
  }

  const labels = []
  const today = new Date()
  for (let i = range - 1; i >= 0; i--) {
    const d = new Date(today)
    d.setDate(d.getDate() - i)
    labels.push(d.toLocaleDateString('da-DK', { day: 'numeric', month: 'short' }))
  }

  const dateKeys = labels.map((_, i) => {
    const d = new Date(today)
    d.setDate(d.getDate() - (range - 1 - i))
    return d.toISOString().slice(0, 10)
  })

  const entryMap = {}
  entries.forEach(e => { entryMap[e.entry_date] = e.scores })

  const datasets = SYMPTOMS
    .filter(s => metrics.includes(s.k))
    .map((s, i) => ({
      label: s.l,
      data: dateKeys.map(dk => entryMap[dk]?.[s.k] ?? null),
      borderColor: TREND_COLORS[SYMPTOMS.findIndex(x => x.k === s.k) % TREND_COLORS.length],
      backgroundColor: TREND_COLORS[SYMPTOMS.findIndex(x => x.k === s.k) % TREND_COLORS.length] + '22',
      tension: 0.3,
      pointRadius: 4,
      borderWidth: 2,
      spanGaps: true,
    }))

  const chartData = { labels, datasets }

  const tickColor = isDark ? '#9098a5' : '#6b7280'
  const gridColor = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)'

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: false } },
    scales: {
      x: {
        ticks: { font: { size: 10 }, maxRotation: 45, autoSkip: true, maxTicksLimit: 10, color: tickColor },
        grid: { display: false },
      },
      y: {
        min: 1, max: 10,
        ticks: { stepSize: 1, font: { size: 10 }, color: tickColor },
        grid: { color: gridColor },
      },
    },
  }

  return (
    <div className="trends-wrap">
      <section className="section">
        <div className="sec-label">Metrik</div>
        <div className="metric-picks">
          {SYMPTOMS.map((s, i) => (
            <button
              key={s.k}
              className={`mpick ${metrics.includes(s.k) ? 'on' : ''}`}
              onClick={() => toggleMetric(s.k)}
              style={metrics.includes(s.k) ? { borderColor: TREND_COLORS[i % TREND_COLORS.length], color: TREND_COLORS[i % TREND_COLORS.length] } : {}}
            >
              {s.l.split(' / ')[0].split(' ')[0]}
            </button>
          ))}
        </div>
      </section>

      <section className="section">
        <div className="sec-label">Periode</div>
        <div className="range-picks">
          {RANGES.map(r => (
            <button
              key={r.days}
              className={`rpick ${range === r.days ? 'on' : ''}`}
              onClick={() => setRange(r.days)}
            >
              {r.label}
            </button>
          ))}
        </div>
      </section>

      <div className="chart-wrap">
        <Line data={chartData} options={options} />
      </div>

      <div className="legend">
        {datasets.map(ds => (
          <span key={ds.label} className="legend-item">
            <span className="legend-dot" style={{ background: ds.borderColor }} />
            {ds.label}
          </span>
        ))}
      </div>

      {entries.length === 0 && (
        <div className="empty-state">Ingen data endnu. Begynd at udfylde dagbogen for at se grafer.</div>
      )}
    </div>
  )
}
