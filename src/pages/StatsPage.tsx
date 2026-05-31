import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import PhoneShell from '../components/PhoneShell';
import FloatingHearts from '../components/FloatingHearts';
import {
  fetchAppStats,
  fetchRecentEvents,
  type AppStats,
  type RecentEvent,
} from '../lib/stats';
import {
  isAdminConfigured,
  isUnlocked,
  tryUnlock,
  lock,
  sha256Hex,
} from '../lib/admin';
import { playClick, playConfirm } from '../lib/sounds';

export default function StatsPage() {
  const navigate = useNavigate();
  const [unlocked, setUnlocked]   = useState(isUnlocked());
  const [pass, setPass]           = useState('');
  const [wrong, setWrong]         = useState(false);
  const [stats, setStats]         = useState<AppStats | null>(null);
  const [recent, setRecent]       = useState<RecentEvent[]>([]);
  const [loadingStats, setLoading] = useState(false);

  /* Setup-helper inputs (only shown when admin isn't configured yet) */
  const [setupPass, setSetupPass] = useState('');
  const [computedHash, setComputedHash] = useState('');

  useEffect(() => {
    if (!unlocked) return;
    setLoading(true);
    Promise.all([fetchAppStats(), fetchRecentEvents(12)]).then(([s, r]) => {
      setStats(s);
      setRecent(r);
      setLoading(false);
    });
  }, [unlocked]);

  const handleUnlock = async () => {
    const ok = await tryUnlock(pass);
    if (ok) {
      playConfirm();
      setUnlocked(true);
      setWrong(false);
      setPass('');
    } else {
      setWrong(true);
      setTimeout(() => setWrong(false), 1500);
    }
  };

  const handleComputeHash = async () => {
    if (!setupPass) return;
    setComputedHash(await sha256Hex(setupPass));
  };

  /* ── Setup screen — shown once if VITE_ADMIN_HASH isn't configured ── */
  if (!isAdminConfigured()) {
    return (
      <PhoneShell>
        <div className="h-full overflow-y-auto no-scrollbar p-5">
          <div className="flex items-center justify-between mb-3">
            <button
              onClick={() => { playClick(); navigate('/'); }}
              className="text-pink-500 font-extrabold text-lg leading-none"
            >‹</button>
            <span className="font-extrabold text-sm">🔧 Admin setup</span>
            <span className="w-4" />
          </div>

          <div className="card p-4">
            <div className="text-[13px] font-extrabold text-ink mb-1">
              Admin passphrase not configured
            </div>
            <p className="text-[12px] text-ink-soft leading-relaxed mb-3">
              The <code className="font-mono text-pink-600">/stats</code> page is locked. To enable it, set a passphrase below to generate a SHA-256 hash, then add it to your Vercel project as the <code className="font-mono text-pink-600">VITE_ADMIN_HASH</code> environment variable and redeploy.
            </p>
            <input
              className="input"
              type="text"
              placeholder="Type your secret passphrase here"
              value={setupPass}
              onChange={(e) => setSetupPass(e.target.value)}
            />
            <button
              onClick={handleComputeHash}
              disabled={!setupPass}
              className="btn btn-primary btn-block mt-2"
              style={{ opacity: setupPass ? 1 : 0.5 }}
            >
              Generate hash
            </button>

            {computedHash && (
              <div
                className="mt-4 p-3 rounded-xl"
                style={{ background: '#fff7fb', border: '1px dashed #f9a8d4' }}
              >
                <div className="text-[10px] uppercase font-extrabold text-pink-500 mb-1.5">
                  Your hash — paste this into Vercel
                </div>
                <div className="font-mono text-[11px] text-ink break-all bg-white p-2 rounded border border-pink-200">
                  {computedHash}
                </div>
                <button
                  onClick={() => navigator.clipboard.writeText(computedHash)}
                  className="btn btn-ghost btn-block mt-2"
                  style={{ fontSize: 12 }}
                >
                  🔗 Copy hash
                </button>
                <div className="text-[10px] text-ink-soft mt-2 leading-snug">
                  Vercel → your project → <b>Settings → Environment Variables</b><br />
                  Name: <code className="font-mono text-pink-600">VITE_ADMIN_HASH</code> · Value: the hash above<br />
                  Then redeploy. The passphrase itself never goes anywhere — only its hash.
                </div>
              </div>
            )}
          </div>
        </div>
      </PhoneShell>
    );
  }

  /* ── Lock screen — admin configured but not unlocked on this device ── */
  if (!unlocked) {
    return (
      <PhoneShell>
        <div className="h-full flex flex-col items-center justify-center p-6 relative overflow-hidden">
          <FloatingHearts count={6} />
          <div className="text-5xl">🔒</div>
          <div className="script text-pink-600 mt-2" style={{ fontSize: 30 }}>
            admin only
          </div>
          <p className="text-ink-soft text-[12px] mt-1 text-center">
            Enter your passphrase to unlock the stats.
          </p>
          <div className="mt-5 w-full max-w-[280px]">
            <input
              className="input text-center"
              type="password"
              placeholder="passphrase…"
              value={pass}
              onChange={(e) => setPass(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') handleUnlock(); }}
              autoFocus
              style={wrong ? { borderColor: '#ef4444', background: '#fef2f2' } : undefined}
            />
            {wrong && (
              <div className="text-[11px] text-red-500 mt-1 text-center font-bold">
                Nope — try again.
              </div>
            )}
            <button
              onClick={handleUnlock}
              disabled={!pass}
              className="btn btn-primary btn-block mt-3"
              style={{ opacity: pass ? 1 : 0.5 }}
            >
              Unlock ✨
            </button>
            <button
              onClick={() => { playClick(); navigate('/'); }}
              className="btn btn-ghost btn-block mt-2"
            >
              ← Back
            </button>
          </div>
        </div>
      </PhoneShell>
    );
  }

  /* ── Stats screen — unlocked ── */
  const yesRate = stats && stats.totalAsks > 0
    ? Math.round((stats.totalYes / Math.max(stats.totalOpened, 1)) * 100)
    : 0;

  return (
    <PhoneShell>
      <div className="h-full overflow-y-auto no-scrollbar">
        <div className="p-5 pb-3 flex items-center justify-between">
          <button
            onClick={() => { playClick(); navigate('/'); }}
            className="text-pink-500 font-extrabold text-lg leading-none"
          >‹</button>
          <span className="font-extrabold text-sm">📊 Admin · Stats</span>
          <button
            onClick={() => { lock(); setUnlocked(false); }}
            className="text-pink-500 text-xs"
          >Lock</button>
        </div>

        <div className="px-5 relative">
          <FloatingHearts count={6} />

          {loadingStats || !stats ? (
            <div className="card p-6 text-center text-ink-soft text-sm">
              Loading numbers…
            </div>
          ) : (
            <>
              <div
                className="rounded-2xl p-5 text-white relative overflow-hidden"
                style={{ background: 'linear-gradient(135deg, #ec4899, #f472b6)' }}
              >
                <div className="text-[11px] font-extrabold uppercase tracking-wider opacity-90">
                  All time
                </div>
                <div className="text-[40px] font-black leading-none mt-1">
                  {stats.totalAsks.toLocaleString()}
                </div>
                <div className="text-xs opacity-90 mt-0.5">total invites created</div>
                <div className="flex gap-3 mt-3 text-[12px]">
                  <span>💕 <b>{stats.totalYes}</b> yes</span>
                  <span>💔 <b>{stats.totalNo}</b> no</span>
                  <span>👀 <b>{stats.totalOpened}</b> opened</span>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2 mt-3">
                <Stat label="YES rate"      value={`${yesRate}%`}                accent="#16a34a" />
                <Stat label="Cards"         value={String(stats.totalCards)}     accent="#be185d" emoji="🎴" />
                <Stat label="No-dodges"     value={String(stats.totalNoDodges)}  accent="#a855f7" emoji="🏃" />
              </div>

              <div className="grid grid-cols-2 gap-2 mt-2">
                <Stat label="24h invites" value={String(stats.last24hAsks)} accent="#ec4899" />
                <Stat label="24h YES"     value={String(stats.last24hYes)}  accent="#16a34a" emoji="💕" />
              </div>

              <div className="card p-4 mt-3">
                <div className="font-black text-sm mb-2">Recent activity</div>
                {recent.length === 0 ? (
                  <div className="text-ink-soft text-sm py-3 text-center">No events yet</div>
                ) : (
                  <div className="grid gap-2">
                    {recent.map((ev, i) => (
                      <motion.div
                        key={`${ev.at}-${i}`}
                        initial={{ opacity: 0, x: -6 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.3, delay: i * 0.03 }}
                        className="flex items-center justify-between text-[12px]"
                      >
                        <span>
                          {ev.kind === 'yes' ? '💕 Someone said YES' :
                           ev.kind === 'opened' ? '👀 An invite was opened' :
                           '💌 New invite created'}
                        </span>
                        <span className="text-ink-soft text-[11px]">{timeAgo(ev.at)}</span>
                      </motion.div>
                    ))}
                  </div>
                )}
              </div>

              <div className="text-[10px] text-ink-soft text-center mt-3 mb-5 italic">
                Aggregate counts only — no names, no contacts, no messages.
              </div>
            </>
          )}
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
        {emoji && <div className="text-sm">{emoji}</div>}
      </div>
    </div>
  );
}

function timeAgo(iso: string): string {
  const s = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (s < 60) return 'just now';
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86400)}d ago`;
}
