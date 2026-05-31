import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import PhoneShell from '../components/PhoneShell';
import FloatingHearts from '../components/FloatingHearts';
import { listMyInvites, removeMyInvite, addMyInvite, inviteUrl, type MyInvite } from '../lib/myInvites';
import { listMyCards, removeMyCard, cardUrl, type MyCard } from '../lib/myCards';
import { getAsk, listAsksByParent } from '../lib/supabase';
import { playClick } from '../lib/sounds';
import type { Ask } from '../types';

type Status = 'loading' | 'pending' | 'opened' | 'yes' | 'no' | 'missing';

interface Row extends MyInvite {
  status: Status;
  no_count: number;
  opened_at: string | null;
}

const STATUS_META: Record<Status, { label: string; emoji: string; bg: string; color: string }> = {
  loading: { label: '...',       emoji: '⌛', bg: '#fce7f3', color: '#831843' },
  pending: { label: 'Pending',   emoji: '💌', bg: '#fef3c7', color: '#92400e' },
  opened:  { label: 'Opened',    emoji: '👀', bg: '#dbeafe', color: '#1e40af' },
  yes:     { label: 'YES 💕',    emoji: '💖', bg: '#fbcfe8', color: '#9d174d' },
  no:      { label: 'Said no',   emoji: '💔', bg: '#e5e7eb', color: '#374151' },
  missing: { label: 'Expired',   emoji: '🗑️', bg: '#f3f4f6', color: '#6b7280' },
};

function timeAgo(iso: string): string {
  const ms = Date.now() - new Date(iso).getTime();
  const s = Math.floor(ms / 1000);
  if (s < 60) return 'just now';
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  return `${d}d ago`;
}

function statusOf(a: Ask | null): Status {
  if (!a) return 'missing';
  if (a.answer === 'yes') return 'yes';
  if (a.answer === 'no')  return 'no';
  if (a.opened_at)        return 'opened';
  return 'pending';
}

interface CardRow extends MyCard {
  responses: number;
  yes: number;
}

