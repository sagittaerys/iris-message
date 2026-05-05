import { useEffect, useRef, useState, useCallback } from 'react'
import { Send, ShieldCheck } from 'lucide-react'
import { useConversationStore } from '@/store/conversationStore'
import { useMessageStore } from '@/store/messageStore'
import { useAuthStore } from '@/store/authStore'
import { useMessages } from '@/hooks/useMessages'
import { useWebSocket } from '@/hooks/useWebSocket'
import { MessageBubble } from './MessageBubble'
import { EncryptionBadge } from '@/components/ui/EncryptionBadge'
import { Button } from '@/components/ui/Button'
import { cn } from '@/lib/utils'

export function ChatPane() {
  const { activeUserId, conversations } = useConversationStore()
  const { conversations: messageMap } = useMessageStore()
  const { user } = useAuthStore()
  const { sendMessage, loadHistory, getRecipientPublicKey, sending, loadingHistory } = useMessages()
  const { status } = useWebSocket()

  const [text, setText] = useState('')
  const [recipientPublicKey, setRecipientPublicKey] = useState<string | null>(null)
  const bottomRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const activeConv = conversations.find((c) => c.user_id === activeUserId)
  const messages = activeUserId ? (messageMap[activeUserId] ?? []) : []

  // load history and public key when conversation changes
  useEffect(() => {
    if (!activeUserId) return
    setRecipientPublicKey(null)
    loadHistory(activeUserId)
    getRecipientPublicKey(activeUserId).then(setRecipientPublicKey)
  }, [activeUserId])

  // scroll to bottom on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages.length])

  // auto-resize textarea
  useEffect(() => {
    const ta = textareaRef.current
    if (!ta) return
    ta.style.height = 'auto'
    ta.style.height = `${Math.min(ta.scrollHeight, 140)}px`
  }, [text])

  const handleSend = useCallback(async () => {
    if (!activeUserId || !recipientPublicKey || !text.trim()) return
    const ok = await sendMessage(activeUserId, recipientPublicKey, text.trim())
    if (ok) setText('')
  }, [activeUserId, recipientPublicKey, text, sendMessage])

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  // no active conversation
  if (!activeUserId || !activeConv) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center gap-4 bg-[#0a0a0f]">
        <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[#7c5ef6]/20 to-[#38bdf8]/20 flex items-center justify-center">
          <ShieldCheck className="w-7 h-7 text-[#7c5ef6]" strokeWidth={1.5} />
        </div>
        <div className="text-center">
          <p className="text-[#f0efff] font-medium">Iris Messenger</p>
          <p className="text-sm text-[#6b6785] mt-1">Select a conversation or start a new one</p>
        </div>
        <EncryptionBadge encrypted verbose />
      </div>
    )
  }

  return (
    <div className="flex-1 flex flex-col min-w-0 bg-[#0a0a0f]">

      {/* chat header */}
      <header className="flex items-center justify-between px-6 py-4 border-b border-[rgba(255,255,255,0.06)] bg-[#111118]">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#1c1c28] to-[#242432] border border-[rgba(255,255,255,0.08)] flex items-center justify-center text-sm font-semibold text-[#a8a4c8]">
            {activeConv.username[0]?.toUpperCase()}
          </div>
          <div>
            <p className="text-sm font-semibold text-[#f0efff]">{activeConv.username}</p>
            <p className={cn(
              'text-[10px] font-medium',
              status === 'connected' ? 'text-[#34d399]' : 'text-[#6b6785]',
            )}>
              {status === 'connected' ? 'Online' : 'Connecting...'}
            </p>
          </div>
        </div>
        <EncryptionBadge encrypted verbose />
      </header>

      {/* messages */}
      <div className="flex-1 overflow-y-auto px-6 py-4">
        {loadingHistory && (
          <div className="flex justify-center py-4">
            <div className="flex gap-1">
              {[0, 1, 2].map((i) => (
                <span
                  key={i}
                  className="w-1.5 h-1.5 rounded-full bg-[#7c5ef6] animate-bounce"
                  style={{ animationDelay: `${i * 0.15}s` }}
                />
              ))}
            </div>
          </div>
        )}

        <div className="flex flex-col gap-2">
          {messages.map((msg, i) => {
            const isMine = msg.senderId === user?.id
            const prevMsg = messages[i - 1]
            const showSender = !isMine && prevMsg?.senderId !== msg.senderId
            return (
              <MessageBubble
                key={msg.id}
                message={msg}
                isMine={isMine}
                showSender={showSender}
              />
            )
          })}
        </div>

        <div ref={bottomRef} />
      </div>

      {/* input area */}
      <div className="px-4 py-4 border-t border-[rgba(255,255,255,0.06)] bg-[#111118]">
        <div className="flex items-end gap-3 bg-[#1c1c28] border border-[rgba(255,255,255,0.06)] rounded-2xl px-4 py-3 focus-within:border-[rgba(124,94,246,0.4)] transition-colors">
          <textarea
            ref={textareaRef}
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Message (encrypted end-to-end)"
            rows={1}
            disabled={sending || !recipientPublicKey}
            className={cn(
              'flex-1 bg-transparent resize-none',
              'text-sm text-[#f0efff] placeholder:text-[#3d3a52]',
              'focus:outline-none',
              'min-h-[24px] max-h-[140px]',
              'leading-relaxed',
            )}
          />
          <Button
            variant="primary"
            size="icon"
            onClick={handleSend}
            disabled={!text.trim() || sending || !recipientPublicKey}
            loading={sending}
            className="shrink-0 rounded-xl"
            aria-label="Send message"
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
        <p className="text-center text-[10px] text-[#3d3a52] mt-2">
          Messages are encrypted before leaving your device
        </p>
      </div>
    </div>
  )
}