import { useEffect, useState } from 'react'
import { ShieldCheck } from 'lucide-react'
import { useAuthStore } from '@/store/authStore'
import { useConversationStore } from '@/store/conversationStore'
import { useMessageStore } from '@/store/messageStore'
import { useWebSocket } from '@/hooks/useWebSocket'
import { getConversations } from '@/api/messages'
import { LoginForm } from '@/components/auth/LoginForm'
import { RegisterForm } from '@/components/auth/RegisterForm'
import { ConversationList } from '@/components/chat/ConversationList'
import { ChatPane } from '@/components/chat/ChatPane'
import { EncryptionBadge } from '@/components/ui/EncryptionBadge'



function ChatShell() {
  const { setConversations } = useConversationStore()
  const { user, privateKey } = useAuthStore()
  const { conversations: messageMap } = useMessageStore()


  useWebSocket()

  
  useEffect(() => {
    getConversations()
      .then(setConversations)
      .catch(() => {})
  }, [])

  return (
    <div className="flex h-full">
      <ConversationList />
      <ChatPane />
    </div>
  )
}



function AuthScreen() {
  const [mode, setMode] = useState<'login' | 'register'>('login')

  return (
    <div className="flex h-full items-center justify-center bg-[#0a0a0f] px-4">
      {/* Ambient glow */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-96 h-96 bg-[#7c5ef6]/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 left-1/3 w-80 h-80 bg-[#38bdf8]/8 rounded-full blur-3xl" />
      </div>

      <div className="relative w-full max-w-sm animate-fade-in">
        {/* Logo */}
        <div className="flex flex-col items-center gap-3 mb-10">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#7c5ef6] to-[#38bdf8] flex items-center justify-center shadow-[0_0_32px_rgba(124,94,246,0.4)]">
            <ShieldCheck className="w-7 h-7 text-white" strokeWidth={1.5} />
          </div>
          <div className="text-center">
            <h1 className="text-2xl font-bold tracking-tight iris-gradient-text">Iris</h1>
            <p className="text-sm text-[#6b6785] mt-1">Secure messaging, end-to-end</p>
          </div>
          <EncryptionBadge encrypted verbose />
        </div>

        {/* card */}
        <div className="glass rounded-2xl p-8">
          <h2 className="text-lg font-semibold text-[#f0efff] mb-6">
            {mode === 'login' ? 'Welcome back' : 'Create your account'}
          </h2>

          {mode === 'login' ? (
            <LoginForm onSwitch={() => setMode('register')} />
          ) : (
            <RegisterForm onSwitch={() => setMode('login')} />
          )}
        </div>

        {/* Footer note */}
        <p className="text-center text-xs text-[#3d3a52] mt-6 leading-relaxed">
          Your private key never leaves your device.
          <br />
          Messages are encrypted before they reach our servers.
        </p>
      </div>
    </div>
  )
}



export default function App() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)
  return isAuthenticated ? <ChatShell /> : <AuthScreen />
}