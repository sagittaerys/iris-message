import { useState, useEffect, useRef } from "react";
import * as Dialog from "@radix-ui/react-dialog";
// import * as VisuallyHidden from "@radix-ui/react-visually-hidden";
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
        <Dialog.Overlay className="fixed inset-0 z-40 bg-black/25 backdrop-blur-sm" />

        <Dialog.Content className="fixed z-50 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md  focus:outline-none">
          <div className="bg-white rounded-md w-full  shadow-xl overflow-hidden">
           
              <Dialog.Title>Search users</Dialog.Title>
              <Dialog.Description>
                Find a user to start a conversation
              </Dialog.Description>
           

            {/* Header */}
            <div className="flex items-center justify-between px-5 pt-5 pb-4">
              <p className="text-[15px] font-medium text-zinc-900">
                New conversation
              </p>
              <Dialog.Close asChild>
                <button className="w-7 h-7 rounded-full border border-zinc-200 bg-zinc-50 flex items-center justify-center text-zinc-400 hover:bg-zinc-100 hover:text-zinc-600 transition-colors cursor-pointer">
                  <X className="w-3.5 h-3.5" />
                </button>
              </Dialog.Close>
            </div>

            {/* Search input */}
            <div className="px-5 pb-4">
              <div className="flex items-center gap-2.5 bg-zinc-50 border border-zinc-100 rounded-xl px-3.5 py-2.5">
                <Search className="w-4 h-4 text-zinc-300 shrink-0" />
                <input
                  ref={inputRef}
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search by username…"
                  className="flex-1 text-sm text-zinc-900 placeholder:text-zinc-300 bg-transparent outline-none border-none ring-0"
                />
                {query && (
                  <button
                    onClick={() => setQuery("")}
                    className="text-zinc-300 hover:text-zinc-500 transition-colors cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>

            {/* Results */}
            <div className="border-t border-zinc-100 max-h-72 overflow-y-auto">
              {loading && (
                <div className="flex justify-center py-10">
                  <div className="flex gap-1">
                    {[0, 1, 2].map((i) => (
                      <span
                        key={i}
                        className="w-1.5 h-1.5 rounded-full bg-zinc-300 animate-bounce"
                        style={{ animationDelay: `${i * 0.15}s` }}
                      />
                    ))}
                  </div>
                </div>
              )}

              {!loading && !query && (
                <div className="flex flex-col items-center gap-2 py-10">
                  <div className="w-10 h-10 rounded-full bg-zinc-50 flex items-center justify-center">
                    <Users className="w-5 h-5 text-zinc-300" />
                  </div>
                  <p className="text-sm text-zinc-300">
                    Type a username to find someone
                  </p>
                </div>
              )}

              {!loading && empty && (
                <div className="flex flex-col items-center gap-2 py-10">
                  <div className="w-10 h-10 rounded-full bg-zinc-50 flex items-center justify-center">
                    <Users className="w-5 h-5 text-zinc-300" />
                  </div>
                  <p className="text-sm text-zinc-300">No users found</p>
                </div>
              )}

              {!loading && results.length > 0 && (
                <ul className="py-2">
                  {results.map((user) => (
                    <li key={user.id}>
                      <button
                        onClick={() => handleSelect(user)}
                        className="w-full flex items-center gap-3 px-5 py-2.5 hover:bg-zinc-50 transition-colors cursor-pointer text-left"
                      >
                        <div
                          className="w-9 h-9 rounded-full bg-zinc-100 flex items-center justify-center text-sm font-semibold text-zinc-700 shrink-0"
                          style={{ fontFamily: "Syne, sans-serif" }}
                        >
                          {user.username[0]?.toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-zinc-900 truncate">
                            {user.username}
                          </p>
                          <p className="text-xs text-zinc-400">
                            Start a conversation
                          </p>
                        </div>
                        <MessageSquare className="w-4 h-4 text-zinc-300 shrink-0" />
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
