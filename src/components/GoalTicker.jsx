import { useState, useEffect, useRef } from 'react'

export function GoalTicker({ priorities }) {
  const filled  = (priorities || []).filter(p => p.text?.trim())
  const pending = filled.filter(p => !p.done)
  const doneCount = filled.length - pending.length
  const allDone = filled.length > 0 && pending.length === 0
  const empty   = filled.length === 0

  const [idx, setIdx]         = useState(0)
  const [animKey, setAnimKey] = useState(0)
  const pendingRef = useRef(pending)

  // Reset index when the pending list length changes
  useEffect(() => {
    pendingRef.current = pending
    setIdx(0)
    setAnimKey(k => k + 1)
  }, [pending.length, allDone]) // eslint-disable-line react-hooks/exhaustive-deps

  // Cycle every 5 s when there are multiple pending items
  useEffect(() => {
    if (pending.length <= 1) return
    const id = setInterval(() => {
      setIdx(i => (i + 1) % pendingRef.current.length)
      setAnimKey(k => k + 1)
    }, 5000)
    return () => clearInterval(id)
  }, [pending.length])

  const current = pending[idx % Math.max(1, pending.length)]

  return (
    <div className="flex items-center gap-2 rounded-lg border border-slate-700/60 bg-slate-800/80 px-3 py-1.5 overflow-hidden h-8">
      {/* Pulsing LED */}
      <div className="relative flex shrink-0 h-2 w-2 items-center justify-center">
        <div
          className={`h-2 w-2 rounded-full ${allDone ? 'bg-green-500' : 'bg-green-400'}`}
        />
        {!allDone && !empty && (
          <div className="absolute inset-0 rounded-full bg-green-400 animate-ping opacity-60" />
        )}
      </div>

      {/* "GOALS" label */}
      <span className="shrink-0 font-mono text-[9px] font-black tracking-[0.18em] text-slate-500">
        GOALS
      </span>

      {/* Divider */}
      <span className="shrink-0 text-slate-700 text-xs select-none">│</span>

      {/* Scrolling text */}
      <div className="relative flex-1 overflow-hidden h-full flex items-center">
        {empty ? (
          <p className="font-mono text-[11px] text-slate-600 truncate">
            No priorities set today
          </p>
        ) : allDone ? (
          <p className="font-mono text-[11px] text-green-400 truncate">
            ✓ All goals done — solid day.
          </p>
        ) : current ? (
          <p
            key={animKey}
            className="ticker-slide-up font-mono text-[11px] text-slate-200 truncate w-full"
          >
            {current.text}
          </p>
        ) : null}
      </div>

      {/* Done / total pill */}
      {!empty && (
        <span
          className={`shrink-0 rounded-full px-2 py-px text-[9px] font-bold tabular-nums ${
            allDone
              ? 'bg-green-900/60 text-green-400'
              : 'bg-slate-700 text-slate-400'
          }`}
        >
          {doneCount}/{filled.length}
        </span>
      )}
    </div>
  )
}
