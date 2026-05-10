import { useState, useEffect } from 'react'
import { Plus, Trash2, Edit2, Rss, RefreshCw, ExternalLink } from 'lucide-react'
import { useFirestore } from '../hooks/useFirestore'
import { Card } from '../components/Card'
import { Modal, Field, inputCls, btnPrimary, btnSecondary } from '../components/Modal'
import { ExportButton } from '../components/ExportButton'
import { uid, today, formatDate, weekKey } from '../utils/export'
import { fetchRSS } from '../utils/rss'

const MEETING_TAGS = ['market', 'stakeholder', 'internal', 'other']
const READ_STATUS = ['to read', 'reading', 'done']

const DEFAULT_FEEDS = [
  { id: 'intrafish', name: 'Intrafish', url: 'https://www.intrafish.com/rss' },
  { id: 'salmonbusiness', name: 'SalmonBusiness', url: 'https://salmonbusiness.com/feed/' },
]

const INIT = {
  priorities: [],
  meetings: [],
  learning: [],
  contacts: [],
  reading: [],
  feeds: DEFAULT_FEEDS,
}

const TABS = ['Priorities', 'Meetings', 'Learning', 'Contacts', 'Industry News', 'Reading List']

export function Sjomatradet() {
  const [data, setData] = useFirestore('sjomatradet', INIT)
  const [tab, setTab] = useState('Priorities')
  const [modal, setModal] = useState(null)
  const [form, setForm] = useState({})
  const [editItem, setEditItem] = useState(null)
  const [rssArticles, setRssArticles] = useState({})
  const [rssLoading, setRssLoading] = useState(false)
  const [selectedArticle, setSelectedArticle] = useState(null)
  const todayStr = today()
  const wk = weekKey()

  const feeds = data.feeds?.length ? data.feeds : DEFAULT_FEEDS

  const loadRSS = async () => {
    setRssLoading(true)
    const results = {}
    await Promise.all(
      feeds.map(async f => {
        try {
          results[f.id] = await fetchRSS(f.url)
        } catch {
          results[f.id] = []
        }
      }),
    )
    setRssArticles(results)
    setRssLoading(false)
  }

  useEffect(() => {
    if (tab === 'Industry News') loadRSS()
  }, [tab])

  // Priorities
  const priorities = (data.priorities || []).filter(p => p.weekKey === wk || !p.done)
  const addPriority = () => {
    if (!form.text) return
    setData(d => ({ ...d, priorities: [{ id: uid(), text: form.text, done: false, weekKey: wk }, ...(d.priorities || [])] }))
    setModal(null)
  }
  const togglePriority = (id) =>
    setData(d => ({ ...d, priorities: d.priorities.map(p => p.id === id ? { ...p, done: !p.done } : p) }))
  const deletePriority = (id) =>
    setData(d => ({ ...d, priorities: d.priorities.filter(p => p.id !== id) }))

  // Meetings
  const saveMeeting = () => {
    if (!form.date) return
    const meetings = data.meetings || []
    const updated = editItem
      ? meetings.map(m => m.id === editItem.id ? { ...form, id: editItem.id } : m)
      : [{ ...form, id: uid() }, ...meetings]
    setData(d => ({ ...d, meetings: updated }))
    setModal(null)
  }
  const deleteMeeting = (id) => setData(d => ({ ...d, meetings: d.meetings.filter(m => m.id !== id) }))

  // Learning
  const saveLearning = () => {
    if (!form.content) return
    setData(d => ({ ...d, learning: [{ id: uid(), date: todayStr, content: form.content }, ...(d.learning || [])] }))
    setModal(null)
  }
  const deleteLearning = (id) => setData(d => ({ ...d, learning: d.learning.filter(l => l.id !== id) }))

  // Contacts
  const saveContact = () => {
    if (!form.name) return
    const contacts = data.contacts || []
    const updated = editItem
      ? contacts.map(c => c.id === editItem.id ? { ...form, id: editItem.id } : c)
      : [{ ...form, id: uid() }, ...contacts]
    setData(d => ({ ...d, contacts: updated }))
    setModal(null)
  }
  const deleteContact = (id) => setData(d => ({ ...d, contacts: d.contacts.filter(c => c.id !== id) }))

  // Reading
  const saveReading = () => {
    if (!form.title) return
    setData(d => ({ ...d, reading: [{ id: uid(), status: 'to read', ...form }, ...(d.reading || [])] }))
    setModal(null)
  }
  const updateReadStatus = (id, status) =>
    setData(d => ({ ...d, reading: d.reading.map(r => r.id === id ? { ...r, status } : r) }))
  const deleteReading = (id) => setData(d => ({ ...d, reading: d.reading.filter(r => r.id !== id) }))

  // Feeds
  const addFeed = () => {
    if (!form.url) return
    const newFeed = { id: uid(), name: form.name || form.url, url: form.url }
    setData(d => ({ ...d, feeds: [...(d.feeds || DEFAULT_FEEDS), newFeed] }))
    setModal(null)
  }
  const deleteFeed = (id) => setData(d => ({ ...d, feeds: (d.feeds || DEFAULT_FEEDS).filter(f => f.id !== id) }))

  const openModal = (type, item = null) => {
    setEditItem(item)
    setForm(item ? { ...item } : {})
    setModal(type)
  }

  const statusColor = { 'to read': 'bg-slate-700 text-slate-400', reading: 'bg-indigo-900/60 text-indigo-400', done: 'bg-green-900/60 text-green-400' }

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-100">Sjømatrådet</h1>
        <ExportButton data={data} filename="sjomatradet" />
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

      {/* Priorities */}
      {tab === 'Priorities' && (
        <div>
          <div className="mb-4 flex items-center justify-between">
            <p className="text-sm text-slate-400">Week {wk.split('-W')[1]} priorities</p>
            <button onClick={() => openModal('priority')} className="flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3 py-2 text-sm font-medium text-white hover:bg-indigo-500 transition"><Plus size={15} /> Add</button>
          </div>
          {priorities.length === 0 && <Card><p className="py-6 text-center text-sm text-slate-500">No priorities this week.</p></Card>}
          <div className="space-y-2">
            {priorities.slice(0, 10).map(p => (
              <Card key={p.id} className="flex items-center gap-3">
                <button onClick={() => togglePriority(p.id)} className={`shrink-0 h-5 w-5 rounded border-2 flex items-center justify-center transition ${p.done ? 'border-green-500 bg-green-500/20 text-green-400 text-xs' : 'border-slate-600'}`}>{p.done && '✓'}</button>
                <p className={`flex-1 text-sm ${p.done ? 'line-through text-slate-600' : 'text-slate-100'}`}>{p.text}</p>
                <button onClick={() => deletePriority(p.id)} className="text-slate-600 hover:text-red-400 transition"><Trash2 size={13} /></button>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Meetings */}
      {tab === 'Meetings' && (
        <div>
          <div className="mb-4 flex justify-end">
            <button onClick={() => openModal('meeting')} className="flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3 py-2 text-sm font-medium text-white hover:bg-indigo-500 transition"><Plus size={15} /> Log Meeting</button>
          </div>
          {(data.meetings || []).length === 0 && <Card><p className="py-6 text-center text-sm text-slate-500">No meetings logged.</p></Card>}
          <div className="space-y-3">
            {(data.meetings || []).map(m => (
              <Card key={m.id}>
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <p className="font-semibold text-slate-100">{m.title || 'Meeting'}</p>
                      <span className="text-xs text-slate-500">{formatDate(m.date)}</span>
                      {m.tag && <span className="text-xs rounded-full px-2 py-0.5 bg-slate-700 text-slate-400">{m.tag}</span>}
                    </div>
                    {m.notes && <p className="text-sm text-slate-400 whitespace-pre-wrap">{m.notes}</p>}
                  </div>
                  <div className="flex gap-1 shrink-0 ml-2">
                    <button onClick={() => openModal('meeting', m)} className="p-1 text-slate-600 hover:text-slate-300 transition"><Edit2 size={13} /></button>
                    <button onClick={() => deleteMeeting(m.id)} className="p-1 text-slate-600 hover:text-red-400 transition"><Trash2 size={13} /></button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Learning Log */}
      {tab === 'Learning' && (
        <div>
          <div className="mb-4 flex justify-end">
            <button onClick={() => openModal('learning')} className="flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3 py-2 text-sm font-medium text-white hover:bg-indigo-500 transition"><Plus size={15} /> Add Entry</button>
          </div>
          {(data.learning || []).length === 0 && <Card><p className="py-6 text-center text-sm text-slate-500">No learning entries yet.</p></Card>}
          <div className="space-y-3">
            {(data.learning || []).map(l => (
              <Card key={l.id}>
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-slate-500 mb-1">{formatDate(l.date)}</p>
                    <p className="text-sm text-slate-200 whitespace-pre-wrap">{l.content}</p>
                  </div>
                  <button onClick={() => deleteLearning(l.id)} className="ml-2 shrink-0 text-slate-600 hover:text-red-400 transition"><Trash2 size={13} /></button>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Contacts */}
      {tab === 'Contacts' && (
        <div>
          <div className="mb-4 flex justify-end">
            <button onClick={() => openModal('contact')} className="flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3 py-2 text-sm font-medium text-white hover:bg-indigo-500 transition"><Plus size={15} /> Add Contact</button>
          </div>
          {(data.contacts || []).length === 0 && <Card><p className="py-6 text-center text-sm text-slate-500">No contacts yet.</p></Card>}
          <div className="space-y-3">
            {(data.contacts || []).map(c => (
              <Card key={c.id}>
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-slate-100">{c.name}</p>
                    {c.org && <p className="text-xs text-slate-500">{c.org}</p>}
                    {c.context && <p className="text-sm text-slate-400 mt-1">{c.context}</p>}
                    {c.followUp && <p className="text-xs text-indigo-400 mt-1">Follow-up: {c.followUp}</p>}
                  </div>
                  <div className="flex gap-1 shrink-0 ml-2">
                    <button onClick={() => openModal('contact', c)} className="p-1 text-slate-600 hover:text-slate-300 transition"><Edit2 size={13} /></button>
                    <button onClick={() => deleteContact(c.id)} className="p-1 text-slate-600 hover:text-red-400 transition"><Trash2 size={13} /></button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Industry News */}
      {tab === 'Industry News' && (
        <div>
          <div className="mb-4 flex items-center justify-between">
            <div className="flex gap-2">
              <button onClick={loadRSS} className="flex items-center gap-1.5 rounded-lg bg-slate-700 px-3 py-2 text-sm text-slate-300 hover:bg-slate-600 transition">
                <RefreshCw size={13} className={rssLoading ? 'animate-spin' : ''} /> Refresh
              </button>
              <button onClick={() => openModal('feed')} className="flex items-center gap-1.5 rounded-lg bg-slate-700 px-3 py-2 text-sm text-slate-300 hover:bg-slate-600 transition">
                <Rss size={13} /> Manage feeds
              </button>
            </div>
          </div>
          {selectedArticle ? (
            <Card>
              <button onClick={() => setSelectedArticle(null)} className="mb-3 text-xs text-indigo-400 hover:text-indigo-300">← Back</button>
              <h2 className="text-lg font-bold text-slate-100 mb-1">{selectedArticle.title}</h2>
              <p className="text-xs text-slate-500 mb-4">{selectedArticle.author} · {selectedArticle.pubDate}</p>
              <div className="text-sm text-slate-300 leading-relaxed whitespace-pre-wrap">{selectedArticle.description}</div>
              {selectedArticle.link && (
                <a href={selectedArticle.link} target="_blank" rel="noreferrer" className="mt-4 flex items-center gap-1 text-xs text-indigo-400 hover:underline">
                  Open original <ExternalLink size={11} />
                </a>
              )}
            </Card>
          ) : (
            feeds.map(feed => (
              <div key={feed.id} className="mb-4">
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">{feed.name}</p>
                <div className="space-y-1">
                  {rssLoading ? (
                    <Card><p className="py-3 text-center text-xs text-slate-500">Loading…</p></Card>
                  ) : (rssArticles[feed.id] || []).length === 0 ? (
                    <Card><p className="py-3 text-center text-xs text-slate-500">No articles loaded.</p></Card>
                  ) : (
                    (rssArticles[feed.id] || []).slice(0, 8).map((a, i) => (
                      <button key={i} onClick={() => setSelectedArticle(a)} className="w-full text-left rounded-lg hover:bg-slate-700/50 px-3 py-2 transition">
                        <p className="text-sm text-slate-200">{a.title}</p>
                        <p className="text-xs text-slate-500 mt-0.5">{a.pubDate}</p>
                      </button>
                    ))
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Reading List */}
      {tab === 'Reading List' && (
        <div>
          <div className="mb-4 flex justify-end">
            <button onClick={() => openModal('reading')} className="flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3 py-2 text-sm font-medium text-white hover:bg-indigo-500 transition"><Plus size={15} /> Add</button>
          </div>
          {(data.reading || []).length === 0 && <Card><p className="py-6 text-center text-sm text-slate-500">No reading items.</p></Card>}
          <div className="space-y-2">
            {(data.reading || []).map(r => (
              <Card key={r.id} className="flex items-center gap-3">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-100">{r.title}</p>
                  {r.url && <a href={r.url} target="_blank" rel="noreferrer" className="text-xs text-indigo-400 hover:underline flex items-center gap-1">{r.url.slice(0, 50)} <ExternalLink size={10} /></a>}
                </div>
                <select value={r.status} onChange={e => updateReadStatus(r.id, e.target.value)}
                  className="rounded-lg bg-slate-700 px-2 py-1 text-xs text-slate-300 border border-slate-600 focus:outline-none">
                  {READ_STATUS.map(s => <option key={s}>{s}</option>)}
                </select>
                <button onClick={() => deleteReading(r.id)} className="text-slate-600 hover:text-red-400 transition"><Trash2 size={13} /></button>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Modals */}
      <Modal open={modal === 'priority'} onClose={() => setModal(null)} title="Add Priority">
        <Field label="Priority"><input className={inputCls} value={form.text || ''} onChange={e => setForm(f => ({ ...f, text: e.target.value }))} placeholder="This week's focus item…" /></Field>
        <div className="flex gap-2 mt-2"><button onClick={addPriority} className={btnPrimary}>Add</button><button onClick={() => setModal(null)} className={btnSecondary}>Cancel</button></div>
      </Modal>

      <Modal open={modal === 'meeting'} onClose={() => setModal(null)} title={editItem ? 'Edit Meeting' : 'Log Meeting'} maxWidth="max-w-xl">
        <Field label="Title"><input className={inputCls} value={form.title || ''} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} /></Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Date"><input type="date" className={inputCls} value={form.date || todayStr} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} /></Field>
          <Field label="Tag"><select className={inputCls} value={form.tag || 'internal'} onChange={e => setForm(f => ({ ...f, tag: e.target.value }))}>{MEETING_TAGS.map(t => <option key={t}>{t}</option>)}</select></Field>
        </div>
        <Field label="Notes"><textarea className={inputCls} rows={4} value={form.notes || ''} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} /></Field>
        <div className="flex gap-2 mt-2"><button onClick={saveMeeting} className={btnPrimary}>Save</button><button onClick={() => setModal(null)} className={btnSecondary}>Cancel</button></div>
      </Modal>

      <Modal open={modal === 'learning'} onClose={() => setModal(null)} title="Learning Entry">
        <Field label="What did you learn?"><textarea className={inputCls} rows={4} value={form.content || ''} onChange={e => setForm(f => ({ ...f, content: e.target.value }))} /></Field>
        <div className="flex gap-2 mt-2"><button onClick={saveLearning} className={btnPrimary}>Save</button><button onClick={() => setModal(null)} className={btnSecondary}>Cancel</button></div>
      </Modal>

      <Modal open={modal === 'contact'} onClose={() => setModal(null)} title={editItem ? 'Edit Contact' : 'Add Contact'}>
        <Field label="Name"><input className={inputCls} value={form.name || ''} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} /></Field>
        <Field label="Organisation"><input className={inputCls} value={form.org || ''} onChange={e => setForm(f => ({ ...f, org: e.target.value }))} /></Field>
        <Field label="Context"><textarea className={inputCls} rows={2} value={form.context || ''} onChange={e => setForm(f => ({ ...f, context: e.target.value }))} /></Field>
        <Field label="Follow-up"><input className={inputCls} value={form.followUp || ''} onChange={e => setForm(f => ({ ...f, followUp: e.target.value }))} /></Field>
        <div className="flex gap-2 mt-2"><button onClick={saveContact} className={btnPrimary}>Save</button><button onClick={() => setModal(null)} className={btnSecondary}>Cancel</button></div>
      </Modal>

      <Modal open={modal === 'reading'} onClose={() => setModal(null)} title="Add to Reading List">
        <Field label="Title"><input className={inputCls} value={form.title || ''} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} /></Field>
        <Field label="URL (optional)"><input className={inputCls} value={form.url || ''} onChange={e => setForm(f => ({ ...f, url: e.target.value }))} /></Field>
        <div className="flex gap-2 mt-2"><button onClick={saveReading} className={btnPrimary}>Add</button><button onClick={() => setModal(null)} className={btnSecondary}>Cancel</button></div>
      </Modal>

      <Modal open={modal === 'feed'} onClose={() => setModal(null)} title="Manage RSS Feeds" maxWidth="max-w-xl">
        <div className="mb-4 space-y-2">
          {feeds.map(f => (
            <div key={f.id} className="flex items-center gap-2">
              <Rss size={13} className="text-slate-500 shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm text-slate-200">{f.name}</p>
                <p className="text-xs text-slate-500 truncate">{f.url}</p>
              </div>
              <button onClick={() => deleteFeed(f.id)} className="text-slate-600 hover:text-red-400 transition"><Trash2 size={13} /></button>
            </div>
          ))}
        </div>
        <div className="border-t border-slate-700 pt-4">
          <p className="mb-2 text-xs font-medium text-slate-400">Add feed</p>
          <Field label="Name"><input className={inputCls} value={form.name || ''} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} /></Field>
          <Field label="RSS URL"><input className={inputCls} value={form.url || ''} onChange={e => setForm(f => ({ ...f, url: e.target.value }))} /></Field>
          <div className="flex gap-2 mt-2"><button onClick={addFeed} className={btnPrimary}>Add</button><button onClick={() => setModal(null)} className={btnSecondary}>Done</button></div>
        </div>
      </Modal>
    </div>
  )
}
