import { create } from 'zustand'
import { ConversationSummary, MessageResponse } from '@/types'

interface ConversationState {
  conversations: ConversationSummary[]
  activeUserId: string | null

  setConversations: (list: ConversationSummary[]) => void
  setActiveUserId: (userId: string | null) => void

  upsertFromMessage: (msg: MessageResponse, currentUserId: string) => void
  startConversationWith: (userId: string, username: string) => void
  clearAll: () => void
}

export const useConversationStore = create<ConversationState>((set, get) => ({
  conversations: [],
  activeUserId: null,

  setConversations: (list) => set({ conversations: list }),
  setActiveUserId: (userId) => set({ activeUserId: userId }),

  upsertFromMessage: (msg, currentUserId) => {
    const partnerId = msg.sender_id === currentUserId ? msg.recipient_id : msg.sender_id
    const partnerUsername =
      msg.sender_id === currentUserId ? msg.recipient_id : msg.sender_username

    set((state) => {
      const existing = state.conversations.find((c) => c.user_id === partnerId)
      const updated: ConversationSummary = existing
        ? { ...existing, last_message: msg }
        : {
            user_id: partnerId,
            username: partnerUsername,
            last_message: msg,
            unread_count: msg.sender_id !== currentUserId ? 1 : 0,
          }

      const filtered = state.conversations.filter((c) => c.user_id !== partnerId)
      return { conversations: [updated, ...filtered] }
    })
  },

  startConversationWith: (userId, username) => {
    const exists = get().conversations.some((c) => c.user_id === userId)
    if (!exists) {
      set((state) => ({
        conversations: [
          { user_id: userId, username, last_message: null, unread_count: 0 },
          ...state.conversations,
        ],
      }))
    }
    set({ activeUserId: userId })
  },

  clearAll: () => set({ conversations: [], activeUserId: null }),
}))