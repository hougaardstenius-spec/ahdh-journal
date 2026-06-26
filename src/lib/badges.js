export const BADGES = [
  // Dagbog
  { id: 'first_log', icon: '📝', name: 'Første skridt', desc: 'Log din første dag', check: (s) => s.total_logs >= 1 },
  { id: 'log_7', icon: '🔥', name: 'Uge 1', desc: '7 dage logget i alt', check: (s) => s.total_logs >= 7 },
  { id: 'log_30', icon: '📅', name: 'En måned', desc: '30 dage logget i alt', check: (s) => s.total_logs >= 30 },
  { id: 'log_100', icon: '💯', name: '100 dage', desc: '100 dage logget i alt', check: (s) => s.total_logs >= 100 },
  { id: 'streak_3', icon: '⚡', name: 'På stribe', desc: '3 dage i træk', check: (s) => s.current_streak >= 3 },
  { id: 'streak_7', icon: '🌟', name: 'En hel uge', desc: '7 dage i træk', check: (s) => s.current_streak >= 7 },
  { id: 'streak_14', icon: '🚀', name: 'To uger', desc: '14 dage i træk', check: (s) => s.current_streak >= 14 },
  { id: 'streak_30', icon: '👑', name: 'En måned i træk', desc: '30 dage i træk', check: (s) => s.current_streak >= 30 },

  // Vaner
  { id: 'all_habits', icon: '✅', name: 'Perfekt dag', desc: 'Alle vaner gennemført på én dag', check: (s) => s.perfect_habit_days >= 1 },
  { id: 'all_habits_5', icon: '🏅', name: 'Vanemester', desc: '5 dage med alle vaner', check: (s) => s.perfect_habit_days >= 5 },
  { id: 'run_10', icon: '👟', name: 'Løber', desc: '10 løbeture logget', check: (s) => s.habit_counts?.run >= 10 },
  { id: 'sleep_10', icon: '😴', name: 'Sovemester', desc: '10 nætter med min. 7 timers søvn', check: (s) => s.habit_counts?.sleep7 >= 10 },
  { id: 'read_10', icon: '📚', name: 'Bogorm', desc: '10 gange læst i en bog', check: (s) => s.habit_counts?.read >= 10 },

  // Træning
  { id: 'first_workout', icon: '🏋️', name: 'Første træning', desc: 'Gennemfør din første træning', check: (s) => s.total_workouts >= 1 },
  { id: 'workout_10', icon: '💪', name: 'Rutine', desc: '10 træninger gennemført', check: (s) => s.total_workouts >= 10 },
  { id: 'workout_50', icon: '🦾', name: 'Dedikeret', desc: '50 træninger gennemført', check: (s) => s.total_workouts >= 50 },
  { id: 'level_2', icon: '🏗️', name: 'Stability', desc: 'Nå level 2 i træning', check: (s) => s.training_level >= 2 },
  { id: 'level_5', icon: '🔥', name: 'Power', desc: 'Nå level 5 i træning', check: (s) => s.training_level >= 5 },
  { id: 'level_10', icon: '👑', name: 'Mastery', desc: 'Nå det endelige level', check: (s) => s.training_level >= 10 },

  // Quests
  { id: 'first_quest', icon: '🎯', name: 'Første quest', desc: 'Gennemfør din første quest', check: (s) => s.completed_quests >= 1 },
  { id: 'quest_5', icon: '⚔️', name: 'Questjæger', desc: '5 quests gennemført', check: (s) => s.completed_quests >= 5 },

  // Refleksion
  { id: 'first_week', icon: '🌿', name: 'Første refleksion', desc: 'Gem din første ugerefleksion', check: (s) => s.total_weekly >= 1 },
  { id: 'weekly_4', icon: '🗓️', name: 'En hel måned', desc: '4 ugerefleksioner gemt', check: (s) => s.total_weekly >= 4 },
]

export function computeUnlocked(stats) {
  return BADGES.filter(b => {
    try { return b.check(stats) } catch { return false }
  }).map(b => b.id)
}
