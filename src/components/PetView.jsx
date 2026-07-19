import { useState, useEffect } from 'react'
import {
  SPECIES, STAGE_NAMES, STAGE_THRESHOLDS, ACTIVITY_ENERGY_COST,
  getPetStage, getPetEmoji, getSpecies, getPetMood, getPetMessage,
} from '../lib/pet'
import { getExistingSubscription, subscribeToPush } from '../lib/push'
import './PetView.css'

function NotificationOptIn({ user }) {
  const supported = typeof window !== 'undefined' && 'serviceWorker' in navigator && 'PushManager' in window
  const [subscribed, setSubscribed] = useState(null) // null = tjekker endnu
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!supported) { setSubscribed(false); return }
    getExistingSubscription().then(sub => setSubscribed(!!sub)).catch(() => setSubscribed(false))
  }, [supported])

  async function handleEnable() {
    setBusy(true)
    setError(null)
    try {
      const sub = await subscribeToPush(user.id)
      setSubscribed(!!sub)
      if (!sub) setError('Du skal give tilladelse i browseren for at få notifikationer.')
    } catch {
      setError('Kunne ikke aktivere notifikationer i denne browser.')
    }
    setBusy(false)
  }

  if (!supported) return null

  return (
    <div className="pet-notify-block">
      {subscribed ? (
        <div className="pet-notify-on">🔔 Notifikationer aktiveret</div>
      ) : (
        <button className="pet-notify-btn" onClick={handleEnable} disabled={busy || subscribed === null}>
          {busy ? 'Aktiverer…' : '🔔 Aktivér notifikationer'}
        </button>
      )}
      {error && <div className="pet-notify-error">{error}</div>}
    </div>
  )
}

function Onboarding({ onSetupPet }) {
  const [speciesId, setSpeciesId] = useState(SPECIES[0].id)
  const [name, setName] = useState('')
  const [saving, setSaving] = useState(false)

  async function handleAdopt() {
    if (!name.trim()) return
    setSaving(true)
    await onSetupPet(speciesId, name.trim())
    setSaving(false)
  }

  return (
    <div className="pet-onboard">
      <div className="pet-onboard-egg">🥚</div>
      <div className="pet-onboard-title">Få dit eget kæledyr</div>
      <div className="pet-onboard-sub">
        Det vokser og trives, når du passer dig selv — log dagen, spin dagens hjul,
        og tag det med på ture.
      </div>

      <div className="pet-onboard-label">Vælg art</div>
      <div className="pet-species-grid">
        {SPECIES.map(s => (
          <div
            key={s.id}
            className={`pet-species-opt ${speciesId === s.id ? 'selected' : ''}`}
            onClick={() => setSpeciesId(s.id)}
          >
            <div className="pet-species-emoji">{s.stages[1]}</div>
            <div className="pet-species-name">{s.name}</div>
          </div>
        ))}
      </div>

      <div className="pet-onboard-label">Navngiv dit kæledyr</div>
      <input
        className="pet-name-input"
        value={name}
        onChange={e => setName(e.target.value)}
        placeholder="F.eks. Nisse…"
        maxLength={20}
      />

      <button className="pet-adopt-btn" onClick={handleAdopt} disabled={saving || !name.trim()}>
        {saving ? 'Klækker…' : '🥚 Klæk dit kæledyr'}
      </button>
    </div>
  )
}

export default function PetView({ user, pet, onSetupPet, onClaimActivity, today }) {
  const [claiming, setClaiming] = useState(false)
  const [result, setResult] = useState(null)

  if (!pet) return <Onboarding onSetupPet={onSetupPet} />

  const species = getSpecies(pet.species)
  const stage = getPetStage(pet.total_activities || 0)
  const emoji = getPetEmoji(pet.species, stage.stageIdx)
  const mood = getPetMood(pet.happiness)
  const message = getPetMessage(mood, today)
  const canClaim = pet.energy >= ACTIVITY_ENERGY_COST

  async function handleClaim() {
    if (!canClaim || claiming) return
    setClaiming(true)
    const r = await onClaimActivity()
    setClaiming(false)
    if (r) {
      setResult(r)
      setTimeout(() => setResult(null), 3500)
    }
  }

  return (
    <div className="pet-wrap">
      <div className="pet-hero">
        <div className={`pet-hero-emoji ${claiming ? 'bouncing' : ''}`}>{emoji}</div>
        <div className="pet-hero-name">{pet.name}</div>
        <div className="pet-hero-species">{species.name} · {stage.name}</div>
        <div className="pet-mood-row">
          <span className="pet-mood-emoji">{mood.emoji}</span>
          <span className="pet-mood-msg">{message}</span>
        </div>
      </div>

      <NotificationOptIn user={user} />

      <div className="pet-stat-block">
        <div className="pet-stat-row">
          <span className="pet-stat-label">⚡ Energi</span>
          <span className="pet-stat-val">{pet.energy}/100</span>
        </div>
        <div className="pet-stat-track"><div className="pet-stat-fill energy" style={{ width: `${pet.energy}%` }} /></div>
        <div className="pet-stat-hint">Flere vaner krydset af når du logger dagen = mere energi</div>
      </div>

      <div className="pet-stat-block">
        <div className="pet-stat-row">
          <span className="pet-stat-label">💗 Lykke</span>
          <span className="pet-stat-val">{pet.happiness}/100</span>
        </div>
        <div className="pet-stat-track"><div className="pet-stat-fill happiness" style={{ width: `${pet.happiness}%` }} /></div>
      </div>

      <div className="pet-stat-block">
        <div className="pet-stat-row">
          <span className="pet-stat-label">{stage.name}</span>
          <span className="pet-stat-val">
            {stage.nextIdx !== null ? `${stage.activitiesToNext} ture til næste stadie` : 'Fuldt udvokset 👑'}
          </span>
        </div>
        <div className="pet-stat-track"><div className="pet-stat-fill stage" style={{ width: `${stage.progressPct}%` }} /></div>
      </div>

      {result ? (
        <div className="pet-activity-result">
          <span className="pet-activity-result-icon">🎁</span>
          <div>
            <div className="pet-activity-result-title">{pet.name} kom glad hjem fra turen!</div>
            <div className="pet-activity-result-xp">+{result.xpReward} XP</div>
          </div>
        </div>
      ) : (
        <button className="pet-activity-btn" onClick={handleClaim} disabled={!canClaim || claiming}>
          {claiming ? 'På tur…' : canClaim ? `🚶 Send på tur (−${ACTIVITY_ENERGY_COST} energi)` : `Kræver ${ACTIVITY_ENERGY_COST} energi`}
        </button>
      )}

      <div className="pet-section-label">Udvikling</div>
      <div className="pet-evolution-gallery">
        {species.stages.map((stageEmoji, i) => {
          const unlocked = i <= stage.stageIdx
          return (
            <div key={i} className={`pet-evo-item ${unlocked ? 'unlocked' : ''}`}>
              <div className="pet-evo-emoji">{unlocked ? stageEmoji : '🔒'}</div>
              <div className="pet-evo-name">{STAGE_NAMES[i]}</div>
              {!unlocked && <div className="pet-evo-req">{STAGE_THRESHOLDS[i]} ture</div>}
            </div>
          )
        })}
      </div>
    </div>
  )
}
