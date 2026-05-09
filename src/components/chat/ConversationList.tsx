import { useState } from 'react'
import { SquarePen, LogOut, ShieldCheck } from 'lucide-react'
import { useConversationStore } from '@/store/conversationStore'
import { useAuthStore } from '@/store/authStore'
import { useMessageStore } from '@/store/messageStore'
import { UserSearch } from '@/components/search/UserSearch'
import { formatDistanceToNow } from '@/lib/time'
import { cn } from '@/lib/utils'

function capitalize(str: string): string {
  if (!str) return ''
  return str.charAt(0).toUpperCase() + str.slice(1)
}

export function ConversationList() {
  const { conversations, activeUserId, setActiveUserId } = useConversationStore()
  const { user, logout } = useAuthStore()
  const { conversations: messageMap } = useMessageStore()
  const [searchOpen, setSearchOpen] = useState(false)

  return (
    <>
      <div className="flex flex-col h-full bg-white border-r border-zinc-100">

        {/* Header */}
        <div className="px-5 pt-10 pb-5">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-[13px] text-zinc-400 font-medium mb-0.5">
                Hi, {capitalize(user?.username ?? '')}
              </p>
              <h1
                style={{ fontFamily: 'Syne, sans-serif' }}
                className="text-[26px] font-bold text-zinc-900 leading-tight tracking-tight"
              >
                Messages
              </h1>
            </div>
            <div className="flex items-center gap-1.5 mt-1">
              <button
                onClick={() => setSearchOpen(true)}
                className="w-9 h-9 rounded-xl bg-zinc-900 text-white flex items-center justify-center hover:bg-zinc-700 transition-colors cursor-pointer"
                aria-label="New conversation"
              >
                <SquarePen className="w-4 h-4" />
              </button>
              <button
                onClick={() => logout()}
                className="w-9 h-9 rounded-xl bg-zinc-100 text-zinc-500 flex items-center justify-center hover:bg-zinc-200 hover:text-zinc-800 transition-colors cursor-pointer"
                aria-label="Sign out"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* E2EE badge */}
          {/* <div className="flex items-center gap-1.5 mt-4">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" strokeWidth={2.5} />
            <span className="text-[11px] text-emerald-600 font-semibold tracking-wide">
              End-to-end encrypted
            </span>
          </div> */}
        </div>

        {/* Recent contacts row */}
        {conversations.length > 0 && (
          <div className="px-5 mb-3">
            <p
              className="text-[10px] font-bold tracking-[0.12em] uppercase text-zinc-300 mb-3"
              style={{ fontFamily: 'Lato, sans-serif' }}
            >
              Contacts
            </p>
            <div className="flex gap-4 overflow-x-auto pb-1">
              {conversations.slice(0, 6).map((conv) => (
                <button
                  key={conv.user_id}
                  onClick={() => setActiveUserId(conv.user_id)}
                  className="flex flex-col items-center gap-1.5 shrink-0 cursor-pointer"
                >
                  <div
                    className={cn(
                      'w-11 h-11 rounded-full flex items-center justify-center text-sm font-bold transition-all duration-200',
                      activeUserId === conv.user_id
                        ? 'bg-zinc-900 text-white'
                        : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200'
                    )}
                    style={{ fontFamily: 'Syne, sans-serif' }}
                  >
                    {conv.username[0]?.toUpperCase()}
                  </div>
                  <span className="text-[10px] text-zinc-400 truncate w-11 text-center leading-tight">
                    {capitalize(conv.username)}
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Section label */}
        <div className="px-5 mb-2">
          <p
            className="text-[10px] font-bold tracking-[0.12em] uppercase text-zinc-300"
            style={{ fontFamily: 'Lato, sans-serif' }}
          >
            All Messages ({conversations.length})
          </p>
        </div>

        {/* List */}
        <nav className="flex-1 overflow-y-auto px-3 pb-4">
          {conversations.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-48 gap-3 text-center">
              <div className="w-11 h-11 rounded-2xl bg-zinc-50 border border-zinc-100 flex items-center justify-center">
                <SquarePen className="w-4 h-4 text-zinc-300" />
              </div>
              <div>
                <p className="text-sm font-medium text-zinc-400">No conversations yet</p>
                <p className="text-xs text-zinc-300 mt-0.5">Start by searching for someone</p>
              </div>
              <button
                onClick={() => setSearchOpen(true)}
                className="px-4 py-2 rounded-xl bg-zinc-900 text-white text-xs font-semibold hover:bg-zinc-700 transition-colors cursor-pointer mt-1"
              >
                Find someone
              </button>
            </div>
          ) : (
            conversations.map((conv) => {
              const messages = messageMap[conv.user_id] ?? []
              const lastMsg = messages[messages.length - 1]
              const isActive = activeUserId === conv.user_id
              const preview = lastMsg?.decryptionFailed
                ? 'Encrypted message'
                : lastMsg?.plaintext || 'No messages yet'

              return (
                <button
                  key={conv.user_id}
                  onClick={() => setActiveUserId(conv.user_id)}
                  className={cn(
                    'w-full flex items-center gap-3 px-3 py-3 rounded-2xl text-left transition-all duration-200 cursor-pointer mb-0.5',
                    isActive ? 'bg-zinc-900' : 'hover:bg-zinc-50'
                  )}
                >
                  {/* Avatar */}
                  <div
                    className={cn(
                      'w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold shrink-0 transition-all duration-200',
                      isActive ? 'bg-white text-zinc-900' : 'bg-zinc-100 text-zinc-700'
                    )}
                    style={{ fontFamily: 'Syne, sans-serif' }}
                  >
                    {conv.username[0]?.toUpperCase()}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <span
                        className={cn(
                          'text-[13px] font-semibold truncate',
                          isActive ? 'text-white' : 'text-zinc-900'
                        )}
                        style={{ fontFamily: 'Syne, sans-serif' }}
                      >
                        {capitalize(conv.username)}
                      </span>
                      {(lastMsg ?? conv.last_message) && (
                        <span className={cn(
                          'text-[10px] shrink-0 tabular-nums',
                          isActive ? 'text-zinc-500' : 'text-zinc-300'
                        )}>
                          {formatDistanceToNow(new Date(
                            lastMsg?.timestamp ?? conv.last_message?.created_at ?? ''
                          ))}
                        </span>
                      )}
                    </div>
                    <p className={cn(
                      'text-[12px] truncate mt-0.5 leading-snug',
                      isActive ? 'text-zinc-500' : 'text-zinc-400'
                    )}>
                      {preview}
                    </p>
                  </div>

                  {/* Unread badge */}
                  {conv.unread_count > 0 && !isActive && (
                    <div className="w-5 h-5 rounded-full bg-zinc-900 flex items-center justify-center shrink-0">
                      <span className="text-[10px] text-white font-bold">{conv.unread_count}</span>
                    </div>
                  )}
                </button>
              )
            })
          )}
        </nav>
      </div>

      <UserSearch open={searchOpen} onClose={() => setSearchOpen(false)} />
    </>
  )
}