export const DAILY_FOUNDATION = [
  { name: 'Deep Squat Hold', dose: '1 minut' },
  { name: 'Shoulder CARs', dose: '3 langsomme × hver arm' },
  { name: 'Cat-Cow', dose: '8–10 gentagelser' },
]

export const MOBILITY_LEVELS = [
  {
    level: 1,
    name: 'Basal bevægelighed',
    trait: 'Kom i gang',
    blocks: [
      {
        id: 1, name: 'Hofter & ankler', weeks: '1–2',
        goal: 'Bedre squat og mere eksplosive bevægelser',
        exercises: [
          { name: 'Knee Over Toe Stretch', dose: '45 sek × hvert ben' },
          { name: '90/90 Hip Switches', dose: '5 skift' },
          { name: 'Cossack Squats', dose: '5 × hvert ben' },
          { name: 'Hip Airplanes', dose: '5 × hvert ben' },
        ],
      },
      {
        id: 2, name: 'Rygsøjle & rotation', weeks: '3–4',
        goal: 'Perfekt til padel',
        exercises: [
          { name: "World's Greatest Stretch", dose: '3 × hvert ben' },
          { name: 'Thoracic Rotation', dose: '8 × hver side' },
          { name: 'Jefferson Curl', dose: '5 langsomme gentagelser' },
          { name: 'Thoracic Extension', dose: '8 gentagelser' },
        ],
      },
      {
        id: 3, name: 'Skuldre', weeks: '5–6',
        goal: 'Åbn og stabilisér skulderleddene',
        exercises: [
          { name: 'Wall Slides', dose: '10 gentagelser' },
          { name: 'Band Dislocates', dose: '10 gentagelser' },
          { name: 'Scapular Push-ups', dose: '10 gentagelser' },
          { name: 'Shoulder CARs (ekstra)', dose: '5 × hver arm' },
        ],
      },
      {
        id: 4, name: 'Helkropsbevægelse', weeks: '7–8',
        goal: 'Kroppen arbejder som én enhed',
        exercises: [
          { name: 'Bear Crawl', dose: '20 sek frem' },
          { name: 'Crab Walk', dose: '20 sek til siden' },
          { name: 'Crawling Forward', dose: '20 sek' },
          { name: 'Deep Squat Flow', dose: '5 langsomme gentagelser' },
        ],
      },
    ],
  },
  {
    level: 2,
    name: 'Mere kontrol',
    trait: 'Øg intensiteten',
    blocks: [
      {
        id: 1, name: 'Hofter & ankler — loaded', weeks: '1–2',
        goal: 'Mere belastning, samme mønstre',
        exercises: [
          { name: 'Loaded 90/90', dose: '5 skift med kettlebell' },
          { name: 'Cossack Squat med vægt', dose: '5 × hvert ben' },
          { name: 'Hip Airplanes med vægt', dose: '5 × hvert ben' },
          { name: 'Deep Squat med rotation', dose: '5 gentagelser' },
        ],
      },
      {
        id: 2, name: 'Rygsøjle — dybere', weeks: '3–4',
        goal: 'Mere range of motion',
        exercises: [
          { name: "World's Greatest Stretch — pause", dose: '5 sek hold × 3' },
          { name: 'Thoracic Rotation med stok', dose: '10 × hver side' },
          { name: 'Jefferson Curl — tungere', dose: '5 langsomme' },
          { name: 'Thoracic Extension over foam roller', dose: '10 gentagelser' },
        ],
      },
      {
        id: 3, name: 'Skuldre — loaded', weeks: '5–6',
        goal: 'Aktiv skulderstabilitet',
        exercises: [
          { name: 'Shoulder CARs med let kettlebell', dose: '3 × hver arm' },
          { name: 'Band Dislocates', dose: '12 gentagelser' },
          { name: 'Scapular Push-ups — pause', dose: '10 gentagelser' },
          { name: 'Wall Slides med modstand', dose: '10 gentagelser' },
        ],
      },
      {
        id: 4, name: 'Helkrop — koordination', weeks: '7–8',
        goal: 'Kontrol i bevægelse',
        exercises: [
          { name: 'Bear Crawl — langsomt', dose: '30 sek' },
          { name: 'Crab Walk med pause', dose: '30 sek' },
          { name: 'Crawling med rotation', dose: '20 sek' },
          { name: 'Deep Squat Flow — pause i bund', dose: '5 gentagelser' },
        ],
      },
    ],
  },
  {
    level: 3,
    name: 'Aktiv mobilitet',
    trait: 'Calisthenics begynder',
    blocks: [
      {
        id: 1, name: 'Hofter — aktiv kontrol', weeks: '1–2',
        goal: 'Aktiv range of motion',
        exercises: [
          { name: 'Pancake Stretch', dose: '3 × 30 sek' },
          { name: 'Hip Airplanes — kontrolleret', dose: '8 × hvert ben' },
          { name: 'Deep Squat Flow', dose: '8 gentagelser' },
          { name: 'L-Sit Compression', dose: '5 × 5 sek hold' },
        ],
      },
      {
        id: 2, name: 'Bridge progression', weeks: '3–4',
        goal: 'Ryg og skulder åbning',
        exercises: [
          { name: 'Bridge Hold', dose: '3 × 30 sek' },
          { name: 'Jefferson Curl', dose: '5 langsomme' },
          { name: 'Thoracic Rotation', dose: '10 × hver side' },
          { name: 'German Hang forberedelse', dose: '3 × 10 sek' },
        ],
      },
      {
        id: 3, name: 'Skuldre — avanceret', weeks: '5–6',
        goal: 'Skulder og thorax integration',
        exercises: [
          { name: 'Hanging Shrugs', dose: '3 × 10' },
          { name: 'Skin the Cat (modificeret)', dose: '3 gentagelser' },
          { name: 'Shoulder CARs med kettlebell', dose: '5 × hver arm' },
          { name: 'Scapular Push-ups — langsomme', dose: '10 gentagelser' },
        ],
      },
      {
        id: 4, name: 'Helkrop — flow', weeks: '7–8',
        goal: 'Flydende bevægelse',
        exercises: [
          { name: 'Bear Crawl + rotation', dose: '30 sek' },
          { name: 'Crab Walk + hip bridge', dose: '30 sek' },
          { name: 'Deep Squat Flow', dose: '8 gentagelser' },
          { name: 'L-Sit Hold', dose: '3 × 10 sek' },
        ],
      },
    ],
  },
]

