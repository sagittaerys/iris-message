/**
 * components/search/UserSearch.tsx
 *
 * Modal dialog for finding users by username.
 * On select, starts a conversation and closes.
 */

import { useState, useEffect, useRef } from 'react'
import * as Dialog from '@radix-ui/react-dialog'
import { Search, X, MessageSquare } from 'lucide-react'
import { searchUsers } from '@/api/users'
import { useConversationStore } from '@/store/conversationStore'
import { Button } from '@/components/ui/Button'
import { UserSearchResult } from '@/types'
import { cn } from '@/lib/utils'

interface UserSearchProps {
  open: boolean
  onClose: () => void
}

export function UserSearch({ open, onClose }: UserSearchProps) {
  const [query, setQuery]           = useState('')
  const [results, setResults]       = useState<UserSearchResult[]>([])
  const [loading, setLoading]       = useState(false)
  const [error, setError]           = useState<string | null>(null)
  const { startConversationWith }   = useConversationStore()
  const inputRef                    = useRef<HTMLInputElement>(null)
  const debounceRef                 = useRef<ReturnType<typeof setTimeout> | null>(null)

  // focus input on open
  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 50)
      setQuery('')
      setResults([])
      setError(null)
    }
  }, [open])

  // debounced search
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    if (!query.trim()) { setResults([]); return }

    debounceRef.current = setTimeout(async () => {
      setLoading(true)
      setError(null)
      try {
        const data = await searchUsers(query.trim())
        setResults(data)
        if (data.length === 0) setError('No users found')
      } catch {
        setError('Search failed — try again')
      } finally {
        setLoading(false)
      }
    }, 350)

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [query])

  const handleSelect = (user: UserSearchResult) => {
    startConversationWith(user.id, user.username)
    onClose()
  }

  return (
    <Dialog.Root open={open} onOpenChange={(o) => !o && onClose()}>
      <Dialog.Portal>
        {/* backdrop */}
        <Dialog.Overlay className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm animate-fade-in" />

        {/* Panel */}
        <Dialog.Content
          className={cn(
            'fixed z-50 top-[20%] left-1/2 -translate-x-1/2',
            'w-full max-w-md',
            'bg-[#16161f] border border-[rgba(255,255,255,0.08)]',
            'rounded-2xl shadow-[0_24px_64px_rgba(0,0,0,0.6)]',
            'animate-fade-in',
            'focus:outline-none',
          )}
        >
          {/* search input */}
          <div className="flex items-center gap-3 px-4 py-4 border-b border-[rgba(255,255,255,0.06)]">
            <Search className="w-4 h-4 text-[#6b6785] shrink-0" />
            <input
              ref={inputRef}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by username..."
              className={cn(
                'flex-1 bg-transparent text-sm text-[#f0efff]',
                'placeholder:text-[#3d3a52] focus:outline-none',
              )}
            />
            {query && (
              <button
                onClick={() => setQuery('')}
                className="text-[#6b6785] hover:text-[#a8a4c8] transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            )}
            <Dialog.Close asChild>
              <Button variant="ghost" size="icon" aria-label="Close search">
                <X className="w-4 h-4" />
              </Button>
            </Dialog.Close>
          </div>

          {/* results */}
          <div className="max-h-72 overflow-y-auto py-2">
            {loading && (
              <div className="flex justify-center py-6">
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

            {!loading && error && (
              <p className="text-sm text-[#6b6785] text-center py-6">{error}</p>
            )}

            {!loading && !error && results.length > 0 && (
              <ul>
                {results.map((user) => (
                  <li key={user.id}>
                    <button
                      onClick={() => handleSelect(user)}
                      className={cn(
                        'w-full flex items-center gap-3 px-4 py-3',
                        'hover:bg-[#1c1c28] transition-colors cursor-pointer text-left',
                      )}
                    >
                      {/* Avatar */}
                      <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#1c1c28] to-[#242432] border border-[rgba(255,255,255,0.08)] flex items-center justify-center text-sm font-semibold text-[#a8a4c8] shrink-0">
                        {user.username[0]?.toUpperCase()}
                      </div>
                      <span className="flex-1 text-sm text-[#f0efff] font-medium">
                        {user.username}
                      </span>
                      <MessageSquare className="w-4 h-4 text-[#6b6785]" />
                    </button>
                  </li>
                ))}
              </ul>
            )}

            {!loading && !error && !query && (
              <p className="text-sm text-[#6b6785] text-center py-6">
                Type a username to search
              </p>
            )}
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}