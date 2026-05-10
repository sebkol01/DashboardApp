import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useWhoop } from '../hooks/useWhoop'

const TOKEN_URL = '/api/whoop-token'

export function WhoopCallback() {
  const navigate = useNavigate()
  const { saveTokens } = useWhoop()
  const [status, setStatus] = useState('Connecting to Whoop…')
  const done = useRef(false)

  useEffect(() => {
    if (done.current) return
    done.current = true

    const params = new URLSearchParams(window.location.search)
    const code = params.get('code')
    const state = params.get('state')
    const savedState = sessionStorage.getItem('whoop_state')
    const verifier = sessionStorage.getItem('whoop_verifier')
    const clientId = sessionStorage.getItem('whoop_client_id')
    const clientSecret = sessionStorage.getItem('whoop_client_secret')
    console.log('[Whoop callback] clientId:', clientId, '| secret present:', !!clientSecret, '| secret length:', clientSecret?.length)

    if (!code || state !== savedState) {
      setStatus('Auth failed — state mismatch. Redirecting…')
      setTimeout(() => navigate('/'), 2000)
      return
    }

    const redirectUri = `${window.location.origin}/whoop-callback`

    const bodyParams = new URLSearchParams({
      grant_type: 'authorization_code',
      code,
      client_id: clientId,
      redirect_uri: redirectUri,
      code_verifier: verifier,
    })
    if (clientSecret) bodyParams.set('client_secret', clientSecret)
    const headers = { 'Content-Type': 'application/x-www-form-urlencoded' }
    console.log('[Whoop callback] sending params:', [...bodyParams.keys()])
    fetch(TOKEN_URL, { method: 'POST', headers, body: bodyParams })
      .then(async (r) => {
        const text = await r.text()
        console.log('[Whoop callback] status:', r.status, 'body:', text)
        let json
        try { json = JSON.parse(text) } catch { throw new Error(`Non-JSON response: ${text}`) }
        if (!json.access_token) throw new Error(`Whoop error: ${json.error} — ${json.error_description ?? text}`)
        return json
      })
      .then((json) => {
        localStorage.setItem('whoop_pending_tokens', JSON.stringify({
          access_token: json.access_token,
          refresh_token: json.refresh_token,
          expires_at: Date.now() + json.expires_in * 1000,
        }))
        sessionStorage.removeItem('whoop_verifier')
        sessionStorage.removeItem('whoop_state')
        sessionStorage.removeItem('whoop_client_id')
        sessionStorage.removeItem('whoop_client_secret')
        setStatus('Connected! Redirecting…')
        setTimeout(() => navigate('/'), 1500)
      })
      .catch((err) => {
        console.error('[Whoop callback] token exchange failed:', err)
        setStatus(`Token exchange failed: ${err.message}`)
        setTimeout(() => navigate('/'), 6000)
      })
  }, [navigate, saveTokens])

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-900">
      <div className="text-center">
        <div className="mb-4 h-8 w-8 mx-auto animate-spin rounded-full border-2 border-indigo-500 border-t-transparent" />
        <p className="text-slate-300">{status}</p>
      </div>
    </div>
  )
}
