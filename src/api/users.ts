import { PublicUserProfile, UserSearchResult } from '@/types'
import { apiRequest } from './client'

export async function searchUsers(query: string): Promise<UserSearchResult[]> {
  const params = new URLSearchParams({ q: query })
  return apiRequest<UserSearchResult[]>(`/users/search?${params.toString()}`)
}

export async function getUserPublicKey(userId: string): Promise<PublicUserProfile> {
  return apiRequest<PublicUserProfile>(`/users/${userId}/public-key`)
}