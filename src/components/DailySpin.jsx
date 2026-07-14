import { useState } from 'react'
import { getDailySpin } from '../lib/gamification'
import './DailySpin.css'

export default function DailySpin({ today, spunToday, onSpin }) {
  const [spinning, setSpinning] = useState(false)
  const [revealed, setRevealed] = useState(spunToday)
  const outcome = getDailySpin(today)

  async function handleSpin() {
    if (spunToday || spinning) return
    setSpinning(true)
    await new Promise(r => setTimeout(r, 900))
    setSpinning(false)
    setRevealed(true)
    onSpin(outcome)
  }

  return (
    <div className="spin-wrap">
      <div className="spin-header">
        <span className="spin-title">🎰 Dagens overraskelse</span>
        {!spunToday && !revealed && <span className="spin-hint">Én gang om dagen</span>}
      </div>

      {!revealed ? (
        <button className={`spin-btn ${spinning ? 'spinning' : ''}`} onClick={handleSpin} disabled={spinning}>
          {spinning ? (
            <span className="spin-icons">
              {['⚡','🔥','💎','🎯','🌟'].map((e, i) => (
                <span key={i} className="spin-icon-item" style={{ animationDelay: `${i * 0.1}s` }}>{e}</span>
              ))}
            </span>
          ) : (
            <>
              <span className="spin-btn-icon">🎰</span>
              <span className="spin-btn-label">Tryk for at se hvad du får</span>
            </>
          )}
        </button>
      ) : (
        <div className={`spin-result rarity-${outcome.rarity}`}>
          <span className="spin-result-icon">{outcome.icon}</span>
          <div className="spin-result-info">
            <div className="spin-result-label">{outcome.label}</div>
            {outcome.challenge && <div className="spin-result-desc">{outcome.challenge}</div>}
            {outcome.message && <div className="spin-result-desc spin-message">"{outcome.message}"</div>}
            <div className="spin-result-xp">+{outcome.xp} XP</div>
          </div>
          {spunToday && <div className="spin-done-badge">Hentet i dag ✓</div>}
        </div>
      )}
    </div>
  )
}
