import { useEffect, useRef, useState } from 'react'

// Animates from 0 up to `value` once `active` becomes true.
// Purely decorative/comprehension aid — no topic knowledge required.
export default function CountUp({ value, active, duration = 1400 }) {
  const [display, setDisplay] = useState(0)
  const rafRef = useRef(null)
  const startedRef = useRef(false)

  useEffect(() => {
    if (!active || startedRef.current) return
    startedRef.current = true
    const start = performance.now()

    function tick(now) {
      const progress = Math.min((now - start) / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 3) // ease-out cubic
      setDisplay(Math.round(value * eased))
      if (progress < 1) rafRef.current = requestAnimationFrame(tick)
    }
    rafRef.current = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(rafRef.current)
  }, [active, value, duration])

  return <span>{display.toLocaleString()}</span>
}
