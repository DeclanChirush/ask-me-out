import { useMemo } from 'react';

/**
 * Full-screen fixed-position background particles.
 * Hearts float upward continuously using the bgFloat CSS keyframe.
 * The component is purely decorative (pointer-events: none, z-index: 0).
 */

const EMOJIS = ['💕', '💗', '💖', '💝', '❤️', '💓', '💞', '🩷', '💘', '🌸'];

interface Props {
  count?: number;
}

export default function HeartParticles({ count = 22 }: Props) {
  const particles = useMemo(
    () =>
      Array.from({ length: count }, (_, i) => ({
        id: i,
        left:     1 + Math.random() * 97,           // % from left
        size:     10 + Math.random() * 16,           // px font-size
        duration: 9  + Math.random() * 10,           // s per cycle
        delay:    -Math.random() * 19,               // s — negative = already mid-way through
        opacity:  0.30 + Math.random() * 0.28,
        emoji:    EMOJIS[Math.floor(Math.random() * EMOJIS.length)],
      })),
    [count],
  );

  return (
    <div
      aria-hidden
      style={{
        position:      'fixed',
        inset:         0,
        pointerEvents: 'none',
        zIndex:        0,
        overflow:      'hidden',
      }}
    >
      {particles.map((p) => (
        <span
          key={p.id}
          style={{
            position:                'absolute',
            left:                    `${p.left}%`,
            bottom:                  '-2rem',
            fontSize:                `${p.size}px`,
            opacity:                 p.opacity,
            animationName:           'bgFloat',
            animationDuration:       `${p.duration}s`,
            animationDelay:          `${p.delay}s`,
            animationIterationCount: 'infinite',
            animationTimingFunction: 'ease-in-out',
            userSelect:              'none',
          }}
        >
          {p.emoji}
        </span>
      ))}
    </div>
  );
}