// Extend to 10 levels with trait names
export const MOBILITY_LEVEL_TRAITS = [
  'Basal bevægelighed',
  'Mere kontrol',
  'Aktiv mobilitet',
  'Balance',
  'Rotation',
  'Fascia & elasticitet',
  'Loaded Mobility',
  'Calisthenics Mobility',
  'Atletisk mobilitet',
  'Vedligeholdelse & fri kombination',
]

export const BONUS_CHALLENGES = [
  { name: 'Squat Hold', desc: '60 sekunders deep squat hold', icon: '🏋️' },
  { name: 'Balanceøvelse', desc: '30 sekunders balance på ét ben — hvert ben', icon: '🦩' },
  { name: 'Næsevejrtrækning', desc: '2 minutters kontrolleret næsevejrtrækning', icon: '🧘' },
  { name: 'Plankevarianter', desc: '30 sek plank + 30 sek sideplank hver side', icon: '💪' },
  { name: 'Wrist CARs', desc: '5 langsomme rotationer × hvert håndled', icon: '🤲' },
  { name: 'Neck CARs', desc: '3 langsomme rotationer hver retning', icon: '🔄' },
  { name: 'Ankle CARs', desc: '8 langsomme rotationer × hver fod', icon: '🦶' },
]

export function getCurrentMobilityBlock(mobilityState) {
  const levelIdx = Math.min((mobilityState.currentLevel || 1) - 1, MOBILITY_LEVELS.length - 1)
  const level = MOBILITY_LEVELS[levelIdx] || MOBILITY_LEVELS[MOBILITY_LEVELS.length - 1]
  const blockIdx = mobilityState.currentBlockIdx || 0
  const block = level.blocks[blockIdx % level.blocks.length]
  return { level, block, blockIdx }
}

export function getTodayBonus(mobilityState) {
  const idx = (mobilityState.totalSessions || 0) % BONUS_CHALLENGES.length
  return BONUS_CHALLENGES[idx]
}
