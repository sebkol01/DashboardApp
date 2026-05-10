import { useCallback, useEffect } from 'react'
import { useFirestore } from './useFirestore'
import { useAuth } from '../contexts/AuthContext'

const AUTH_URL = 'https://api.prod.whoop.com/oauth/oauth2/auth'
const TOKEN_URL = '/api/whoop-token'
const API_BASE = '/api/whoop-api'
const SCOPES = 'read:recovery read:sleep read:workout read:profile read:cycles'
const REDIRECT_URI = `${window.location.origin}/whoop-callback`

async function generatePKCE() {
  const array = new Uint8Array(64)
  crypto.getRandomValues(array)
  const verifier = btoa(String.fromCharCode(...array))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '')
    .slice(0, 128)
  const encoder = new TextEncoder()
  const hash = await crypto.subtle.digest('SHA-256', encoder.encode(verifier))
  const challenge = btoa(String.fromCharCode(...new Uint8Array(hash)))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '')
  return { verifier, challenge }
}

export function useWhoop() {
  const { currentUser } = useAuth()
  const [settings, setSettings] = useFirestore('settings', {
    whoopClientId: '',
    whoopClientSecret: '',
    whoopTokens: null,
    whoopCache: null,
    guardianKey: '',
  })

  useEffect(() => {
    if (!currentUser) return
    const pending = localStorage.getItem('whoop_pending_tokens')
    if (!pending) return
    try {
      const tokens = JSON.parse(pending)
      localStorage.removeItem('whoop_pending_tokens')
      setSettings(s => ({ ...s, whoopTokens: tokens }))
    } catch { localStorage.removeItem('whoop_pending_tokens') }
  }, [currentUser]) // eslint-disable-line react-hooks/exhaustive-deps

  const login = useCallback(async (overrideClientId, overrideClientSecret) => {
    const clientId = overrideClientId ?? settings.whoopClientId
    const clientSecret = overrideClientSecret ?? settings.whoopClientSecret
    if (!clientId) {
      alert('Enter your Whoop Client ID in Settings first.')
      return
    }
    const { verifier, challenge } = await generatePKCE()
    const state = Math.random().toString(36).slice(2)
    sessionStorage.setItem('whoop_verifier', verifier)
    sessionStorage.setItem('whoop_state', state)
    sessionStorage.setItem('whoop_client_id', clientId)
    sessionStorage.setItem('whoop_client_secret', clientSecret || '')

    const params = new URLSearchParams({
      client_id: clientId,
      response_type: 'code',
      redirect_uri: REDIRECT_URI,
      scope: SCOPES,
      code_challenge: challenge,
      code_challenge_method: 'S256',
      state,
    })
    window.location.href = `${AUTH_URL}?${params}`
  }, [settings.whoopClientId])

  const disconnect = useCallback(() => {
    setSettings((s) => ({ ...s, whoopTokens: null, whoopCache: null }))
  }, [setSettings])

  const fetchWithAuth = useCallback(
    async (path) => {
      const tokens = settings.whoopTokens
      if (!tokens) return null
      let { access_token, refresh_token, expires_at } = tokens

      if (Date.now() > expires_at - 60_000) {
        try {
          const refreshParams = {
            grant_type: 'refresh_token',
            refresh_token,
            client_id: settings.whoopClientId,
          }
          if (settings.whoopClientSecret) refreshParams.client_secret = settings.whoopClientSecret
          const res = await fetch(TOKEN_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams(refreshParams),
          })
          const refreshed = await res.json()
          const newTokens = {
            access_token: refreshed.access_token,
            refresh_token: refreshed.refresh_token || refresh_token,
            expires_at: Date.now() + refreshed.expires_in * 1000,
          }
          await setSettings((s) => ({ ...s, whoopTokens: newTokens }))
          access_token = newTokens.access_token
        } catch {
          return null
        }
      }

      const res = await fetch(`${API_BASE}${path}`, {
        headers: { Authorization: `Bearer ${access_token}` },
      })
      if (res.status === 404) return { records: [] }
      if (!res.ok) {
        const body = await res.text().catch(() => '')
        console.error(`[Whoop API] ${path} → ${res.status}:`, body)
        return null
      }
      return res.json()
    },
    [settings, setSettings],
  )

  const refreshData = useCallback(async () => {
    const cache = settings.whoopCache
    if (cache && cache.workouts !== undefined && Date.now() - cache.fetchedAt < 3_600_000) return cache

    const [recoveryRes, sleepRes, cycleRes, workoutRes] = await Promise.all([
      fetchWithAuth('/recovery?limit=25'),
      fetchWithAuth('/activity/sleep?limit=25'),
      fetchWithAuth('/cycle?limit=25'),
      fetchWithAuth('/activity/workout?limit=25'),
    ])

    if (!cycleRes) return null

    const newCache = {
      fetchedAt: Date.now(),
      recovery: recoveryRes?.records || [],
      sleep: sleepRes?.records || [],
      cycles: cycleRes?.records || [],
      workouts: workoutRes?.records || [],
    }
    await setSettings((s) => ({ ...s, whoopCache: newCache }))
    return newCache
  }, [fetchWithAuth, settings.whoopCache, setSettings])

  return {
    isConnected: !!settings.whoopTokens,
    clientId: settings.whoopClientId,
    clientSecret: settings.whoopClientSecret,
    setClientId: (id) => setSettings((s) => ({ ...s, whoopClientId: id })),
    setClientSecret: (secret) => setSettings((s) => ({ ...s, whoopClientSecret: secret })),
    cache: settings.whoopCache,
    login,
    disconnect,
    refreshData,
    saveTokens: (tokens) => setSettings((s) => ({ ...s, whoopTokens: tokens })),
  }
}
