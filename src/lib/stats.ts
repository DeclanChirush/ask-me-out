import { supabase } from './supabase';

/**
 * Privacy-safe aggregate analytics. NEVER returns names, messages, or
 * any identifying field. Only counts and anonymised timestamps.
 */

export interface AppStats {
  /** Total ask records ever created (= total senders, near enough) */
  totalAsks: number;
  /** Total reusable cards created */
  totalCards: number;
  /** Total invites where the link was opened by a receiver */
  totalOpened: number;
  /** Total YES answers */
  totalYes: number;
  /** Total NO answers (final ones, not no-button-dodges) */
  totalNo: number;
  /** Sum of every "tried no but button ran away" attempt */
  totalNoDodges: number;
  /** Asks created in the last 24 hours */
  last24hAsks: number;
  /** Yeses in the last 24 hours */
  last24hYes: number;
}

export interface RecentEvent {
  kind: 'yes' | 'opened' | 'created';
  at: string;
}

const EMPTY: AppStats = {
  totalAsks: 0, totalCards: 0, totalOpened: 0,
  totalYes: 0, totalNo: 0, totalNoDodges: 0,
  last24hAsks: 0, last24hYes: 0,
};

export async function fetchAppStats(): Promise<AppStats> {
  if (!supabase) return EMPTY;
  // Pull just the columns we need to aggregate. Postgres count(*) would
  // be cheaper but this keeps a single round trip + lets us derive the
  // 24h windows without extra queries.
  const { data, error } = await supabase
    .from('asks')
    .select('id, answer, opened_at, no_count, parent_id, created_at');
  if (error || !data) return EMPTY;

  const now = Date.now();
  const ONE_DAY = 24 * 60 * 60 * 1000;
  let s = { ...EMPTY };
  s.totalAsks = data.length;
  for (const row of data as Array<{ answer: string | null; opened_at: string | null; no_count: number | null; parent_id: string | null; created_at: string | null }>) {
    if (!row.parent_id) {
      // Parents are either one-off invites OR reusable card templates.
      // We can't tell which from the DB alone (is_reusable lives on the
      // sender's device), so we count every parent-less row here for
      // "ever created" — and the cards count below is best-effort.
    }
    if (row.opened_at) s.totalOpened++;
    if (row.answer === 'yes') s.totalYes++;
    if (row.answer === 'no')  s.totalNo++;
    s.totalNoDodges += row.no_count || 0;
    const createdMs = row.created_at ? new Date(row.created_at).getTime() : 0;
    if (createdMs && now - createdMs < ONE_DAY) s.last24hAsks++;
    if (row.answer === 'yes' && createdMs && now - createdMs < ONE_DAY) s.last24hYes++;
  }
  // A card is a parent whose own answer is null AND which has at least
  // one child pointing at it. Approximate by counting distinct parent_ids.
  const parentIds = new Set<string>();
  for (const r of data as Array<{ parent_id: string | null }>) {
    if (r.parent_id) parentIds.add(r.parent_id);
  }
  s.totalCards = parentIds.size;
  return s;
}

export async function fetchRecentEvents(limit = 10): Promise<RecentEvent[]> {
  if (!supabase) return [];
  const { data } = await supabase
    .from('asks')
    .select('answer, answered_at, opened_at, created_at')
    .order('created_at', { ascending: false })
    .limit(50);
  if (!data) return [];
  const out: RecentEvent[] = [];
  for (const row of data as Array<{ answer: string | null; answered_at: string | null; opened_at: string | null; created_at: string | null }>) {
    if (row.answer === 'yes' && row.answered_at) {
      out.push({ kind: 'yes', at: row.answered_at });
    } else if (row.opened_at) {
      out.push({ kind: 'opened', at: row.opened_at });
    } else if (row.created_at) {
      out.push({ kind: 'created', at: row.created_at });
    }
  }
  return out.sort((a, b) => (a.at < b.at ? 1 : -1)).slice(0, limit);
}
