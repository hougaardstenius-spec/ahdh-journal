export const DAYS = ['Man', 'Tirs', 'Ons', 'Tors', 'Fre', 'Lør', 'Søn']

export const SYMPTOMS = [
  {
    k: 'motivation', l: 'Motivation / Dopamin',
    desc: 'Hvor meget lyst og drive har du i dag? Lav score = svært at komme i gang, alt føles tungt. Høj score = du har energi til at tage fat og gennemføre ting.',
  },
  {
    k: 'overstim', l: 'Overstimulering',
    desc: 'Hvor meget bliver du påvirket af sanseindtryk og krav udefra? Lav score = du håndterer det fint. Høj score = støj, mennesker eller skærmtid føles overvældende.',
  },
  {
    k: 'mental_noise', l: 'Mental støj',
    desc: 'Hvor mange tanker kører rundt i hovedet på dig? Lav score = rolig og fokuseret. Høj score = mange tanker på én gang, svært at lande.',
  },
  {
    k: 'focus', l: 'Fokus',
    desc: 'Hvor let er det at koncentrere sig og blive på en opgave? Lav score = tanker vandrer, svært at sætte i gang. Høj score = du kan holde fokus og arbejde i flow.',
  },
  {
    k: 'energy', l: 'Energi',
    desc: 'Din fysiske og mentale kapacitet i dag. Lav score = du er træt og tom. Høj score = du føler dig udhvilet og klar til at tage fat.',
  },
  {
    k: 'social_energy', l: 'Social energi',
    desc: 'Hvor meget overskud har du til andre mennesker? Lav score = du har brug for at være alene og lade op. Høj score = du nyder kontakt og har energi til sociale situationer.',
  },
]

export const HABITS = [
  { k: 'run', l: 'Cardio' },
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
