import { useState, useEffect } from 'react'

// Awake window: 08:00 → 00:00
const WAKE_START = 8 * 60    // 480 min
const WAKE_END   = 24 * 60   // 1440 min
const WAKE_DUR   = WAKE_END - WAKE_START  // 960 min

// Exact colour stops from the spec
const STOPS = [
  [255, 216, 158],  // 0%   morning gold
  [255, 227, 143],  // 25%  amber
  [255, 149,  89],  // 50%  sunset orange
  [226,  93, 122],  // 75%  twilight purple
  [ 47,  58, 102],  // 100% deep night blue
]

const PHASES = [
  { label: 'MORNING',   start:  8, end: 12, emoji: '🌅' },
  { label: 'MIDDAY',    start: 12, end: 15, emoji: '☀️'  },
  { label: 'AFTERNOON', start: 15, end: 19, emoji: '🌤️' },
  { label: 'EVENING',   start: 19, end: 22, emoji: '🌆' },
  { label: 'BEDTIME',   start: 22, end: 24, emoji: '🌙' },
]

function lerp(a, b, t) { return Math.round(a + (b - a) * t) }

function interpolateColor(p) {
  const n = STOPS.length - 1
  const s = Math.max(0, Math.min(1, p)) * n
  const i = Math.min(Math.floor(s), n - 1)
  const t = s - i
  const [r1, g1, b1] = STOPS[i]
  const [r2, g2, b2] = STOPS[i + 1]
  return `rgb(${lerp(r1,r2,t)},${lerp(g1,g2,t)},${lerp(b1,b2,t)})`
}

function snap(n, d = 1) { return n.toFixed(d) }

function getState() {
  const now   = new Date()
  const mins  = now.getHours() * 60 + now.getMinutes() + now.getSeconds() / 60
  const isSleeping = mins < WAKE_START
  const progress   = Math.max(0, Math.min(1, (mins - WAKE_START) / WAKE_DUR))
  const h          = now.getHours()
  const phase      = isSleeping ? null
    : (PHASES.find(p => h >= p.start && h < p.end) ?? PHASES[PHASES.length - 1])
  const minsLeft   = Math.max(0, WAKE_END - mins)
  const hLeft      = Math.floor(minsLeft / 60)
  const mLeft      = Math.floor(minsLeft % 60)
  const clock      = now.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
  return { progress, isSleeping, phase, hLeft, mLeft, clock }
}

const RING_SIZE  = 176
const TRACK_COL  = '#1e293b'
const INNER_INSET = 15  // ring stroke width

export function DayRing() {
  const [st, setSt] = useState(getState)

  useEffect(() => {
    const id = setInterval(() => setSt(getState()), 1000)
    return () => clearInterval(id)
  }, [])

  const { progress: p, isSleeping, phase, hLeft, mLeft, clock } = st
  const tipColor = interpolateColor(p)

  // Compress colour stops into the filled arc, then hard-stop to track colour
  const [c0, c1, c2, c3, c4] = STOPS.map(s => `rgb(${s.join(',')})`)
  const deg = (frac) => `${snap(frac * 360, 2)}deg`
  const conicGrad = (p <= 0 || isSleeping)
    ? TRACK_COL
    : [
        `conic-gradient(from -90deg`,
        `${c0} 0deg`,
        `${c1} ${deg(p * 0.25)}`,
        `${c2} ${deg(p * 0.50)}`,
        `${c3} ${deg(p * 0.75)}`,
        `${c4} ${deg(p * 1.00)}`,
        `${TRACK_COL} ${deg(p * 1.00)}`,
        `${TRACK_COL} 360deg)`,
      ].join(',')

  const remainingStr = hLeft > 0 ? `${hLeft}h ${mLeft}m` : `${mLeft}m`

  return (
    <div className="flex items-center gap-5 flex-wrap">
      {/* ── Ring ────────────────────────────────────────────────────────── */}
      <div
        className="relative shrink-0"
        style={{ width: RING_SIZE, height: RING_SIZE }}
      >
        {/* Track */}
        <div
          className="absolute inset-0 rounded-full"
          style={{ background: TRACK_COL }}
        />
        {/* Gradient fill */}
        {!isSleeping && p > 0 && (
          <div
            className="absolute inset-0 rounded-full transition-[background] duration-1000"
            style={{ background: conicGrad }}
          />
        )}
        {/* Inner hole */}
        <div
          className="absolute rounded-full bg-slate-900"
          style={{ inset: INNER_INSET }}
        />
        {/* Inner content */}
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center text-center px-2">
          {isSleeping ? (
            <>
              <span className="text-3xl leading-none">😴</span>
              <p className="mt-1 text-[10px] text-slate-500 tracking-wider">SLEEPING</p>
            </>
          ) : (
            <>
              <p
                className="font-mono text-[10px] font-semibold leading-none tracking-wide"
                style={{ color: tipColor }}
              >
                {clock}
              </p>
              <p
                className="mt-1 font-mono text-[22px] font-black leading-none"
                style={{ color: tipColor }}
              >
                {Math.round(p * 100)}%
              </p>
              {phase && (
                <p
                  className="mt-0.5 text-[8px] font-black tracking-[0.2em] leading-none"
                  style={{ color: tipColor, opacity: 0.8 }}
                >
                  {phase.label}
                </p>
              )}
            </>
          )}
        </div>
      </div>

      {/* ── Status line ─────────────────────────────────────────────────── */}
      <div className="flex flex-col gap-1">
        {isSleeping ? (
          <>
            <p className="text-2xl leading-none">😴</p>
            <p className="mt-1 font-semibold text-slate-200">Sleeping</p>
            <p className="text-sm text-slate-500">Wake window starts at 8:00 AM</p>
          </>
        ) : phase ? (
          <>
            <p className="text-2xl leading-none">{phase.emoji}</p>
            <p className="mt-1 font-black tracking-wider" style={{ color: tipColor }}>
              {phase.label}
            </p>
            <p className="text-sm text-slate-400">
              {remainingStr} of awake time remaining
            </p>
          </>
        ) : (
          <>
            <p className="text-2xl leading-none">🌑</p>
            <p className="mt-1 font-bold text-slate-500">PAST MIDNIGHT</p>
            <p className="text-sm text-slate-600">Get some rest</p>
          </>
        )}
      </div>
    </div>
  )
}
