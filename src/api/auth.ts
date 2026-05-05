import {
  AuthResponse,
  LoginPayload,
  RefreshPayload,
  RegisterPayload,
  UserProfile,
} from '@/types'
import { apiRequest } from './client'

export async function register(payload: RegisterPayload): Promise<AuthResponse> {
  return apiRequest<AuthResponse>('/auth/register', {
    method: 'POST',
    body: payload,
    auth: false,
  })
}

export async function login(payload: LoginPayload): Promise<AuthResponse> {
  return apiRequest<AuthResponse>('/auth/login', {
    method: 'POST',
    body: payload,
    auth: false,
  })
}

export async function refreshToken(payload: RefreshPayload): Promise<AuthResponse> {
  return apiRequest<AuthResponse>('/auth/refresh', {
    method: 'POST',
    body: payload,
    auth: false, 
  })
}

export async function logout(refreshToken: string): Promise<void> {
  return apiRequest<void>('/auth/logout', {
    method: 'POST',
    body: { refresh_token: refreshToken },
  })
}

export async function getMe(): Promise<UserProfile> {
  return apiRequest<UserProfile>('/auth/me')
}