import { useEffect, useRef } from 'react'
import './Confetti.css'

const COLORS = ['#378ADD', '#27ae60', '#eda100', '#e34948', '#9b59b6', '#e87ba4']
const EMOJIS = ['⭐', '🎉', '✨', '🔥', '💎', '🏆']

export default function Confetti({ active, onDone }) {
  const ref = useRef(null)

  useEffect(() => {
    if (!active || !ref.current) return
    const container = ref.current
    container.innerHTML = ''

    const pieces = []
    for (let i = 0; i < 60; i++) {
      const el = document.createElement('div')
      const isEmoji = Math.random() > 0.7
      el.className = 'confetti-piece'
      if (isEmoji) {
        el.textContent = EMOJIS[Math.floor(Math.random() * EMOJIS.length)]
        el.style.fontSize = `${Math.random() * 14 + 12}px`
      } else {
        el.style.background = COLORS[Math.floor(Math.random() * COLORS.length)]
        el.style.width = `${Math.random() * 8 + 6}px`
        el.style.height = `${Math.random() * 8 + 6}px`
        el.style.borderRadius = Math.random() > 0.5 ? '50%' : '2px'
      }
      el.style.left = `${Math.random() * 100}%`
      el.style.animationDelay = `${Math.random() * 0.5}s`
      el.style.animationDuration = `${Math.random() * 1 + 1.5}s`
      container.appendChild(el)
      pieces.push(el)
    }

    const timer = setTimeout(() => {
      container.innerHTML = ''
      onDone?.()
    }, 3000)

    return () => { clearTimeout(timer); container.innerHTML = '' }
  }, [active])

  return <div ref={ref} className="confetti-container" aria-hidden="true" />
}
