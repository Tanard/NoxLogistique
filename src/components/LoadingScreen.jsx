import { useState, useEffect } from 'react'

export function LoadingScreen({ onDone }) {
  const [filledSquares, setFilledSquares] = useState([])
  const [fadeOut, setFadeOut] = useState(false)

  useEffect(() => {
    const interval = 1300 / 10
    const timeouts = []
    for (let i = 0; i < 10; i++) {
      const t = setTimeout(() => setFilledSquares(prev => [...prev, i]), (i + 1) * interval)
      timeouts.push(t)
    }
    return () => timeouts.forEach(clearTimeout)
  }, [])

  useEffect(() => {
    if (filledSquares.length >= 10) {
      const t = setTimeout(() => setFadeOut(true), 300)
      return () => clearTimeout(t)
    }
  }, [filledSquares])

  useEffect(() => {
    if (fadeOut) {
      const t = setTimeout(onDone, 500)
      return () => clearTimeout(t)
    }
  }, [fadeOut, onDone])

  return (
    <div
      className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-white transition-opacity duration-500"
      style={{ opacity: fadeOut ? 0 : 1 }}
    >
      <div style={{ display: 'flex', gap: '6px' }}>
        {Array.from({ length: 10 }).map((_, i) => (
          <div
            key={i}
            style={{
              width: '28px',
              height: '28px',
              backgroundColor: filledSquares.includes(i) ? 'var(--color-accent)' : '#E5E5E5',
              border: '2px solid var(--color-app-text)',
              transition: 'background-color 0.1s',
            }}
          />
        ))}
      </div>
      <p style={{
        marginTop: '20px',
        color: 'var(--color-app-text)',
        fontSize: '13px',
        fontFamily: "'Courier New', monospace",
        letterSpacing: '4px',
        textTransform: 'uppercase',
        fontWeight: 'bold',
      }}>
        En chargement
      </p>
    </div>
  )
}
