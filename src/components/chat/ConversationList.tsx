import { formatDistanceToNow } from '@/lib/time'
import { useConversationStore } from '@/store/conversationStore'
import { useAuthStore } from '@/store/authStore'
import { useMessageStore } from '@/store/messageStore'
import { EncryptionBadge } from '@/components/ui/EncryptionBadge'
import { UserSearch } from '@/components/search/UserSearch'
import { Button } from '@/components/ui/Button'
import { SquarePen, LogOut } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useState } from 'react'

export function ConversationList() {
  const { conversations, activeUserId, setActiveUserId } = useConversationStore()
  const { user, logout } = useAuthStore()
  const { conversations: messageMap } = useMessageStore()
  const [searchOpen, setSearchOpen] = useState(false)

  return (
    <>
      <aside className="flex flex-col w-72 shrink-0 border-r border-[rgba(255,255,255,0.06)] bg-[#111118]">

        {/* header */}
        <div className="flex items-center justify-between px-4 py-4 border-b border-[rgba(255,255,255,0.06)]">
          <div className="flex items-center gap-2">
            <span className="text-base font-semibold tracking-tight iris-gradient-text">
              Iris
            </span>
            <EncryptionBadge encrypted />
          </div>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setSearchOpen(true)}
              aria-label="New conversation"
            >
              <SquarePen className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Current user */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-[rgba(255,255,255,0.06)]">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#7c5ef6] to-[#38bdf8] flex items-center justify-center text-xs font-bold text-white shrink-0">
            {user?.username?.[0]?.toUpperCase() ?? '?'}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-[#f0efff] truncate">{user?.username}</p>
            <p className="text-xs text-[#6b6785]">You</p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => logout()}
            aria-label="Sign out"
            className="shrink-0 text-[#6b6785] hover:text-[#f87171]"
          >
            <LogOut className="w-4 h-4" />
          </Button>
        </div>

        {/* conversation list */}
        <nav className="flex-1 overflow-y-auto py-1">
          {conversations.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full gap-3 px-6 text-center">
              <div className="w-12 h-12 rounded-full bg-[#1c1c28] flex items-center justify-center">
                <SquarePen className="w-5 h-5 text-[#6b6785]" />
              </div>
              <p className="text-sm text-[#6b6785]">No conversations yet</p>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setSearchOpen(true)}
              >
                Start one
              </Button>
            </div>
          ) : (
            conversations.map((conv) => {
              const messages = messageMap[conv.user_id] ?? []
              const lastDecrypted = messages[messages.length - 1]
              const isActive = activeUserId === conv.user_id

              return (
                <button
                  key={conv.user_id}
                  onClick={() => setActiveUserId(conv.user_id)}
                  className={cn(
                    'w-full flex items-center gap-3 px-4 py-3',
                    'text-left transition-colors duration-100 cursor-pointer',
                    'hover:bg-[#1c1c28]',
                    isActive && 'bg-[#1c1c28] border-r-2 border-[#7c5ef6]',
                  )}
                >
                  {/* Avatar */}
                  <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#1c1c28] to-[#242432] border border-[rgba(255,255,255,0.08)] flex items-center justify-center text-sm font-semibold text-[#a8a4c8] shrink-0">
                    {conv.username[0]?.toUpperCase()}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-sm font-medium text-[#f0efff] truncate">
                        {conv.username}
                      </span>
                      {(lastDecrypted ?? conv.last_message) && (
                        <span className="text-[10px] text-[#6b6785] shrink-0">
                          {formatDistanceToNow(
                            new Date(lastDecrypted?.timestamp ?? conv.last_message?.created_at ?? ''),
                          )}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-[#6b6785] truncate mt-0.5">
                      {lastDecrypted?.decryptionFailed
                        ? '[Encrypted message]'
                        : lastDecrypted?.plaintext
                          ? lastDecrypted.plaintext
                          : 'No messages yet'}
                    </p>
                  </div>
                </button>
              )
            })
          )}
        </nav>
      </aside>

      <UserSearch open={searchOpen} onClose={() => setSearchOpen(false)} />
    </>
  )
}