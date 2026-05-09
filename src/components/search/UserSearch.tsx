


import { useState, useEffect, useRef } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { Search, X, MessageSquare, Users } from "lucide-react";

import { searchUsers } from "@/api/users";
import { useConversationStore } from "@/store/conversationStore";
import { UserSearchResult } from "@/types";

interface UserSearchProps {
  open: boolean;
  onClose: () => void;
}

export function UserSearch({ open, onClose }: UserSearchProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<UserSearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [empty, setEmpty] = useState(false);

  const { startConversationWith } = useConversationStore();

  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 50);

      setQuery("");
      setResults([]);
      setEmpty(false);
    }
  }, [open]);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (!query.trim()) {
      setResults([]);
      setEmpty(false);
      return;
    }

    debounceRef.current = setTimeout(async () => {
      setLoading(true);

      try {
        const data = await searchUsers(query.trim());

        setResults(data);
        setEmpty(data.length === 0);
      } catch {
        setEmpty(true);
      } finally {
        setLoading(false);
      }
    }, 350);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query]);

  const handleSelect = (user: UserSearchResult) => {
    startConversationWith(user.id, user.username);
    onClose();
  };

  return (
    <Dialog.Root open={open} onOpenChange={(o) => !o && onClose()}>
      <Dialog.Portal>
        {/* Overlay */}
        <Dialog.Overlay className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm" />

        {/* Modal */}
        <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-full max-w-lg -translate-x-1/2 -translate-y-1/2 px-4 focus:outline-none">
          <div className="w-full overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-2xl">
            {/* Top Section */}
            <div className="border-b border-zinc-100 px-6 pt-6 pb-5">
              <div className="mb-5 flex items-start justify-between gap-4">
                <div className="space-y-1">
                  <Dialog.Title className="text-lg font-semibold tracking-tight text-zinc-900">
                    Search users
                  </Dialog.Title>

                  <Dialog.Description className="text-sm text-zinc-500">
                    Find a user to start a conversation
                  </Dialog.Description>
                </div>

                <Dialog.Close asChild>
                  <button className="flex h-9 w-9 items-center justify-center rounded-full border border-zinc-200 bg-white text-zinc-400 transition-all hover:bg-zinc-100 hover:text-zinc-700 cursor-pointer">
                    <X className="h-4 w-4" />
                  </button>
                </Dialog.Close>
              </div>

              {/* Label */}
              <p className="mb-3 text-sm font-medium text-zinc-800">
                New conversation
              </p>

              {/* Search Input */}
              <div className="flex items-center gap-3 rounded-xl border border-zinc-200 bg-white px-4 py-3 shadow-sm transition-all focus-within:border-zinc-400">
                <Search className="h-4 w-4 shrink-0 text-zinc-400" />

                <input
                  ref={inputRef}
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search by username..."
                  className="flex-1 bg-transparent text-sm text-zinc-900 placeholder:text-zinc-400 outline-none"
                />

                {query && (
                  <button
                    onClick={() => setQuery("")}
                    className="text-zinc-400 transition-colors hover:text-zinc-700 cursor-pointer"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>
            </div>

            {/* Results */}
            <div className="max-h-80 overflow-y-auto">
              {/* Loading */}
              {loading && (
                <div className="flex justify-center py-12">
                  <div className="flex gap-1.5">
                    {[0, 1, 2].map((i) => (
                      <span
                        key={i}
                        className="h-2 w-2 animate-bounce rounded-full bg-zinc-300"
                        style={{
                          animationDelay: `${i * 0.15}s`,
                        }}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Empty Initial */}
              {!loading && !query && (
                <div className="flex flex-col items-center justify-center gap-3 px-6 py-14 text-center">
                  <div className="flex h-14 w-14 items-center justify-center rounded-full bg-zinc-100">
                    <Users className="h-6 w-6 text-zinc-400" />
                  </div>

                  <div className="space-y-1">
                    <p className="text-sm font-medium text-zinc-700">
                      Search for someone
                    </p>

                    <p className="text-sm text-zinc-400">
                      Type a username to start chatting
                    </p>
                  </div>
                </div>
              )}

              {/* No Results */}
              {!loading && empty && (
                <div className="flex flex-col items-center justify-center gap-3 px-6 py-14 text-center">
                  <div className="flex h-14 w-14 items-center justify-center rounded-full bg-zinc-100">
                    <Users className="h-6 w-6 text-zinc-400" />
                  </div>

                  <div className="space-y-1">
                    <p className="text-sm font-medium text-zinc-700">
                      No users found
                    </p>

                    <p className="text-sm text-zinc-400">
                      Try a different username
                    </p>
                  </div>
                </div>
              )}

              {/* Results List */}
              {!loading && results.length > 0 && (
                <ul className="py-2">
                  {results.map((user) => (
                    <li key={user.id}>
                      <button
                        onClick={() => handleSelect(user)}
                        className="flex w-full items-center gap-4 px-6 py-3 text-left transition-colors hover:bg-zinc-50 cursor-pointer"
                      >
                        {/* Avatar */}
                        <div
                          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-zinc-100 text-sm font-semibold text-zinc-700"
                          style={{
                            fontFamily: "Syne, sans-serif",
                          }}
                        >
                          {user.username[0]?.toUpperCase()}
                        </div>

                        {/* User Info */}
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium text-zinc-900">
                            {user.username}
                          </p>

                          <p className="text-xs text-zinc-400">
                            Start a conversation
                          </p>
                        </div>

                        {/* Icon */}
                        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-zinc-100 text-zinc-400">
                          <MessageSquare className="h-4 w-4" />
                        </div>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}