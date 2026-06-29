export const DAYS = ['Man', 'Tirs', 'Ons', 'Tors', 'Fre', 'Lør', 'Søn']

export const SYMPTOMS = [
  { k: 'motivation', l: 'Motivation / Dopamin' },
  { k: 'overstim', l: 'Overstimulering' },
  { k: 'mental_noise', l: 'Mental støj' },
  { k: 'focus', l: 'Fokus' },
  { k: 'energy', l: 'Energi' },
  { k: 'social_energy', l: 'Social energi' },
]

export const HABITS = [
  { k: 'run', l: 'Løbe en tur' },
  { k: 'strength', l: 'Styrketræne' },
  { k: 'yoga', l: 'Mobilitet' },
  { k: 'fasting', l: '16/8 faste' },
  { k: 'sleep7', l: 'Sov min. 7 timer' },
  { k: 'read', l: 'Læse i en bog' },
]

export const PATTERNS = [
  { k: 'sleep_impact', l: 'Søvn påvirker mig mere end jeg troede' },
  { k: 'exercise_helps', l: 'Motion hjælper tydeligt' },
  { k: 'social_drains', l: 'Sociale aktiviteter dræner mig' },
  { k: 'social_energizes', l: 'Sociale aktiviteter giver mig energi' },
  { k: 'hyperfocus_backlash', l: 'Hyperfokus giver bagslag dagen efter' },
  { k: 'fasting_helps', l: 'Faste hjælper mit fokus' },
  { k: 'fasting_no_help', l: 'Faste hjælper ikke mit fokus' },
]

export const TREND_COLORS = [
  '#2a78d6', '#1baf7a', '#eda100', '#4a3aa7', '#e34948', '#e87ba4',
]

export function getMondayOfWeek(offset = 0) {
  const d = new Date()
  const day = d.getDay()
  const diff = day === 0 ? -6 : 1 - day
  d.setDate(d.getDate() + diff + offset * 7)
  d.setHours(0, 0, 0, 0)
  return d
}

export function formatWeekRange(offset = 0) {
  const mon = getMondayOfWeek(offset)
  const sun = new Date(mon)
  sun.setDate(sun.getDate() + 6)
  const opts = { day: 'numeric', month: 'short' }
  return `${mon.toLocaleDateString('da-DK', opts)} – ${sun.toLocaleDateString('da-DK', opts)}`
}

export function dayDateKey(weekOffset, dayIdx) {
  const mon = getMondayOfWeek(weekOffset)
  const d = new Date(mon)
  d.setDate(d.getDate() + dayIdx)
  return d.toISOString().slice(0, 10)
}
