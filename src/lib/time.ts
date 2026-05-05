export function formatDistanceToNow(date: Date): string {
  const now = Date.now()
  const diff = now - date.getTime()

  const seconds = Math.floor(diff / 1000)
  const minutes = Math.floor(diff / 60_000)
  const hours   = Math.floor(diff / 3_600_000)
  const days    = Math.floor(diff / 86_400_000)

  if (seconds < 60)  return 'just now'
  if (minutes < 60)  return `${minutes}m`
  if (hours < 24)    return `${hours}h`
  if (days < 7)      return `${days}d`

  return date.toLocaleDateString([], { month: 'short', day: 'numeric' })
}