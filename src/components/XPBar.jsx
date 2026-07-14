import { useState, useEffect } from 'react'
import { getXPLevel } from '../lib/gamification'
import './XPBar.css'

export default function XPBar({ totalXP, newXP = 0 }) {
  const [displayXP, setDisplayXP] = useState(totalXP - newXP)
  const [levelUp, setLevelUp] = useState(false)

  useEffect(() => {
    if (newXP <= 0) { setDisplayXP(totalXP); return }
    const before = getXPLevel(totalXP - newXP)
    const after = getXPLevel(totalXP)
    if (after.current.level > before.current.level) setLevelUp(true)

    // Animate XP counting up
    let start = null
    const duration = 800
    const from = totalXP - newXP
    const to = totalXP
    function step(ts) {
      if (!start) start = ts
      const prog = Math.min((ts - start) / duration, 1)
      setDisplayXP(Math.round(from + (to - from) * prog))
      if (prog < 1) requestAnimationFrame(step)
    }
    requestAnimationFrame(step)
  }, [totalXP, newXP])

  const { current, next, pct } = getXPLevel(displayXP)

  return (
    <div className={`xp-bar-wrap ${levelUp ? 'level-up' : ''}`}>
      <div className="xp-bar-top">
        <span className="xp-level-badge">Lv.{current.level}</span>
        <span className="xp-level-name">{current.name}</span>
        {newXP > 0 && <span className="xp-gain">+{newXP} XP</span>}
        {levelUp && <span className="xp-levelup-badge">LEVEL UP! 🎉</span>}
        {next && <span className="xp-to-next">{next.xpRequired - displayXP} XP til {next.name}</span>}
      </div>
      <div className="xp-bar-track">
        <div className="xp-bar-fill" style={{ width: `${pct}%` }} />
      </div>
    </div>
  )
}
