import {
  ConversationSummary,
  MessageResponse,
  PaginatedMessages,
  SendMessagePayload,
} from '@/types'
import { apiRequest } from './client'

export async function sendMessage(payload: SendMessagePayload): Promise<MessageResponse> {
  return apiRequest<MessageResponse>('/messages', {
    method: 'POST',
    body: payload,
  })
}

export async function getConversations(): Promise<ConversationSummary[]> {
  return apiRequest<ConversationSummary[]>('/conversations')
}

export async function getConversationMessages(
  userId: string,
  before?: string,
): Promise<PaginatedMessages> {
  const params = new URLSearchParams()
  if (before) params.set('before', before)
  const qs = params.toString() ? `?${params.toString()}` : ''
  return apiRequest<PaginatedMessages>(`/conversations/${userId}/messages${qs}`)
}