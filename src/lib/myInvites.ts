/**
 * Per-device "my invites" tracker.
 *
 * Stored in localStorage so a single sender can create multiple invites
 * (e.g. asking a few different people) and come back later to see what
 * each one said — without needing accounts/auth.
 *
 * Nothing here is sensitive: just IDs + names + the photo key hash so
 * we can rebuild the share URL.
 */

const LS_KEY = 'askout:my_invites';

export interface MyInvite {
  id: string;
  sender_name: string;
  receiver_name: string;
  /** "#abc..." or "" — needed to rebuild the receiver URL with the decryption key */
  hash: string;
  created_at: string;
}

export function listMyInvites(): MyInvite[] {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (!raw) return [];
    const arr = JSON.parse(raw) as MyInvite[];
    // Newest first
    return arr.sort((a, b) => (a.created_at < b.created_at ? 1 : -1));
  } catch {
    return [];
  }
}

export function addMyInvite(inv: MyInvite) {
  const all = listMyInvites().filter((x) => x.id !== inv.id);
  all.unshift(inv);
  localStorage.setItem(LS_KEY, JSON.stringify(all));
}

export function removeMyInvite(id: string) {
  const all = listMyInvites().filter((x) => x.id !== id);
  localStorage.setItem(LS_KEY, JSON.stringify(all));
}

/** Rebuild the full shareable URL for a saved invite. */
export function inviteUrl(inv: MyInvite): string {
  return `${window.location.origin}/ask/${inv.id}${inv.hash || ''}`;
}
