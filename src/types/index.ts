// auth
export interface RegisterPayload {
  username: string
  display_name: string       
  password: string
  public_key: string
  wrapped_private_key: string
  pbkdf2_salt: string
}

export interface LoginPayload {
  username: string
  password: string
}

export interface AuthResponse {
  access_token: string
  refresh_token: string
  token_type: 'bearer'
}

export interface RefreshPayload {
  refresh_token: string
}

export interface UserProfile {
  id: string
  username: string
  public_key: string
  wrapped_private_key: string
  pbkdf2_salt: string
  created_at: string
}


// users
export interface PublicUserProfile {
  id: string
  username: string
  public_key: string
  created_at: string
}

export interface UserSearchResult {
  id: string
  username: string
}


// crypto
export interface WrappedKeyBundle {
  wrappedPrivateKey: string
  pbkdf2Salt: string
  iv: string
}

export interface EncryptedPayload {
  ciphertext: string         
  iv: string                 
  encrypted_key: string      
  encrypted_key_for_self: string 
}

export interface DecryptedMessage {
  id: string
  senderId: string
  senderUsername: string
  recipientId: string
  plaintext: string
  timestamp: string
  decryptionFailed?: boolean
}

// encoded keys 
export interface KeyPairBundle {
  publicKeyB64: string       
  privateKey: CryptoKey   
  publicKey: CryptoKey       
}


// messages
export interface SendMessagePayload {
  to: string
  payload: {
    ciphertext: string
    iv: string
    encrypted_key: string
    encrypted_key_for_self: string
  }
}

export interface MessageResponse {
  id: string
  sender_id: string
  sender_username: string
  recipient_id: string
  ciphertext: string
  iv: string
  encrypted_key: string
  encrypted_key_for_self: string
  created_at: string
}

export interface PaginatedMessages {
  messages: MessageResponse[]
  next_cursor: string | null
}


// conversations
export interface ConversationSummary {
  user_id: string
  username: string
  last_message: MessageResponse | null
  unread_count: number
}

// websocket frames

export interface WSMessageSendFrame {
  type: 'message.send'
  recipient_id: string
  ciphertext: string
  iv: string
  encrypted_key: string
  encrypted_key_for_self: string
}

export interface WSMessageReceiveFrame {
  type: 'message.receive'
  message: MessageResponse
}

export interface WSErrorFrame {
  type: 'error'
  code: string
  detail: string
}

export type WSIncomingFrame = WSMessageReceiveFrame | WSErrorFrame


//  this is for the app state 
export type ConnectionStatus = 'connecting' | 'connected' | 'disconnected' | 'error'

export interface ActiveConversation {
  userId: string
  username: string
}

// ─── API Error ───────────────────────────────────────────────────────────────

export interface ApiErrorBody {
  detail: string
}

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    public readonly detail: string,
  ) {
    super(detail)
    this.name = 'ApiError'
  }
}