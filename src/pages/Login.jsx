import { useAuth } from '../contexts/AuthContext'
import { LogIn } from 'lucide-react'

export function Login() {
  const { signInWithGoogle } = useAuth()
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-slate-900 p-4">
      <div className="w-full max-w-sm rounded-2xl bg-slate-800 p-8 text-center shadow-2xl">
        <div className="mb-2 text-4xl">🏠</div>
        <h1 className="mb-1 text-2xl font-bold text-slate-100">Dashboard</h1>
        <p className="mb-8 text-sm text-slate-400">
          Your personal productivity hub — synced across all devices.
        </p>
        <button
          onClick={signInWithGoogle}
          className="flex w-full items-center justify-center gap-3 rounded-xl bg-white px-4 py-3 text-sm font-semibold text-slate-900 shadow transition hover:bg-slate-100"
        >
          <svg width="18" height="18" viewBox="0 0 48 48">
            <path fill="#EA4335" d="M24 9.5c3.5 0 6.3 1.2 8.4 3.1l6.3-6.3C34.8 2.7 29.8.5 24 .5 14.8.5 7 6.1 3.5 14l7.4 5.7C12.7 13.2 17.9 9.5 24 9.5z"/>
            <path fill="#4285F4" d="M46.6 24.5c0-1.6-.1-3.1-.4-4.6H24v8.7h12.7c-.5 2.9-2.2 5.4-4.7 7l7.3 5.7c4.3-3.9 6.8-9.7 6.8-16.8z"/>
            <path fill="#FBBC05" d="M10.9 28.6A14.5 14.5 0 0 1 9.5 24c0-1.6.3-3.1.8-4.5L3 13.7A23.5 23.5 0 0 0 .5 24c0 3.8.9 7.4 2.5 10.6l7.9-6z"/>
            <path fill="#34A853" d="M24 47.5c5.8 0 10.7-1.9 14.3-5.2l-7.3-5.7c-2 1.3-4.5 2.1-7 2.1-6.1 0-11.3-3.7-13.2-9.1l-7.9 6C6.8 41.8 14.8 47.5 24 47.5z"/>
          </svg>
          Sign in with Google
        </button>
        <p className="mt-6 text-xs text-slate-600">
          Data synced via Firebase · stays private to your account
        </p>
      </div>
    </div>
  )
}
