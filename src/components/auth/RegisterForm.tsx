import { useState } from 'react'
import { Eye, EyeOff, Lock, User } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'

interface RegisterFormProps {
  onSwitch: () => void
}

export function RegisterForm({ onSwitch }: RegisterFormProps) {
  const { register, loading } = useAuth()
  const [username, setUsername]         = useState('')
  const [password, setPassword]         = useState('')
  const [confirm, setConfirm]           = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [errors, setErrors]             = useState<Record<string, string>>({})

  const validate = (): boolean => {
    const next: Record<string, string> = {}

    if (!username.trim())
      next['username'] = 'Username is required'
    else if (username.length < 3)
      next['username'] = 'Username must be at least 3 characters'
    else if (!/^[a-zA-Z0-9_]+$/.test(username))
      next['username'] = 'Letters, numbers and underscores only'

    if (!password)
      next['password'] = 'Password is required'
    else if (password.length < 8)
      next['password'] = 'Password must be at least 8 characters'

    if (password !== confirm)
      next['confirm'] = 'Passwords do not match'

    setErrors(next)
    return Object.keys(next).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validate()) return

    const result = await register(username.trim(), password)
    if (!result.ok) {
      setErrors({ form: result.error ?? 'Registration failed' })
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5" noValidate>
      <Input
        label="Username"
        type="text"
        placeholder="Choose a username"
        value={username}
        onChange={(e) => setUsername(e.target.value)}
        prefixIcon={<User className="w-4 h-4" />}
        error={errors['username']}
        autoComplete="username"
        autoFocus
        disabled={loading}
      />

      <Input
        label="Password"
        type={showPassword ? 'text' : 'password'}
        placeholder="Create a strong password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        prefixIcon={<Lock className="w-4 h-4" />}
        suffixIcon={
          <button
            type="button"
            onClick={() => setShowPassword((v) => !v)}
            className="text-[#6b6785] hover:text-[#a8a4c8] transition-colors cursor-pointer"
            aria-label={showPassword ? 'Hide password' : 'Show password'}
          >
            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        }
        error={errors['password']}
        hint="Minimum 8 characters. This encrypts your private key."
        autoComplete="new-password"
        disabled={loading}
      />

      <Input
        label="Confirm password"
        type={showPassword ? 'text' : 'password'}
        placeholder="Repeat your password"
        value={confirm}
        onChange={(e) => setConfirm(e.target.value)}
        prefixIcon={<Lock className="w-4 h-4" />}
        error={errors['confirm']}
        autoComplete="new-password"
        disabled={loading}
      />

      {errors['form'] && (
        <p className="text-sm text-[#f87171] text-center animate-fade-in">
          {errors['form']}
        </p>
      )}

      <Button
        type="submit"
        variant="gradient"
        size="lg"
        loading={loading}
        className="mt-1 w-full"
      >
        {loading ? 'Generating keys...' : 'Create account'}
      </Button>

      <p className="text-center text-sm text-[#6b6785]">
        Already have an account?
        <button
          type="button"
          onClick={onSwitch}
          className="text-[#9d8dfa] hover:text-[#7c5ef6] font-medium transition-colors cursor-pointer"
        >
          Sign in
        </button>
      </p>
    </form>
  )
}