import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import PhoneShell from '../components/PhoneShell';
import FloatingHearts from '../components/FloatingHearts';
import QRCode from '../components/QRCode';
import {
  getCard,
  cardUrl,
  type MyCard,
} from '../lib/myCards';
import { listAsksByParent } from '../lib/supabase';
import { playClick } from '../lib/sounds';
import type { Ask } from '../types';

type Status = 'loading' | 'pending' | 'opened' | 'yes' | 'no' | 'missing';

interface Row {
  id: string;
  receiver_name: string;
  created_at: string;
  status: Status;
  no_count: number;
}

const STATUS_META: Record<Status, { label: string; emoji: string; bg: string; color: string }> = {
  loading: { label: '...',     emoji: '⌛', bg: '#fce7f3', color: '#831843' },
  pending: { label: 'Pending', emoji: '💌', bg: '#fef3c7', color: '#92400e' },
  opened:  { label: 'Opened',  emoji: '👀', bg: '#dbeafe', color: '#1e40af' },
  yes:     { label: 'YES 💕',  emoji: '💖', bg: '#fbcfe8', color: '#9d174d' },
  no:      { label: 'Said no', emoji: '💔', bg: '#e5e7eb', color: '#374151' },
  missing: { label: 'Expired', emoji: '🗑️', bg: '#f3f4f6', color: '#6b7280' },
};

