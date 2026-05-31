/**
 * Per-device tracking of reusable "Cards" — one QR you can hand to multiple
 * strangers, each of whom scans, types their name, and gets their own
 * personalised invite spawned from the card's template.
 *
 * A card is just a regular Ask record (with receiver_name blank) that the
 * sender's device remembers as a template. Each scan creates a fresh child
 * Ask copying all template data, and we record the parent→children link
 * here so the sender can group their responses.
 */

const LS_CARDS = 'askout:my_cards';
const LS_CHILDREN_PREFIX = 'askout:card_children:';

export interface MyCard {
  id: string;             // template ask id
  sender_name: string;
  hash: string;           // "#abc..." — photo key, same for all children
  created_at: string;
}

export interface CardChild {
  id: string;             // child ask id
  receiver_name: string;
  created_at: string;
}

/* ────── Cards ────── */

export function listMyCards(): MyCard[] {
  try {
    const raw = localStorage.getItem(LS_CARDS);
    if (!raw) return [];
    return (JSON.parse(raw) as MyCard[]).sort((a, b) =>
      a.created_at < b.created_at ? 1 : -1,
    );
  } catch {
    return [];
  }
}

export function addMyCard(card: MyCard) {
  const all = listMyCards().filter((x) => x.id !== card.id);
  all.unshift(card);
  localStorage.setItem(LS_CARDS, JSON.stringify(all));
}

export function removeMyCard(id: string) {
  const all = listMyCards().filter((x) => x.id !== id);
  localStorage.setItem(LS_CARDS, JSON.stringify(all));
  localStorage.removeItem(LS_CHILDREN_PREFIX + id);
}

export function getCard(id: string): MyCard | null {
  return listMyCards().find((c) => c.id === id) || null;
}

export function cardUrl(card: MyCard): string {
  return `${window.location.origin}/card/${card.id}${card.hash || ''}`;
}

/* ────── Children of a card (this device's view) ────── */

export function listCardChildren(cardId: string): CardChild[] {
  try {
    const raw = localStorage.getItem(LS_CHILDREN_PREFIX + cardId);
    if (!raw) return [];
    return (JSON.parse(raw) as CardChild[]).sort((a, b) =>
      a.created_at < b.created_at ? 1 : -1,
    );
  } catch {
    return [];
  }
}

export function addCardChild(cardId: string, child: CardChild) {
  const all = listCardChildren(cardId).filter((x) => x.id !== child.id);
  all.unshift(child);
  localStorage.setItem(LS_CHILDREN_PREFIX + cardId, JSON.stringify(all));
}

/* ────── Cross-device discovery for the scanner ────── */

/**
 * The scanner's device (which is NOT the sender's) needs to remember
 * which card it spawned which child from — so a "you already opened
 * this card" check works on re-scan. Stored under a separate key.
 */
const LS_SCANNED_PREFIX = 'askout:scanned_card:';

export function getScannedChildId(cardId: string): string | null {
  return localStorage.getItem(LS_SCANNED_PREFIX + cardId);
}

export function setScannedChildId(cardId: string, childId: string) {
  localStorage.setItem(LS_SCANNED_PREFIX + cardId, childId);
}
