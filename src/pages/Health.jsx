import { useState } from 'react'
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, Tooltip,
  ResponsiveContainer, CartesianGrid, ComposedChart, Legend,
} from 'recharts'
import { Plus, Trash2, Edit2, ChevronDown, ChevronUp } from 'lucide-react'
import { useFirestore } from '../hooks/useFirestore'
import { useWhoop } from '../hooks/useWhoop'
import { Card, SectionHeader } from '../components/Card'
import { Modal, Field, inputCls, btnPrimary, btnSecondary } from '../components/Modal'
import { ExportButton } from '../components/ExportButton'
import { uid, today, formatDate } from '../utils/export'

const DISCIPLINES = ['MMA', 'Muay Thai', 'BJJ', 'No-Gi', 'Judo', 'Lifting', 'Other']
const COACHES = ['Haakon', 'Jonas F', 'Marius', 'Vahan', 'Zoey', 'Other']
const BODY_REGIONS = ['Neck', 'Shoulder', 'Elbow', 'Wrist', 'Back', 'Hip', 'Knee', 'Ankle', 'Foot', 'Other']

const INIT = {
  trainingSessions: [],
  habits: [],
  injuries: [],
  myoNotes: [],
}

const TABS = ['Overview', 'Training Log', 'Habits', 'Injuries', 'MyoAdapt']

