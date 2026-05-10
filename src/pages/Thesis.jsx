import { useState } from 'react'
import { Plus, Trash2, Edit2, Clock } from 'lucide-react'
import { useFirestore } from '../hooks/useFirestore'
import { Card, SectionHeader } from '../components/Card'
import { Modal, Field, inputCls, btnPrimary, btnSecondary } from '../components/Modal'
import { ExportButton } from '../components/ExportButton'
import { uid, today, formatDate, daysUntil } from '../utils/export'

const STATUSES = ['Not started', 'In progress', 'Done']
const STATUS_COLORS = {
  'Not started': 'border-slate-600 bg-slate-800',
  'In progress': 'border-indigo-500 bg-indigo-950/30',
  Done: 'border-green-600 bg-green-950/30',
}
const STATUS_BADGE = {
  'Not started': 'bg-slate-700 text-slate-400',
  'In progress': 'bg-indigo-900/60 text-indigo-400',
  Done: 'bg-green-900/60 text-green-400',
}

const TABS = ['Kanban', 'Tasks', 'Meetings', 'Notes']
const INIT = { chapters: [], tasks: [], meetings: [], deadline: '', notes: [] }

export function Thesis() {
  const [data, setData] = useFirestore('thesis', INIT)
  const [tab, setTab] = useState('Kanban')
  const [chapterModal, setChapterModal] = useState(false)
  const [taskModal, setTaskModal] = useState(false)
  const [meetingModal, setMeetingModal] = useState(false)
  const [noteModal, setNoteModal] = useState(false)
  const [form, setForm] = useState({})
  const [editItem, setEditItem] = useState(null)
  const todayStr = today()

  const days = daysUntil(data.deadline)

  // ── Chapters ──────────────────────────────────────────────────────────────
  const openChapterModal = (ch = null) => {
    setEditItem(ch)
    setForm(ch || { title: '', section: '', status: 'Not started' })
    setChapterModal(true)
  }

  const saveChapter = () => {
    if (!form.title) return
    const chapters = data.chapters || []
    const updated = editItem
      ? chapters.map(c => (c.id === editItem.id ? { ...form, id: editItem.id } : c))
      : [{ ...form, id: uid() }, ...chapters]
    setData(d => ({ ...d, chapters: updated }))
    setChapterModal(false)
  }

  const moveChapter = (id, status) =>
    setData(d => ({ ...d, chapters: d.chapters.map(c => c.id === id ? { ...c, status } : c) }))

  const deleteChapter = (id) =>
    setData(d => ({ ...d, chapters: d.chapters.filter(c => c.id !== id) }))

  // ── Tasks ─────────────────────────────────────────────────────────────────
  const saveTask = () => {
    if (!form.title) return
    const tasks = data.tasks || []
    const updated = editItem
      ? tasks.map(t => (t.id === editItem.id ? { ...form, id: editItem.id } : t))
      : [{ ...form, id: uid(), done: false }, ...tasks]
    setData(d => ({ ...d, tasks: updated }))
    setTaskModal(false)
  }

  const toggleTask = (id) =>
    setData(d => ({ ...d, tasks: d.tasks.map(t => t.id === id ? { ...t, done: !t.done } : t) }))

  const deleteTask = (id) =>
    setData(d => ({ ...d, tasks: d.tasks.filter(t => t.id !== id) }))

  // ── Meetings ──────────────────────────────────────────────────────────────
  const saveMeeting = () => {
    if (!form.date) return
    const meetings = data.meetings || []
    const updated = editItem
      ? meetings.map(m => (m.id === editItem.id ? { ...form, id: editItem.id } : m))
      : [{ ...form, id: uid() }, ...meetings]
    setData(d => ({ ...d, meetings: updated }))
    setMeetingModal(false)
  }

  const deleteMeeting = (id) =>
    setData(d => ({ ...d, meetings: d.meetings.filter(m => m.id !== id) }))

  // ── Notes ─────────────────────────────────────────────────────────────────
  const saveNote = () => {
    if (!form.content) return
    setData(d => ({ ...d, notes: [{ id: uid(), date: todayStr, ...form }, ...(d.notes || [])] }))
    setNoteModal(false)
  }

  const deleteNote = (id) =>
    setData(d => ({ ...d, notes: d.notes.filter(n => n.id !== id) }))

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-100">Master's Thesis</h1>
          {data.deadline && (
            <div className={`flex items-center gap-1.5 mt-1 text-sm ${days !== null && days < 30 ? 'text-red-400' : days !== null && days < 60 ? 'text-yellow-400' : 'text-slate-400'}`}>
              <Clock size={13} />
              <span>
                Deadline: {formatDate(data.deadline)} ·{' '}
                {days !== null ? (days < 0 ? `${Math.abs(days)}d overdue` : `${days} days left`) : ''}
              </span>
            </div>
          )}
        </div>
        <div className="flex gap-2 items-center">
          <ExportButton data={data} filename="thesis" />
          <input
            type="date"
            className="rounded-lg bg-slate-700 px-2 py-1 text-xs text-slate-300 border border-slate-600 focus:outline-none focus:border-indigo-500"
            value={data.deadline || ''}
            onChange={e => setData(d => ({ ...d, deadline: e.target.value }))}
            title="Set submission deadline"
          />
        </div>
      </div>

      {/* Tabs */}
      <div className="mb-6 flex gap-1 overflow-x-auto no-scrollbar rounded-xl bg-slate-800 p-1">
        {TABS.map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`shrink-0 rounded-lg px-3 py-1.5 text-sm font-medium transition ${tab === t ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-slate-100'}`}>
            {t}
          </button>
        ))}
      </div>

      {/* ── Kanban ────────────────────────────────────────────────────────── */}
      {tab === 'Kanban' && (
        <div>
          <div className="mb-4 flex justify-end">
            <button onClick={() => openChapterModal()} className="flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3 py-2 text-sm font-medium text-white hover:bg-indigo-500 transition">
              <Plus size={15} /> Add Chapter/Section
            </button>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            {STATUSES.map(status => (
              <div key={status}>
                <div className="mb-3 flex items-center gap-2">
                  <span className={`text-xs font-semibold uppercase tracking-wide px-2 py-0.5 rounded-full ${STATUS_BADGE[status]}`}>{status}</span>
                  <span className="text-xs text-slate-600">
                    {(data.chapters || []).filter(c => c.status === status).length}
                  </span>
                </div>
                <div className="space-y-2 min-h-[120px]">
                  {(data.chapters || [])
                    .filter(c => c.status === status)
                    .map(ch => (
                      <div key={ch.id} className={`rounded-xl border p-3 ${STATUS_COLORS[status]}`}>
                        <div className="flex items-start justify-between gap-1">
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-slate-100">{ch.title}</p>
                            {ch.section && <p className="text-xs text-slate-500 mt-0.5">{ch.section}</p>}
                          </div>
                          <div className="flex gap-1 shrink-0">
                            <button onClick={() => openChapterModal(ch)} className="p-1 text-slate-600 hover:text-slate-300 transition"><Edit2 size={12} /></button>
                            <button onClick={() => deleteChapter(ch.id)} className="p-1 text-slate-600 hover:text-red-400 transition"><Trash2 size={12} /></button>
                          </div>
                        </div>
                        <div className="mt-2 flex gap-1 flex-wrap">
                          {STATUSES.filter(s => s !== status).map(s => (
                            <button key={s} onClick={() => moveChapter(ch.id, s)}
                              className="text-xs rounded px-1.5 py-0.5 bg-slate-700 text-slate-400 hover:bg-slate-600 transition">
                              → {s}
                            </button>
                          ))}
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Tasks ─────────────────────────────────────────────────────────── */}
      {tab === 'Tasks' && (
        <div>
          <div className="mb-4 flex justify-end">
            <button onClick={() => { setEditItem(null); setForm({ title: '', section: '' }); setTaskModal(true) }}
              className="flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3 py-2 text-sm font-medium text-white hover:bg-indigo-500 transition">
              <Plus size={15} /> Add Task
            </button>
          </div>
          {(data.tasks || []).length === 0 && (
            <Card><p className="py-6 text-center text-sm text-slate-500">No tasks yet.</p></Card>
          )}
          <div className="space-y-2">
            {(data.tasks || []).map(t => (
              <Card key={t.id} className="flex items-center gap-3">
                <button onClick={() => toggleTask(t.id)} className="shrink-0">
                  {t.done
                    ? <div className="h-4 w-4 rounded border-2 border-green-500 bg-green-500/20 flex items-center justify-center text-green-400 text-xs">✓</div>
                    : <div className="h-4 w-4 rounded border-2 border-slate-600" />}
                </button>
                <div className="flex-1 min-w-0">
                  <p className={`text-sm ${t.done ? 'line-through text-slate-600' : 'text-slate-100'}`}>{t.title}</p>
                  {t.section && <p className="text-xs text-slate-500">{t.section}</p>}
                </div>
                <div className="flex gap-1 shrink-0">
                  <button onClick={() => { setEditItem(t); setForm({ ...t }); setTaskModal(true) }} className="p-1 text-slate-600 hover:text-slate-300 transition"><Edit2 size={13} /></button>
                  <button onClick={() => deleteTask(t.id)} className="p-1 text-slate-600 hover:text-red-400 transition"><Trash2 size={13} /></button>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* ── Meetings ──────────────────────────────────────────────────────── */}
      {tab === 'Meetings' && (
        <div>
          <div className="mb-4 flex justify-end">
            <button onClick={() => { setEditItem(null); setForm({ date: todayStr, agenda: '', outcomes: '', actions: '' }); setMeetingModal(true) }}
              className="flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3 py-2 text-sm font-medium text-white hover:bg-indigo-500 transition">
              <Plus size={15} /> Log Meeting
            </button>
          </div>
          {(data.meetings || []).length === 0 && (
            <Card><p className="py-6 text-center text-sm text-slate-500">No supervisor meetings logged.</p></Card>
          )}
          <div className="space-y-3">
            {(data.meetings || []).map(m => (
              <Card key={m.id}>
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-slate-500 mb-1">{formatDate(m.date)}</p>
                    {m.agenda && <div className="mb-1"><p className="text-xs font-medium text-slate-400">Agenda</p><p className="text-sm text-slate-200">{m.agenda}</p></div>}
                    {m.outcomes && <div className="mb-1"><p className="text-xs font-medium text-slate-400">Outcomes</p><p className="text-sm text-slate-200">{m.outcomes}</p></div>}
                    {m.actions && <div><p className="text-xs font-medium text-slate-400">Action Points</p><p className="text-sm text-slate-200">{m.actions}</p></div>}
                  </div>
                  <div className="flex gap-1 shrink-0 ml-2">
                    <button onClick={() => { setEditItem(m); setForm({ ...m }); setMeetingModal(true) }} className="p-1 text-slate-600 hover:text-slate-300 transition"><Edit2 size={13} /></button>
                    <button onClick={() => deleteMeeting(m.id)} className="p-1 text-slate-600 hover:text-red-400 transition"><Trash2 size={13} /></button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* ── Notes ─────────────────────────────────────────────────────────── */}
      {tab === 'Notes' && (
        <div>
          <div className="mb-4 flex justify-end">
            <button onClick={() => { setForm({ content: '', tags: '' }); setNoteModal(true) }}
              className="flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3 py-2 text-sm font-medium text-white hover:bg-indigo-500 transition">
              <Plus size={15} /> Add Note
            </button>
          </div>
          {(data.notes || []).length === 0 && (
            <Card><p className="py-6 text-center text-sm text-slate-500">No reading/reference notes yet.</p></Card>
          )}
          <div className="space-y-3">
            {(data.notes || []).map(n => (
              <Card key={n.id}>
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-slate-500 mb-1">{formatDate(n.date)}</p>
                    <p className="text-sm text-slate-200 whitespace-pre-wrap">{n.content}</p>
                    {n.tags && <p className="mt-1 text-xs text-indigo-400">{n.tags}</p>}
                  </div>
                  <button onClick={() => deleteNote(n.id)} className="ml-2 shrink-0 text-slate-600 hover:text-red-400 transition"><Trash2 size={13} /></button>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* ── Modals ────────────────────────────────────────────────────────── */}
      <Modal open={chapterModal} onClose={() => setChapterModal(false)} title={editItem ? 'Edit Chapter' : 'Add Chapter/Section'}>
        <Field label="Title"><input className={inputCls} value={form.title || ''} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="e.g. Chapter 2: Literature Review" /></Field>
        <Field label="Section / label (optional)"><input className={inputCls} value={form.section || ''} onChange={e => setForm(f => ({ ...f, section: e.target.value }))} placeholder="e.g. Theory" /></Field>
        <Field label="Status">
          <select className={inputCls} value={form.status || 'Not started'} onChange={e => setForm(f => ({ ...f, status: e.target.value }))}>
            {STATUSES.map(s => <option key={s}>{s}</option>)}
          </select>
        </Field>
        <div className="flex gap-2 mt-2"><button onClick={saveChapter} className={btnPrimary}>Save</button><button onClick={() => setChapterModal(false)} className={btnSecondary}>Cancel</button></div>
      </Modal>

      <Modal open={taskModal} onClose={() => setTaskModal(false)} title={editItem ? 'Edit Task' : 'Add Task'}>
        <Field label="Task"><input className={inputCls} value={form.title || ''} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} /></Field>
        <Field label="Section"><input className={inputCls} value={form.section || ''} onChange={e => setForm(f => ({ ...f, section: e.target.value }))} placeholder="e.g. Chapter 3" /></Field>
        <div className="flex gap-2 mt-2"><button onClick={saveTask} className={btnPrimary}>Save</button><button onClick={() => setTaskModal(false)} className={btnSecondary}>Cancel</button></div>
      </Modal>

      <Modal open={meetingModal} onClose={() => setMeetingModal(false)} title={editItem ? 'Edit Meeting' : 'Log Supervisor Meeting'} maxWidth="max-w-xl">
        <Field label="Date"><input type="date" className={inputCls} value={form.date || todayStr} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} /></Field>
        <Field label="Agenda"><textarea className={inputCls} rows={2} value={form.agenda || ''} onChange={e => setForm(f => ({ ...f, agenda: e.target.value }))} /></Field>
        <Field label="Outcomes"><textarea className={inputCls} rows={2} value={form.outcomes || ''} onChange={e => setForm(f => ({ ...f, outcomes: e.target.value }))} /></Field>
        <Field label="Action Points"><textarea className={inputCls} rows={2} value={form.actions || ''} onChange={e => setForm(f => ({ ...f, actions: e.target.value }))} /></Field>
        <div className="flex gap-2 mt-2"><button onClick={saveMeeting} className={btnPrimary}>Save</button><button onClick={() => setMeetingModal(false)} className={btnSecondary}>Cancel</button></div>
      </Modal>

      <Modal open={noteModal} onClose={() => setNoteModal(false)} title="Add Note">
        <Field label="Content"><textarea className={inputCls} rows={5} value={form.content || ''} onChange={e => setForm(f => ({ ...f, content: e.target.value }))} placeholder="References, ideas, insights…" /></Field>
        <Field label="Tags"><input className={inputCls} value={form.tags || ''} onChange={e => setForm(f => ({ ...f, tags: e.target.value }))} placeholder="e.g. methodology, Foucault" /></Field>
        <div className="flex gap-2 mt-2"><button onClick={saveNote} className={btnPrimary}>Save</button><button onClick={() => setNoteModal(false)} className={btnSecondary}>Cancel</button></div>
      </Modal>
    </div>
  )
}
