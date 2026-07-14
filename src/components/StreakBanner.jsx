import { getStreakStatus } from '../lib/gamification'
import './StreakBanner.css'

export default function StreakBanner({ streak, loggedToday }) {
  const status = getStreakStatus(streak, loggedToday)

  return (
    <div className={`streak-banner ${status.danger ? 'danger' : ''} ${loggedToday ? 'safe' : ''}`}>
      <span className="streak-emoji">{status.emoji}</span>
      <span className="streak-label">{status.label}</span>
      {streak >= 3 && (
        <div className="streak-dots">
          {Array.from({ length: Math.min(streak, 7) }, (_, i) => (
            <div key={i} className="streak-dot on" />
          ))}
          {streak < 7 && Array.from({ length: 7 - streak }, (_, i) => (
            <div key={`e-${i}`} className="streak-dot" />
          ))}
        </div>
      )}
    </div>
  )
}
