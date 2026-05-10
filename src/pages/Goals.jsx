import { useState } from 'react'
import { Plus, Trash2, Edit2, Pin, PinOff, CheckSquare, Square } from 'lucide-react'
import { useFirestore } from '../hooks/useFirestore'
import { Card, SectionHeader } from '../components/Card'
import { Modal, Field, inputCls, btnPrimary, btnSecondary } from '../components/Modal'
import { ExportButton } from '../components/ExportButton'
import { uid, today, formatDate, daysUntil } from '../utils/export'

const CATEGORIES = ['Health', 'Academic', 'Work', 'Skills', 'Personal']
const LIFE_AREAS = ['Health', 'Thesis', 'Sjømatrådet', 'Elkjøp', 'Personal', 'Relationships']

const INIT = { goals: [], weeklyIntentions: {} }

function weekKey() {
  const d = new Date()
  d.setHours(0, 0, 0, 0)
  d.setDate(d.getDate() + 3 - ((d.getDay() + 6) % 7))
  const week1 = new Date(d.getFullYear(), 0, 4)
  const n = Math.round(((d - week1) / 86400000 + ((week1.getDay() + 6) % 7)) / 7) + 1
  return `${d.getFullYear()}-W${String(n).padStart(2, '0')}`
}

function progress(goal) {
  const tasks = goal.subtasks || []
  if (!tasks.length) return 0
  return Math.round((tasks.filter(t => t.done).length / tasks.length) * 100)
}

function catColor(cat) {
  return (
    { Health: 'bg-green-900/40 text-green-400', Academic: 'bg-blue-900/40 text-blue-400',
      Work: 'bg-amber-900/40 text-amber-400', Skills: 'bg-purple-900/40 text-purple-400',
      Personal: 'bg-rose-900/40 text-rose-400' }[cat] || 'bg-slate-700 text-slate-400'
  )
}

