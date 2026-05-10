import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Heart, Zap, Moon, Activity, Settings, RefreshCw,
  CheckSquare, Square, ChevronRight,
} from 'lucide-react'
import { useFirestore } from '../hooks/useFirestore'
import { useWhoop } from '../hooks/useWhoop'
import { Card, SectionHeader } from '../components/Card'
import { Modal, Field, inputCls, btnPrimary } from '../components/Modal'
import { DayRing } from '../components/DayRing'
import { GoalTicker } from '../components/GoalTicker'
import { uid, today } from '../utils/export'

// ── Constants ──────────────────────────────────────────────────────────────

const DAYS   = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday']
const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December']

function todayLabel() {
  const d = new Date()
  return `${DAYS[d.getDay()]}, ${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`
}

// Use 6 AM as day boundary for streak counting
function streakDay() {
  const n = new Date()
  if (n.getHours() < 6) n.setDate(n.getDate() - 1)
  return n.toISOString().slice(0, 10)
}

function calcStreak(completedDays = {}) {
  let count = 0
  const n = new Date()
  if (n.getHours() < 6) n.setDate(n.getDate() - 1)
  // Walk back day-by-day
  const d = new Date(n.toISOString().slice(0, 10) + 'T00:00:00')
  while ((completedDays || {})[d.toISOString().slice(0, 10)]) {
    count++
    d.setDate(d.getDate() - 1)
  }
  return count
}

function recoveryColor(score) {
  if (score >= 67) return 'text-green-400'
  if (score >= 34) return 'text-yellow-400'
  return 'text-red-400'
}

// ── Defaults ───────────────────────────────────────────────────────────────

const INIT_HOME   = { priorities: [], focus: '', completedDays: {} }
const INIT_GOALS  = { goals: [] }
const INIT_THESIS = { tasks: [] }
const INIT_SJOM   = { priorities: [] }
const INIT_HEALTH = { habits: [] }

// ── Component ──────────────────────────────────────────────────────────────

