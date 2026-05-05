import { WSIncomingFrame, WSMessageSendFrame } from '@/types'
import { BASE_URL } from './client'

const WS_BASE = BASE_URL.replace('https://', 'wss://').replace('http://', 'ws://')
const MAX_BACKOFF_MS = 30_000
const BASE_BACKOFF_MS = 1_000

type MessageHandler = (frame: WSIncomingFrame) => void
type TokenProvider = () => Promise<string | null>

export class IrisWebSocket {
  private ws: WebSocket | null = null
  private handlers: Set<MessageHandler> = new Set()
  private reconnectAttempt = 0
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null
  private destroyed = false
  private tokenProvider: TokenProvider

  constructor(tokenProvider: TokenProvider) {
    this.tokenProvider = tokenProvider
  }

  // connect
  async connect(): Promise<void> {
    if (this.destroyed) return

    const token = await this.tokenProvider()
    if (!token) {
      console.warn('[WS] No access token — cannot connect')
      return
    }

    const url = `${WS_BASE}/ws?token=${encodeURIComponent(token)}`
    this.ws = new WebSocket(url)

    this.ws.onopen = () => {
      console.info('[WS] Connected')
      this.reconnectAttempt = 0
    }

    this.ws.onmessage = (event: MessageEvent<string>) => {
      try {
        const frame = JSON.parse(event.data) as WSIncomingFrame
        this.handlers.forEach((h) => h(frame))
      } catch {
        console.warn('[WS] Unparseable frame received')
      }
    }

    this.ws.onclose = (event) => {
      console.info(`[WS] Closed (code=${event.code})`)
      if (!this.destroyed) {
        this.scheduleReconnect()
      }
    }

    this.ws.onerror = () => {
      console.warn('[WS] Error — closing')
      this.ws?.close()
    }
  }

 
// send
  send(frame: WSMessageSendFrame): boolean {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(frame))
      return true
    }
    return false
  }

  
// reconnect
  private scheduleReconnect(): void {
    const backoff = Math.min(
      BASE_BACKOFF_MS * 2 ** this.reconnectAttempt,
      MAX_BACKOFF_MS,
    )
    this.reconnectAttempt++
    console.info(`[WS] Reconnecting in ${backoff}ms (attempt ${this.reconnectAttempt})`)
    this.reconnectTimer = setTimeout(() => this.connect(), backoff)
  }

 
// handlers
  onMessage(handler: MessageHandler): () => void {
    this.handlers.add(handler)
    return () => this.handlers.delete(handler)
  }

  // destroy
  destroy(): void {
    this.destroyed = true
    if (this.reconnectTimer) clearTimeout(this.reconnectTimer)
    this.ws?.close(1000, 'Logout')
    this.ws = null
    this.handlers.clear()
  }

  get isConnected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN
  }
}