export default function MyInvitesPage() {
  const navigate = useNavigate();
  const [rows, setRows] = useState<Row[]>([]);
  const [cards, setCards] = useState<CardRow[]>([]);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    // Load cards + enrich with response counts
    const savedCards = listMyCards();
    setCards(savedCards.map((c) => ({ ...c, responses: 0, yes: 0 })));
    (async () => {
      const enrichedCards = await Promise.all(
        savedCards.map(async (c) => {
          const kids = await listAsksByParent(c.id);
          return {
            ...c,
            responses: kids.length,
            yes: kids.filter((k) => k.answer === 'yes').length,
          } as CardRow;
        }),
      );
      setCards(enrichedCards);
    })();

    const saved = listMyInvites();
    // Render skeleton immediately, then enrich with live status
    setRows(saved.map((s) => ({ ...s, status: 'loading', no_count: 0, opened_at: null })));
    (async () => {
      const enriched = await Promise.all(
        saved.map(async (s) => {
          const a = await getAsk(s.id);
          // If the receiver typed their own name on the cover page, the DB
          // now has it — backfill localStorage so the name persists here too.
          const liveReceiverName = a?.receiver_name?.trim() || s.receiver_name;
          if (liveReceiverName && liveReceiverName !== s.receiver_name) {
            addMyInvite({ ...s, receiver_name: liveReceiverName });
          }
          return {
            ...s,
            receiver_name: liveReceiverName,
            status: statusOf(a),
            no_count: a?.no_count || 0,
            opened_at: a?.opened_at || null,
          } as Row;
        })
      );
      setRows(enriched);
    })();
  }, []);

  const handleCopy = (inv: MyInvite) => {
    navigator.clipboard.writeText(inviteUrl(inv));
    setCopiedId(inv.id);
    setTimeout(() => setCopiedId(null), 1400);
  };

  const handleRemove = (id: string) => {
    if (!confirm('Remove this invite from your list?\n(The link itself will still work for the recipient.)')) return;
    removeMyInvite(id);
    setRows((rs) => rs.filter((r) => r.id !== id));
  };

  const handleCopyCard = (card: MyCard) => {
    navigator.clipboard.writeText(cardUrl(card));
    setCopiedId(card.id);
    setTimeout(() => setCopiedId(null), 1400);
  };

  const handleRemoveCard = (id: string) => {
    if (!confirm('Remove this card from your list?\n(The QR will still work for anyone who already scanned it.)')) return;
    removeMyCard(id);
    setCards((cs) => cs.filter((c) => c.id !== id));
  };

  return (
    <PhoneShell>
      <div className="h-full flex flex-col overflow-hidden">

        {/* Header */}
        <div className="px-5 pt-4 pb-2 flex items-center justify-between">
          <button
            onClick={() => { playClick(); navigate('/'); }}
            className="text-pink-500 font-extrabold text-lg leading-none"
            aria-label="Back"
          >
            ‹
          </button>
          <span className="font-extrabold text-sm">💌 My Invites</span>
          <button
            onClick={() => { playClick(); navigate('/setup'); }}
            className="text-pink-600 font-extrabold text-xs"
          >
            + New
          </button>
        </div>

        <div className="px-5 pb-2">
          <div className="washi">~ your love story chapters ~</div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto no-scrollbar px-5 pb-4 relative">
          <FloatingHearts count={8} />

          {rows.length === 0 && cards.length === 0 ? (
            <div className="text-center mt-12 px-4">
              <div className="text-5xl">💌</div>
              <div className="script text-pink-600 mt-2" style={{ fontSize: 28 }}>
                no invites yet
              </div>
              <p className="text-ink-soft text-[13px] mt-2 leading-relaxed">
                Make your first one — it only takes about a minute.
              </p>
              <button
                onClick={() => { playClick(); navigate('/setup'); }}
                className="btn btn-primary mt-5"
              >
                Start a love story 💕
              </button>
            </div>
          ) : (
            <>
              {/* ── Reusable cards ───────────────────────────── */}
              {cards.length > 0 && (
                <div className="mt-2">
                  <div className="text-[11px] uppercase tracking-wider font-extrabold text-pink-500 mb-2 flex items-center gap-1.5">
                    🎴 Reusable cards
                  </div>
                  <div className="grid gap-2">
                    {cards.map((c, i) => (
                      <motion.div
                        key={c.id}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.35, delay: i * 0.04 }}
                        className="card p-3 relative"
                        style={{
                          background: 'linear-gradient(135deg,#fff1f7,#fce7f3)',
                          border: '1.5px solid #f9a8d4',
                        }}
                      >
                        <div className="flex items-start gap-3">
                          <div
                            className="flex-none w-11 h-11 rounded-2xl grid place-items-center text-xl"
                            style={{ background: 'white', border: '1px solid #fbcfe8' }}
                          >
                            🎴
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <div className="font-extrabold text-[15px] text-ink truncate">
                                {c.sender_name}'s card
                              </div>
                              <span
                                className="text-[10px] font-extrabold uppercase tracking-wider px-1.5 py-0.5 rounded"
                                style={{ background: '#fbcfe8', color: '#9d174d' }}
                              >
                                {c.responses} {c.responses === 1 ? 'reply' : 'replies'}
                                {c.yes > 0 && ` · ${c.yes} 💕`}
                              </span>
                            </div>
                            <div className="text-[11px] text-ink-soft mt-0.5">
                              {timeAgo(c.created_at)} · one QR, many replies
                            </div>

                            <div className="flex gap-1.5 mt-2 flex-wrap">
                              <button
                                onClick={() => { playClick(); navigate(`/card/${c.id}/responses`); }}
                                className="btn btn-primary"
                                style={{ padding: '5px 10px', fontSize: 11, borderRadius: 10 }}
                              >
                                📊 See replies
                              </button>
                              <button
                                onClick={() => handleCopyCard(c)}
                                className="btn btn-ghost"
                                style={{ padding: '5px 10px', fontSize: 11, borderRadius: 10 }}
                              >
                                {copiedId === c.id ? '✓ Copied' : '🔗 Copy link'}
                              </button>
                              <button
                                onClick={() => handleRemoveCard(c.id)}
                                className="btn btn-ghost"
                                style={{ padding: '5px 10px', fontSize: 11, borderRadius: 10, color: '#9ca3af' }}
                                aria-label="Remove card"
                              >
                                ×
                              </button>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>
              )}

              {/* ── One-off invites ───────────────────────────── */}
              {rows.length > 0 && (
                <div className={cards.length > 0 ? 'mt-5' : 'mt-2'}>
                  {cards.length > 0 && (
                    <div className="text-[11px] uppercase tracking-wider font-extrabold text-pink-500 mb-2">
                      💌 One-off invites
                    </div>
                  )}
                  <div className="grid gap-3">
              {rows.map((r, i) => {
                const meta = STATUS_META[r.status];
                return (
                  <motion.div
                    key={r.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.35, delay: i * 0.04 }}
                    className="card p-3 relative"
                  >
                    <div className="flex items-start gap-3">
                      <div
                        className="flex-none w-11 h-11 rounded-2xl grid place-items-center text-xl"
                        style={{ background: meta.bg }}
                      >
                        {meta.emoji}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <div className="font-extrabold text-[15px] text-ink truncate">
                            {r.receiver_name || (
                              <span className="italic text-ink-soft font-normal">
                                {r.status === 'loading' ? '…' : 'waiting for name'}
                              </span>
                            )}
                          </div>
                          <span
                            className="text-[10px] font-extrabold uppercase tracking-wider px-1.5 py-0.5 rounded"
                            style={{ background: meta.bg, color: meta.color }}
                          >
                            {meta.label}
                          </span>
                        </div>
                        <div className="text-[11px] text-ink-soft mt-0.5">
                          from <b className="text-pink-600">{r.sender_name}</b> · {timeAgo(r.created_at)}
                          {r.no_count > 0 && (
                            <span className="ml-1 text-pink-400">· {r.no_count} no-dodges</span>
                          )}
                        </div>

                        <div className="flex gap-1.5 mt-2 flex-wrap">
                          <button
                            onClick={() => { playClick(); navigate(`/dashboard/${r.id}`); }}
                            className="btn btn-primary"
                            style={{ padding: '5px 10px', fontSize: 11, borderRadius: 10 }}
                          >
                            📊 Dashboard
                          </button>
                          <button
                            onClick={() => handleCopy(r)}
                            className="btn btn-ghost"
                            style={{ padding: '5px 10px', fontSize: 11, borderRadius: 10 }}
                          >
                            {copiedId === r.id ? '✓ Copied' : '🔗 Copy link'}
                          </button>
                          <button
                            onClick={() => handleRemove(r.id)}
                            className="btn btn-ghost"
                            style={{ padding: '5px 10px', fontSize: 11, borderRadius: 10, color: '#9ca3af' }}
                            aria-label="Remove from list"
                          >
                            ×
                          </button>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
                  </div>
                </div>
              )}

              <p className="text-center text-[10px] text-ink-soft mt-3 leading-relaxed px-4">
                This list lives only on this device — nobody else can see it. 🔒
              </p>
            </>
          )}
        </div>
      </div>
    </PhoneShell>
  );
}
