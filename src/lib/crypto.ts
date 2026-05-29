/**
 * AES-256-GCM photo encryption.
 *
 * How it works:
 *   - A random AES-GCM key is generated when the sender creates an ask.
 *   - All photos (base64 strings) are encrypted client-side into a single blob.
 *   - The blob is stored as photos[0] = "enc:<base64>".
 *   - The raw key is exported as URL-safe base64 and placed in the share-link
 *     hash fragment:  /ask/<id>#<key>
 *   - Hash fragments are NEVER sent to any server (browsers strip them from
 *     HTTP requests), so even with Supabase the key stays client-only.
 *   - The receiver page reads the key from window.location.hash, imports it,
 *     and decrypts photos entirely in the browser.
 */

const ALG = { name: 'AES-GCM', length: 256 } as const;
const IV_LEN = 12; // bytes (96-bit IV is standard for AES-GCM)

/* ---------- key helpers ---------- */

export async function generatePhotoKey(): Promise<CryptoKey> {
  return crypto.subtle.generateKey(ALG, true, ['encrypt', 'decrypt']);
}

export async function exportKeyB64(key: CryptoKey): Promise<string> {
  const raw = await crypto.subtle.exportKey('raw', key);
  return toB64(new Uint8Array(raw as ArrayBuffer));
}

export async function importKeyB64(b64: string): Promise<CryptoKey> {
  const raw = fromB64(b64);
  return crypto.subtle.importKey('raw', raw.buffer as ArrayBuffer, ALG, false, ['decrypt']);
}

/* ---------- photo payload type ---------- */

/** Both sides' compressed base64 photos bundled into one encrypted blob. */
export interface PhotoPayload {
  s: string[]; // sender photos
  r: string[]; // receiver photos
}

/* ---------- encrypt / decrypt ---------- */

/**
 * Encrypts an array of base64 photo strings.
 * Returns the string "enc:<url-safe-base64(iv + ciphertext)>".
 */
export async function encryptPhotos(photos: string[], key: CryptoKey): Promise<string> {
  // Use explicit ArrayBuffer to satisfy TypeScript 5 strict Uint8Array<ArrayBuffer> requirement
  const iv = new Uint8Array(new ArrayBuffer(IV_LEN));
  crypto.getRandomValues(iv);

  const plain = new TextEncoder().encode(JSON.stringify(photos));
  const cipher = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, plain);

  const packed = new Uint8Array(new ArrayBuffer(IV_LEN + cipher.byteLength));
  packed.set(iv, 0);
  packed.set(new Uint8Array(cipher as ArrayBuffer), IV_LEN);
  return 'enc:' + toB64(packed);
}

/**
 * Decrypts a value produced by encryptPhotos.
 * Returns plain base64 photo array. If stored value is not encrypted, parses
 * it as a JSON array (backwards compat / no-photos case).
 */
export async function decryptPhotos(stored: string, key: CryptoKey): Promise<string[]> {
  if (!stored.startsWith('enc:')) {
    try { return JSON.parse(stored) as string[]; }
    catch { return []; }
  }

  const packed = fromB64(stored.slice(4));

  const iv = new Uint8Array(new ArrayBuffer(IV_LEN));
  iv.set(packed.subarray(0, IV_LEN));

  const cipherBytes = packed.subarray(IV_LEN);
  // Copy into a fresh ArrayBuffer so TypeScript is happy with the overload
  const cipherBuf = cipherBytes.buffer.slice(
    cipherBytes.byteOffset,
    cipherBytes.byteOffset + cipherBytes.byteLength
  ) as ArrayBuffer;

  const plain = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, key, cipherBuf);
  return JSON.parse(new TextDecoder().decode(plain)) as string[];
}

/**
 * Encrypts a PhotoPayload (sender + receiver photos).
 * Same wire format as encryptPhotos — just serialises an object instead of an array.
 */
export async function encryptPhotoPayload(payload: PhotoPayload, key: CryptoKey): Promise<string> {
  const iv = new Uint8Array(new ArrayBuffer(IV_LEN));
  crypto.getRandomValues(iv);
  const plain = new TextEncoder().encode(JSON.stringify(payload));
  const cipher = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, plain);
  const packed = new Uint8Array(new ArrayBuffer(IV_LEN + cipher.byteLength));
  packed.set(iv, 0);
  packed.set(new Uint8Array(cipher as ArrayBuffer), IV_LEN);
  return 'enc:' + toB64(packed);
}

/**
 * Decrypts a value produced by encryptPhotoPayload.
 * Also handles the old encryptPhotos format (plain string[] → treats as sender photos).
 */
export async function decryptPhotoPayload(stored: string, key: CryptoKey): Promise<PhotoPayload> {
  if (!stored.startsWith('enc:')) {
    try {
      const parsed = JSON.parse(stored);
      if (Array.isArray(parsed)) return { s: parsed as string[], r: [] };
      return parsed as PhotoPayload;
    } catch { return { s: [], r: [] }; }
  }

  const packed = fromB64(stored.slice(4));
  const iv = new Uint8Array(new ArrayBuffer(IV_LEN));
  iv.set(packed.subarray(0, IV_LEN));
  const cipherBytes = packed.subarray(IV_LEN);
  const cipherBuf = cipherBytes.buffer.slice(
    cipherBytes.byteOffset,
    cipherBytes.byteOffset + cipherBytes.byteLength
  ) as ArrayBuffer;

  const plain = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, key, cipherBuf);
  const parsed = JSON.parse(new TextDecoder().decode(plain));

  // Handle both old format (string[]) and new format ({ s, r })
  if (Array.isArray(parsed)) return { s: parsed as string[], r: [] };
  return parsed as PhotoPayload;
}

/* ---------- base64url helpers ---------- */

function toB64(buf: Uint8Array): string {
  // NOTE: do NOT use spread (...Array.from(buf)) — photos can be hundreds of KB
  // which pushes past the JS engine's max argument count (~65k) and throws
  // "RangeError: too many function arguments". Loop instead.
  let binary = '';
  for (let i = 0; i < buf.byteLength; i++) binary += String.fromCharCode(buf[i]);
  return btoa(binary)
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

function fromB64(b64: string): Uint8Array {
  const std = b64.replace(/-/g, '+').replace(/_/g, '/');
  const binary = atob(std);
  const bytes = new Uint8Array(new ArrayBuffer(binary.length));
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}
