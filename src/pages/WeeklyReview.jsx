import { useState } from 'react'
import { ChevronLeft, ChevronRight, Plus, Save } from 'lucide-react'
import { useFirestore } from '../hooks/useFirestore'
import { Card } from '../components/Card'
import { inputCls, btnPrimary, btnSecondary } from '../components/Modal'
import { ExportButton } from '../components/ExportButton'
import { uid, weekKey, formatDate } from '../utils/export'

const LIFE_AREAS = ['Health', 'Thesis', 'Sjømatrådet', 'Elkjøp', 'Personal']

const INIT = { reviews: [] }

function currentWeek() {
  const wk = weekKey()
  const [year, week] = wk.split('-W')
  return { wk, year: +year, week: +week }
}

function weekLabel(wk) {
  const [year, week] = wk.split('-W')
  return `Week ${week}, ${year}`
}

export function WeeklyReview() {
  const [data, setData] = useFirestore('weeklyReview', INIT)
  const { wk: thisWeek } = currentWeek()
  const [activeWk, setActiveWk] = useState(thisWeek)
  const [mode, setMode] = useState('view') // 'view' | 'edit'
  const [form, setForm] = useState({})

  const reviews = data.reviews || []
  const review = reviews.find(r => r.weekKey === activeWk)

  const allWeeks = [...new Set([thisWeek, ...reviews.map(r => r.weekKey)])].sort().reverse()

  const startNew = () => {
    setForm({
      weekKey: activeWk,
      ...LIFE_AREAS.reduce((acc, a) => ({ ...acc, [a]: '' }), {}),
      didntMove: '',
      adjustment: '',
      rating: 7,
    })
    setMode('edit')
  }

  const editExisting = () => {
    setForm({ ...review })
    setMode('edit')
  }

  const saveReview = () => {
    const existing = reviews.find(r => r.weekKey === form.weekKey)
    let updated
    if (existing) {
      updated = reviews.map(r => r.weekKey === form.weekKey ? { ...form, id: r.id } : r)
    } else {
      updated = [{ ...form, id: uid() }, ...reviews]
    }
    setData(d => ({ ...d, reviews: updated }))
    setMode('view')
  }

  const navWeek = (dir) => {
    const idx = allWeeks.indexOf(activeWk)
    const next = allWeeks[idx + dir]
    if (next) { setActiveWk(next); setMode('view') }
  }

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-100">Weekly Review</h1>
        <ExportButton data={data} filename="weekly-review" />
      </div>

      {/* Week nav */}
      <div className="mb-6 flex items-center gap-3">
        <button onClick={() => navWeek(1)} disabled={allWeeks.indexOf(activeWk) >= allWeeks.length - 1}
          className="rounded-lg bg-slate-800 p-2 text-slate-400 hover:text-slate-100 disabled:opacity-30 transition">
          <ChevronLeft size={16} />
        </button>
        <div className="flex-1 text-center">
          <p className="font-semibold text-slate-100">{weekLabel(activeWk)}</p>
          {activeWk === thisWeek && <p className="text-xs text-indigo-400">Current week</p>}
        </div>
        <button onClick={() => navWeek(-1)} disabled={allWeeks.indexOf(activeWk) <= 0}
          className="rounded-lg bg-slate-800 p-2 text-slate-400 hover:text-slate-100 disabled:opacity-30 transition">
          <ChevronRight size={16} />
        </button>
      </div>

      {mode === 'edit' ? (
        <div className="space-y-4">
          <Card>
            <p className="mb-4 text-sm font-semibold text-slate-300">What moved forward this week?</p>
            <div className="space-y-3">
              {LIFE_AREAS.map(area => (
                <div key={area}>
                  <label className="mb-1 block text-xs font-medium text-slate-400">{area}</label>
                  <textarea
                    className={inputCls}
                    rows={2}
                    value={form[area] || ''}
                    onChange={e => setForm(f => ({ ...f, [area]: e.target.value }))}
                    placeholder={`What happened in ${area}?`}
                  />
                </div>
              ))}
            </div>
          </Card>

          <Card>
            <div className="space-y-4">
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-400">What didn't move / fell short?</label>
                <textarea className={inputCls} rows={3} value={form.didntMove || ''} onChange={e => setForm(f => ({ ...f, didntMove: e.target.value }))} />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-400">One adjustment for next week</label>
                <textarea className={inputCls} rows={2} value={form.adjustment || ''} onChange={e => setForm(f => ({ ...f, adjustment: e.target.value }))} />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-400">
                  Overall week rating: <span className="text-indigo-400 font-bold">{form.rating}/10</span>
                </label>
                <input
                  type="range" min={1} max={10} step={1}
                  className="w-full accent-indigo-500"
                  value={form.rating || 7}
                  onChange={e => setForm(f => ({ ...f, rating: +e.target.value }))}
                />
                <div className="flex justify-between text-xs text-slate-600 mt-0.5">
                  <span>1</span><span>10</span>
                </div>
              </div>
            </div>
          </Card>

          <div className="flex gap-2">
            <button onClick={saveReview} className={`${btnPrimary} flex items-center gap-1.5`}>
              <Save size={14} /> Save Review
            </button>
            <button onClick={() => setMode('view')} className={btnSecondary}>Cancel</button>
          </div>
        </div>
      ) : review ? (
        <div className="space-y-4">
          <Card>
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm font-semibold text-slate-300">What moved forward</p>
              <button onClick={editExisting} className="text-xs text-indigo-400 hover:underline">Edit</button>
            </div>
            <div className="space-y-3">
              {LIFE_AREAS.map(area => review[area] ? (
                <div key={area}>
                  <p className="text-xs font-medium text-slate-500 mb-0.5">{area}</p>
                  <p className="text-sm text-slate-200">{review[area]}</p>
                </div>
              ) : null)}
            </div>
          </Card>

          {review.didntMove && (
            <Card>
              <p className="text-xs font-medium text-slate-500 mb-1">What didn't move</p>
              <p className="text-sm text-slate-200">{review.didntMove}</p>
            </Card>
          )}

          {review.adjustment && (
            <Card>
              <p className="text-xs font-medium text-slate-500 mb-1">Adjustment for next week</p>
              <p className="text-sm text-slate-200">{review.adjustment}</p>
            </Card>
          )}

          {review.rating && (
            <Card>
              <p className="text-xs font-medium text-slate-500 mb-2">Week rating</p>
              <div className="flex items-end gap-3">
                <p className="text-4xl font-bold text-indigo-400">{review.rating}</p>
                <p className="text-sm text-slate-500 pb-1">/ 10</p>
              </div>
              <div className="mt-2 h-2 w-full rounded-full bg-slate-700">
                <div className="h-2 rounded-full bg-indigo-500 transition-all" style={{ width: `${review.rating * 10}%` }} />
              </div>
            </Card>
          )}
        </div>
      ) : (
        <Card>
          <div className="py-8 text-center">
            <p className="text-slate-400 mb-4">
              {activeWk === thisWeek
                ? 'No review yet for this week. Take 5 minutes to reflect.'
                : 'No review found for this week.'}
            </p>
            {activeWk === thisWeek && (
              <button onClick={startNew} className={`${btnPrimary} flex items-center gap-1.5 mx-auto`}>
                <Plus size={14} /> Start this week's review
              </button>
            )}
          </div>
        </Card>
      )}

      {/* Past reviews list */}
      {reviews.length > 0 && mode === 'view' && (
        <div className="mt-8">
          <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-500">Past Reviews</p>
          <div className="space-y-1">
            {allWeeks.map(wk => {
              const r = reviews.find(r => r.weekKey === wk)
              return (
                <button key={wk} onClick={() => { setActiveWk(wk); setMode('view') }}
                  className={`w-full flex items-center justify-between rounded-lg px-3 py-2 text-sm transition ${activeWk === wk ? 'bg-indigo-600/20 text-indigo-400' : 'text-slate-400 hover:bg-slate-800'}`}>
                  <span>{weekLabel(wk)}</span>
                  {r ? <span className="text-xs font-bold">{r.rating}/10</span> : <span className="text-xs text-slate-600">no review</span>}
                </button>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