export function Goals() {
  const [data, setData] = useFirestore('goals', INIT)
  const [modal, setModal] = useState(false)
  const [editGoal, setEditGoal] = useState(null)
  const [form, setForm] = useState({})
  const [subtaskInput, setSubtaskInput] = useState('')
  const [expandedId, setExpandedId] = useState(null)
  const wk = weekKey()

  const intentions = (data.weeklyIntentions || {})[wk] || {}
  const setIntention = (area, val) =>
    setData(d => ({
      ...d,
      weeklyIntentions: {
        ...d.weeklyIntentions,
        [wk]: { ...(d.weeklyIntentions[wk] || {}), [area]: val },
      },
    }))

  const openModal = (goal = null) => {
    setEditGoal(goal)
    setForm(goal ? { ...goal } : {
      title: '', category: 'Health', targetDate: '', why: '', subtasks: [], pinned: false,
    })
    setSubtaskInput('')
    setModal(true)
  }

  const addSubtask = () => {
    if (!subtaskInput.trim()) return
    setForm(f => ({ ...f, subtasks: [...(f.subtasks || []), { id: uid(), text: subtaskInput.trim(), done: false }] }))
    setSubtaskInput('')
  }

  const removeSubtask = (id) =>
    setForm(f => ({ ...f, subtasks: f.subtasks.filter(s => s.id !== id) }))

  const saveGoal = () => {
    if (!form.title) return
    const goals = data.goals || []
    const updated = editGoal
      ? goals.map(g => (g.id === editGoal.id ? { ...form, id: editGoal.id } : g))
      : [{ ...form, id: uid() }, ...goals]
    setData(d => ({ ...d, goals: updated }))
    setModal(false)
  }

  const deleteGoal = (id) =>
    setData(d => ({ ...d, goals: d.goals.filter(g => g.id !== id) }))

  const togglePin = (id) =>
    setData(d => ({
      ...d,
      goals: d.goals.map(g => (g.id === id ? { ...g, pinned: !g.pinned } : g)),
    }))

  const toggleSubtask = (goalId, taskId) =>
    setData(d => ({
      ...d,
      goals: d.goals.map(g =>
        g.id !== goalId
          ? g
          : { ...g, subtasks: g.subtasks.map(s => s.id === taskId ? { ...s, done: !s.done } : s) },
      ),
    }))

  const sorted = [...(data.goals || [])].sort((a, b) => {
    if (a.pinned && !b.pinned) return -1
    if (!a.pinned && b.pinned) return 1
    return new Date(a.targetDate) - new Date(b.targetDate)
  })

  const pinned = sorted.filter(g => g.pinned)
  const rest = sorted.filter(g => !g.pinned)

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-100">Goals</h1>
        <div className="flex gap-2">
          <ExportButton data={data} filename="goals" />
          <button onClick={() => openModal()} className="flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3 py-2 text-sm font-medium text-white hover:bg-indigo-500 transition">
            <Plus size={15} /> New Goal
          </button>
        </div>
      </div>

      {/* Weekly Intentions */}
      <Card className="mb-6">
        <p className="mb-3 text-sm font-semibold text-slate-300 uppercase tracking-wide">
          Week {wk.split('-W')[1]} — Intentions
        </p>
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {LIFE_AREAS.map(area => (
            <div key={area}>
              <p className="mb-1 text-xs font-medium text-slate-500">{area}</p>
              <input
                className="w-full rounded-lg bg-slate-700 px-2 py-1.5 text-sm text-slate-100 placeholder-slate-600 border border-slate-600 focus:border-indigo-500 focus:outline-none"
                placeholder={`Focus for ${area}…`}
                value={intentions[area] || ''}
                onChange={e => setIntention(area, e.target.value)}
              />
            </div>
          ))}
        </div>
      </Card>

      {/* Pinned goal */}
      {pinned.length > 0 && (
        <div className="mb-6">
          <p className="mb-2 text-xs font-medium uppercase tracking-widest text-indigo-400">Current Focus</p>
          {pinned.map(g => <GoalCard key={g.id} goal={g} expanded={expandedId === g.id} onExpand={() => setExpandedId(expandedId === g.id ? null : g.id)} onEdit={() => openModal(g)} onDelete={() => deleteGoal(g.id)} onPin={() => togglePin(g.id)} onToggleTask={(tid) => toggleSubtask(g.id, tid)} />)}
        </div>
      )}

      {/* All goals */}
      <div className="space-y-3">
        {rest.length === 0 && pinned.length === 0 && (
          <Card><p className="py-8 text-center text-sm text-slate-500">No goals yet. Add one to get started.</p></Card>
        )}
        {rest.map(g => (
          <GoalCard key={g.id} goal={g} expanded={expandedId === g.id} onExpand={() => setExpandedId(expandedId === g.id ? null : g.id)} onEdit={() => openModal(g)} onDelete={() => deleteGoal(g.id)} onPin={() => togglePin(g.id)} onToggleTask={(tid) => toggleSubtask(g.id, tid)} />
        ))}
      </div>

      {/* Modal */}
      <Modal open={modal} onClose={() => setModal(false)} title={editGoal ? 'Edit Goal' : 'New Goal'} maxWidth="max-w-xl">
        <Field label="Title">
          <input className={inputCls} value={form.title || ''} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="What do you want to achieve?" />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Category">
            <select className={inputCls} value={form.category || 'Health'} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}>
              {CATEGORIES.map(c => <option key={c}>{c}</option>)}
            </select>
          </Field>
          <Field label="Target date">
            <input type="date" className={inputCls} value={form.targetDate || ''} onChange={e => setForm(f => ({ ...f, targetDate: e.target.value }))} />
          </Field>
        </div>
        <Field label="Why it matters">
          <input className={inputCls} value={form.why || ''} onChange={e => setForm(f => ({ ...f, why: e.target.value }))} placeholder="One sentence on why this goal matters…" />
        </Field>
        <Field label="Sub-tasks">
          <div className="space-y-1 mb-2">
            {(form.subtasks || []).map(s => (
              <div key={s.id} className="flex items-center gap-2">
                <span className="flex-1 text-sm text-slate-300">{s.text}</span>
                <button onClick={() => removeSubtask(s.id)} className="text-slate-500 hover:text-red-400"><Trash2 size={12} /></button>
              </div>
            ))}
          </div>
          <div className="flex gap-2">
            <input className={inputCls} value={subtaskInput} onChange={e => setSubtaskInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && addSubtask()} placeholder="Add sub-task…" />
            <button onClick={addSubtask} className="rounded-lg bg-slate-700 px-3 py-2 text-sm text-slate-300 hover:bg-slate-600 transition">Add</button>
          </div>
        </Field>
        <div className="flex items-center gap-2 mb-4">
          <input type="checkbox" id="pinned" checked={!!form.pinned} onChange={e => setForm(f => ({ ...f, pinned: e.target.checked }))} className="rounded" />
          <label htmlFor="pinned" className="text-sm text-slate-300">Pin as current focus</label>
        </div>
        <div className="flex gap-2">
          <button onClick={saveGoal} className={btnPrimary}>Save</button>
          <button onClick={() => setModal(false)} className={btnSecondary}>Cancel</button>
        </div>
      </Modal>
    </div>
  )
}

