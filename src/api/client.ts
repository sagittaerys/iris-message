import { ApiError, ApiErrorBody } from '@/types'

export const BASE_URL = import.meta.env.VITE_API_BASE_URL as string


let _accessToken: string | null = null

export function setAccessToken(token: string | null): void {
  _accessToken = token
}

export function getAccessToken(): string | null {
  return _accessToken
}

interface RequestOptions extends Omit<RequestInit, 'body'> {
  body?: unknown
  auth?: boolean 
}

export async function apiRequest<T>(
  path: string,
  options: RequestOptions = {},
): Promise<T> {
  const { body, auth = true, headers: extraHeaders, ...rest } = options

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(extraHeaders as Record<string, string>),
  }

  if (auth && _accessToken) {
    headers['Authorization'] = `Bearer ${_accessToken}`
  }

  const fetchInit: RequestInit = {
    ...rest,
    headers,
  }
  if (body !== undefined) {
    fetchInit.body = JSON.stringify(body)
  }

  const response = await fetch(`${BASE_URL}${path}`, fetchInit)

  if (!response.ok) {
    let detail = `HTTP ${response.status}`
    try {
      const err = (await response.json()) as ApiErrorBody
      detail = err.detail ?? detail
    } catch {
     
    }
    throw new ApiError(response.status, detail)
  }

  
  if (response.status === 204) {
    return undefined as T
  }

  return response.json() as Promise<T>
}