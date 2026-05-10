<div align="center">
  <img src="./public/iris-logo.png" alt="Iris Banner" width="100%" />
</div>

# Iris

> End-to-end encrypted messaging. Your keys. Your messages. Your privacy.

**[Live Demo](https://iris-ochre-ten.vercel.app)** · **[Repository](https://github.com/sagittaerys/iris-message)**

---

## Overview

Iris is a secure real-time messaging application built on a strict end-to-end encryption model. 
If you're a fan of Rick Riordan... just move lol... Anyways the server acts as a blind relay — it stores only ciphertext and never has access to plaintext messages, private keys, or passwords. All cryptographic operations happen exclusively on the client using the browser-native Web Crypto API.

The name is drawn from Greek mythology — Iris was the goddess of the rainbow and the divine messenger, the counterpart to Hermes. In the same way, Iris the app carries messages through a medium that cannot read them.

---

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                     CLIENT (Browser)                     │
│                                                          │
│  ┌─────────────┐   ┌──────────────┐   ┌─────────────┐  │
│  │ Crypto Layer│   │  State Layer │   │   UI Layer  │  │
│  │             │   │              │   │             │  │
│  │ keys.ts     │   │ authStore    │   │ LoginForm   │  │
│  │ messaging.ts│   │ messageStore │   │ ChatPane    │  │
│  │ storage.ts  │   │ convStore    │   │ ConvList    │  │
│  └──────┬──────┘   └──────┬───────┘   └──────┬──────┘  │
│         │                 │                  │          │
│         └─────────────────┴──────────────────┘          │
│                           │                             │
│                    ┌──────▼──────┐                      │
│                    │  Transport  │                      │
│                    │  WebSocket  │                      │
│                    │  REST API   │                      │
│                    └──────┬──────┘                      │
└───────────────────────────┼─────────────────────────────┘
                            │ ciphertext only
                            ▼
┌─────────────────────────────────────────────────────────┐
│                  WHISPERBOX API SERVER                   │
│                                                          │
│   Auth  ·  User Registry  ·  Encrypted Message Store    │
│                                                          │
│         Server never sees plaintext. Ever.              │
└─────────────────────────────────────────────────────────┘
```

### Frontend Responsibilities
- RSA-OAEP key pair generation
- Private key wrapping and secure storage
- AES-GCM message encryption before sending
- AES-GCM message decryption after receiving
- WebSocket connection management with reconnect
- Silent JWT token refresh

### Backend Responsibilities (Whisperbox)
- User identity and authentication
- Storing encrypted message blobs
- WebSocket message relay
- Public key distribution

---

## Encryption Flow

### Registration

```
1. Generate RSA-OAEP 2048-bit key pair (Web Crypto API)
2. Export public key as base64 SPKI → sent to server
3. Export private key as PKCS8 bytes
4. Generate 128-bit random PBKDF2 salt
5. Derive AES-GCM 256-bit wrapping key from password via PBKDF2
   └── 310,000 iterations, SHA-256 (OWASP 2023 recommendation)
6. Generate 96-bit random IV
7. AES-GCM encrypt PKCS8 private key bytes → wrappedPrivateKey
8. Store { wrappedPrivateKey, pbkdf2Salt, iv } in IndexedDB
9. Send { username, public_key, wrapped_private_key, pbkdf2_salt } to server
```

### Login

```
1. Authenticate with server → receive access token + wrapped key bundle
2. Load IV from IndexedDB (never sent to server)
3. Re-derive AES-GCM wrapping key from password + salt via PBKDF2
4. AES-GCM decrypt wrapped private key → PKCS8 bytes
5. Import PKCS8 as non-extractable CryptoKey → lives in memory only
6. Private key is now available for the session
```

### Sending a Message

```
1. Generate fresh AES-GCM 256-bit key + 96-bit IV (per message)
2. Encrypt plaintext with AES-GCM → ciphertext
3. Export AES key as raw bytes
4. RSA-OAEP encrypt AES key with recipient's public key → encrypted_key
5. RSA-OAEP encrypt AES key with sender's own public key → encrypted_key_for_self
6. Transmit { ciphertext, iv, encrypted_key, encrypted_key_for_self }
```

### Receiving a Message

```
1. Receive { ciphertext, iv, encrypted_key, encrypted_key_for_self }
2. Select correct slot:
   └── received message → encrypted_key
   └── sent message     → encrypted_key_for_self
3. RSA-OAEP decrypt with own private key → raw AES key bytes
4. Import raw bytes as AES-GCM CryptoKey
5. AES-GCM decrypt ciphertext using iv → plaintext
6. Decryption failure → render "[Could not decrypt]", never crash
```

---

## Key Management

| Key | Storage | Notes |
|-----|---------|-------|
| RSA private key (CryptoKey) | Memory only | Non-extractable. Cleared on logout or page refresh |
| RSA private key (wrapped) | IndexedDB | AES-GCM encrypted with password-derived key. Safe at rest |
| RSA public key | Server + memory | Not sensitive. Distributed freely for encryption |
| AES message key | Never persisted | Generated fresh per message, used once, discarded |
| PBKDF2 salt | IndexedDB + server | Not sensitive. Required to re-derive wrapping key |
| AES-GCM IV (key wrapping) | IndexedDB only | Never sent to server. Required for private key unwrap |
| Access token | Memory only | Never written to localStorage or IndexedDB |
| Refresh token | IndexedDB | Long-lived. Revoked server-side on logout |

### Why AES-GCM for key wrapping instead of AES-KW?

AES-KW (Key Wrap) imposes a strict requirement that input data must conform to RFC 3394 padding — RSA PKCS8 private keys do not satisfy this constraint and produce a `DataError` at runtime. AES-GCM has no such input length requirements and provides equivalent security with authenticated encryption. The IV is stored locally in IndexedDB and never transmitted.

---

## Project Structure

```
src/
├── api/
│   ├── auth.ts           # register, login, refresh, logout, me
│   ├── client.ts         # base fetch wrapper, in-memory token injection
│   ├── messages.ts       # send, conversations, paginated history
│   ├── users.ts          # search, public key retrieval
│   └── websocket.ts      # WS manager, exponential backoff reconnect
│
├── components/
│   ├── auth/
│   │   ├── LoginForm.tsx
│   │   └── RegisterForm.tsx
│   ├── chat/
│   │   ├── ChatPane.tsx        # message thread, input, WS integration
│   │   ├── ConversationList.tsx # sidebar, contacts row, empty state
│   │   └── MessageBubble.tsx   # grouped bubbles, decryption failure state
│   ├── search/
│   │   └── UserSearch.tsx      # debounced Radix dialog
│   └── ui/
│       ├── button.tsx
│       ├── input.tsx
│       └── label.tsx
│
├── crypto/
│   ├── keys.ts           # RSA keygen, PBKDF2 derivation, AES-GCM wrap/unwrap
│   ├── messaging.ts      # per-message AES-GCM encrypt/decrypt
│   └── storage.ts        # IndexedDB vault — keys, tokens, IV
│
├── hooks/
│   ├── useAuth.ts        # register/login orchestration with full crypto flow
│   ├── useMessages.ts    # send + paginated history loading
│   └── useWebSocket.ts   # WS lifecycle tied to auth state
│
├── store/
│   ├── authStore.ts      # session state, in-memory keys, 14-min refresh timer
│   ├── conversationStore.ts
│   └── messageStore.ts   # decrypted messages per conversation
│
├── types/
│   └── index.ts          # all interfaces — single source of truth
│
├── lib/
│   ├── time.ts           # lightweight formatDistanceToNow
│   └── utils.ts          # cn() — clsx + tailwind-merge
│
└── App.tsx               # splash → auth → chat shell routing
```

---

## Tech Stack

| Concern | Choice | Reason |
|---------|--------|--------|
| Framework | React 19 + Vite 8 | Pure client-side SPA — SSR adds no value for a crypto app |
| Language | TypeScript (strict) | `strict: true`, `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes` |
| Crypto | Web Crypto API | Browser-native, hardware-accelerated, zero supply chain risk |
| State | Zustand | Minimal, no boilerplate, easy out-of-component access for token management |
| Styling | Tailwind v4 | Utility-first, no runtime overhead |
| Animations | Motion (Framer) | Splash screen, form transitions, message entry |
| Package manager | pnpm | Strict dependency resolution, fast installs |
| Deployment | Vercel | Zero-config, automatic HTTPS |

---

## Security Design Decisions

### What the server never sees
- Plaintext messages
- Private keys (wrapped or unwrapped)
- The IV used to wrap private keys
- Passwords

### Token strategy
Access tokens live exclusively in a JavaScript module-level variable — not `localStorage`, not `sessionStorage`, not a cookie. They are invisible to any other script on the page and cleared immediately on logout. The 15-minute expiry is silently refreshed at 14 minutes via a `setInterval` in the auth store.

### Private key lifecycle
The private key exists as a non-extractable `CryptoKey` object in memory for the duration of the session. It cannot be serialised or exported after import. On logout or page refresh it is gone — the user must re-authenticate to re-derive it from their password. This is an intentional security trade-off.

### Per-message key rotation
Every message uses a freshly generated AES-GCM key. There is no shared session key, no key reuse, and no state to compromise across messages.

### Decryption failures
Any decryption error is caught per-message and rendered as a silent failure indicator. The application never crashes on a bad decrypt and never exposes error internals to the UI.

---

## Security Trade-offs and Known Limitations

**Private key is memory-only after login.** A page refresh requires the user to log in again and re-derive their private key from their password. This is by design — persisting a decrypted private key would defeat the purpose of wrapping it. Messages received while logged out are delivered on the next WebSocket connection.

**The IV for private key wrapping is stored in IndexedDB.** If a user clears their browser storage, they will be unable to decrypt their stored private key and must re-register. This is a UX trade-off for keeping the IV off the server.

**No forward secrecy.** This implementation uses static RSA key pairs. True forward secrecy (as in the Signal Protocol) would require ephemeral key exchange (X3DH + Double Ratchet), which is outside the scope of this project. Each session uses the same long-term RSA key pair.

**No replay attack protection.** Messages are not sequenced or timestamped in a way that prevents a compromised server from replaying old ciphertext. Mitigation would require monotonic message counters or nonce tracking on the client.

**Single device only.** Private keys are scoped to the device and browser they were generated on. There is no cross-device key sync mechanism.

**Password as the single factor.** The security of the private key at rest depends entirely on password strength. A weak password means a weak wrapping key. Argon2 or scrypt would be stronger choices than PBKDF2 — but PBKDF2 with 310,000 iterations is the current OWASP minimum recommendation for SHA-256.

---

## Running Locally

```bash
# Clone
git clone https://github.com/sagittaerys/iris-message
cd iris-message

# Install
pnpm install

# Environment
echo "VITE_API_BASE_URL=https://whisperbox.koyeb.app" > .env.local

# Dev
pnpm dev

# Type check
pnpm typecheck

# Build
pnpm build
```

---

## API

Iris communicates with the [Whisperbox API](https://whisperbox.koyeb.app/docs).

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/auth/register` | Register with public key bundle |
| POST | `/auth/login` | Login, receive tokens |
| GET | `/auth/me` | Current user profile + wrapped key |
| POST | `/auth/refresh` | Refresh access token |
| POST | `/auth/logout` | Revoke refresh token |
| GET | `/users/search` | Search users by username |
| GET | `/users/{id}/public-key` | Fetch recipient public key |
| GET | `/conversations` | List conversations |
| GET | `/conversations/{id}/messages` | Paginated message history |
| POST | `/messages` | Send encrypted message (REST fallback) |
| WSS | `/ws?token=` | Real-time encrypted message relay |

---

## License

MIT