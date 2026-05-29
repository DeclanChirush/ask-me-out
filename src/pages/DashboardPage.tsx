import { useEffect, useMemo, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { getAsk, subscribeAsk } from '../lib/supabase';
import { PLACES } from '../store/useAskStore';
import type { Ask, FeedEvent } from '../types';
import PhoneShell from '../components/PhoneShell';
import FloatingHearts from '../components/FloatingHearts';
import LoadingHeart from '../components/LoadingHeart';

function timeAgo(iso?: string | null) {
  if (!iso) return '—';
  const s = (Date.now() - new Date(iso).getTime()) / 1000;
  if (s < 60) return `${Math.floor(s)}s ago`;
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  return `${Math.floor(s / 3600)}h ago`;
}

function buildFeed(ask: Ask): FeedEvent[] {
  const out: FeedEvent[] = [];
  if (ask.opened_at) {
    out.push({
      id: 'opened',
      emoji: '👀',
      text: 'Link opened',
      sub: `at ${new Date(ask.opened_at).toLocaleTimeString()}`,
      color: '#3b82f6',
      at: new Date(ask.opened_at).getTime(),
    });
  }
  for (let i = 1; i <= ask.no_count; i++) {
    out.push({
      id: `no-${i}`,
      emoji: '🏃',
      text: `Tried No (attempt #${i})`,
      sub: i === ask.no_count && ask.no_count >= 4 ? 'No button vanished 😏' : 'button ran away',
      color: '#a855f7',
      at: Date.now() - (ask.no_count - i) * 10000,
    });
  }
  if (ask.chosen_place) {
    const p = PLACES.find((x) => x.id === ask.chosen_place);
    const placeLabel = ask.chosen_place === 'custom'
      ? (ask.chosen_place_custom || 'Custom place')
      : (p?.label || ask.chosen_place);
    const outfitPart = ask.outfit_color
      ? ` · wearing ${ask.outfit_color}`
      : ask.outfit_custom ? ` · ${ask.outfit_custom}` : '';
    out.push({
      id: 'plan',
      emoji: p?.emoji || '📍',
      text: `Chose ${placeLabel}${ask.chosen_day ? ' · ' + ask.chosen_day : ''}${outfitPart}`,
      color: '#ec4899',
      at: Date.now() - 2000,
    });
  }
  if (ask.how_we_met) {
    out.push({
      id: 'pickup',
      emoji: '🏠',
      text: `Pick up from: ${ask.how_we_met}`,
      color: '#f472b6',
      at: Date.now() - 1500,
    });
  }
  if (ask.receiver_message) {
    out.push({
      id: 'msg',
      emoji: '💬',
      text: `"${ask.receiver_message}"`,
      color: '#f472b6',
      at: Date.now() - 1000,
    });
  }
  if (ask.answer === 'yes') {
    out.push({
      id: 'yes',
      emoji: '💕',
      text: 'Said YES!',
      sub: ask.answered_at ? `at ${new Date(ask.answered_at).toLocaleTimeString()}` : 'just now',
      color: '#16a34a',
      at: ask.answered_at ? new Date(ask.answered_at).getTime() : Date.now(),
    });
  }
  return out.sort((a, b) => b.at - a.at);
}

export default function DashboardPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [ask, setAsk] = useState<Ask | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!id) return;
    (async () => {
      const a = await getAsk(id);
      if (a) setAsk(a);
    })();
    const unsub = subscribeAsk(id, (a) => setAsk(a));
    return () => unsub();
  }, [id]);

  const feed = useMemo(() => (ask ? buildFeed(ask) : []), [ask]);
  const url = ask ? `${window.location.origin}/ask/${ask.id}` : '';

  if (!ask) {
    return <LoadingHeart message="Getting everything ready…" />;
  }

  const statusText = ask.answer === 'yes' ? 'YES' : ask.opened_at ? 'Reading…' : 'Waiting…';
  const statusColor = ask.answer === 'yes' ? '#16a34a' : '#be185d';

  return (
    <PhoneShell>
      <div className="h-full overflow-y-auto no-scrollbar">
        <div className="p-5 pb-3 flex items-center justify-between">
          <span className="font-extrabold text-sm">📊 Sender dashboard</span>
          <span className="inline-flex items-center gap-1.5 text-[10px] font-extrabold uppercase tracking-wider text-pink-600">
            <span className="w-1.5 h-1.5 rounded-full bg-pink-500 animate-live-pulse" />
            LIVE
          </span>
        </div>

        <div className="px-5">
          <div
            className="rounded-2xl p-5 text-white relative overflow-hidden shadow-pink-lg"
            style={{ background: 'linear-gradient(135deg, #ec4899, #f472b6)' }}
          >
            <FloatingHearts count={6} />
            <div className="flex items-center gap-2 relative">
              <span className="w-2.5 h-2.5 rounded-full bg-white animate-live-pulse" />
              <span className="text-[11px] font-extrabold uppercase tracking-wider opacity-90">Live update</span>
            </div>
            <div className="mt-1.5 text-[22px] font-black relative tracking-tight">
              {ask.answer === 'yes'
                ? `${ask.receiver_name} said YES! 💕`
                : `Waiting for ${ask.receiver_name}… 💕`}
            </div>
            <div className="text-xs opacity-85 mt-0.5 relative">
              {ask.answer === 'yes' && ask.chosen_place
                ? `${PLACES.find((p) => p.id === ask.chosen_place)?.label} · ${ask.chosen_day}`
                : ask.opened_at
                ? 'They opened the link.'
                : 'Share the link with them to begin.'}
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2 mt-3">
            <Stat label="Link opened" value={ask.opened_at ? '✓' : '—'} accent={ask.opened_at ? '#16a34a' : '#a44b73'} />
            <Stat label="No attempts" value={String(ask.no_count)} icon="🏃" accent="#be185d" />
            <Stat label="Status" value={statusText} accent={statusColor} icon={ask.answer === 'yes' ? '💕' : undefined} />
          </div>

          <div className="card mt-3 p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="font-black text-sm">Activity feed</div>
              <div className="text-[10px] text-ink-soft font-bold">newest ↓</div>
            </div>
            <div>
              <AnimatePresence initial={false}>
                {feed.length === 0 && (
                  <div className="text-sm text-ink-soft py-4 text-center">
                    No activity yet. When they open your link, you'll see it here.
                  </div>
                )}
                {feed.map((it, i) => (
                  <FeedRow key={it.id} item={it} isLast={i === feed.length - 1} />
                ))}
              </AnimatePresence>
            </div>
          </div>

          <div className="grid gap-2 mt-3">
            {/* <a
              href={`https://wa.me/?text=${encodeURIComponent(`💕 ${url}`)}`}
              target="_blank"
              rel="noreferrer"
              className="btn btn-block"
              style={{ background: '#25D366', color: 'white', boxShadow: '0 10px 22px -10px rgba(37,211,102,.55)' }}
            >
              💬 WhatsApp {ask.receiver_name}
            </a> */}
            <button
              className="btn btn-ghost btn-block"
              onClick={() => {
                navigator.clipboard.writeText(url);
                setCopied(true);
                setTimeout(() => setCopied(false), 1400);
              }}
            >
              🔗 {copied ? 'Copied!' : 'Copy link'}
            </button>
            <button
              className="btn btn-ghost btn-block"
              onClick={() => navigate('/setup')}
            >
              ✨ Send a new invite
            </button>
          </div>

          <div className="rounded-xl mt-3 mb-6 p-3 text-[12px] text-ink-soft leading-snug"
               style={{ background: '#fff1f7', border: '1px dashed #f9a8d4' }}>
            <b className="text-ink">Pro tip —</b> keep this tab open. Updates land in real time.
          </div>
        </div>
      </div>
    </PhoneShell>
  );
}

