import { ShieldOff } from 'lucide-react'
import { DecryptedMessage } from '@/types'
import { cn } from '@/lib/utils'

interface MessageBubbleProps {
  message: DecryptedMessage
  isMine: boolean
  isFirst: boolean
  isLast: boolean
}

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

export function MessageBubble({ message, isMine, isFirst, isLast }: MessageBubbleProps) {
  return (
    <div className={cn(
      'flex items-end gap-2 px-4',
      isMine ? 'justify-end' : 'justify-start',
      isFirst ? 'mt-3' : 'mt-0.5',
    )}>
      {/* Avatar — only for theirs, only on last in group */}
      {!isMine && (
        <div className={cn('w-7 h-7 rounded-full shrink-0 mb-0.5', isLast ? 'bg-zinc-200 flex items-center justify-center' : 'invisible')}>
          {isLast && (
            <span className="text-[10px] font-bold text-zinc-600" style={{ fontFamily: 'Syne, sans-serif' }}>
              {message.senderUsername?.[0]?.toUpperCase() ?? '?'}
            </span>
          )}
        </div>
      )}

      <div className={cn('flex flex-col gap-0.5', isMine ? 'items-end' : 'items-start', 'max-w-[72%]')}>
        <div className={cn(
          'px-4 py-2.5 text-sm leading-relaxed',
          isMine ? [
            'bg-zinc-900 text-white',
            isFirst && isLast ? 'rounded-3xl' :
            isFirst ? 'rounded-3xl rounded-br-lg' :
            isLast ? 'rounded-3xl rounded-tr-lg' :
            'rounded-3xl rounded-r-lg',
          ] : [
            'bg-zinc-100 text-zinc-900',
            isFirst && isLast ? 'rounded-3xl' :
            isFirst ? 'rounded-3xl rounded-bl-lg' :
            isLast ? 'rounded-3xl rounded-tl-lg' :
            'rounded-3xl rounded-l-lg',
          ],
          message.decryptionFailed && 'opacity-50',
        )}>
          {message.decryptionFailed ? (
            <span className="flex items-center gap-1.5 text-xs italic">
              <ShieldOff className="w-3 h-3 shrink-0" />
              Could not decrypt
            </span>
          ) : message.plaintext}
        </div>

        {isLast && (
          <span className="text-[10px] text-zinc-300 px-1">
            {formatTime(message.timestamp)}
          </span>
        )}
      </div>
    </div>
  )
}