import { ShieldCheck, ShieldOff } from 'lucide-react'
import { cn } from '@/lib/utils'

interface EncryptionBadgeProps {
  encrypted?: boolean
  className?: string
  verbose?: boolean 
}

export function EncryptionBadge({
  encrypted = true,
  className,
  verbose = false,
}: EncryptionBadgeProps) {
  return (
    <div
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1',
        'text-xs font-medium tracking-wide',
        'border transition-all duration-300',
        encrypted
          ? [
              'text-[#34d399] border-[rgba(52,211,153,0.2)]',
              'bg-[rgba(52,211,153,0.06)]',
            ]
          : [
              'text-[#f87171] border-[rgba(248,113,113,0.2)]',
              'bg-[rgba(248,113,113,0.06)]',
            ],
        className,
      )}
      role="status"
      aria-label={encrypted ? 'End-to-end encrypted' : 'Not encrypted'}
    >
      {encrypted ? (
        <ShieldCheck className="w-3.5 h-3.5 shrink-0" strokeWidth={2.5} />
      ) : (
        <ShieldOff className="w-3.5 h-3.5 shrink-0" strokeWidth={2.5} />
      )}
      {verbose && (
        <span>{encrypted ? 'End-to-end encrypted' : 'Not encrypted'}</span>
      )}
      {!verbose && (
        <span>{encrypted ? 'E2EE' : 'Unencrypted'}</span>
      )}
    </div>
  )
}