function timeAgo(iso: string): string {
  const s = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (s < 60) return 'just now';
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86400)}d ago`;
}

function statusOf(a: Ask | null): Status {
  if (!a) return 'missing';
  if (a.answer === 'yes') return 'yes';
  if (a.answer === 'no')  return 'no';
  if (a.opened_at)        return 'opened';
  return 'pending';
}

export default function CardResponsesPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [card, setCard] = useState<MyCard | null>(null);
  const [rows, setRows] = useState<Row[]>([]);
  const [copied, setCopied] = useState(false);
  const [showQR, setShowQR] = useState(false);

  useEffect(() => {
    if (!id) return;
    const c = getCard(id);
    setCard(c);

    (async () => {
      // Pull every ask that links back to this card — works cross-device
      // because parent_id is stored in the DB, not just localStorage.
      const children = await listAsksByParent(id);
      setRows(children.map((a) => ({
        id: a.id,
        receiver_name: a.receiver_name,
        created_at: a.created_at || new Date().toISOString(),
        status: statusOf(a),
        no_count: a.no_count || 0,
      })));
    })();
  }, [id]);

  if (!card) {
    return (
      <PhoneShell>
        <div className="h-full grid place-items-center text-center p-6">
          <div>
            <div className="text-5xl">💔</div>
            <div className="font-extrabold mt-2">Card not found on this device.</div>
            <button onClick={() => navigate('/my-invites')} className="btn btn-ghost mt-4">
              ← Back to my invites
            </button>
          </div>
        </div>
      </PhoneShell>
    );
  }

  const url = cardUrl(card);
  const yesCount = rows.filter((r) => r.status === 'yes').length;
  const openedCount = rows.filter((r) => r.status !== 'pending' && r.status !== 'loading').length;

  return (
    <PhoneShell>
      <div className="h-full flex flex-col overflow-hidden">

        {/* Header */}
        <div className="px-5 pt-4 pb-2 flex items-center justify-between">
          <button
            onClick={() => { playClick(); navigate('/my-invites'); }}
            className="text-pink-500 font-extrabold text-lg leading-none"
            aria-label="Back"
          >
            ‹
          </button>
          <span className="font-extrabold text-sm">🎴 Reusable card</span>
          <span className="w-4" />
        </div>

        <div className="flex-1 overflow-y-auto no-scrollbar px-5 pb-4 relative">
          <FloatingHearts count={8} />

          <div className="washi mt-1">~ {card.sender_name}'s card ~</div>

          {/* Quick stats */}
          <div className="grid grid-cols-3 gap-2 mt-3">
            <Stat label="Replies" value={String(rows.length)} accent="#be185d" />
            <Stat label="Opened"  value={String(openedCount)} accent="#1e40af" />
            <Stat label="YES"     value={String(yesCount)}    accent="#9d174d" emoji="💕" />
          </div>

          {/* QR + share */}
          <div className="card mt-3 p-4">
            <button
              onClick={() => { playClick(); setShowQR((v) => !v); }}
              className="w-full text-left flex items-center justify-between"
            >
              <span className="font-extrabold text-[13px]">📱 Show QR to scan</span>
              <span className="text-pink-500 text-xs">{showQR ? 'hide' : 'show'}</span>
            </button>
            {showQR && (
              <div className="flex justify-center mt-3">
                <QRCode value={url} size={160} />
              </div>
            )}
            <div
              className="flex items-center gap-2 rounded-xl px-3 py-2.5 font-mono text-[11px] mt-3"
              style={{ background: '#fff7fb', border: '1.5px solid #fbcfe8', color: '#831843' }}
            >
              <span className="flex-1 truncate">{url}</span>
              <button
                className="btn btn-primary"
                style={{ padding: '5px 10px', fontSize: 11 }}
                onClick={() => {
                  navigator.clipboard.writeText(url);
                  setCopied(true);
                  setTimeout(() => setCopied(false), 1400);
                }}
              >
                {copied ? '✓' : 'Copy'}
              </button>
            </div>
          </div>

          {/* Responses list */}
          <div className="mt-4">
            <div className="text-[11px] uppercase tracking-wider font-extrabold text-pink-500 mb-2">
              Responses
            </div>

            {rows.length === 0 ? (
              <div className="card p-5 text-center">
                <div className="text-3xl">💌</div>
                <div className="text-[13px] font-extrabold mt-2">No replies yet</div>
                <p className="text-ink-soft text-[11px] mt-1 leading-snug">
                  Show your QR to someone — when they scan and type their name, they'll appear here.
                </p>
              </div>
            ) : (
              <div className="grid gap-2">
                {rows.map((r, i) => {
                  const meta = STATUS_META[r.status];
                  return (
                    <motion.button
                      key={r.id}
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3, delay: i * 0.04 }}
                      onClick={() => { playClick(); navigate(`/dashboard/${r.id}`); }}
                      className="card p-3 text-left flex items-center gap-3 hover:border-pink-300"
                    >
                      <div
                        className="flex-none w-10 h-10 rounded-2xl grid place-items-center text-lg"
                        style={{ background: meta.bg }}
                      >
                        {meta.emoji}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <div className="font-extrabold text-[14px] text-ink truncate">
                            {r.receiver_name || (
                              <span className="italic text-ink-soft font-normal">
                                {r.status === 'loading' ? '…' : 'waiting for name'}
                              </span>
                            )}
                          </div>
                          <span
                            className="text-[9px] font-extrabold uppercase tracking-wider px-1.5 py-0.5 rounded"
                            style={{ background: meta.bg, color: meta.color }}
                          >
                            {meta.label}
                          </span>
                        </div>
                        <div className="text-[10px] text-ink-soft mt-0.5">
                          {timeAgo(r.created_at)}
                          {r.no_count > 0 && (
                            <span className="ml-1 text-pink-400">· {r.no_count} no-dodges</span>
                          )}
                        </div>
                      </div>
                      <span className="text-pink-300 text-base">›</span>
                    </motion.button>
                  );
                })}
              </div>
            )}
          </div>

          <p className="text-center text-[10px] text-ink-soft mt-4 leading-relaxed px-4">
            Only this device sees this list — others can't see who else scanned. 🔒
          </p>
        </div>
      </div>
    </PhoneShell>
  );
}

function Stat({ label, value, accent, emoji }: { label: string; value: string; accent: string; emoji?: string }) {
  return (
    <div className="bg-white border border-pink-200 rounded-2xl px-3 py-2.5 flex flex-col gap-1">
      <div className="text-[9px] text-ink-soft font-black uppercase tracking-wider">{label}</div>
      <div className="flex items-baseline gap-1.5">
        <div className="text-[20px] font-black leading-none" style={{ color: accent }}>{value}</div>
        {emoji && <div className="text-xs">{emoji}</div>}
      </div>
    </div>
  );
}
