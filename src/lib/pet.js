export const SPECIES = [
  { id: 'bird',   name: 'Fugl',  stages: ['🥚', '🐣', '🐤', '🦉'] },
  { id: 'cat',    name: 'Kat',   stages: ['🥚', '🐱', '🐈', '🐈‍⬛'] },
  { id: 'dog',    name: 'Hund',  stages: ['🥚', '🐶', '🐕', '🦮'] },
  { id: 'dragon', name: 'Drage', stages: ['🥚', '🦎', '🐲', '🐉'] },
]

export const STAGE_NAMES = ['Æg', 'Baby', 'Voksen', 'Mester']
export const STAGE_THRESHOLDS = [0, 5, 15, 35]

export const DEFAULT_ENERGY = 50
export const DEFAULT_HAPPINESS = 70
export const ENERGY_GAIN_PER_EVENT = 15
export const HAPPINESS_GAIN_PER_EVENT = 5
export const ACTIVITY_ENERGY_COST = 30
export const ACTIVITY_HAPPINESS_GAIN = 15
export const ACTIVITY_XP_MIN = 10
export const ACTIVITY_XP_MAX = 25
export const HAPPINESS_DECAY_PER_MISSED_DAY = 10

export const MOOD_BANDS = [
  { min: 0,  emoji: '😢', label: 'Ked af det' },
  { min: 25, emoji: '😟', label: 'Utilpas' },
  { min: 50, emoji: '😐', label: 'Okay' },
  { min: 75, emoji: '😊', label: 'Glad' },
  { min: 90, emoji: '🤩', label: 'Overlykkelig' },
]

const PET_MESSAGES = {
  'Ked af det': [
    'Jeg har savnet dig… skal vi logge dagen sammen?',
    'Det har været stille herinde. Kom tilbage til mig 💙',
  ],
  'Utilpas': [
    'Jeg kunne godt bruge lidt opmærksomhed i dag.',
    'Hvordan går det? Log dagen, så har jeg det bedre.',
  ],
  'Okay': [
    'Klar til endnu en dag sammen?',
    'Jeg holder øje med din streak!',
  ],
  'Glad': [
    'Du gør det godt — jeg kan mærke det!',
    'Endnu en god dag. Tak fordi du logger 🐾',
  ],
  'Overlykkelig': [
    'Bedste dag nogensinde! Du er fantastisk 🌟',
    'Jeg vokser hurtigt takket være dig!',
  ],
}

function clamp(v, min = 0, max = 100) {
  return Math.max(min, Math.min(max, v))
}

export function daysBetween(dateStrA, dateStrB) {
  const a = new Date(dateStrA + 'T00:00:00')
  const b = new Date(dateStrB + 'T00:00:00')
  return Math.round((b - a) / 86400000)
}

export function getPetStage(totalActivities) {
  let idx = 0
  for (let i = STAGE_THRESHOLDS.length - 1; i >= 0; i--) {
    if (totalActivities >= STAGE_THRESHOLDS[i]) { idx = i; break }
  }
  const nextIdx = idx < STAGE_THRESHOLDS.length - 1 ? idx + 1 : null
  const activitiesToNext = nextIdx !== null ? STAGE_THRESHOLDS[nextIdx] - totalActivities : 0
  const spanStart = STAGE_THRESHOLDS[idx]
  const spanEnd = nextIdx !== null ? STAGE_THRESHOLDS[nextIdx] : spanStart
  const progressPct = nextIdx !== null
    ? Math.min(((totalActivities - spanStart) / (spanEnd - spanStart)) * 100, 100)
    : 100
  return {
    stageIdx: idx,
    stageNum: idx + 1,
    name: STAGE_NAMES[idx],
    nextIdx,
    activitiesToNext,
    progressPct,
  }
}

export function getSpecies(speciesId) {
  return SPECIES.find(s => s.id === speciesId) || SPECIES[0]
}

export function getPetEmoji(speciesId, stageIdx) {
  const species = getSpecies(speciesId)
  return species.stages[Math.min(stageIdx, species.stages.length - 1)]
}

export function applyEngagementGain(pet) {
  return {
    energy: clamp((pet.energy ?? 0) + ENERGY_GAIN_PER_EVENT),
    happiness: clamp((pet.happiness ?? 0) + HAPPINESS_GAIN_PER_EVENT),
  }
}

// Lazily catches up happiness for days missed since the pet was last checked.
// Returns null when today has already been accounted for (idempotent per day).
export function applyHappinessDecay(pet, gamification, todayStr) {
  if (pet.last_happiness_check_date === todayStr) return null
  const lastLog = gamification?.last_log_date
  const missedDays = lastLog ? Math.max(0, daysBetween(lastLog, todayStr) - 1) : 0
  const happiness = missedDays > 0
    ? clamp(pet.happiness - missedDays * HAPPINESS_DECAY_PER_MISSED_DAY)
    : pet.happiness
  return { happiness, last_happiness_check_date: todayStr }
}

export function resolveActivity(pet) {
  if ((pet.energy ?? 0) < ACTIVITY_ENERGY_COST) return null
  const xpReward = ACTIVITY_XP_MIN + Math.floor(Math.random() * (ACTIVITY_XP_MAX - ACTIVITY_XP_MIN + 1))
  return {
    energy: clamp(pet.energy - ACTIVITY_ENERGY_COST),
    happiness: clamp(pet.happiness + ACTIVITY_HAPPINESS_GAIN),
    total_activities: (pet.total_activities || 0) + 1,
    xpReward,
  }
}

export function getPetMood(happiness) {
  let band = MOOD_BANDS[0]
  for (const b of MOOD_BANDS) if (happiness >= b.min) band = b
  return band
}

export function getPetMessage(mood, dateStr) {
  const pool = PET_MESSAGES[mood.label] || PET_MESSAGES['Okay']
  const seed = dateStr.split('').reduce((a, c) => a + c.charCodeAt(0), 0)
  return pool[seed % pool.length]
}
