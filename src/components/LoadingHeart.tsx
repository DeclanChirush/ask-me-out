import { motion } from 'framer-motion';
import PhoneShell from './PhoneShell';
import FloatingHearts from './FloatingHearts';

interface Props {
  message?: string;
}

/**
 * Beautiful loading screen — replaces the plain "Loading…" text.
 * Shows a pulsing heart with a glowing halo and three bouncing emoji dots.
 */
export default function LoadingHeart({ message = 'Loading your invite…' }: Props) {
  return (
    <PhoneShell>
      <div className="h-full flex flex-col items-center justify-center gap-5 relative overflow-hidden">
        <FloatingHearts count={8} />

        {/* Pulsing heart with radial glow */}
        <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          {/* Outer glow ring */}
          <motion.div
            animate={{ scale: [1, 1.6, 1], opacity: [0.35, 0, 0.35] }}
            transition={{ duration: 1.8, repeat: Infinity, ease: 'easeOut' }}
            style={{
              position:     'absolute',
              inset:        -24,
              borderRadius: '50%',
              background:   'radial-gradient(circle, rgba(236,72,153,0.35), transparent 70%)',
            }}
          />
          {/* Inner heart */}
          <motion.div
            animate={{ scale: [1, 1.20, 1] }}
            transition={{ duration: 1.1, repeat: Infinity, ease: 'easeInOut' }}
            style={{
              fontSize: 72,
              lineHeight: 1,
              filter: 'drop-shadow(0 6px 22px rgba(236,72,153,0.55))',
              position: 'relative',
            }}
          >
            💕
          </motion.div>
        </div>

        {/* Fading message */}
        <motion.p
          animate={{ opacity: [0.55, 1, 0.55] }}
          transition={{ duration: 1.5, repeat: Infinity }}
          className="font-extrabold text-pink-600 text-base text-center px-8"
        >
          {message}
        </motion.p>

        {/* Three bouncing emoji dots */}
        <div style={{ display: 'flex', gap: 10 }}>
          {(['💗', '💕', '💖'] as const).map((emoji, i) => (
            <motion.span
              key={i}
              animate={{ y: [0, -14, 0], scale: [1, 1.25, 1] }}
              transition={{ duration: 0.75, repeat: Infinity, delay: i * 0.17, ease: 'easeInOut' }}
              style={{ fontSize: 22 }}
            >
              {emoji}
            </motion.span>
          ))}
        </div>
      </div>
    </PhoneShell>
  );
}
