export const LEVELS = [
  {
    level: 1,
    name: 'Foundations',
    trait: 'Move Better',
    focus: 'Teknik. Ingen tunge vægte.',
    programs: [
      { id: 'A', exercises: ['Goblet Squat', 'Halo', 'Suitcase Carry'] },
      { id: 'B', exercises: ['Swing', 'Single-arm Row', 'Around the World'] },
      { id: 'C', exercises: ['Strict Press', 'Single-leg RDL', 'Bottom-up Carry'] },
      { id: 'D', exercises: ['Turkish Get-Up', 'Windmill', 'Goblet Squat'] },
    ],
  },
  {
    level: 2,
    name: 'Stability',
    trait: 'Build Stability',
    focus: 'Kroppen arbejder mere ensidigt.',
    programs: [
      { id: 'A', exercises: ['Swing', 'Half-kneeling Press', 'Suitcase Carry'] },
      { id: 'B', exercises: ['Cossack Squat', 'Gorilla Row', 'Halo'] },
      { id: 'C', exercises: ['Clean', 'Bottom-up Carry', 'Windmill'] },
      { id: 'D', exercises: ['Turkish Get-Up', 'Single-leg RDL', 'Around the World'] },
    ],
  },
  {
    level: 3,
    name: 'Strength',
    trait: 'Get Strong',
    focus: 'Nu må der godt blive tungt.',
    programs: [
      { id: 'A', exercises: ['Front Squat', 'Strict Press', 'Suitcase Carry'] },
      { id: 'B', exercises: ['Clean', 'Row', 'Bottom-up Carry'] },
      { id: 'C', exercises: ['Swing', 'Push Press', 'Halo'] },
      { id: 'D', exercises: ['Turkish Get-Up', 'Windmill', 'Single-leg RDL'] },
    ],
  },
  {
    level: 4,
    name: 'Athletic',
    trait: 'Move Fast',
    focus: 'Nu begynder tempo.',
    programs: [
      { id: 'A', exercises: ['Swing', 'Push Press', 'Overhead Carry'] },
      { id: 'B', exercises: ['Clean', 'Cossack Squat', 'Around the World'] },
      { id: 'C', exercises: ['Snatch', 'Gorilla Row', 'Bottom-up Carry'] },
      { id: 'D', exercises: ['Turkish Get-Up', 'Windmill', 'Halo'] },
    ],
  },
  {
    level: 5,
    name: 'Power',
    trait: 'Generate Power',
    focus: 'Eksplosivitet.',
    programs: [
      { id: 'A', exercises: ['Snatch', 'Front Squat', 'Suitcase Carry'] },
      { id: 'B', exercises: ['Swing', 'Push Press', 'Bottom-up Carry'] },
      { id: 'C', exercises: ['Clean', 'Renegade Row', 'Halo'] },
      { id: 'D', exercises: ['Turkish Get-Up', 'Overhead Carry', 'Single-leg RDL'] },
    ],
  },
  {
    level: 6,
    name: 'Rotational Athlete',
    trait: 'Rotate Better',
    focus: 'Specielt til padel.',
    programs: [
      { id: 'A', exercises: ['Windmill', 'Cossack Squat', 'Around the World'] },
      { id: 'B', exercises: ['Half-kneeling Press', 'Bottom-up Carry', 'Swing'] },
      { id: 'C', exercises: ['Single-leg RDL', 'Gorilla Row', 'Halo'] },
      { id: 'D', exercises: ['Turkish Get-Up', 'Overhead Carry', 'Clean'] },
    ],
  },
  {
    level: 7,
    name: 'Hybrid Strength',
    trait: 'Athletic Strength',
    focus: 'Nu blandes det hele.',
    programs: [
      { id: 'A', exercises: ['Clean', 'Front Squat', 'Push Press'] },
      { id: 'B', exercises: ['Swing', 'Renegade Row', 'Bottom-up Carry'] },
      { id: 'C', exercises: ['Cossack Squat', 'Halo', 'Suitcase Carry'] },
      { id: 'D', exercises: ['Turkish Get-Up', 'Windmill', 'Gorilla Row'] },
    ],
  },
  {
    level: 8,
    name: 'Endurance',
    trait: 'Work Capacity',
    focus: 'Længere sæt. Mere puls. Mindre vægt.',
    programs: [
      { id: 'A', exercises: ['Swing', 'Goblet Squat', 'Carry'] },
      { id: 'B', exercises: ['Clean', 'Press', 'Halo'] },
      { id: 'C', exercises: ['Snatch', 'Row', 'Around the World'] },
      { id: 'D', exercises: ['Turkish Get-Up', 'Windmill', 'Bottom-up Carry'] },
    ],
  },
  {
    level: 9,
    name: 'Performance',
    trait: 'Performance',
    focus: 'Komplekser — øvelserne kobles sammen.',
    programs: [
      { id: 'A', exercises: ['Clean', 'Front Squat', 'Press'], complex: true },
      { id: 'B', exercises: ['Swing', 'Snatch', 'Overhead Carry'], complex: true },
      { id: 'C', exercises: ['Goblet Squat', 'Row', 'Halo'], complex: true },
      { id: 'D', exercises: ['Turkish Get-Up', 'Windmill', 'Suitcase Carry'], complex: true },
    ],
  },
  {
    level: 10,
    name: 'Mastery',
    trait: 'Mastery',
    focus: 'Alt du har lært. Kun bedre udførelse.',
    programs: [
      { id: 'A', exercises: ['Turkish Get-Up', 'Snatch', 'Windmill'] },
      { id: 'B', exercises: ['Clean', 'Front Squat', 'Push Press'] },
      { id: 'C', exercises: ['Swing', 'Renegade Row', 'Around the World'] },
      { id: 'D', exercises: ['Cossack Squat', 'Gorilla Row', 'Bottom-up Carry'] },
    ],
  },
]

