import React, { useState } from 'react'
import { Eye, EyeOff } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { Input } from '@/components/ui/input'

interface RegisterFormProps { onSwitch: () => void }

export function RegisterForm({ onSwitch }: RegisterFormProps) {
  const { register, loading } = useAuth()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  const validate = () => {
    const next: Record<string, string> = {}
    if (!username.trim()) next['username'] = 'Required'
    else if (username.length < 3) next['username'] = 'Min 3 characters'
    else if (!/^[a-zA-Z0-9_]+$/.test(username)) next['username'] = 'Letters, numbers, underscores only'
    if (!password) next['password'] = 'Required'
    else if (password.length < 8) next['password'] = 'Min 8 characters'
    if (password !== confirm) next['confirm'] = 'Passwords do not match'
    setErrors(next)
    return Object.keys(next).length === 0
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!validate()) return
    const result = await register(username.trim(), password)
    if (!result.ok) setErrors({ form: result.error ?? 'Registration failed' })
  }

  const inputClass = (key: string) =>
    `h-12 px-4 rounded-2xl bg-zinc-50 text-sm placeholder:text-zinc-300 focus-visible:border-zinc-900 focus-visible:ring-0 ${
      errors[key] ? 'border-red-300' : 'border-zinc-200'
    }`

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
          placeholder="Your Username"
          autoComplete="username"
          autoFocus
          disabled={loading}
          className={inputClass('username')}
        />
        {errors['username'] && <p className="text-xs text-red-500 animate-fade-in">{errors['username']}</p>}
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
            placeholder="••••••••"
            autoComplete="new-password"
            disabled={loading}
            className={`${inputClass('password')} pr-12`}
          />
          <button
            type="button"
            onClick={() => setShowPassword(v => !v)}
            className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-zinc-400 hover:text-zinc-700 transition-colors cursor-pointer"
          >
            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>
        {errors['password'] && <p className="text-xs text-red-500 animate-fade-in">{errors['password']}</p>}
      </div>

      {/* Confirm password */}
      <div className="flex flex-col gap-2">
        <label className="text-xs font-bold tracking-widest uppercase text-zinc-400" style={{ fontFamily: 'Lato, sans-serif' }}>
          Confirm Password
        </label>
        <div className="relative">
          <Input
            type={showPassword ? 'text' : 'password'}
            value={confirm}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setConfirm(e.target.value)}
            placeholder="••••••••"
            autoComplete="new-password"
            disabled={loading}
            className={`${inputClass('confirm')} pr-12`}
          />
          <button
            type="button"
            onClick={() => setShowPassword(v => !v)}
            className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-zinc-400 hover:text-zinc-700 transition-colors cursor-pointer"
          >
            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>
        {errors['confirm'] && <p className="text-xs text-red-500 animate-fade-in">{errors['confirm']}</p>}
      </div>

      {errors['form'] && (
        <p className="text-xs text-red-500 text-center animate-fade-in">{errors['form']}</p>
      )}

      <p className="text-xs text-center text-zinc-400 leading-relaxed">
        Your password encrypts your private key locally. We never see it.
      </p>

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
            Generating keys...
          </span>
        ) : 'Create account'}
      </button>

      <p className="text-center text-sm text-zinc-400">
        Already have an account?{' '}
        <button type="button" onClick={onSwitch} className="text-zinc-900 font-semibold hover:underline cursor-pointer">
          Sign in
        </button>
      </p>

    </form>
  )
}