import { EncryptedPayload } from '@/types'
import { bufferToBase64, base64ToBuffer, importPublicKey } from './keys'

const AES_KEY_LENGTH = 256
const IV_LENGTH = 12 


/**
 *  *
 * @param plaintext - raw message string
 * @param recipientPublicKeyB64 - base64 SPKI public key of the recipient
 * @param senderPublicKey - CryptoKey of the sender's public key 
 * @returns SendMessagePayload ready to POST or send over WebSocket
 */





export async function encryptMessagePayload(
  plaintext: string,
  recipientPublicKeyB64: string,
  senderPublicKey: CryptoKey,
): Promise<EncryptedPayload> {
  const enc = new TextEncoder()

 
  const aesKey = await crypto.subtle.generateKey(
    { name: 'AES-GCM', length: AES_KEY_LENGTH },
    true, 
    ['encrypt'],
  )

  const iv = crypto.getRandomValues(new Uint8Array(IV_LENGTH))

  const ciphertextBuffer = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    aesKey,
    enc.encode(plaintext),
  )


  const rawAesKey = await crypto.subtle.exportKey('raw', aesKey)

  
  const recipientPublicKey = await importPublicKey(recipientPublicKeyB64)
  const encryptedKeyForRecipient = await crypto.subtle.encrypt(
    { name: 'RSA-OAEP' },
    recipientPublicKey,
    rawAesKey,
  )

 
  const encryptedKeyForSelf = await crypto.subtle.encrypt(
    { name: 'RSA-OAEP' },
    senderPublicKey,
    rawAesKey,
  )

  return {
    ciphertext: bufferToBase64(ciphertextBuffer),
    iv: bufferToBase64(iv.buffer),
    encrypted_key: bufferToBase64(encryptedKeyForRecipient),
    encrypted_key_for_self: bufferToBase64(encryptedKeyForSelf),
  }
}



/**
 *  *
 * @param payload - the encrypted payload from the server
 * @param privateKey - the current user's private key (from memory session)
 * @param isSentByMe - if true, uses encrypted_key_for_self
 * @returns decrypted plaintext string
 * @throws if decryption fails — caller must catch and surface gracefully
 */


export async function decryptMessage(
  payload: EncryptedPayload,
  privateKey: CryptoKey,
  isSentByMe: boolean,
): Promise<string> {
  const dec = new TextDecoder()

 
  const encryptedKeyB64 = isSentByMe
    ? payload.encrypted_key_for_self
    : payload.encrypted_key

 
  const rawAesKey = await crypto.subtle.decrypt(
    { name: 'RSA-OAEP' },
    privateKey,
    base64ToBuffer(encryptedKeyB64),
  )

 
  const aesKey = await crypto.subtle.importKey(
    'raw',
    rawAesKey,
    { name: 'AES-GCM', length: AES_KEY_LENGTH },
    false,
    ['decrypt'],
  )

 
  const plaintextBuffer = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv: base64ToBuffer(payload.iv) },
    aesKey,
    base64ToBuffer(payload.ciphertext),
  )

  return dec.decode(plaintextBuffer)
}