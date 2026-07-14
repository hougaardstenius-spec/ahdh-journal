export const XP_REWARDS = {
  log_day: 20,
  habit_each: 10,
  all_habits_bonus: 30,
  save_week: 40,
  complete_strength: 25,
  complete_mobility: 20,
  complete_quest: 50,
}

export const XP_LEVELS = [
  { level: 1,  name: 'Nybegynder',  xpRequired: 0 },
  { level: 2,  name: 'Lærling',     xpRequired: 100 },
  { level: 3,  name: 'Praktikant',  xpRequired: 250 },
  { level: 4,  name: 'Udøver',      xpRequired: 500 },
  { level: 5,  name: 'Atlet',       xpRequired: 900 },
  { level: 6,  name: 'Veteran',     xpRequired: 1400 },
  { level: 7,  name: 'Mester',      xpRequired: 2000 },
  { level: 8,  name: 'Elite',       xpRequired: 2800 },
  { level: 9,  name: 'Champion',    xpRequired: 3800 },
  { level: 10, name: 'Legende',     xpRequired: 5000 },
]

export function getXPLevel(totalXP) {
  let current = XP_LEVELS[0]
  let next = XP_LEVELS[1]
  for (let i = XP_LEVELS.length - 1; i >= 0; i--) {
    if (totalXP >= XP_LEVELS[i].xpRequired) {
      current = XP_LEVELS[i]
      next = XP_LEVELS[i + 1] || null
      break
    }
  }
  const xpInLevel = totalXP - current.xpRequired
  const xpToNext = next ? next.xpRequired - current.xpRequired : 1
  const pct = next ? Math.min((xpInLevel / xpToNext) * 100, 100) : 100
  return { current, next, xpInLevel, xpToNext, pct }
}

export const SPIN_OUTCOMES = [
  { type: 'xp',        icon: '⚡', label: '+15 bonus XP',                xp: 15,  rarity: 'common' },
  { type: 'xp',        icon: '🔥', label: '+25 bonus XP',                xp: 25,  rarity: 'common' },
  { type: 'xp',        icon: '💎', label: '+50 bonus XP',                xp: 50,  rarity: 'rare' },
  { type: 'xp',        icon: '👑', label: '🎉 JACKPOT — +100 XP',        xp: 100, rarity: 'legendary' },
  { type: 'challenge', icon: '🎯', label: '5 min gåtur',                  xp: 20,  rarity: 'common',   challenge: 'Tag en 5 minutters gåtur inden du sover i dag.' },
  { type: 'challenge', icon: '🧘', label: '2 min vejrtrækning',           xp: 20,  rarity: 'common',   challenge: '2 minutter: luk munden, træk vejret langsomt igennem næsen.' },
  { type: 'challenge', icon: '💪', label: '20 squats',                    xp: 25,  rarity: 'common',   challenge: 'Lav 20 goblet squats eller air squats — lige nu.' },
  { type: 'challenge', icon: '📖', label: 'Læs 10 minutter',              xp: 20,  rarity: 'common',   challenge: 'Sæt en timer på 10 min og læs noget du nyder.' },
  { type: 'challenge', icon: '🏃', label: '4 × 20 sek sprint',            xp: 30,  rarity: 'uncommon', challenge: '4 × 20 sekunders sprint med 40 sekunders pause.' },
  { type: 'challenge', icon: '🧊', label: '30 sek koldt vand',            xp: 35,  rarity: 'uncommon', challenge: 'Slut dit næste bad med 30 sekunder koldt vand.' },
  { type: 'message',   icon: '🌟', label: 'Du er på rette spor',          xp: 10,  rarity: 'common',   message: 'Konsistens slår perfektion. Du er her — det er nok.' },
  { type: 'message',   icon: '🚀', label: 'ADHD er din superpower',       xp: 10,  rarity: 'common',   message: 'Din hjerne ser mønstre andre overser. Det er en gave.' },
  { type: 'message',   icon: '🎉', label: 'Fejr det lille',               xp: 10,  rarity: 'common',   message: 'Du åbnede appen i dag. Det er ikke lille — det er alt.' },
  { type: 'message',   icon: '💡', label: 'En tanke til dig',             xp: 10,  rarity: 'common',   message: 'Hjernen husker bedst det der er forbundet med følelser. Log hvad du mærker.' },
]

export function getDailySpin(dateStr) {
  const weights = { common: 70, uncommon: 20, rare: 8, legendary: 2 }
  const pool = SPIN_OUTCOMES.flatMap(o => Array(weights[o.rarity]).fill(o))
  // Deterministic seed fra dato så samme dag giver samme resultat
  const seed = dateStr.split('').reduce((a, c) => a + c.charCodeAt(0), 0)
  return pool[seed % pool.length]
}

export function getStreakStatus(streak, loggedToday) {
  if (streak === 0 && !loggedToday) return { color: '#aaa', emoji: '💤', label: 'Ingen streak endnu', danger: false }
  if (loggedToday) return { color: '#27ae60', emoji: '🔥', label: `${streak} dag${streak !== 1 ? 'e' : ''} i træk`, danger: false }
  if (streak >= 7) return { color: '#e34948', emoji: '⚠️', label: `${streak} dages streak i fare!`, danger: true }
  return { color: '#eda100', emoji: '⏰', label: `${streak} dages streak — log i dag!`, danger: true }
}