function GoalCard({ goal, expanded, onExpand, onEdit, onDelete, onPin, onToggleTask }) {
  const pct = progress(goal)
  const days = daysUntil(goal.targetDate)

  return (
    <Card className={goal.pinned ? 'border border-indigo-500/40' : ''}>
      <div className="flex items-start gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <span className="font-semibold text-slate-100">{goal.title}</span>
            <span className={`text-xs rounded-full px-2 py-0.5 ${catColor(goal.category)}`}>{goal.category}</span>
            {goal.targetDate && (
              <span className={`text-xs ${days !== null && days < 7 ? 'text-red-400' : 'text-slate-500'}`}>
                {days !== null ? (days < 0 ? `${Math.abs(days)}d overdue` : `${days}d left`) : ''} · {formatDate(goal.targetDate)}
              </span>
            )}
          </div>
          {goal.why && <p className="text-sm text-slate-400 mb-2">{goal.why}</p>}
          <div className="flex items-center gap-2 mb-2">
            <div className="flex-1 h-1.5 rounded-full bg-slate-700">
              <div className="h-1.5 rounded-full bg-indigo-500 transition-all" style={{ width: `${pct}%` }} />
            </div>
            <span className="text-xs text-slate-500">{pct}%</span>
          </div>
        </div>
        <div className="flex gap-1 shrink-0">
          <button onClick={onPin} className={`p-1.5 transition ${goal.pinned ? 'text-indigo-400' : 'text-slate-600 hover:text-slate-300'}`} title="Pin">
            {goal.pinned ? <PinOff size={13} /> : <Pin size={13} />}
          </button>
          <button onClick={onExpand} className="p-1.5 text-slate-600 hover:text-slate-300 transition">
            {expanded ? <CheckSquare size={13} /> : <Square size={13} />}
          </button>
          <button onClick={onEdit} className="p-1.5 text-slate-600 hover:text-slate-300 transition"><Edit2 size={13} /></button>
          <button onClick={onDelete} className="p-1.5 text-slate-600 hover:text-red-400 transition"><Trash2 size={13} /></button>
        </div>
      </div>

      {expanded && (goal.subtasks || []).length > 0 && (
        <div className="mt-3 space-y-1.5 border-t border-slate-700 pt-3">
          {goal.subtasks.map(s => (
            <button key={s.id} onClick={() => onToggleTask(s.id)} className="flex items-center gap-2 w-full text-left hover:text-slate-100 transition">
              {s.done ? <CheckSquare size={14} className="text-indigo-400 shrink-0" /> : <Square size={14} className="text-slate-600 shrink-0" />}
              <span className={`text-sm ${s.done ? 'line-through text-slate-600' : 'text-slate-300'}`}>{s.text}</span>
            </button>
          ))}
        </div>
      )}
    </Card>
  )
}
