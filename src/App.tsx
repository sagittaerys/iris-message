import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { ShieldCheck } from 'lucide-react'
import { useAuthStore } from '@/store/authStore'
import { useConversationStore } from '@/store/conversationStore'
import { useWebSocket } from '@/hooks/useWebSocket'
import { getConversations } from '@/api/messages'
import { LoginForm } from '@/components/auth/LoginForm'
import { RegisterForm } from '@/components/auth/RegisterForm'
import { ConversationList } from '@/components/chat/ConversationList'
import { ChatPane } from '@/components/chat/ChatPane'



function SplashScreen({ onDone }: { onDone: () => void }) {
  useEffect(() => {
    const t = setTimeout(onDone, 2400)
    return () => clearTimeout(t)
  }, [onDone])

  return (
    <motion.div
      className="fixed inset-0 z-50 bg-white flex flex-col items-center justify-center"
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5, ease: 'easeInOut' }}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.92 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        className="flex flex-col items-center gap-6"
      >
        <div className="w-16 h-16 rounded-2xl flex items-center justify-center">

          <img src="/iris-logo.png" alt="Logo" className="w-16 h-16" />
        </div>
        <div className="text-center">
          <h1 style={{ fontFamily: 'Syne, sans-serif' }} className="text-4xl font-bold tracking-tight text-zinc-900">
            Iris
          </h1>
          <p className="text-sm text-zinc-400 mt-1 tracking-wide">
            end-to-end encrypted
          </p>
        </div>
      </motion.div>

      {/* Progress bar */}
      <div className="absolute bottom-16 w-32 h-[2px] bg-zinc-100 rounded-full overflow-hidden">
        <motion.div
          className="h-full bg-zinc-900 rounded-full"
          initial={{ width: '0%' }}
          animate={{ width: '100%' }}
          transition={{ duration: 2, ease: 'linear' }}
        />
      </div>
    </motion.div>
  )
}



function AuthScreen() {
  const [mode, setMode] = useState<'login' | 'register'>('login')

  return (
    <div className="flex h-full items-center justify-center bg-white px-6">
      <motion.div
        key={mode}
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
        className="w-full max-w-sm"
      >
        {/* logo */}
        <div className="flex flex-col items-center gap-4 mb-10">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center">

          <img src="/iris-logo.png" alt="Logo" className="w-16 h-16" />
        </div>
          <div className="text-center">
            <h1 style={{ fontFamily: 'Syne, sans-serif' }} className="text-3xl font-bold text-zinc-900 tracking-tight">
              Iris
            </h1>
            <p className="text-sm text-zinc-400 mt-1">Private. Secure. Yours.</p>
          </div>
        </div>

        
        {/* form */}
        {mode === 'login' ? (
          <LoginForm onSwitch={() => setMode('register')} />
        ) : (
          <RegisterForm onSwitch={() => setMode('login')} />
        )}

        {/* footer */}
        <p className="text-center text-xs text-zinc-300 mt-8 leading-relaxed">
          Your private key never leaves this device
        </p>
      </motion.div>
    </div>
  )
}



function ChatShell() {
  const { setConversations } = useConversationStore()
  const { activeUserId } = useConversationStore()
  useWebSocket()

  useEffect(() => {
    getConversations().then(setConversations).catch(() => {})
  }, [])

  return (
    <div className="flex h-full bg-white overflow-hidden">
      {/* mobile */}
      <div className={`${activeUserId ? 'hidden md:flex' : 'flex'} flex-col w-full md:w-80 shrink-0`}>
        <ConversationList />
      </div>
      <div className={`${!activeUserId ? 'hidden md:flex' : 'flex'} flex-1 flex-col min-w-0`}>
        <ChatPane />
      </div>
    </div>
  )
}



export default function App() {
  const [splashDone, setSplashDone] = useState(false)
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)

  return (
    <AnimatePresence mode="wait">
      {!splashDone ? (
        <SplashScreen key="splash" onDone={() => setSplashDone(true)} />
      ) : isAuthenticated ? (
        <motion.div
          key="chat"
          className="h-full"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
        >
          <ChatShell />
        </motion.div>
      ) : (
        <motion.div
          key="auth"
          className="h-full"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
        >
          <AuthScreen />
        </motion.div>
      )}
    </AnimatePresence>
  )
}