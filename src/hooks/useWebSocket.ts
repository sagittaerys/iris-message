import { useEffect, useRef, useState } from 'react'
import { IrisWebSocket } from '@/api/websocket'
import { useAuthStore } from '@/store/authStore'
import { useMessageStore } from '@/store/messageStore'
import { useConversationStore } from '@/store/conversationStore'
import { ConnectionStatus, WSMessageReceiveFrame } from '@/types'
import { getAccessToken } from '@/api/client'

export function useWebSocket() {
  const wsRef = useRef<IrisWebSocket | null>(null)
  const [status, setStatus] = useState<ConnectionStatus>('disconnected')

  const { isAuthenticated, user, privateKey } = useAuthStore()
  const addMessage = useMessageStore((s) => s.addMessage)
  const upsertFromMessage = useConversationStore((s) => s.upsertFromMessage)

  useEffect(() => {
    if (!isAuthenticated || !user || !privateKey) return

    const ws = new IrisWebSocket(async () => {
      // token provider - always returns fresh token from memory
      return getAccessToken()
    })

    wsRef.current = ws

    // status tracking via monkey-patching connect/destroy
    setStatus('connecting')
    ws.connect().then(() => setStatus('connected')).catch(() => setStatus('error'))

    // subscribe to incoming messages
    const unsub = ws.onMessage(async (frame) => {
      if (frame.type === 'message.receive') {
        const { message } = frame as WSMessageReceiveFrame
        if (!privateKey || !user) return
        await addMessage(message, user.id, privateKey)
        upsertFromMessage(message, user.id)
      }
    })

    return () => {
      unsub()
      ws.destroy()
      wsRef.current = null
      setStatus('disconnected')
    }
  }, [isAuthenticated, user?.id, privateKey])

  const sendFrame = (frame: Parameters<IrisWebSocket['send']>[0]) => {
    return wsRef.current?.send(frame) ?? false
  }

  return { status, sendFrame, ws: wsRef.current }
}

// honestly i very much like the idea of websockets. the fact that it helps keeps connections between the client and server alive feels nice.... tho would redis fit into this in one way?