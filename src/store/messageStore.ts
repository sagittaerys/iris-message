import { create } from 'zustand'
import { DecryptedMessage, EncryptedPayload, MessageResponse } from '@/types'
import { decryptMessage } from '@/crypto/messaging'

interface MessageState {
  conversations: Record<string, DecryptedMessage[]>
  cursors: Record<string, string | null>

  addMessage: (
    message: MessageResponse,
    currentUserId: string,
    privateKey: CryptoKey,
  ) => Promise<void>

  prependMessages: (
    userId: string,
    messages: MessageResponse[],
    currentUserId: string,
    privateKey: CryptoKey,
    cursor: string | null,
  ) => Promise<void>

  clearConversation: (userId: string) => void
  clearAll: () => void
}

async function decryptSafe(
  msg: MessageResponse,
  currentUserId: string,
  privateKey: CryptoKey,
): Promise<DecryptedMessage> {
  const payload: EncryptedPayload = {
    ciphertext: msg.payload.ciphertext,
    iv: msg.payload.iv,
    encrypted_key: msg.payload.encryptedKey,
    encrypted_key_for_self: msg.payload.encryptedKeyForSelf,
  }
  const isSentByMe = msg.from_user_id === currentUserId

  try {
    const plaintext = await decryptMessage(payload, privateKey, isSentByMe)
    return {
      id: msg.id,
      senderId: msg.from_user_id,
      senderUsername: '',
      recipientId: msg.to_user_id,
      plaintext,
      timestamp: msg.created_at,
    }
  } catch {
    return {
      id: msg.id,
      senderId: msg.from_user_id,
      senderUsername: '',
      recipientId: msg.to_user_id,
      plaintext: '',
      timestamp: msg.created_at,
      decryptionFailed: true,
    }
  }
}

export const useMessageStore = create<MessageState>((set) => ({
  conversations: {},
  cursors: {},

  addMessage: async (message, currentUserId, privateKey) => {
    const decrypted = await decryptSafe(message, currentUserId, privateKey)
    const partnerId =
      message.from_user_id === currentUserId ? message.to_user_id : message.from_user_id

    set((state) => {
      const existing = state.conversations[partnerId] ?? []
      if (existing.some((m) => m.id === decrypted.id)) return state
      return {
        conversations: {
          ...state.conversations,
          [partnerId]: [...existing, decrypted],
        },
      }
    })
  },

  prependMessages: async (userId, messages, currentUserId, privateKey, cursor) => {
    const decrypted = await Promise.all(
      messages.map((m) => decryptSafe(m, currentUserId, privateKey)),
    )

    set((state) => {
      const existing = state.conversations[userId] ?? []
      const existingIds = new Set(existing.map((m) => m.id))
      const fresh = decrypted.filter((m) => !existingIds.has(m.id))
      return {
        conversations: {
          ...state.conversations,
          [userId]: [...fresh.reverse(), ...existing],
        },
        cursors: {
          ...state.cursors,
          [userId]: cursor,
        },
      }
    })
  },

  clearConversation: (userId) => {
    set((state) => {
      const { [userId]: _, ...rest } = state.conversations
      return { conversations: rest }
    })
  },

  clearAll: () => set({ conversations: {}, cursors: {} }),
}))