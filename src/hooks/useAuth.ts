import { useState } from "react";
import { register as apiRegister, login as apiLogin, getMe } from "@/api/auth";
import {
  generateKeyPair,
  unwrapPrivateKey,
  importPublicKey,
  wrapPrivateKey,
} from "@/crypto/keys";
import { saveKeyBundle, loadKeyBundle } from "@/crypto/storage";
import { setAccessToken } from "@/api/client";
import { useAuthStore } from "@/store/authStore";
import { ApiError } from "@/types";

interface AuthResult {
  ok: boolean;
  error?: string;
}

export function useAuth() {
  const [loading, setLoading] = useState(false);
  const setSession = useAuthStore((s) => s.setSession);
  const logout = useAuthStore((s) => s.logout);

  const register = async (
    username: string,
    password: string,
  ): Promise<AuthResult> => {
    setLoading(true);
    try {
      const { publicKeyB64, privateKey, publicKey } = await generateKeyPair();

      const { wrappedPrivateKey, pbkdf2Salt, iv } = await wrapPrivateKey(
        privateKey,
        password,
      );

      const { access_token, refresh_token } = await apiRegister({
        username,
        display_name: username,
        password,
        public_key: publicKeyB64,
        wrapped_private_key: wrappedPrivateKey,
        pbkdf2_salt: pbkdf2Salt,
      });

      await saveKeyBundle({ wrappedPrivateKey, pbkdf2Salt, publicKeyB64, iv });

      setAccessToken(access_token)

      const user = await getMe();

      await setSession({
        accessToken: access_token,
        refreshToken: refresh_token,
        user,
        privateKey,
        publicKey,
      });

      return { ok: true };
    } catch (e) {
      console.error("Registration error:", e);
      const msg = e instanceof ApiError ? e.detail : "Registration failed";
      return { ok: false, error: msg };
    } finally {
      setLoading(false);
    }
  };

  const login = async (
    username: string,
    password: string,
  ): Promise<AuthResult> => {
    setLoading(true);
    try {
      const { access_token, refresh_token } = await apiLogin({
        username,
        password,
      });

      setAccessToken(access_token);

      const user = await getMe();

      const bundle = await loadKeyBundle();
      if (!bundle) {
        return { ok: false, error: "No key bundle found — please register again" };
      }

      const privateKey = await unwrapPrivateKey(
        user.wrapped_private_key,
        user.pbkdf2_salt,
        password,
        bundle.iv,
      );

      const publicKey = await importPublicKey(user.public_key);

      await saveKeyBundle({
        wrappedPrivateKey: user.wrapped_private_key,
        pbkdf2Salt: user.pbkdf2_salt,
        publicKeyB64: user.public_key,
        iv: bundle.iv,
      });

      await setSession({
        accessToken: access_token,
        refreshToken: refresh_token,
        user,
        privateKey,
        publicKey,
      });

      return { ok: true };
    } catch (e) {
      const msg =
        e instanceof ApiError
          ? e.status === 401
            ? "Invalid username or password"
            : e.detail
          : "Login failed";
      return { ok: false, error: msg };
    } finally {
      setLoading(false);
    }
  };

  const restoreSession = async (): Promise<boolean> => {
    const { refreshSession } = useAuthStore.getState();
    return refreshSession();
  };

  return { register, login, logout, restoreSession, loading };
}