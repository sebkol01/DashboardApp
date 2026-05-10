import { useState, useEffect, useCallback } from 'react'
import { Rss, RefreshCw, Trash2, Plus, ExternalLink, Settings } from 'lucide-react'
import { useFirestore } from '../hooks/useFirestore'
import { Card } from '../components/Card'
import { Modal, Field, inputCls, btnPrimary, btnSecondary } from '../components/Modal'
import { uid } from '../utils/export'
import { fetchRSS, formatDate } from '../utils/rss'

const DEFAULT_FEEDS = [
  { id: 'nrk', name: 'NRK', url: 'https://www.nrk.no/toppsaker.rss' },
  { id: 'bbc', name: 'BBC News', url: 'https://feeds.bbci.co.uk/news/rss.xml' },
  { id: 'guardian', name: 'The Guardian', url: 'https://www.theguardian.com/world/rss' },
]

const GUARDIAN_API = 'https://content.guardianapis.com/search'

const INIT = { feeds: DEFAULT_FEEDS, guardianKey: '' }

export function News() {
  const [data, setData] = useFirestore('news', INIT)
  const [articles, setArticles] = useState({})
  const [guardianArticles, setGuardianArticles] = useState([])
  const [loading, setLoading] = useState({})
  const [selectedArticle, setSelectedArticle] = useState(null)
  const [activeFeed, setActiveFeed] = useState(null)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [feedForm, setFeedForm] = useState({})
  const [tempGuardianKey, setTempGuardianKey] = useState('')

  const feeds = data.feeds?.length ? data.feeds : DEFAULT_FEEDS

  const loadFeed = useCallback(async (feed) => {
    setLoading(l => ({ ...l, [feed.id]: true }))
    try {
      const items = await fetchRSS(feed.url)
      setArticles(a => ({ ...a, [feed.id]: items }))
    } catch {
      setArticles(a => ({ ...a, [feed.id]: [] }))
    }
    setLoading(l => ({ ...l, [feed.id]: false }))
  }, [])

  const loadGuardian = useCallback(async (key) => {
    if (!key) return
    setLoading(l => ({ ...l, guardian: true }))
    try {
      const url = `${GUARDIAN_API}?api-key=${key}&show-fields=bodyText,headline,byline,trailText&page-size=20`
      const res = await fetch(url)
      const json = await res.json()
      setGuardianArticles(
        (json.response?.results || []).map(r => ({
          title: r.fields?.headline || r.webTitle,
          description: r.fields?.bodyText || r.fields?.trailText || '',
          author: r.fields?.byline || '',
          pubDate: formatDate(r.webPublicationDate),
          link: r.webUrl,
          guid: r.id,
        })),
      )
    } catch { /* ignore */ }
    setLoading(l => ({ ...l, guardian: false }))
  }, [])

  useEffect(() => {
    if (activeFeed) {
      const feed = feeds.find(f => f.id === activeFeed)
      if (feed && !articles[feed.id]) loadFeed(feed)
    }
  }, [activeFeed])

  useEffect(() => {
    if (feeds.length > 0 && !activeFeed) {
      setActiveFeed(feeds[0].id)
    }
  }, [feeds.length])

  const addFeed = () => {
    if (!feedForm.url) return
    const newFeed = { id: uid(), name: feedForm.name || feedForm.url, url: feedForm.url }
    setData(d => ({ ...d, feeds: [...(d.feeds || DEFAULT_FEEDS), newFeed] }))
    setFeedForm({})
  }

  const deleteFeed = (id) => {
    setData(d => ({ ...d, feeds: (d.feeds || DEFAULT_FEEDS).filter(f => f.id !== id) }))
    if (activeFeed === id) setActiveFeed(feeds[0]?.id || null)
  }

  const saveGuardianKey = () => {
    setData(d => ({ ...d, guardianKey: tempGuardianKey }))
    setSettingsOpen(false)
    if (tempGuardianKey) loadGuardian(tempGuardianKey)
  }

  const currentFeed = activeFeed === 'guardian'
    ? { id: 'guardian', name: 'The Guardian (API)', items: guardianArticles }
    : feeds.find(f => f.id === activeFeed)

  const currentItems =
    activeFeed === 'guardian' ? guardianArticles : articles[activeFeed] || []

  return (
    <div className="flex flex-col md:flex-row gap-4 h-[calc(100vh-120px)] md:h-[calc(100vh-80px)]">
      {/* Feed list sidebar */}
      <div className="md:w-56 shrink-0 flex flex-col gap-2">
        <div className="flex items-center justify-between mb-1">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Feeds</p>
          <button onClick={() => { setTempGuardianKey(data.guardianKey || ''); setSettingsOpen(true) }}
            className="text-slate-500 hover:text-slate-300 transition"><Settings size={14} /></button>
        </div>

        {feeds.map(feed => (
          <button key={feed.id} onClick={() => { setActiveFeed(feed.id); setSelectedArticle(null) }}
            className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-left transition w-full ${activeFeed === feed.id ? 'bg-indigo-600/20 text-indigo-400' : 'text-slate-400 hover:bg-slate-800'}`}>
            <Rss size={13} className="shrink-0" />
            <span className="flex-1 truncate">{feed.name}</span>
            <button onClick={e => { e.stopPropagation(); loadFeed(feed) }}
              className="opacity-0 group-hover:opacity-100 hover:text-slate-200 transition">
              <RefreshCw size={11} className={loading[feed.id] ? 'animate-spin' : ''} />
            </button>
          </button>
        ))}

        {data.guardianKey && (
          <button onClick={() => { setActiveFeed('guardian'); setSelectedArticle(null); loadGuardian(data.guardianKey) }}
            className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-left transition w-full ${activeFeed === 'guardian' ? 'bg-indigo-600/20 text-indigo-400' : 'text-slate-400 hover:bg-slate-800'}`}>
            <Rss size={13} />
            <span className="flex-1 truncate">Guardian API</span>
          </button>
        )}

        <button onClick={() => { setFeedForm({}); setSettingsOpen(true) }}
          className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs text-slate-500 hover:bg-slate-800 transition mt-2">
          <Plus size={12} /> Add feed
        </button>
      </div>

      {/* Headlines + reading view */}
      <div className="flex-1 flex gap-4 overflow-hidden min-w-0">
        {/* Headlines */}
        <div className="w-full md:w-72 shrink-0 overflow-y-auto rounded-xl bg-slate-800">
          <div className="flex items-center justify-between px-3 py-2 border-b border-slate-700">
            <p className="text-sm font-semibold text-slate-300">
              {feeds.find(f => f.id === activeFeed)?.name || 'Guardian API'}
            </p>
            {activeFeed && activeFeed !== 'guardian' && (
              <button onClick={() => loadFeed(feeds.find(f => f.id === activeFeed))}
                className="text-slate-500 hover:text-slate-300 transition">
                <RefreshCw size={13} className={loading[activeFeed] ? 'animate-spin' : ''} />
              </button>
            )}
          </div>
          {loading[activeFeed] ? (
            <p className="py-6 text-center text-xs text-slate-500">Loading…</p>
          ) : currentItems.length === 0 ? (
            <div className="py-6 text-center">
              <p className="text-xs text-slate-500 mb-2">No articles loaded.</p>
              {activeFeed && activeFeed !== 'guardian' && (
                <button onClick={() => loadFeed(feeds.find(f => f.id === activeFeed))}
                  className="text-xs text-indigo-400 hover:underline">Load now</button>
              )}
            </div>
          ) : (
            <div>
              {currentItems.map((a, i) => (
                <button key={a.guid || i} onClick={() => setSelectedArticle(a)}
                  className={`w-full text-left px-3 py-3 border-b border-slate-700/50 hover:bg-slate-700/40 transition ${selectedArticle?.guid === a.guid ? 'bg-slate-700/40' : ''}`}>
                  <p className="text-sm text-slate-200 line-clamp-2 leading-snug">{a.title}</p>
                  <p className="text-xs text-slate-500 mt-1">{a.pubDate}</p>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Reading view */}
        <div className="flex-1 overflow-y-auto rounded-xl bg-slate-800 hidden md:block">
          {selectedArticle ? (
            <div className="p-6">
              <h1 className="text-xl font-bold text-slate-100 mb-2 leading-tight">{selectedArticle.title}</h1>
              <div className="flex items-center gap-2 mb-6 text-xs text-slate-500">
                {selectedArticle.author && <span>{selectedArticle.author}</span>}
                {selectedArticle.author && selectedArticle.pubDate && <span>·</span>}
                {selectedArticle.pubDate && <span>{selectedArticle.pubDate}</span>}
                {selectedArticle.link && (
                  <a href={selectedArticle.link} target="_blank" rel="noreferrer"
                    className="ml-auto flex items-center gap-1 text-indigo-400 hover:underline">
                    Original <ExternalLink size={10} />
                  </a>
                )}
              </div>
              <div className="text-sm text-slate-300 leading-relaxed whitespace-pre-wrap">
                {selectedArticle.description || 'No body text available — open the original article.'}
              </div>
            </div>
          ) : (
            <div className="flex h-full items-center justify-center">
              <p className="text-slate-600 text-sm">Select an article to read</p>
            </div>
          )}
        </div>
      </div>

      {/* Settings modal */}
      <Modal open={settingsOpen} onClose={() => setSettingsOpen(false)} title="News Settings" maxWidth="max-w-lg">
        <div className="mb-5">
          <p className="mb-3 text-sm font-medium text-slate-300">RSS Feeds</p>
          <div className="space-y-2 mb-4">
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
            <Field label="Name"><input className={inputCls} value={feedForm.name || ''} onChange={e => setFeedForm(f => ({ ...f, name: e.target.value }))} /></Field>
            <Field label="RSS URL"><input className={inputCls} value={feedForm.url || ''} onChange={e => setFeedForm(f => ({ ...f, url: e.target.value }))} placeholder="https://…/feed" /></Field>
            <button onClick={addFeed} className={`${btnPrimary} mb-2`}>Add feed</button>
          </div>
        </div>

        <div className="border-t border-slate-700 pt-4">
          <p className="mb-2 text-sm font-medium text-slate-300">Guardian API (optional)</p>
          <p className="mb-3 text-xs text-slate-500">Get a free key at <a href="https://open-platform.theguardian.com/access/" target="_blank" rel="noreferrer" className="text-indigo-400 underline">open-platform.theguardian.com</a></p>
          <Field label="API Key">
            <input className={inputCls} type="password" value={tempGuardianKey} onChange={e => setTempGuardianKey(e.target.value)} placeholder="your-guardian-api-key" />
          </Field>
          <button onClick={saveGuardianKey} className={btnPrimary}>Save</button>
        </div>
      </Modal>
    </div>
  )
}
