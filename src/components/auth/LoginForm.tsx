import React, { useState } from 'react'
import { Eye, EyeOff } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { Input } from '@/components/ui/input'

interface LoginFormProps { onSwitch: () => void }

export function LoginForm({ onSwitch }: LoginFormProps) {
  const { login, loading } = useAuth()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError(null)
    if (!username.trim() || !password) { setError('Please fill in all fields'); return }
    const result = await login(username.trim(), password)
    if (!result.ok) setError(result.error ?? 'Login failed')
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5 w-full max-w-md" noValidate>

      {/* Username */}
      <div className="flex flex-col gap-2">
        <label className="text-xs font-bold tracking-widest uppercase text-zinc-400" style={{ fontFamily: 'Lato, sans-serif' }}>
          Username
        </label>
        <Input
          type="text"
          value={username}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setUsername(e.target.value)}
          placeholder="    Your Username"
          autoComplete="username"
          autoFocus
          disabled={loading}
          className="h-12 px-4 rounded-2xl bg-zinc-50 border-zinc-200 text-sm placeholder:text-zinc-300 pl-4 focus-visible:border-zinc-900 focus-visible:ring-0"
        />
      </div>

      {/* Password */}
      <div className="flex flex-col gap-2">
        <label className="text-xs font-bold tracking-widest uppercase text-zinc-400" style={{ fontFamily: 'Lato, sans-serif' }}>
          Password
        </label>
        <div className="relative">
          <Input
            type={showPassword ? 'text' : 'password'}
            value={password}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPassword(e.target.value)}
            placeholder="    ••••••••"
            autoComplete="current-password"
            disabled={loading}
            className="h-12 px-4 pr-12 rounded-2xl bg-zinc-50 border-zinc-200 text-sm placeholder:text-zinc-300 focus-visible:border-zinc-900 focus-visible:ring-0"
          />
          <button
            type="button"
            onClick={() => setShowPassword(v => !v)}
            className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-zinc-400 hover:text-zinc-700 transition-colors cursor-pointer"
          >
            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {error && (
        <p className="text-xs text-red-500 animate-fade-in -mt-2">{error}</p>
      )}

      <button
        type="submit"
        disabled={loading}
        className="w-full h-12 rounded-2xl bg-zinc-900 text-white text-sm font-semibold tracking-wide hover:bg-zinc-800 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
        style={{ fontFamily: 'Lato, sans-serif' }}
      >
        {loading ? (
          <span className="flex items-center justify-center gap-2">
            <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
            </svg>
            Unlocking vault...
          </span>
        ) : 'Sign in'}
      </button>

      <p className="text-center text-sm text-zinc-400">
        No account?{' '}
        <button type="button" onClick={onSwitch} className="text-zinc-900 font-semibold hover:underline cursor-pointer">
          Register
        </button>
      </p>

    </form>
  )
}