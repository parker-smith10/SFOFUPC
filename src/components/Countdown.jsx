import { useEffect, useState } from 'react'

function getParts(msRemaining) {
  const clamped = Math.max(0, msRemaining)
  const totalSeconds = Math.floor(clamped / 1000)
  const days = Math.floor(totalSeconds / 86400)
  const hours = Math.floor((totalSeconds % 86400) / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const seconds = totalSeconds % 60
  return { days, hours, minutes, seconds }
}

export default function Countdown({ lockAt, onLock }) {
  const target = new Date(lockAt).getTime()
  const [now, setNow] = useState(Date.now())
  const locked = now >= target

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(id)
  }, [])

  useEffect(() => {
    if (locked) onLock?.()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [locked])

  if (locked) {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-md bg-osu-black px-3 py-1 text-xs font-bold uppercase tracking-wide text-osu-paper">
        Locked
      </span>
    )
  }

  const { days, hours, minutes, seconds } = getParts(target - now)
  const urgent = target - now < 3600 * 1000 * 3

  return (
    <div
      className={`inline-flex items-center gap-2 rounded-md px-3 py-1 text-xs font-bold uppercase tracking-wide ${
        urgent ? 'bg-osu-orange text-white animate-pulse' : 'bg-osu-black/90 text-osu-paper'
      }`}
    >
      <span>Locks in</span>
      <span className="font-display tabular-nums tracking-normal">
        {days > 0 ? `${days}d ` : ''}
        {String(hours).padStart(2, '0')}:{String(minutes).padStart(2, '0')}:
        {String(seconds).padStart(2, '0')}
      </span>
    </div>
  )
}
