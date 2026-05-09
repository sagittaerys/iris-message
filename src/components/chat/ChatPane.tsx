import { useEffect, useRef, useState, useCallback } from 'react'
import { Send, ShieldCheck, ArrowLeft } from 'lucide-react'
import { motion } from 'motion/react'
import { useConversationStore } from '@/store/conversationStore'
import { useMessageStore } from '@/store/messageStore'
import { useAuthStore } from '@/store/authStore'
import { useMessages } from '@/hooks/useMessages'
import { useWebSocket } from '@/hooks/useWebSocket'
import { MessageBubble } from './MessageBubble'
import { cn } from '@/lib/utils'

export function ChatPane() {
  const { activeUserId, conversations, setActiveUserId } = useConversationStore()
  const { conversations: messageMap } = useMessageStore()
  const { user } = useAuthStore()
  const { sendMessage, loadHistory, getRecipientPublicKey, sending, loadingHistory } = useMessages()
  const { status } = useWebSocket()

  const [text, setText] = useState('')
  const [recipientPublicKey, setRecipientPublicKey] = useState<string | null>(null)
  const bottomRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const activeConv = conversations.find(c => c.user_id === activeUserId)
  const messages = activeUserId ? (messageMap[activeUserId] ?? []) : []

  useEffect(() => {
    if (!activeUserId) return
    setRecipientPublicKey(null)
    loadHistory(activeUserId)
    getRecipientPublicKey(activeUserId).then(setRecipientPublicKey)
  }, [activeUserId])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages.length])

  useEffect(() => {
    const ta = textareaRef.current
    if (!ta) return
    ta.style.height = 'auto'
    ta.style.height = `${Math.min(ta.scrollHeight, 120)}px`
  }, [text])

  const handleSend = useCallback(async () => {
    if (!activeUserId || !recipientPublicKey || !text.trim()) return
    const ok = await sendMessage(activeUserId, recipientPublicKey, text.trim())
    if (ok) setText('')
  }, [activeUserId, recipientPublicKey, text, sendMessage])

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend() }
  }

  // Empty state
  if (!activeUserId || !activeConv) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center gap-4 bg-zinc-50">
        <div className="w-14 h-14 rounded-2xl bg-white border border-zinc-100 flex items-center justify-center shadow-sm">
          <ShieldCheck className="w-6 h-6 text-zinc-300" strokeWidth={1.5} />
        </div>
        <div className="text-center">
          <p style={{ fontFamily: 'Syne, sans-serif' }} className="text-base font-semibold text-zinc-900">
            Iris Messenger
          </p>
          <p className="text-sm text-zinc-400 mt-1">Select a conversation to begin</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full bg-white">

      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-4 border-b border-zinc-100 bg-white">
        {/* Back button — mobile */}
        <button
          onClick={() => setActiveUserId(null)}
          className="md:hidden w-8 h-8 rounded-full flex items-center justify-center text-zinc-500 hover:bg-zinc-100 transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>

        {/* Avatar */}
        <div className="w-10 h-10 rounded-full bg-zinc-900 flex items-center justify-center text-white text-sm font-bold shrink-0"
          style={{ fontFamily: 'Syne, sans-serif' }}>
          {activeConv.username[0]?.toUpperCase()}
        </div>

        {/* Name + status */}
        <div className="flex-1">
          <p style={{ fontFamily: 'Syne, sans-serif' }} className="text-sm font-bold text-zinc-900">
            {activeConv.username}
          </p>
          <div className="flex items-center gap-1.5">
            <div className={cn(
              'w-1.5 h-1.5 rounded-full',
              status === 'connected' ? 'bg-emerald-400' : 'bg-zinc-300'
            )} />
            <span className="text-xs text-zinc-400">
              {status === 'connected' ? 'Online' : 'Connecting...'}
            </span>
          </div>
        </div>

        {/* E2EE indicator */}
        <div className="flex items-center gap-1">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" strokeWidth={2.5} />
          <span className="text-[11px] text-emerald-600 font-medium hidden sm:block">Encrypted</span>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto py-4">
        {loadingHistory && (
          <div className="flex justify-center py-3">
            <div className="flex gap-1">
              {[0,1,2].map(i => (
                <span key={i} className="w-1.5 h-1.5 rounded-full bg-zinc-300 animate-bounce"
                  style={{ animationDelay: `${i * 0.15}s` }} />
              ))}
            </div>
          </div>
        )}

        {messages.length === 0 && !loadingHistory && (
          <div className="flex flex-col items-center justify-center h-32 gap-2">
            <p className="text-sm text-zinc-300">No messages yet</p>
            <p className="text-xs text-zinc-200">Say hello to {activeConv.username}</p>
          </div>
        )}

        <div className="flex flex-col">
          {messages.map((msg, i) => {
            const isMine = msg.senderId === user?.id
            const prevMsg = messages[i - 1]
            const nextMsg = messages[i + 1]
            const isFirst = !prevMsg || prevMsg.senderId !== msg.senderId
            const isLast = !nextMsg || nextMsg.senderId !== msg.senderId
            return (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2 }}
              >
                <MessageBubble
                  message={msg}
                  isMine={isMine}
                  isFirst={isFirst}
                  isLast={isLast}
                />
              </motion.div>
            )
          })}
        </div>

        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="px-4 py-3 border-t border-zinc-100 bg-white">
        <div className="flex items-end gap-3">
          <div className="flex-1 bg-zinc-50 border border-zinc-200 rounded-3xl px-4 py-3 focus-within:border-zinc-400 focus-within:bg-white transition-all">
            <textarea
              ref={textareaRef}
              value={text}
              onChange={e => setText(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Message..."
              rows={1}
              disabled={sending || !recipientPublicKey}
              className="w-full bg-transparent resize-none text-sm text-zinc-900 placeholder:text-zinc-300 focus:outline-none leading-relaxed max-h-[120px]"
            />
          </div>
          <button
            onClick={handleSend}
            disabled={!text.trim() || sending || !recipientPublicKey}
            className={cn(
              'w-11 h-11 rounded-full flex items-center justify-center shrink-0 transition-all cursor-pointer',
              text.trim() && !sending && recipientPublicKey
                ? 'bg-zinc-900 text-white hover:bg-zinc-700 active:scale-95'
                : 'bg-zinc-100 text-zinc-300 cursor-not-allowed'
            )}
          >
            {sending ? (
              <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
              </svg>
            ) : (
              <Send className="w-4 h-4" />
            )}
          </button>
        </div>
        <p className="text-center text-[10px] text-zinc-200 mt-2">
          Messages are encrypted before leaving your device
        </p>
      </div>
    </div>
  )
}