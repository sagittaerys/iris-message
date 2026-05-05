import { useState } from 'react'
import { register as apiRegister, login as apiLogin, getMe } from '@/api/auth'
import { generateKeyPair, unwrapPrivateKey, importPublicKey } from '@/crypto/keys'
import { wrapPrivateKey } from '@/crypto/keys'
import { saveKeyBundle, loadKeyBundle } from '@/crypto/storage'
import { useAuthStore } from '@/store/authStore'
import { ApiError } from '@/types'

interface AuthResult {
  ok: boolean
  error?: string
}

export function useAuth() {
  const [loading, setLoading] = useState(false)
  const setSession = useAuthStore((s) => s.setSession)
  const logout = useAuthStore((s) => s.logout)

  const register = async (username: string, password: string): Promise<AuthResult> => {
    setLoading(true)
    try {
      
      const { publicKeyB64, privateKey, publicKey } = await generateKeyPair()

   
      const { wrappedPrivateKey, pbkdf2Salt } = await wrapPrivateKey(privateKey, password)

     
      const { access_token, refresh_token } = await apiRegister({
        username,
        password,
        public_key: publicKeyB64,
        wrapped_private_key: wrappedPrivateKey,
        pbkdf2_salt: pbkdf2Salt,
      })

     
      await saveKeyBundle({ wrappedPrivateKey, pbkdf2Salt, publicKeyB64 })

    
      const user = await getMe()

     
      await setSession({ accessToken: access_token, refreshToken: refresh_token, user, privateKey, publicKey })

      return { ok: true }
    } catch (e) {
      const msg = e instanceof ApiError ? e.detail : 'Registration failed'
      return { ok: false, error: msg }
    } finally {
      setLoading(false)
    }
  }

  const login = async (username: string, password: string): Promise<AuthResult> => {
    setLoading(true)
    try {
      
      const { access_token, refresh_token } = await apiLogin({ username, password })

     
      const { setAccessToken } = await import('@/api/client')
      setAccessToken(access_token)

      const user = await getMe()

     
      const { wrappedPrivateKey, pbkdf2Salt, publicKeyB64 } = {
        wrappedPrivateKey: user.wrapped_private_key,
        pbkdf2Salt: user.pbkdf2_salt,
        publicKeyB64: user.public_key,
      }

      const privateKey = await unwrapPrivateKey(wrappedPrivateKey, pbkdf2Salt, password)
      const publicKey = await importPublicKey(publicKeyB64)

    
      await saveKeyBundle({ wrappedPrivateKey, pbkdf2Salt, publicKeyB64 })

     
      await setSession({ accessToken: access_token, refreshToken: refresh_token, user, privateKey, publicKey })

      return { ok: true }
    } catch (e) {
      const msg = e instanceof ApiError
        ? e.status === 401 ? 'Invalid username or password' : e.detail
        : 'Login failed'
      return { ok: false, error: msg }
    } finally {
      setLoading(false)
    }
  }

  // attempts to silently restore session using stored refresh token. returns true if successful.
  const restoreSession = async (): Promise<boolean> => {
    const { refreshSession } = useAuthStore.getState()
    return refreshSession()
  }

  return { register, login, logout, restoreSession, loading }
}