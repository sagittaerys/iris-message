
import { create } from 'zustand'
import { UserProfile } from '@/types'
import { setAccessToken } from '@/api/client'
import { clearVault, saveRefreshToken, loadRefreshToken } from '@/crypto/storage'
import { logout as apiLogout, refreshToken as apiRefresh } from '@/api/auth'

const REFRESH_INTERVAL_MS = 14 * 60 * 1000 

interface AuthState {
  accessToken: string | null
  user: UserProfile | null
  isAuthenticated: boolean

  // crypto keys
  privateKey: CryptoKey | null
  publicKey: CryptoKey | null

  // internal
  _refreshTimer: ReturnType<typeof setInterval> | null


  setSession: (params: {
    accessToken: string
    refreshToken: string
    user: UserProfile
    privateKey: CryptoKey
    publicKey: CryptoKey
  }) => Promise<void>

  refreshSession: () => Promise<boolean>
  logout: () => Promise<void>
  clearSession: () => void
}

export const useAuthStore = create<AuthState>((set, get) => ({
  accessToken: null,
  user: null,
  isAuthenticated: false,
  privateKey: null,
  publicKey: null,
  _refreshTimer: null,

  setSession: async ({ accessToken, refreshToken, user, privateKey, publicKey }) => {
    
    setAccessToken(accessToken)

    // persisting refresh token.... hope this doesn't make me come back
    await saveRefreshToken(refreshToken)

  
    const existing = get()._refreshTimer
    if (existing) clearInterval(existing)

   
    const timer = setInterval(async () => {
      const ok = await get().refreshSession()
      if (!ok) get().clearSession()
    }, REFRESH_INTERVAL_MS)

    set({
      accessToken,
      user,
      isAuthenticated: true,
      privateKey,
      publicKey,
      _refreshTimer: timer,
    })
  },

  refreshSession: async (): Promise<boolean> => {
    try {
      const storedToken = await loadRefreshToken()
      if (!storedToken) return false

      const { access_token, refresh_token } = await apiRefresh({
        refresh_token: storedToken,
      })

      setAccessToken(access_token)
      await saveRefreshToken(refresh_token)
      set({ accessToken: access_token })
      return true
    } catch {
      return false
    }
  },

  logout: async () => {
    try {
      const storedToken = await loadRefreshToken()
      if (storedToken) await apiLogout(storedToken)
    } catch {
    
    }
    get().clearSession()
  },

  clearSession: () => {
    const timer = get()._refreshTimer
    if (timer) clearInterval(timer)

    setAccessToken(null)
    clearVault().catch(() => {})

    set({
      accessToken: null,
      user: null,
      isAuthenticated: false,
      privateKey: null,
      publicKey: null,
      _refreshTimer: null,
    })
  },
}))