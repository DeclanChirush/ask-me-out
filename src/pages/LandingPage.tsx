import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import PhoneShell from '../components/PhoneShell';
import FloatingHearts from '../components/FloatingHearts';
import { playClick } from '../lib/sounds';

/**
 * Landing / welcome page — mobile-first, very pink, very cute.
 * Big signature-font headline using the `Caveat` font (loaded globally).
 * Single juicy CTA that drops the visitor into the setup flow.
 */
export default function LandingPage() {
  const navigate = useNavigate();

  return (
    <PhoneShell>
      <div className="relative h-full overflow-y-auto no-scrollbar">

        {/* Soft glow halos */}
        <div
          className="absolute -top-24 -left-16 w-72 h-72 rounded-full pointer-events-none"
          style={{ background: 'radial-gradient(circle, rgba(244,114,182,.35), transparent 70%)' }}
        />
        <div
          className="absolute top-40 -right-20 w-72 h-72 rounded-full pointer-events-none"
          style={{ background: 'radial-gradient(circle, rgba(236,72,153,.28), transparent 70%)' }}
        />

        {/* Floating hearts behind everything */}
        <FloatingHearts count={14} />

        {/* ─── Hero ──────────────────────────────────────────────── */}
        <div className="relative px-6 pt-10 text-center">
          {/* tiny brand pill */}
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-extrabold uppercase tracking-widest text-pink-600"
            style={{ background: 'rgba(255,255,255,.7)', border: '1px solid #fbcfe8' }}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-pink-500 animate-live-pulse" />
            AskOut · v1
          </motion.div>

          {/* Tagline above signature */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="mt-6 text-[12px] font-extrabold uppercase tracking-[.25em] text-pink-500"
          >
            psst…
          </motion.div>

          {/* Signature headline */}
          <motion.h1
            initial={{ opacity: 0, scale: 0.9, rotate: -2 }}
            animate={{ opacity: 1, scale: 1, rotate: -2 }}
            transition={{ type: 'spring', stiffness: 220, damping: 18, delay: 0.2 }}
            className="script mt-1 leading-none select-none"
            style={{
              fontSize: 78,
              background: 'linear-gradient(135deg, #ec4899 0%, #f472b6 45%, #be185d 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              filter: 'drop-shadow(0 6px 18px rgba(236,72,153,.35))',
              transform: 'rotate(-2deg)',
            }}
          >
            Will you?
          </motion.h1>

          {/* Hand-drawn underline */}
          <motion.svg
            initial={{ pathLength: 0, opacity: 0 }}
            animate={{ pathLength: 1, opacity: 1 }}
            transition={{ duration: 0.9, delay: 0.7 }}
            width="180"
            height="14"
            viewBox="0 0 180 14"
            className="block mx-auto -mt-2"
          >
            <motion.path
              d="M4 8 Q 45 -4, 90 6 T 176 6"
              stroke="#ec4899"
              strokeWidth="3"
              strokeLinecap="round"
              fill="none"
            />
          </motion.svg>

          {/* Sub-headline */}
          <motion.p
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.55 }}
            className="text-ink-soft mt-5 text-[14px] leading-relaxed font-bold px-2"
          >
            Make a one-of-a-kind date invite —
            <br />
            animated hearts, your photos, and a
            <span className="text-pink-600 font-black"> real-time YES </span>
            on the other side. 💌
          </motion.p>
        </div>

        {/* ─── Mini preview / sticker collage ───────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.7 }}
          className="relative mx-6 mt-8 h-[150px]"
        >
          {/* Polaroid 1 — back-left */}
          <Polaroid
            emoji="💌"
            label="The invite"
            tilt={-9}
            x={4}
            y={6}
            delay={0.9}
          />
          {/* Polaroid 2 — center */}
          <Polaroid
            emoji="💕"
            label="They said YES"
            tilt={3}
            x={120}
            y={0}
            delay={1.0}
            highlight
          />
          {/* Polaroid 3 — back-right */}
          <Polaroid
            emoji="🎉"
            label="Plan it"
            tilt={10}
            x={238}
            y={10}
            delay={1.1}
          />
          {/* sparkle accents */}
          <motion.span
            animate={{ scale: [1, 1.3, 1], rotate: [0, 12, 0] }}
            transition={{ duration: 2.2, repeat: Infinity }}
            className="absolute text-2xl"
            style={{ top: -10, left: 70 }}
          >
            ✨
          </motion.span>
          <motion.span
            animate={{ scale: [1, 1.3, 1], rotate: [0, -10, 0] }}
            transition={{ duration: 2.4, repeat: Infinity, delay: 0.4 }}
            className="absolute text-xl"
            style={{ bottom: 0, right: 32 }}
          >
            ✦
          </motion.span>
        </motion.div>

        {/* ─── Feature bullets ────────────────────────────────────── */}
        <div className="px-6 mt-8 grid gap-2">
          <FeatureRow icon="🌹" text="Animated hearts & confetti — pure cute" delay={1.1} />
          <FeatureRow icon="📸" text="Add your own photos & a personal note" delay={1.2} />
          <FeatureRow icon="📡" text="Watch her reaction live — real time" delay={1.3} />
        </div>

        {/* ─── CTA ──────────────────────────────────────────────── */}
        <div className="px-6 mt-7 pb-3">
          <motion.button
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 1.45 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => { playClick(); navigate('/setup'); }}
            className="btn btn-primary btn-block relative overflow-hidden"
            style={{ fontSize: 17, padding: '16px 18px' }}
          >
            {/* shimmer sweep */}
            <motion.span
              aria-hidden
              initial={{ x: '-120%' }}
              animate={{ x: '220%' }}
              transition={{ duration: 2.4, repeat: Infinity, ease: 'easeInOut', repeatDelay: 1.4 }}
              style={{
                position: 'absolute', top: 0, left: 0,
                height: '100%', width: '40%',
                background: 'linear-gradient(120deg, transparent 0%, rgba(255,255,255,.45) 50%, transparent 100%)',
                pointerEvents: 'none',
              }}
            />
            Start your love story 💌
          </motion.button>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 1.65 }}
            className="text-center text-[11px] text-ink-soft mt-2.5 font-bold"
          >
            takes ~60 seconds · totally private 🔒
          </motion.div>
        </div>

        {/* ─── Footer ──────────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 1.8 }}
          className="text-center pb-7 pt-5"
        >
          <div className="script text-pink-500 text-[22px] leading-none" style={{ transform: 'rotate(-1deg)' }}>
            made with 💕
          </div>
          <div className="text-[10px] uppercase tracking-[.25em] text-ink-soft font-extrabold mt-1">
            for the brave hearts of Sri Lanka
          </div>
        </motion.div>

      </div>
    </PhoneShell>
  );
}

/* ─── Small polaroid card ─────────────────────────────────────── */
function Polaroid({
  emoji, label, tilt, x, y, delay, highlight,
}: {
  emoji: string;
  label: string;
  tilt: number;
  x: number;
  y: number;
  delay: number;
  highlight?: boolean;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 18, rotate: tilt - 6, scale: 0.85 }}
      animate={{ opacity: 1, y, rotate: tilt, scale: 1 }}
      transition={{ type: 'spring', stiffness: 200, damping: 16, delay }}
      whileHover={{ rotate: tilt - 3, scale: 1.04 }}
      className="absolute"
      style={{
        left: x,
        width: 110,
        background: 'white',
        borderRadius: 14,
        padding: 8,
        boxShadow: highlight
          ? '0 14px 28px -10px rgba(236,72,153,.55)'
          : '0 10px 22px -10px rgba(190,24,93,.30)',
        border: highlight ? '1.5px solid #f9a8d4' : '1px solid #fce7f3',
      }}
    >
      <div
        className="rounded-md grid place-items-center"
        style={{
          height: 78,
          background: highlight
            ? 'linear-gradient(135deg, #fff1f7, #fce7f3)'
            : 'linear-gradient(135deg, #fdf2f8, #fce7f3)',
          fontSize: 38,
        }}
      >
        {emoji}
      </div>
      <div className="script text-center text-pink-600 mt-1 leading-none" style={{ fontSize: 18 }}>
        {label}
      </div>
    </motion.div>
  );
}

/* ─── Feature bullet row ─────────────────────────────────────── */
function FeatureRow({ icon, text, delay }: { icon: string; text: string; delay: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.5, delay }}
      className="flex items-center gap-3 rounded-2xl px-3 py-2.5"
      style={{ background: 'rgba(255,255,255,.7)', border: '1px solid #fce7f3' }}
    >
      <div
        className="w-9 h-9 rounded-xl grid place-items-center text-lg flex-none"
        style={{ background: 'linear-gradient(135deg,#fff1f7,#fce7f3)' }}
      >
        {icon}
      </div>
      <div className="text-[13px] font-extrabold text-ink leading-tight">{text}</div>
    </motion.div>
  );
}
