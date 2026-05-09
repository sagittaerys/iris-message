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

function capitalize(str: string): string {
  if (!str) return ''
  return str.charAt(0).toUpperCase() + str.slice(1)
}

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

  // empty state
  if (!activeUserId || !activeConv) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center gap-5 bg-white">
        <div className="w-10 h-10 rounded-[20px] bg-zinc-50 border border-zinc-100 flex items-center justify-center">
          <img src="/iris-logo.png" alt="Logo" className="w-10 h-10" />
        </div>
        <div className="text-center">
          <p
            style={{ fontFamily: 'Syne, sans-serif' }}
            className="text-[15px] font-bold text-zinc-900"
          >
            Iris Messenger
          </p>
          <p className="text-[13px] text-zinc-400 mt-1">
            Select a conversation to begin
          </p>
        </div>
        <div className="flex items-center gap-1.5">
          <ShieldCheck className="w-3 h-3 text-emerald-500" strokeWidth={2.5} />
          <span className="text-[11px] text-emerald-600 font-semibold">End-to-end encrypted</span>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full bg-white">

      {/* header */}
      <div className="flex items-center gap-3 px-5 py-4 border-b border-zinc-100">
        <button
          onClick={() => setActiveUserId(null)}
          className="md:hidden w-8 h-8 rounded-full flex items-center justify-center text-zinc-400 hover:bg-zinc-100 transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>

        <div
          className="w-10 h-10 rounded-full bg-zinc-900 flex items-center justify-center text-white text-sm font-bold shrink-0"
          style={{ fontFamily: 'Syne, sans-serif' }}
        >
          {activeConv.username[0]?.toUpperCase()}
        </div>

        <div className="flex-1">
          <p
            style={{ fontFamily: 'Syne, sans-serif' }}
            className="text-[14px] font-bold text-zinc-900 leading-tight"
          >
            {capitalize(activeConv.username)}
          </p>
          <div className="flex items-center gap-1.5 mt-0.5">
            <div className={cn(
              'w-1.5 h-1.5 rounded-full transition-colors',
              status === 'connected' ? 'bg-emerald-400' : 'bg-zinc-300'
            )} />
            <span className="text-[11px] text-zinc-400">
              {status === 'connected' ? 'Online' : 'Connecting...'}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" strokeWidth={2.5} />
          <span className="text-[11px] text-emerald-600 font-semibold hidden sm:block">
            Encrypted
          </span>
        </div>
      </div>

      {/* messages */}
      <div className="flex-1 overflow-y-auto py-4">
        {loadingHistory && (
          <div className="flex justify-center py-6">
            <div className="flex gap-1">
              {[0, 1, 2].map(i => (
                <span
                  key={i}
                  className="w-1.5 h-1.5 rounded-full bg-zinc-200 animate-bounce"
                  style={{ animationDelay: `${i * 0.15}s` }}
                />
              ))}
            </div>
          </div>
        )}

        {messages.length === 0 && !loadingHistory && (
          <div className="flex flex-col items-center justify-center h-32 gap-1.5">
            <p className="text-[13px] text-zinc-300 font-medium">No messages yet</p>
            <p className="text-[12px] text-zinc-200">
              Say hello to {capitalize(activeConv.username)}
            </p>
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
                transition={{ duration: 0.18, ease: 'easeOut' }}
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

      {/* input */}
      <div className="px-4 py-4 border-t border-zinc-100">
        <div className="flex items-end gap-2.5">
          <div className={cn(
            'flex-1 bg-zinc-50 border rounded-3xl px-4 py-3 transition-all duration-200',
            text ? 'border-zinc-300 bg-white' : 'border-zinc-200'
          )}>
            <textarea
              ref={textareaRef}
              value={text}
              onChange={e => setText(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={`Message ${capitalize(activeConv.username)}...`}
              rows={1}
              disabled={sending || !recipientPublicKey}
              className="w-full bg-transparent resize-none text-[14px] text-zinc-900 placeholder:text-zinc-300 focus:outline-none leading-relaxed max-h-[120px] disabled:opacity-40"
            />
          </div>
          <button
            onClick={handleSend}
            disabled={!text.trim() || sending || !recipientPublicKey}
            className={cn(
              'w-11 h-11 rounded-full flex items-center justify-center shrink-0 transition-all duration-200',
              text.trim() && !sending && recipientPublicKey
                ? 'bg-zinc-900 text-white hover:bg-zinc-700 active:scale-95 cursor-pointer'
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
        <p className="text-center text-[10px] text-zinc-200 mt-2.5">
          Messages are encrypted before leaving your device
        </p>
      </div>
    </div>
  )
}