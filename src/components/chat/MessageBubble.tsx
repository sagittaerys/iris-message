import { ShieldOff } from 'lucide-react'
import { DecryptedMessage } from '@/types'
import { cn } from '@/lib/utils'

interface MessageBubbleProps {
  message: DecryptedMessage
  isMine: boolean
  showSender?: boolean
}

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

export function MessageBubble({ message, isMine, showSender }: MessageBubbleProps) {
  return (
    <div
      className={cn(
        'flex flex-col gap-1 max-w-[70%] animate-fade-in',
        isMine ? 'self-end items-end' : 'self-start items-start',
      )}
    >
      {showSender && !isMine && (
        <span className="text-[10px] text-[#6b6785] px-1">
          {message.senderUsername}
        </span>
      )}

      <div
        className={cn(
          'px-4 py-2.5 rounded-2xl text-sm leading-relaxed',
          isMine
            ? [
                'bg-[#7c5ef6] text-white',
                'rounded-br-sm',
                'shadow-[0_0_16px_rgba(124,94,246,0.2)]',
              ]
            : [
                'bg-[#1c1c28] text-[#f0efff]',
                'border border-[rgba(255,255,255,0.06)]',
                'rounded-bl-sm',
              ],
          message.decryptionFailed && 'opacity-50',
        )}
      >
        {message.decryptionFailed ? (
          <span className="flex items-center gap-1.5 italic text-[#6b6785] text-xs">
            <ShieldOff className="w-3 h-3 shrink-0" />
            Message could not be decrypted
          </span>
        ) : (
          message.plaintext
        )}
      </div>

      <span className="text-[10px] text-[#3d3a52] px-1">
        {formatTime(message.timestamp)}
      </span>
    </div>
  )
}