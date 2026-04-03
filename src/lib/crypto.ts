/**
 * Web Crypto API wrapper for AES-GCM encryption/decryption.
 * Designed for NoTrace E2EE.
 */

const ALGORITHM = 'AES-GCM';
const IV_LENGTH = 12; // Standard for GCM
const PBKDF2_ITERATIONS = 100_000;
const SALT = 'notrace-ephemeral-salt-v1'; // Static salt — acceptable for ephemeral rooms with high-entropy codes

/**
 * Derives a cryptographic key from a room code using PBKDF2.
 * Uses a static salt since room codes are high-entropy and ephemeral.
 */
async function deriveKey(roomCode: string): Promise<CryptoKey> {
  const enc = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    enc.encode(roomCode.toUpperCase()),
    'PBKDF2',
    false,
    ['deriveKey']
  );

  return crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: enc.encode(SALT),
      iterations: PBKDF2_ITERATIONS,
      hash: 'SHA-256',
    },
    keyMaterial,
    { name: ALGORITHM, length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
}

/**
 * Encrypts a string using AES-GCM.
 * Returns a base64 string containing: iv (12 bytes) + ciphertext.
 */
export async function encryptMessage(text: string, roomCode: string): Promise<string> {
  const enc = new TextEncoder();
  const key = await deriveKey(roomCode);
  const iv = crypto.getRandomValues(new Uint8Array(IV_LENGTH));

  const encrypted = await crypto.subtle.encrypt(
    { name: ALGORITHM, iv },
    key,
    enc.encode(text)
  );

  // Combine IV and Ciphertext for transport
  const combined = new Uint8Array(iv.length + encrypted.byteLength);
  combined.set(iv);
  combined.set(new Uint8Array(encrypted), iv.length);

  // Convert to Base64
  return btoa(String.fromCharCode(...combined));
}

/**
 * Decrypts a base64 string (iv + ciphertext) using AES-GCM.
 */
export async function decryptMessage(base64Data: string, roomCode: string): Promise<string> {
  try {
    const key = await deriveKey(roomCode);
    const combined = Uint8Array.from(atob(base64Data), c => c.charCodeAt(0));

    // Extract IV (first 12 bytes)
    const iv = combined.slice(0, IV_LENGTH);
    const ciphertext = combined.slice(IV_LENGTH);

    const decrypted = await crypto.subtle.decrypt(
      { name: ALGORITHM, iv },
      key,
      ciphertext
    );

    return new TextDecoder().decode(decrypted);
  } catch {
    return '[Decryption Error]';
  }
}
