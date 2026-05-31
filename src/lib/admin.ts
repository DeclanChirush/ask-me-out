/**
 * Tiny "is this Hirush?" gate for the /stats page.
 *
 * Approach: the user picks a passphrase. Its SHA-256 hash is set as
 * VITE_ADMIN_HASH at build time (Vercel env var). Only the hash ends up
 * in the bundle, never the passphrase itself.
 *
 * On /stats, the user enters the passphrase, we hash it client-side and
 * compare. Match → flip a localStorage flag so subsequent visits don't
 * prompt again. Wrong → silently reject.
 *
 * This isn't fortress-grade — anyone who knows the passphrase can get
 * in, and Supabase RLS is the real backstop. But it's enough to keep
 * the stats page from being a random discoverable URL.
 */

const LS_FLAG = 'askout:admin_ok';
const EXPECTED_HASH = (import.meta.env.VITE_ADMIN_HASH || '').toLowerCase();

export function isAdminConfigured(): boolean {
  return EXPECTED_HASH.length === 64; // SHA-256 hex = 64 chars
}

export function isUnlocked(): boolean {
  return localStorage.getItem(LS_FLAG) === '1';
}

export function lock() {
  localStorage.removeItem(LS_FLAG);
}

/** Returns true iff the passphrase hashes to the expected value. */
export async function tryUnlock(passphrase: string): Promise<boolean> {
  if (!isAdminConfigured()) return false;
  const hash = await sha256Hex(passphrase);
  if (hash === EXPECTED_HASH) {
    localStorage.setItem(LS_FLAG, '1');
    return true;
  }
  return false;
}

/** Useful for the setup flow: paste this hash into Vercel env. */
export async function sha256Hex(text: string): Promise<string> {
  const bytes = new TextEncoder().encode(text);
  const digest = await crypto.subtle.digest('SHA-256', bytes);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}
