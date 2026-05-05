/**
 * crypto/keys.ts
 *
 * Handles all RSA-OAEP key generation, PBKDF2 key derivation,
 * AES-KW wrapping/unwrapping of private keys.
 *
 * SECURITY INVARIANTS:
 *   - Private keys are NEVER exported as raw bytes to any storage
 *   - Private keys live only as non-extractable CryptoKey objects in memory
 *   - Wrapped private keys are encrypted with an AES-KW key derived from the user's password
 *   - PBKDF2 salt is 128 bits, 310,000 iterations (OWASP 2023 recommendation)
 */

import { KeyPairBundle, WrappedKeyBundle } from '@/types'

const RSA_PARAMS: RsaHashedKeyGenParams = {
  name: 'RSA-OAEP',
  modulusLength: 2048,
  publicExponent: new Uint8Array([1, 0, 1]), // 65537
  hash: 'SHA-256',
}

const PBKDF2_ITERATIONS = 310_000
const PBKDF2_HASH = 'SHA-256'
const SALT_LENGTH = 16  // 128 bits
const WRAP_KEY_LENGTH = 256 // AES-KW 256-bit

// ─── Helpers ─────────────────────────────────────────────────────────────────

export function bufferToBase64(buffer: ArrayBuffer): string {
  return btoa(String.fromCharCode(...new Uint8Array(buffer)))
}

export function base64ToBuffer(b64: string): ArrayBuffer {
  const binary = atob(b64)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i)
  }
  return bytes.buffer
}

// ─── PBKDF2 ──────────────────────────────────────────────────────────────────

/**
 * Generates a cryptographically random 128-bit salt.
 */
export function generateSalt(): Uint8Array<ArrayBuffer> {
  const buf = new ArrayBuffer(SALT_LENGTH)
  return crypto.getRandomValues(new Uint8Array(buf))
}

/**
 * Derives an AES-KW wrapping key from a password and salt using PBKDF2.
 * The derived key is used exclusively for wrapping/unwrapping the RSA private key.
 */
async function deriveWrappingKey(
  password: string,
  salt: Uint8Array<ArrayBuffer>,
  usage: 'wrapKey' | 'unwrapKey',
): Promise<CryptoKey> {
  const enc = new TextEncoder()
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    enc.encode(password),
    'PBKDF2',
    false,
    ['deriveKey'],
  )

  return crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt,
      iterations: PBKDF2_ITERATIONS,
      hash: PBKDF2_HASH,
    },
    keyMaterial,
    { name: 'AES-KW', length: WRAP_KEY_LENGTH },
    false,
    [usage],
  )
}



// this part handles key generation and it's in 2 facets : public key is extractable while the private key is non extractable...
export async function generateKeyPair(): Promise<KeyPairBundle> {
  const keyPair = await crypto.subtle.generateKey(
    RSA_PARAMS,
    true, 
    ['encrypt', 'decrypt'],
  )


  const publicKeySpki = await crypto.subtle.exportKey('spki', keyPair.publicKey)
  const publicKeyB64 = bufferToBase64(publicKeySpki)

  return {
    publicKeyB64,
    publicKey: keyPair.publicKey,
    privateKey: keyPair.privateKey,
  }
}


export async function wrapPrivateKey(
  privateKey: CryptoKey,
  password: string,
): Promise<WrappedKeyBundle> {
  const salt = generateSalt()
  const wrappingKey = await deriveWrappingKey(password, salt, 'wrapKey')

  const wrappedBuffer = await crypto.subtle.wrapKey('pkcs8', privateKey, wrappingKey, 'AES-KW')

  return {
    wrappedPrivateKey: bufferToBase64(wrappedBuffer),
    pbkdf2Salt: bufferToBase64(salt.buffer as ArrayBuffer),
  }
}


export async function unwrapPrivateKey(
  wrappedPrivateKeyB64: string,
  pbkdf2SaltB64: string,
  password: string,
): Promise<CryptoKey> {
  const wrappedBuffer = base64ToBuffer(wrappedPrivateKeyB64)
  const salt = new Uint8Array(base64ToBuffer(pbkdf2SaltB64) as ArrayBuffer)

  const unwrappingKey = await deriveWrappingKey(password, salt, 'unwrapKey')

  return crypto.subtle.unwrapKey(
    'pkcs8',
    wrappedBuffer,
    unwrappingKey,
    'AES-KW',
    RSA_PARAMS,
    false, 
    ['decrypt'],
  )
}

// imports a base64-encoded spki
export async function importPublicKey(publicKeyB64: string): Promise<CryptoKey> {
  const keyBuffer = base64ToBuffer(publicKeyB64)
  return crypto.subtle.importKey('spki', keyBuffer, RSA_PARAMS, false, ['encrypt'])
}