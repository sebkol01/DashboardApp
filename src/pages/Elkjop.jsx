import { useState } from 'react'
import { Plus, Trash2, Edit2, Search } from 'lucide-react'
import { useFirestore } from '../hooks/useFirestore'
import { Card } from '../components/Card'
import { Modal, Field, inputCls, btnPrimary, btnSecondary } from '../components/Modal'
import { ExportButton } from '../components/ExportButton'
import { uid, today, formatDate } from '../utils/export'

const PRODUCT_CATS = ['TVs', 'Computing', 'White Goods', 'Audio', 'Phones', 'Gaming', 'Smart Home', 'Photography', 'Other']
const OBJ_CATS = ['Price', 'Compatibility', 'Quality', 'Warranty', 'Stock', 'Alternatives', 'Other']
const TABS = ['Overview', 'Product Knowledge', 'Shift Debrief', 'Objection Bank', 'Confidence', 'Wins']

const RAG = ['red', 'amber', 'green']
const RAG_STYLES = {
  red: 'bg-red-900/40 border-red-700 text-red-400',
  amber: 'bg-amber-900/40 border-amber-700 text-amber-400',
  green: 'bg-green-900/40 border-green-700 text-green-400',
  '': 'bg-slate-700 border-slate-600 text-slate-500',
}

const INIT = {
  products: [], debriefs: [], objections: [],
  confidence: {}, campaigns: '', skillFocus: '', wins: [],
}