export function Health() {
  const [data, setData] = useFirestore('health', INIT)
  const { cache } = useWhoop()
  const [tab, setTab] = useState('Overview')
  const [sessionModal, setSessionModal] = useState(false)
  const [injuryModal, setInjuryModal] = useState(false)
  const [myoModal, setMyoModal] = useState(false)
  const [habitModal, setHabitModal] = useState(false)
  const [editSession, setEditSession] = useState(null)
  const [form, setForm] = useState({})

  const todayStr = today()

  // ── Whoop chart data ──────────────────────────────────────────────────────
  const cycleChartData = (cache?.cycles || [])
    .slice(0, 30)
    .reverse()
    .map(c => ({
      date: c.during?.start?.slice(5, 10) || '',
      strain: c.score?.strain != null ? Math.round(c.score.strain * 10) / 10 : null,
      avgHR: c.score?.average_heart_rate || null,
      kcal: c.score?.kilojoule ? Math.round(c.score.kilojoule / 4.184) : null,
    }))

  const recoveryChartData = (cache?.recovery || [])
    .slice(0, 30)
    .reverse()
    .map(r => ({
      date: r.created_at?.slice(5, 10) || '',
      recovery: Math.round(r.score?.recovery_score || 0),
      hrv: Math.round(r.score?.hrv_rmssd_milli || 0),
      sleep: Math.round(r.score?.sleep_performance_percentage || 0),
    }))

  const correlationData = cycleChartData.map(d => {
    const session = (data.trainingSessions || []).find(s => s.date === d.date)
    const rec = recoveryChartData.find(r => r.date === d.date)
    return { ...d, trainingIntensity: session ? session.intensity : null, recovery: rec?.recovery || null }
  })

  const hasWhoopData = cycleChartData.length > 0 || recoveryChartData.length > 0

  // ── Training sessions ─────────────────────────────────────────────────────
  const openSessionModal = (session = null) => {
    setEditSession(session)
    setForm(
      session || {
        date: todayStr, discipline: 'BJJ', duration: '', coach: '',
        intensity: 7, notes: '', feeling: '',
      },
    )
    setSessionModal(true)
  }

  const saveSession = () => {
    if (!form.date || !form.discipline) return
    const sessions = data.trainingSessions || []
    const updated = editSession
      ? sessions.map(s => (s.id === editSession.id ? { ...form, id: editSession.id } : s))
      : [{ ...form, id: uid() }, ...sessions]
    setData(d => ({ ...d, trainingSessions: updated }))
    setSessionModal(false)
  }

  const deleteSession = (id) =>
    setData(d => ({ ...d, trainingSessions: d.trainingSessions.filter(s => s.id !== id) }))

  // ── Habits ────────────────────────────────────────────────────────────────
  const toggleHabit = (habitId) => {
    const updated = (data.habits || []).map(h => {
      if (h.id !== habitId) return h
      const entries = { ...h.entries }
      entries[todayStr] = !entries[todayStr]
      return { ...h, entries }
    })
    setData(d => ({ ...d, habits: updated }))
  }

  const addHabit = () => {
    if (!form.name) return
    setData(d => ({ ...d, habits: [...(d.habits || []), { id: uid(), name: form.name, entries: {} }] }))
    setHabitModal(false)
  }

  const deleteHabit = (id) =>
    setData(d => ({ ...d, habits: d.habits.filter(h => h.id !== id) }))

  const streak = (habit) => {
    let count = 0
    const d = new Date()
    while (true) {
      const k = d.toISOString().slice(0, 10)
      if (!habit.entries[k]) break
      count++
      d.setDate(d.getDate() - 1)
    }
    return count
  }

  // ── Injuries ──────────────────────────────────────────────────────────────
  const saveInjury = () => {
    if (!form.region) return
    setData(d => ({
      ...d,
      injuries: [{ ...form, id: uid(), date: form.date || todayStr }, ...(d.injuries || [])],
    }))
    setInjuryModal(false)
  }

  const deleteInjury = (id) =>
    setData(d => ({ ...d, injuries: d.injuries.filter(i => i.id !== id) }))

  // ── MyoAdapt notes ────────────────────────────────────────────────────────
  const saveMyo = () => {
    if (!form.content) return
    setData(d => ({
      ...d,
      myoNotes: [{ id: uid(), date: todayStr, ...form }, ...(d.myoNotes || [])],
    }))
    setMyoModal(false)
  }

  const deleteMyo = (id) =>
    setData(d => ({ ...d, myoNotes: d.myoNotes.filter(n => n.id !== id) }))

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-100">Health & Training</h1>
        <ExportButton data={data} filename="health" />
      </div>

      {/* Tabs */}
      <div className="mb-6 flex gap-1 overflow-x-auto no-scrollbar rounded-xl bg-slate-800 p-1">
        {TABS.map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`shrink-0 rounded-lg px-3 py-1.5 text-sm font-medium transition ${
              tab === t
                ? 'bg-indigo-600 text-white'
                : 'text-slate-400 hover:text-slate-100'
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {/* ── Overview ──────────────────────────────────────────────────────── */}
      {tab === 'Overview' && (
        <div className="space-y-4">
          {!hasWhoopData ? (
            <Card>
              <p className="py-8 text-center text-sm text-slate-500">
                Connect Whoop on the Home tab to see trends.
              </p>
            </Card>
          ) : (
            <>
              {cycleChartData.length > 0 && (
                <Card>
                  <p className="mb-3 text-sm font-semibold text-slate-300">Daily Strain & Avg HR (30 days)</p>
                  <ResponsiveContainer width="100%" height={200}>
                    <ComposedChart data={cycleChartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                      <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#94a3b8' }} />
                      <YAxis yAxisId="left" domain={[0, 21]} tick={{ fontSize: 10, fill: '#94a3b8' }} />
                      <YAxis yAxisId="right" orientation="right" domain={[40, 120]} tick={{ fontSize: 10, fill: '#94a3b8' }} />
                      <Tooltip contentStyle={{ background: '#1e293b', border: 'none', borderRadius: 8 }} />
                      <Legend wrapperStyle={{ fontSize: 12 }} />
                      <Bar yAxisId="left" dataKey="strain" fill="#6366f1" opacity={0.8} name="Strain (0–21)" />
                      <Line yAxisId="right" type="monotone" dataKey="avgHR" stroke="#f43f5e" dot={false} name="Avg HR (bpm)" />
                    </ComposedChart>
                  </ResponsiveContainer>
                </Card>
              )}

              {cycleChartData.length > 0 && (
                <Card>
                  <p className="mb-3 text-sm font-semibold text-slate-300">Calories Burned (30 days)</p>
                  <ResponsiveContainer width="100%" height={160}>
                    <BarChart data={cycleChartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                      <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#94a3b8' }} />
                      <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} />
                      <Tooltip contentStyle={{ background: '#1e293b', border: 'none', borderRadius: 8 }} />
                      <Bar dataKey="kcal" fill="#f59e0b" opacity={0.8} name="kcal" />
                    </BarChart>
                  </ResponsiveContainer>
                </Card>
              )}

              {recoveryChartData.length > 0 && (
                <>
                  <Card>
                    <p className="mb-3 text-sm font-semibold text-slate-300">Recovery & Sleep (30 days)</p>
                    <ResponsiveContainer width="100%" height={200}>
                      <LineChart data={recoveryChartData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                        <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#94a3b8' }} />
                        <YAxis domain={[0, 100]} tick={{ fontSize: 10, fill: '#94a3b8' }} />
                        <Tooltip contentStyle={{ background: '#1e293b', border: 'none', borderRadius: 8 }} />
                        <Legend wrapperStyle={{ fontSize: 12 }} />
                        <Line type="monotone" dataKey="recovery" stroke="#10b981" dot={false} name="Recovery %" />
                        <Line type="monotone" dataKey="sleep" stroke="#a855f7" dot={false} name="Sleep %" />
                        <Line type="monotone" dataKey="hrv" stroke="#6366f1" dot={false} name="HRV ms" />
                      </LineChart>
                    </ResponsiveContainer>
                  </Card>

                  <Card>
                    <p className="mb-3 text-sm font-semibold text-slate-300">Recovery vs Training Intensity</p>
                    <ResponsiveContainer width="100%" height={200}>
                      <ComposedChart data={correlationData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                        <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#94a3b8' }} />
                        <YAxis yAxisId="left" domain={[0, 100]} tick={{ fontSize: 10, fill: '#94a3b8' }} />
                        <YAxis yAxisId="right" orientation="right" domain={[0, 10]} tick={{ fontSize: 10, fill: '#94a3b8' }} />
                        <Tooltip contentStyle={{ background: '#1e293b', border: 'none', borderRadius: 8 }} />
                        <Legend wrapperStyle={{ fontSize: 12 }} />
                        <Line yAxisId="left" type="monotone" dataKey="recovery" stroke="#10b981" dot={false} name="Recovery %" />
                        <Bar yAxisId="right" dataKey="trainingIntensity" fill="#6366f1" opacity={0.7} name="Training Intensity" />
                      </ComposedChart>
                    </ResponsiveContainer>
                  </Card>
                </>
              )}
            </>
          )}
        </div>
      )}

      {/* ── Training Log ──────────────────────────────────────────────────── */}
      {tab === 'Training Log' && (
        <div>
          <div className="mb-4 flex justify-end">
            <button onClick={() => openSessionModal()} className="flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3 py-2 text-sm font-medium text-white hover:bg-indigo-500 transition">
              <Plus size={15} /> Log Session
            </button>
          </div>
          <div className="space-y-3">
            {(data.trainingSessions || []).length === 0 && (
              <Card><p className="py-6 text-center text-sm text-slate-500">No sessions logged yet.</p></Card>
            )}
            {(data.trainingSessions || []).map(s => (
              <Card key={s.id}>
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-slate-100">{s.discipline}</span>
                      <span className="text-xs text-slate-500">{formatDate(s.date)}</span>
                      {s.duration && <span className="text-xs text-slate-400">{s.duration} min</span>}
                      {s.coach && <span className="text-xs text-slate-400">· {s.coach}</span>}
                      <span className="text-xs font-medium text-indigo-400">Intensity {s.intensity}/10</span>
                    </div>
                    {s.notes && <p className="mt-1 text-sm text-slate-400 line-clamp-2">{s.notes}</p>}
                    {s.feeling && <p className="mt-0.5 text-xs text-slate-500">How body felt: {s.feeling}</p>}
                  </div>
                  <div className="flex gap-1 shrink-0">
                    <button onClick={() => openSessionModal(s)} className="p-1.5 text-slate-500 hover:text-slate-200 transition"><Edit2 size={14} /></button>
                    <button onClick={() => deleteSession(s.id)} className="p-1.5 text-slate-500 hover:text-red-400 transition"><Trash2 size={14} /></button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* ── Habits ────────────────────────────────────────────────────────── */}
      {tab === 'Habits' && (
        <div>
          <div className="mb-4 flex justify-end">
            <button onClick={() => { setForm({ name: '' }); setHabitModal(true) }}
              className="flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3 py-2 text-sm font-medium text-white hover:bg-indigo-500 transition">
              <Plus size={15} /> Add Habit
            </button>
          </div>
          {(data.habits || []).length === 0 && (
            <Card><p className="py-6 text-center text-sm text-slate-500">Add habits to track daily.</p></Card>
          )}
          <div className="space-y-3">
            {(data.habits || []).map(h => {
              const done = !!(h.entries || {})[todayStr]
              const s = streak(h)
              return (
                <Card key={h.id} className="flex items-center gap-4">
                  <button
                    onClick={() => toggleHabit(h.id)}
                    className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 transition ${
                      done ? 'border-green-500 bg-green-500/20 text-green-400' : 'border-slate-600 text-slate-600'
                    }`}
                  >
                    {done && '✓'}
                  </button>
                  <div className="flex-1 min-w-0">
                    <p className={`font-medium ${done ? 'text-slate-400 line-through' : 'text-slate-100'}`}>{h.name}</p>
                    <p className="text-xs text-slate-500">🔥 {s} day streak</p>
                  </div>
                  <button onClick={() => deleteHabit(h.id)} className="text-slate-600 hover:text-red-400 transition"><Trash2 size={14} /></button>
                </Card>
              )
            })}
          </div>
        </div>
      )}

      {/* ── Injuries ──────────────────────────────────────────────────────── */}
      {tab === 'Injuries' && (
        <div>
          <div className="mb-4 flex justify-end">
            <button onClick={() => { setForm({ date: todayStr, region: '', severity: 5, notes: '' }); setInjuryModal(true) }}
              className="flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3 py-2 text-sm font-medium text-white hover:bg-indigo-500 transition">
              <Plus size={15} /> Log Injury
            </button>
          </div>
          {(data.injuries || []).length === 0 && (
            <Card><p className="py-6 text-center text-sm text-slate-500">No injuries logged.</p></Card>
          )}
          <div className="space-y-3">
            {(data.injuries || []).map(inj => (
              <Card key={inj.id}>
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-slate-100">{inj.region}</span>
                      <span className="text-xs text-slate-500">{formatDate(inj.date)}</span>
                      <span className={`text-xs font-medium ${inj.severity >= 7 ? 'text-red-400' : inj.severity >= 4 ? 'text-yellow-400' : 'text-green-400'}`}>
                        Severity {inj.severity}/10
                      </span>
                    </div>
                    {inj.notes && <p className="mt-1 text-sm text-slate-400">{inj.notes}</p>}
                  </div>
                  <button onClick={() => deleteInjury(inj.id)} className="text-slate-600 hover:text-red-400 transition"><Trash2 size={14} /></button>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* ── MyoAdapt Notes ────────────────────────────────────────────────── */}
      {tab === 'MyoAdapt' && (
        <div>
          <div className="mb-4 flex items-center justify-between">
            <p className="text-sm text-slate-400">Lifting context &amp; MyoAdapt notes</p>
            <button onClick={() => { setForm({ content: '', tags: '' }); setMyoModal(true) }}
              className="flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3 py-2 text-sm font-medium text-white hover:bg-indigo-500 transition">
              <Plus size={15} /> Add Note
            </button>
          </div>
          {(data.myoNotes || []).length === 0 && (
            <Card><p className="py-6 text-center text-sm text-slate-500">No MyoAdapt notes yet.</p></Card>
          )}
          <div className="space-y-3">
            {(data.myoNotes || []).map(n => (
              <Card key={n.id}>
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-slate-500 mb-1">{formatDate(n.date)}</p>
                    <p className="text-sm text-slate-200 whitespace-pre-wrap">{n.content}</p>
                    {n.tags && <p className="mt-1 text-xs text-indigo-400">{n.tags}</p>}
                  </div>
                  <button onClick={() => deleteMyo(n.id)} className="ml-2 shrink-0 text-slate-600 hover:text-red-400 transition"><Trash2 size={14} /></button>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* ── Modals ────────────────────────────────────────────────────────── */}
      <Modal open={sessionModal} onClose={() => setSessionModal(false)} title={editSession ? 'Edit Session' : 'Log Training Session'}>
        <Field label="Date">
          <input type="date" className={inputCls} value={form.date || ''} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} />
        </Field>
        <Field label="Discipline">
          <select className={inputCls} value={form.discipline || ''} onChange={e => setForm(f => ({ ...f, discipline: e.target.value }))}>
            {DISCIPLINES.map(d => <option key={d}>{d}</option>)}
          </select>
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Duration (min)">
            <input type="number" className={inputCls} value={form.duration || ''} onChange={e => setForm(f => ({ ...f, duration: e.target.value }))} />
          </Field>
          <Field label="Intensity (1–10)">
            <input type="number" min={1} max={10} className={inputCls} value={form.intensity || 7} onChange={e => setForm(f => ({ ...f, intensity: +e.target.value }))} />
          </Field>
        </div>
        <Field label="Coach">
          <select className={inputCls} value={form.coach || ''} onChange={e => setForm(f => ({ ...f, coach: e.target.value }))}>
            <option value="">— none —</option>
            {COACHES.map(c => <option key={c}>{c}</option>)}
          </select>
        </Field>
        <Field label="Technique notes">
          <textarea className={inputCls} rows={3} value={form.notes || ''} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} />
        </Field>
        <Field label="How body felt">
          <input className={inputCls} value={form.feeling || ''} onChange={e => setForm(f => ({ ...f, feeling: e.target.value }))} placeholder="e.g. Tired but sharp, heavy legs…" />
        </Field>
        <div className="flex gap-2 mt-2">
          <button onClick={saveSession} className={btnPrimary}>Save</button>
          <button onClick={() => setSessionModal(false)} className={btnSecondary}>Cancel</button>
        </div>
      </Modal>

      <Modal open={injuryModal} onClose={() => setInjuryModal(false)} title="Log Injury / Soreness">
        <Field label="Date">
          <input type="date" className={inputCls} value={form.date || todayStr} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} />
        </Field>
        <Field label="Body Region">
          <select className={inputCls} value={form.region || ''} onChange={e => setForm(f => ({ ...f, region: e.target.value }))}>
            <option value="">Select…</option>
            {BODY_REGIONS.map(r => <option key={r}>{r}</option>)}
          </select>
        </Field>
        <Field label="Severity (1–10)">
          <input type="number" min={1} max={10} className={inputCls} value={form.severity || 5} onChange={e => setForm(f => ({ ...f, severity: +e.target.value }))} />
        </Field>
        <Field label="Notes">
          <textarea className={inputCls} rows={3} value={form.notes || ''} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} />
        </Field>
        <div className="flex gap-2 mt-2">
          <button onClick={saveInjury} className={btnPrimary}>Save</button>
          <button onClick={() => setInjuryModal(false)} className={btnSecondary}>Cancel</button>
        </div>
      </Modal>

      <Modal open={habitModal} onClose={() => setHabitModal(false)} title="Add Habit">
        <Field label="Habit name">
          <input className={inputCls} value={form.name || ''} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g. Morning stretch, 8h sleep…" />
        </Field>
        <div className="flex gap-2 mt-2">
          <button onClick={addHabit} className={btnPrimary}>Add</button>
          <button onClick={() => setHabitModal(false)} className={btnSecondary}>Cancel</button>
        </div>
      </Modal>

      <Modal open={myoModal} onClose={() => setMyoModal(false)} title="Add MyoAdapt Note">
        <Field label="Content">
          <textarea className={inputCls} rows={5} value={form.content || ''} onChange={e => setForm(f => ({ ...f, content: e.target.value }))} placeholder="Volume, PRs, programming context…" />
        </Field>
        <Field label="Tags (optional)">
          <input className={inputCls} value={form.tags || ''} onChange={e => setForm(f => ({ ...f, tags: e.target.value }))} placeholder="squat, deload, hypertrophy…" />
        </Field>
        <div className="flex gap-2 mt-2">
          <button onClick={saveMyo} className={btnPrimary}>Save</button>
          <button onClick={() => setMyoModal(false)} className={btnSecondary}>Cancel</button>
        </div>
      </Modal>
    </div>
  )
}