export function Home() {
  const [home, setHome]     = useFirestore('home', INIT_HOME)
  const [goals]             = useFirestore('goals', INIT_GOALS)
  const [thesis]            = useFirestore('thesis', INIT_THESIS)
  const [sjom]              = useFirestore('sjomatradet', INIT_SJOM)
  const [health]            = useFirestore('health', INIT_HEALTH)
  const { isConnected, login, disconnect, cache, refreshData, clientId, setClientId, clientSecret, setClientSecret } = useWhoop()
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [tempClientId, setTempClientId] = useState('')
  const [tempClientSecret, setTempClientSecret] = useState('')
  const [whoopLoading, setWhoopLoading] = useState(false)

  // Fetch Whoop data on mount if connected
  useEffect(() => {
    if (isConnected) {
      setWhoopLoading(true)
      refreshData().finally(() => setWhoopLoading(false))
    }
  }, [isConnected]) // eslint-disable-line react-hooks/exhaustive-deps

  const todayStr = today()
  const todayRecovery = cache?.recovery?.[0] ?? null
  const todayCycle = cache?.cycles?.[0] ?? null

  // ── Priorities ────────────────────────────────────────────────────────────

  const priorities = home.priorities.length
    ? home.priorities
    : [
        { id: uid(), text: '', done: false },
        { id: uid(), text: '', done: false },
        { id: uid(), text: '', done: false },
      ]

  const ensurePriorities = () => {
    if (home.priorities.length === 0) {
      setHome(h => ({
        ...h,
        priorities: [
          { id: uid(), text: '', done: false },
          { id: uid(), text: '', done: false },
          { id: uid(), text: '', done: false },
        ],
      }))
    }
  }

  const setPriority = (id, text) =>
    setHome(h => ({
      ...h,
      priorities: h.priorities.map(p => p.id === id ? { ...p, text } : p),
    }))

  // Toggle a priority and update streak if all now done
  const togglePriority = (id) => {
    const updated = priorities.map(p => p.id === id ? { ...p, done: !p.done } : p)
    const filled  = updated.filter(p => p.text?.trim())
    const allDone = filled.length > 0 && filled.every(p => p.done)
    const day     = streakDay()
    setHome(h => ({
      ...h,
      priorities: updated,
      completedDays: allDone && !(h.completedDays || {})[day]
        ? { ...(h.completedDays || {}), [day]: true }
        : h.completedDays || {},
    }))
  }

  // ── Streak ────────────────────────────────────────────────────────────────

  const streak = calcStreak(home.completedDays)

  // ── Task summary counts ───────────────────────────────────────────────────

  const openGoalTasks   = (goals.goals   || []).reduce((acc, g) => acc + (g.subtasks || []).filter(s => !s.done).length, 0)
  const openThesisTasks = (thesis.tasks  || []).filter(t => !t.done).length
  const openSjomItems   = (sjom.priorities || []).filter(p => !p.done).length
  const todayHabits     = health.habits  || []
  const doneHabits      = todayHabits.filter(h => (h.entries || {})[todayStr]).length

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div>
      {/* ── Header row ─────────────────────────────────────────────────── */}
      <div className="mb-2 flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-medium uppercase tracking-widest text-slate-500">Today</p>
          <h1 className="text-2xl font-bold text-slate-100 leading-tight">{todayLabel()}</h1>
        </div>
        {/* Streak pill */}
        {streak > 0 && (
          <div className="mt-1 flex items-center gap-1.5 rounded-full bg-amber-900/40 border border-amber-700/40 px-3 py-1 shrink-0">
            <span className="text-sm">⚡</span>
            <span className="text-sm font-bold text-amber-400">{streak}</span>
            <span className="text-xs text-amber-600 font-medium">
              {streak === 1 ? 'day' : 'days'}
            </span>
          </div>
        )}
      </div>

      {/* ── Goal Ticker ─────────────────────────────────────────────────── */}
      <div className="mb-5">
        <GoalTicker priorities={priorities} />
      </div>

      {/* ── Main grid ──────────────────────────────────────────────────── */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">

        {/* Day Ring — spans 2 cols on large screens */}
        <Card className="lg:col-span-2">
          <DayRing />
        </Card>

        {/* Quick task summary */}
        <Card>
          <p className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-300">
            Open Items
          </p>
          <div className="space-y-1">
            <SummaryRow label="Goal sub-tasks"  count={openGoalTasks}   to="/goals"         />
            <SummaryRow label="Thesis tasks"    count={openThesisTasks} to="/thesis"        />
            <SummaryRow label="Work priorities" count={openSjomItems}   to="/sjomatradet"   />
            <SummaryRow
              label={`Habits (${doneHabits}/${todayHabits.length})`}
              count={todayHabits.length - doneHabits}
              to="/health"
            />
          </div>
        </Card>

        {/* Whoop Recovery Widget — spans 2 cols */}
        <Card className="lg:col-span-2">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-semibold uppercase tracking-wide text-slate-300">
              Whoop {todayRecovery?.score ? 'Recovery' : 'Activity'}
            </span>
            <div className="flex items-center gap-2">
              {isConnected && (
                <button
                  onClick={() => { setWhoopLoading(true); refreshData().finally(() => setWhoopLoading(false)) }}
                  className="text-slate-500 hover:text-slate-300 transition"
                  title="Refresh"
                >
                  <RefreshCw size={13} className={whoopLoading ? 'animate-spin' : ''} />
                </button>
              )}
              <button
                onClick={() => { setTempClientId(clientId); setTempClientSecret(clientSecret || ''); setSettingsOpen(true) }}
                className="text-slate-500 hover:text-slate-300 transition"
                title="Whoop settings"
              >
                <Settings size={14} />
              </button>
            </div>
          </div>

          {!isConnected ? (
            <div className="flex flex-col items-center py-6 gap-3">
              <p className="text-sm text-slate-400">Connect Whoop to see your recovery data.</p>
              <button
                onClick={() => { setTempClientId(clientId); setTempClientSecret(clientSecret || ''); setSettingsOpen(true) }}
                className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500 transition"
              >
                Connect Whoop
              </button>
            </div>
          ) : todayRecovery?.score ? (
            <>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                <WhoopStat icon={<Heart size={16} />}    label="Recovery"   value={`${Math.round(todayRecovery.score.recovery_score)}%`}                          color={recoveryColor(todayRecovery.score.recovery_score)} />
                <WhoopStat icon={<Activity size={16} />} label="HRV"        value={`${Math.round(todayRecovery.score.hrv_rmssd_milli)}ms`}                         color="text-indigo-400" />
                <WhoopStat icon={<Heart size={16} />}    label="Resting HR" value={`${Math.round(todayRecovery.score.resting_heart_rate)} bpm`}                    color="text-red-400" />
                <WhoopStat icon={<Moon size={16} />}     label="Sleep"      value={`${Math.round(todayRecovery.score.sleep_performance_percentage ?? 0)}%`}         color="text-purple-400" />
              </div>
              <div className="mt-3">
                <div className="flex justify-between text-xs text-slate-500 mb-1">
                  <span>Recovery score</span>
                  <span>{Math.round(todayRecovery.score.recovery_score)}%</span>
                </div>
                <div className="h-2 w-full rounded-full bg-slate-700">
                  <div
                    className={`h-2 rounded-full transition-all ${
                      todayRecovery.score.recovery_score >= 67 ? 'bg-green-500'
                        : todayRecovery.score.recovery_score >= 34 ? 'bg-yellow-500'
                        : 'bg-red-500'
                    }`}
                    style={{ width: `${todayRecovery.score.recovery_score}%` }}
                  />
                </div>
              </div>
            </>
          ) : todayCycle?.score ? (
            <>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                <WhoopStat icon={<Activity size={16} />} label="Strain"  value={todayCycle.score.strain?.toFixed(1) ?? '—'}                                       color="text-indigo-400" />
                <WhoopStat icon={<Heart size={16} />}    label="Avg HR"  value={`${todayCycle.score.average_heart_rate ?? '—'} bpm`}                              color="text-red-400" />
                <WhoopStat icon={<Heart size={16} />}    label="Max HR"  value={`${todayCycle.score.max_heart_rate ?? '—'} bpm`}                                  color="text-orange-400" />
                <WhoopStat icon={<Activity size={16} />} label="kcal"    value={todayCycle.score.kilojoule ? `${Math.round(todayCycle.score.kilojoule / 4.184)}` : '—'} color="text-yellow-400" />
              </div>
              <div className="mt-3">
                <div className="flex justify-between text-xs text-slate-500 mb-1">
                  <span>Strain</span>
                  <span>{todayCycle.score.strain?.toFixed(1) ?? '—'} / 21</span>
                </div>
                <div className="h-2 w-full rounded-full bg-slate-700">
                  <div
                    className={`h-2 rounded-full transition-all ${
                      (todayCycle.score.strain ?? 0) >= 14 ? 'bg-red-500'
                        : (todayCycle.score.strain ?? 0) >= 10 ? 'bg-yellow-500'
                        : 'bg-indigo-500'
                    }`}
                    style={{ width: `${Math.min(100, ((todayCycle.score.strain ?? 0) / 21) * 100)}%` }}
                  />
                </div>
              </div>
            </>
          ) : (
            <p className="py-4 text-center text-sm text-slate-500">
              {whoopLoading ? 'Fetching Whoop data…' : 'No data yet — check back after wearing your Whoop.'}
            </p>
          )}
        </Card>

        {/* Focus for today */}
        <Card>
          <SectionHeader title="Focus for Today" />
          <textarea
            className="w-full resize-none bg-transparent text-sm text-slate-100 placeholder-slate-500 outline-none"
            rows={4}
            placeholder="What's the one thing that matters most today?"
            value={home.focus || ''}
            onChange={e => setHome(h => ({ ...h, focus: e.target.value }))}
          />
        </Card>

        {/* Top 3 Priorities — spans 2 cols */}
        <Card className="md:col-span-2">
          <SectionHeader title="Today's Top 3 Priorities" />
          <div className="space-y-2.5">
            {priorities.slice(0, 3).map((p, i) => (
              <div key={p.id} className="flex items-center gap-3">
                <button
                  onClick={() => { ensurePriorities(); togglePriority(p.id) }}
                  className="shrink-0 text-slate-400 hover:text-indigo-400 transition"
                >
                  {p.done
                    ? <CheckSquare size={18} className="text-indigo-400" />
                    : <Square size={18} />}
                </button>
                <input
                  className={`flex-1 bg-transparent text-sm outline-none border-b border-transparent focus:border-slate-600 transition pb-0.5 ${
                    p.done ? 'line-through text-slate-600' : 'text-slate-100'
                  }`}
                  placeholder={`Priority ${i + 1}…`}
                  value={p.text}
                  onFocus={ensurePriorities}
                  onChange={e => setPriority(p.id, e.target.value)}
                />
              </div>
            ))}
          </div>
        </Card>

      </div>

      {/* ── Whoop Settings Modal ────────────────────────────────────────── */}
      <Modal open={settingsOpen} onClose={() => setSettingsOpen(false)} title="Whoop Settings">
        <Field label="Client ID">
          <input
            className={inputCls}
            value={tempClientId}
            onChange={e => setTempClientId(e.target.value)}
            placeholder="From developer.whoop.com"
          />
        </Field>
        <Field label="Client Secret">
          <input
            className={inputCls}
            type="password"
            value={tempClientSecret}
            onChange={e => setTempClientSecret(e.target.value)}
            placeholder="From developer.whoop.com"
          />
        </Field>
        <p className="mb-4 text-xs text-slate-500">
          Register at{' '}
          <a href="https://developer.whoop.com" target="_blank" rel="noreferrer" className="text-indigo-400 underline">
            developer.whoop.com
          </a>{' '}
          with redirect URI:{' '}
          <code className="rounded bg-slate-700 px-1 text-xs">
            {window.location.origin}/whoop-callback
          </code>
        </p>
        <div className="flex flex-wrap gap-2">
          <button
            className={btnPrimary}
            onClick={() => { setClientId(tempClientId); setClientSecret(tempClientSecret); setSettingsOpen(false) }}
          >
            Save
          </button>
          {tempClientId && (
            <button
              className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500 transition"
              onClick={() => { setClientId(tempClientId); setClientSecret(tempClientSecret); setSettingsOpen(false); setTimeout(() => login(tempClientId, tempClientSecret), 300) }}
            >
              Save & Connect
            </button>
          )}
          {isConnected && (
            <button
              className="ml-auto rounded-lg bg-red-900/40 px-3 py-2 text-xs text-red-400 hover:bg-red-900/60 transition"
              onClick={() => { disconnect(); setSettingsOpen(false) }}
            >
              Disconnect
            </button>
          )}
        </div>
      </Modal>
    </div>
  )
}

// ── Sub-components ──────────────────────────────────────────────────────────

function WhoopStat({ icon, label, value, color }) {
  return (
    <div className="flex flex-col gap-1">
      <div className={`flex items-center gap-1 ${color}`}>{icon}</div>
      <p className={`text-xl font-bold ${color}`}>{value}</p>
      <p className="text-xs text-slate-500">{label}</p>
    </div>
  )
}

function SummaryRow({ label, count, to }) {
  return (
    <Link
      to={to}
      className="flex items-center justify-between rounded-lg px-2 py-1.5 hover:bg-slate-700/50 transition"
    >
      <span className="text-sm text-slate-400">{label}</span>
      <div className="flex items-center gap-1">
        <span className={`text-sm font-semibold ${count > 0 ? 'text-indigo-400' : 'text-slate-600'}`}>
          {count}
        </span>
        <ChevronRight size={13} className="text-slate-600" />
      </div>
    </Link>
  )
}