export function Elkjop() {
  const [data, setData] = useFirestore('elkjop', INIT)
  const [tab, setTab] = useState('Overview')
  const [modal, setModal] = useState(null)
  const [form, setForm] = useState({})
  const [editItem, setEditItem] = useState(null)
  const [searchObj, setSearchObj] = useState('')
  const todayStr = today()

  const openModal = (type, item = null) => {
    setEditItem(item)
    setForm(item ? { ...item } : {})
    setModal(type)
  }

  // Products
  const saveProduct = () => {
    if (!form.title) return
    const products = data.products || []
    const updated = editItem
      ? products.map(p => p.id === editItem.id ? { ...form, id: editItem.id } : p)
      : [{ ...form, id: uid() }, ...products]
    setData(d => ({ ...d, products: updated }))
    setModal(null)
  }
  const deleteProduct = (id) => setData(d => ({ ...d, products: d.products.filter(p => p.id !== id) }))

  // Debriefs
  const saveDebrief = () => {
    if (!form.date) return
    setData(d => ({ ...d, debriefs: [{ ...form, id: uid() }, ...(d.debriefs || [])] }))
    setModal(null)
  }
  const deleteDebrief = (id) => setData(d => ({ ...d, debriefs: d.debriefs.filter(d2 => d2.id !== id) }))

  // Objections
  const saveObjection = () => {
    if (!form.question) return
    const objections = data.objections || []
    const updated = editItem
      ? objections.map(o => o.id === editItem.id ? { ...form, id: editItem.id } : o)
      : [{ ...form, id: uid() }, ...objections]
    setData(d => ({ ...d, objections: updated }))
    setModal(null)
  }
  const deleteObjection = (id) => setData(d => ({ ...d, objections: d.objections.filter(o => o.id !== id) }))

  // Confidence
  const setConfidence = (cat, val) =>
    setData(d => ({ ...d, confidence: { ...d.confidence, [cat]: val } }))

  // Wins
  const saveWin = () => {
    if (!form.content) return
    setData(d => ({ ...d, wins: [{ id: uid(), date: todayStr, content: form.content }, ...(d.wins || [])] }))
    setModal(null)
  }
  const deleteWin = (id) => setData(d => ({ ...d, wins: d.wins.filter(w => w.id !== id) }))

  const filteredObj = (data.objections || []).filter(o =>
    !searchObj || o.question?.toLowerCase().includes(searchObj.toLowerCase()) || o.answer?.toLowerCase().includes(searchObj.toLowerCase()),
  )

  const productsByCategory = PRODUCT_CATS.reduce((acc, cat) => {
    const items = (data.products || []).filter(p => p.category === cat)
    if (items.length) acc[cat] = items
    return acc
  }, {})

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-100">Elkjøp</h1>
        <ExportButton data={data} filename="elkjop" />
      </div>

      <div className="mb-6 flex gap-1 overflow-x-auto no-scrollbar rounded-xl bg-slate-800 p-1">
        {TABS.map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`shrink-0 rounded-lg px-3 py-1.5 text-sm font-medium transition ${tab === t ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-slate-100'}`}>
            {t}
          </button>
        ))}
      </div>

      {/* Overview */}
      {tab === 'Overview' && (
        <div className="space-y-4">
          <Card>
            <p className="mb-2 text-sm font-semibold text-slate-300">Weekly Skill Focus</p>
            <textarea
              className="w-full resize-none bg-transparent text-sm text-slate-100 placeholder-slate-500 outline-none"
              rows={2}
              placeholder="One skill to work on this week…"
              value={data.skillFocus || ''}
              onChange={e => setData(d => ({ ...d, skillFocus: e.target.value }))}
            />
          </Card>
          <Card>
            <p className="mb-2 text-sm font-semibold text-slate-300">Upcoming Campaigns / Promotions</p>
            <textarea
              className="w-full resize-none bg-transparent text-sm text-slate-100 placeholder-slate-500 outline-none"
              rows={4}
              placeholder="Note upcoming deals, bundle offers, campaign dates…"
              value={data.campaigns || ''}
              onChange={e => setData(d => ({ ...d, campaigns: e.target.value }))}
            />
          </Card>
          <div className="grid grid-cols-3 gap-2">
            {PRODUCT_CATS.map(cat => {
              const rag = (data.confidence || {})[cat] || ''
              return (
                <div key={cat} className={`rounded-xl border p-3 cursor-pointer transition ${RAG_STYLES[rag]}`}
                  onClick={() => setConfidence(cat, RAG[(RAG.indexOf(rag) + 1) % RAG.length] || 'red')}>
                  <p className="text-xs font-medium">{cat}</p>
                  <p className="text-xs mt-0.5 capitalize">{rag || 'unset'}</p>
                </div>
              )
            })}
          </div>
          <p className="text-xs text-slate-600 text-center">Click category cards in Overview to cycle Red → Amber → Green confidence</p>
        </div>
      )}

      {/* Product Knowledge */}
      {tab === 'Product Knowledge' && (
        <div>
          <div className="mb-4 flex justify-end">
            <button onClick={() => openModal('product')} className="flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3 py-2 text-sm font-medium text-white hover:bg-indigo-500 transition"><Plus size={15} /> Add Card</button>
          </div>
          {Object.keys(productsByCategory).length === 0 && (
            <Card><p className="py-6 text-center text-sm text-slate-500">No product knowledge cards yet.</p></Card>
          )}
          {PRODUCT_CATS.map(cat => {
            const items = productsByCategory[cat]
            if (!items) return null
            return (
              <div key={cat} className="mb-5">
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">{cat}</p>
                <div className="grid gap-2 sm:grid-cols-2">
                  {items.map(p => (
                    <Card key={p.id}>
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-slate-100">{p.title}</p>
                          {p.content && <p className="text-sm text-slate-400 mt-1 whitespace-pre-wrap">{p.content}</p>}
                        </div>
                        <div className="flex gap-1 shrink-0 ml-2">
                          <button onClick={() => openModal('product', p)} className="p-1 text-slate-600 hover:text-slate-300 transition"><Edit2 size={12} /></button>
                          <button onClick={() => deleteProduct(p.id)} className="p-1 text-slate-600 hover:text-red-400 transition"><Trash2 size={12} /></button>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Shift Debrief */}
      {tab === 'Shift Debrief' && (
        <div>
          <div className="mb-4 flex justify-end">
            <button onClick={() => openModal('debrief', { date: todayStr })} className="flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3 py-2 text-sm font-medium text-white hover:bg-indigo-500 transition"><Plus size={15} /> Log Shift</button>
          </div>
          {(data.debriefs || []).length === 0 && <Card><p className="py-6 text-center text-sm text-slate-500">No shift debriefs yet.</p></Card>}
          <div className="space-y-3">
            {(data.debriefs || []).map(d => (
              <Card key={d.id}>
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-slate-500 mb-2">{formatDate(d.date)}</p>
                    {d.wentWell && <div className="mb-1"><p className="text-xs font-medium text-green-400">What went well</p><p className="text-sm text-slate-300">{d.wentWell}</p></div>}
                    {d.improvement && <div className="mb-1"><p className="text-xs font-medium text-amber-400">One improvement</p><p className="text-sm text-slate-300">{d.improvement}</p></div>}
                    {d.interaction && <div><p className="text-xs font-medium text-indigo-400">Notable interaction</p><p className="text-sm text-slate-300">{d.interaction}</p></div>}
                  </div>
                  <button onClick={() => deleteDebrief(d.id)} className="ml-2 shrink-0 text-slate-600 hover:text-red-400 transition"><Trash2 size={13} /></button>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Objection Bank */}
      {tab === 'Objection Bank' && (
        <div>
          <div className="mb-4 flex items-center gap-2">
            <div className="relative flex-1">
              <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-500" />
              <input className={`${inputCls} pl-8`} placeholder="Search objections…" value={searchObj} onChange={e => setSearchObj(e.target.value)} />
            </div>
            <button onClick={() => openModal('objection')} className="flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3 py-2 text-sm font-medium text-white hover:bg-indigo-500 transition shrink-0"><Plus size={15} /> Add</button>
          </div>
          {filteredObj.length === 0 && <Card><p className="py-6 text-center text-sm text-slate-500">No objections found.</p></Card>}
          <div className="space-y-3">
            {filteredObj.map(o => (
              <Card key={o.id}>
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-semibold text-slate-100">{o.question}</p>
                      {o.category && <span className="text-xs rounded-full px-2 py-0.5 bg-slate-700 text-slate-400">{o.category}</span>}
                    </div>
                    {o.answer && <p className="text-sm text-slate-300 mt-1">{o.answer}</p>}
                  </div>
                  <div className="flex gap-1 shrink-0 ml-2">
                    <button onClick={() => openModal('objection', o)} className="p-1 text-slate-600 hover:text-slate-300 transition"><Edit2 size={13} /></button>
                    <button onClick={() => deleteObjection(o.id)} className="p-1 text-slate-600 hover:text-red-400 transition"><Trash2 size={13} /></button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Confidence */}
      {tab === 'Confidence' && (
        <div>
          <p className="mb-4 text-sm text-slate-400">Self-rate your confidence per product category. Click to cycle R→A→G.</p>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {PRODUCT_CATS.map(cat => {
              const rag = (data.confidence || {})[cat] || ''
              return (
                <button key={cat} onClick={() => setConfidence(cat, RAG[(RAG.indexOf(rag) + 1) % RAG.length] || 'red')}
                  className={`rounded-xl border-2 p-4 text-left transition ${RAG_STYLES[rag]}`}>
                  <p className="font-semibold">{cat}</p>
                  <p className="text-xs mt-1 capitalize">{rag || '— not set —'}</p>
                </button>
              )
            })}
          </div>
        </div>
      )}

      {/* Wins */}
      {tab === 'Wins' && (
        <div>
          <div className="mb-4 flex justify-end">
            <button onClick={() => openModal('win')} className="flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3 py-2 text-sm font-medium text-white hover:bg-indigo-500 transition"><Plus size={15} /> Log Win</button>
          </div>
          {(data.wins || []).length === 0 && <Card><p className="py-6 text-center text-sm text-slate-500">No wins logged yet. Log memorable interactions here!</p></Card>}
          <div className="space-y-3">
            {(data.wins || []).map(w => (
              <Card key={w.id}>
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-slate-500 mb-1">{formatDate(w.date)}</p>
                    <p className="text-sm text-slate-200 whitespace-pre-wrap">{w.content}</p>
                  </div>
                  <button onClick={() => deleteWin(w.id)} className="ml-2 shrink-0 text-slate-600 hover:text-red-400 transition"><Trash2 size={13} /></button>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Modals */}
      <Modal open={modal === 'product'} onClose={() => setModal(null)} title={editItem ? 'Edit Product Card' : 'Add Product Card'} maxWidth="max-w-xl">
        <Field label="Title / Model"><input className={inputCls} value={form.title || ''} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} /></Field>
        <Field label="Category"><select className={inputCls} value={form.category || 'Other'} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}>{PRODUCT_CATS.map(c => <option key={c}>{c}</option>)}</select></Field>
        <Field label="Key facts / Quick reference"><textarea className={inputCls} rows={5} value={form.content || ''} onChange={e => setForm(f => ({ ...f, content: e.target.value }))} placeholder="Specs, selling points, common questions…" /></Field>
        <div className="flex gap-2 mt-2"><button onClick={saveProduct} className={btnPrimary}>Save</button><button onClick={() => setModal(null)} className={btnSecondary}>Cancel</button></div>
      </Modal>

      <Modal open={modal === 'debrief'} onClose={() => setModal(null)} title="Shift Debrief">
        <Field label="Date"><input type="date" className={inputCls} value={form.date || todayStr} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} /></Field>
        <Field label="What went well"><textarea className={inputCls} rows={2} value={form.wentWell || ''} onChange={e => setForm(f => ({ ...f, wentWell: e.target.value }))} /></Field>
        <Field label="One improvement"><textarea className={inputCls} rows={2} value={form.improvement || ''} onChange={e => setForm(f => ({ ...f, improvement: e.target.value }))} /></Field>
        <Field label="Notable customer interaction"><textarea className={inputCls} rows={2} value={form.interaction || ''} onChange={e => setForm(f => ({ ...f, interaction: e.target.value }))} /></Field>
        <div className="flex gap-2 mt-2"><button onClick={saveDebrief} className={btnPrimary}>Save</button><button onClick={() => setModal(null)} className={btnSecondary}>Cancel</button></div>
      </Modal>

      <Modal open={modal === 'objection'} onClose={() => setModal(null)} title={editItem ? 'Edit Objection' : 'Add Objection'} maxWidth="max-w-xl">
        <Field label="Customer question / objection"><textarea className={inputCls} rows={2} value={form.question || ''} onChange={e => setForm(f => ({ ...f, question: e.target.value }))} /></Field>
        <Field label="Best answer"><textarea className={inputCls} rows={4} value={form.answer || ''} onChange={e => setForm(f => ({ ...f, answer: e.target.value }))} /></Field>
        <Field label="Category"><select className={inputCls} value={form.category || 'Other'} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}>{OBJ_CATS.map(c => <option key={c}>{c}</option>)}</select></Field>
        <div className="flex gap-2 mt-2"><button onClick={saveObjection} className={btnPrimary}>Save</button><button onClick={() => setModal(null)} className={btnSecondary}>Cancel</button></div>
      </Modal>

      <Modal open={modal === 'win'} onClose={() => setModal(null)} title="Log a Win">
        <Field label="What happened?"><textarea className={inputCls} rows={4} value={form.content || ''} onChange={e => setForm(f => ({ ...f, content: e.target.value }))} placeholder="Describe the interaction…" /></Field>
        <div className="flex gap-2 mt-2"><button onClick={saveWin} className={btnPrimary}>Save</button><button onClick={() => setModal(null)} className={btnSecondary}>Cancel</button></div>
      </Modal>
    </div>
  )
}