function Stat({ label, value, accent, icon }: { label: string; value: string; accent: string; icon?: string }) {
  return (
    <div className="bg-white border border-pink-200 rounded-2xl px-3 py-2.5 flex flex-col gap-1">
      <div className="text-[9px] text-ink-soft font-black uppercase tracking-wider">{label}</div>
      <div className="flex items-baseline gap-1.5">
        <div className="text-[22px] font-black leading-none" style={{ color: accent }}>{value}</div>
        {icon && <div className="text-sm">{icon}</div>}
      </div>
    </div>
  );
}

function FeedRow({ item, isLast }: { item: FeedEvent; isLast: boolean }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.4 }}
      className="flex gap-3 relative"
    >
      <div className="relative w-8 flex-none">
        <div
          className="w-8 h-8 rounded-full bg-white grid place-items-center text-sm relative z-10"
          style={{ border: `2px solid ${item.color}`, color: item.color, boxShadow: `0 0 0 4px ${item.color}1a` }}
        >
          {item.emoji}
        </div>
        {!isLast && <div className="absolute left-1/2 top-8 bottom-[-14px] w-px bg-pink-200" />}
      </div>
      <div className="flex-1 pb-3.5">
        <div className="flex items-baseline gap-2 justify-between">
          <div className="font-extrabold text-[13px] text-ink">{item.text}</div>
          <div className="text-[10px] text-ink-soft font-bold whitespace-nowrap">{timeAgo(new Date(item.at).toISOString())}</div>
        </div>
        {item.sub && <div className="text-[11.5px] text-ink-soft mt-0.5">{item.sub}</div>}
      </div>
    </motion.div>
  );
}