export const QUESTS = [
  {
    id: 'grip',
    name: 'Grip Quest',
    description: '10 minutters carries på én uge',
    icon: '🤜',
    unit: 'min',
    target: 10,
    trackKey: 'carry_minutes',
    exercises: ['Suitcase Carry', 'Overhead Carry', 'Bottom-up Carry', 'Carry'],
  },
  {
    id: 'mobility',
    name: 'Mobility Quest',
    description: '50 halos + 20 windmills på én uge',
    icon: '🌀',
    unit: 'reps',
    target: 70,
    trackKey: 'mobility_reps',
    exercises: ['Halo', 'Windmill'],
  },
  {
    id: 'power',
    name: 'Power Quest',
    description: '300 swings på én uge',
    icon: '⚡',
    unit: 'reps',
    target: 300,
    trackKey: 'swing_reps',
    exercises: ['Swing'],
  },
  {
    id: 'balance',
    name: 'Balance Quest',
    description: '100 single-leg RDL reps på én uge',
    icon: '🦩',
    unit: 'reps',
    target: 100,
    trackKey: 'rdl_reps',
    exercises: ['Single-leg RDL'],
  },
]

export const LEVEL_ICONS = ['🌱','🏗️','💪','⚡','🔥','🌪️','🏋️','🫁','🎯','👑']

export function getCurrentProgram(trainingState) {
  const levelIdx = (trainingState.currentLevel || 1) - 1
  const programIdx = trainingState.currentProgramIdx || 0
  const level = LEVELS[Math.min(levelIdx, LEVELS.length - 1)]
  const program = level.programs[programIdx % level.programs.length]
  return { level, program, levelIdx, programIdx }
}

export function getSetsReps(levelNum, exercise) {
  const sets = levelNum <= 2 ? 3 : levelNum <= 5 ? 3 : levelNum <= 8 ? 4 : 4
  const reps = exercise.includes('Carry') ? '30 sek' :
    exercise === 'Turkish Get-Up' ? '2 per side' :
    exercise === 'Windmill' ? '5 per side' :
    exercise === 'Halo' ? '5 per side' :
    exercise.includes('Single') || exercise.includes('Half') ? '8 per side' :
    levelNum <= 2 ? '10' : levelNum <= 5 ? '8' : levelNum <= 8 ? '10' : '8'
  return `${sets} × ${reps}`
}
