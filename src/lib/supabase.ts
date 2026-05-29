import { createClient, SupabaseClient } from '@supabase/supabase-js';
import type { Ask } from '../types';

const url  = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const anon = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

export const supabase: SupabaseClient | null =
  url && anon ? createClient(url, anon) : null;

export const isSupabaseEnabled = !!supabase;

/* ---------------- localStorage fallback layer ---------------- */
const LS_KEY = 'askout:asks';

function readAll(): Record<string, Ask> {
  try { return JSON.parse(localStorage.getItem(LS_KEY) || '{}'); }
  catch { return {}; }
}
function writeAll(map: Record<string, Ask>) {
  localStorage.setItem(LS_KEY, JSON.stringify(map));
}
function uid() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16);
  });
}

/* ---------------- API ---------------- */

/**
 * Creates a new ask record.
 * Photo encryption is handled by the caller (SetupPage) — pass the already-encrypted
 * blob in initial.photos so this function stays pure storage logic.
 */
export async function createAsk(initial: Partial<Ask>): Promise<Ask> {
  const newAsk: Ask = {
    id: uid(),
    sender_name: initial.sender_name || '',
    receiver_name: initial.receiver_name || '',
    lang: initial.lang || 'both',
    photos: initial.photos || [],
    places: [],
    sender_whatsapp: initial.sender_whatsapp || null,
    personal_message: initial.personal_message || null,
    receiver_message: null,
    answer: null,
    chosen_place: null,
    chosen_place_custom: null,
    chosen_day: null,
    outfit_color: null,
    outfit_custom: null,
    how_we_met: null,
    no_count: 0,
    opened_at: null,
    answered_at: null,
    created_at: new Date().toISOString(),
    // Photos (and the whole record) auto-expire after 7 days
    expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
  };

  if (supabase) {
    const { data, error } = await supabase.from('asks').insert(newAsk).select().single();
    if (error) throw error;
    return data as Ask;
  }

  const all = readAll();
  all[newAsk.id] = newAsk;
  writeAll(all);
  return newAsk;
}

export async function getAsk(id: string): Promise<Ask | null> {
  if (supabase) {
    const { data } = await supabase.from('asks').select('*').eq('id', id).maybeSingle();
    if (!data) return null;
    const ask = data as Ask;
    // Lazy photo expiry — wipe encrypted blobs once the 7-day window passes.
    // The invite record itself stays so the receiver can still see their plan.
    if (ask.expires_at && new Date(ask.expires_at) < new Date() && ask.photos?.length > 0) {
      // Fire-and-forget; don't block the UI
      supabase.from('asks').update({ photos: [] }).eq('id', id);
      return { ...ask, photos: [] };
    }
    return ask;
  }
  const stored = readAll()[id];
  if (!stored) return null;
  if (stored.expires_at && new Date(stored.expires_at) < new Date() && stored.photos?.length > 0) {
    const all = readAll();
    all[id] = { ...stored, photos: [] };
    writeAll(all);
    return all[id];
  }
  return stored;
}

export async function updateAsk(id: string, patch: Partial<Ask>): Promise<Ask | null> {
  if (supabase) {
    const { data } = await supabase.from('asks').update(patch).eq('id', id).select().single();
    return (data as Ask) || null;
  }
  const all = readAll();
  if (!all[id]) return null;
  all[id] = { ...all[id], ...patch };
  writeAll(all);
  window.dispatchEvent(new CustomEvent('askout:update', { detail: all[id] }));
  return all[id];
}

export async function bumpNo(id: string): Promise<void> {
  const ask = await getAsk(id);
  if (!ask) return;
  await updateAsk(id, { no_count: ask.no_count + 1 });
}

/* ---------------- subscriptions ---------------- */
export function subscribeAsk(id: string, onChange: (a: Ask) => void): () => void {
  if (supabase) {
    const channel = supabase
      .channel('asks:' + id)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'asks', filter: `id=eq.${id}` },
        (payload) => onChange(payload.new as Ask)
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }

  const handler = (e: Event) => {
    const a = (e as CustomEvent<Ask>).detail;
    if (a && a.id === id) onChange(a);
  };
  window.addEventListener('askout:update', handler);
  const poll = setInterval(async () => {
    const a = await getAsk(id);
    if (a) onChange(a);
  }, 1500);
  return () => {
    window.removeEventListener('askout:update', handler);
    clearInterval(poll);
  };
}
