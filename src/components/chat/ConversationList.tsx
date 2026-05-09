import { useState } from 'react'
import { SquarePen, LogOut, ShieldCheck } from 'lucide-react'
import { useConversationStore } from '@/store/conversationStore'
import { useAuthStore } from '@/store/authStore'
import { useMessageStore } from '@/store/messageStore'
import { UserSearch } from '@/components/search/UserSearch'
import { formatDistanceToNow } from '@/lib/time'
import { cn } from '@/lib/utils'

export function ConversationList() {
  const { conversations, activeUserId, setActiveUserId } = useConversationStore()
  const { user, logout } = useAuthStore()
  const { conversations: messageMap } = useMessageStore()
  const [searchOpen, setSearchOpen] = useState(false)

  return (
    <>
      <div className="flex flex-col h-full bg-white border-r border-zinc-100">

        {/* Header */}
        <div className="px-5 pt-8 pb-4">
          <div className="flex items-center py-5 justify-between ">
            <div className="flex items-center gap-3 ">

              {/* <p className="text-xs text-zinc-400 py-6 font-medium">
                Hi, {user?.username}!
              </p> */}

              <h1 style={{ fontFamily: 'Syne, sans-serif' }} className="text-2xl font-bold text-zinc-900  leading-tight">
                Messages
              </h1>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setSearchOpen(true)}
                className="w-6 h-6 rounded-md bg-zinc-900 text-white flex items-center justify-center hover:bg-zinc-700 transition-colors cursor-pointer"
              >
                <SquarePen className="w-4 h-4" />
              </button>
              <button
                onClick={() => logout()}
                className="w-6 h-6 rounded-md bg-zinc-100 text-red-500 flex items-center justify-center hover:bg-zinc-200 hover:text-zinc-900 transition-colors cursor-pointer"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* E2EE badge */}
          <div className="flex items-center gap-1.5 mt-3">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" strokeWidth={2.5} />
            <span className="text-[11px] text-emerald-600 font-medium tracking-wide">End-to-end encrypted</span>
          </div>
        </div>

        {/* Recent contacts row — from conversations */}
        {conversations.length > 0 && (
          <div className="px-5 mb-2">
            <p className="text-[11px] font-bold tracking-widest uppercase text-zinc-300 mb-3" style={{ fontFamily: 'Lato, sans-serif' }}>
              Contacts
            </p>
            <div className="flex gap-3 overflow-x-auto pb-1 no-scrollbar">
              {conversations.slice(0, 6).map((conv) => (
                <button
                  key={conv.user_id}
                  onClick={() => setActiveUserId(conv.user_id)}
                  className="flex flex-col items-center gap-1.5 shrink-0 cursor-pointer"
                >
                  <div className={cn(
                    'w-12 h-12 rounded-full flex items-center justify-center text-sm font-bold transition-all',
                    activeUserId === conv.user_id
                      ? 'bg-zinc-900 text-white'
                      : 'bg-zinc-100 text-zinc-600'
                  )} style={{ fontFamily: 'Syne, sans-serif' }}>
                    {conv.username[0]?.toUpperCase()}
                  </div>
                  <span className="text-[10px] text-zinc-400 truncate w-12 text-center">
                    {conv.username}
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Divider + label */}
        <div className="px-5 mt-1 mb-2 flex items-center justify-between">
          <p className="text-[11px] font-bold tracking-widest uppercase text-zinc-300" style={{ fontFamily: 'Lato, sans-serif' }}>
            All Messages ({conversations.length})
          </p>
        </div>

        {/* Conversation list */}
        <nav className="flex-1 overflow-y-auto px-2">
          {conversations.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-40 gap-3 px-6 text-center">
              <div className="w-10 h-10 rounded-2xl bg-zinc-100 flex items-center justify-center">
                <SquarePen className="w-4 h-4 text-zinc-400" />
              </div>
              <p className="text-sm text-zinc-400">No conversations yet</p>

              {/* <button
                onClick={() => setSearchOpen(true)}
                className=" rounded-md p-4 bg-zinc-900 text-white text-xs font-semibold hover:bg-zinc-700 transition-colors cursor-pointer"
              >
                Start one
              </button> */}
            </div>
          ) : (
            conversations.map((conv) => {
              const messages = messageMap[conv.user_id] ?? []
              const lastMsg = messages[messages.length - 1]
              const isActive = activeUserId === conv.user_id

              return (
                <button
                  key={conv.user_id}
                  onClick={() => setActiveUserId(conv.user_id)}
                  className={cn(
                    'w-full flex items-center gap-3 px-3 py-3 rounded-2xl text-left transition-all cursor-pointer',
                    isActive ? 'bg-zinc-900' : 'hover:bg-zinc-50'
                  )}
                >
                  {/* Avatar */}
                  <div className={cn(
                    'w-11 h-11 rounded-full flex items-center justify-center text-sm font-bold shrink-0 transition-all',
                    isActive ? 'bg-white text-zinc-900' : 'bg-zinc-100 text-zinc-700'
                  )} style={{ fontFamily: 'Syne, sans-serif' }}>
                    {conv.username[0]?.toUpperCase()}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <span className={cn(
                        'text-sm font-semibold truncate',
                        isActive ? 'text-white' : 'text-zinc-900'
                      )} style={{ fontFamily: 'Syne, sans-serif' }}>
                        {conv.username}
                      </span>
                      {(lastMsg ?? conv.last_message) && (
                        <span className={cn(
                          'text-[10px] shrink-0',
                          isActive ? 'text-zinc-400' : 'text-zinc-300'
                        )}>
                          {formatDistanceToNow(new Date(lastMsg?.timestamp ?? conv.last_message?.created_at ?? ''))}
                        </span>
                      )}
                    </div>
                    <p className={cn(
                      'text-xs truncate mt-0.5',
                      isActive ? 'text-zinc-400' : 'text-zinc-400'
                    )}>
                      {lastMsg?.decryptionFailed
                        ? 'Encrypted message'
                        : lastMsg?.plaintext || 'No messages yet'}
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