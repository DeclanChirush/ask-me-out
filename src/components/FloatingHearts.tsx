import { useMemo } from 'react';

interface Props {
  count?: number;
  emojis?: string[];
}

export default function FloatingHearts({ count = 12, emojis = ['💖', '💕', '💗', '🌸', '💘'] }: Props) {
  const items = useMemo(
    () =>
      Array.from({ length: count }).map((_, i) => ({
        left: Math.random() * 100,
        size: 14 + Math.random() * 22,
        delay: -Math.random() * 6,
        dur: 5 + Math.random() * 4,
        emoji: emojis[i % emojis.length],
      })),
    [count, emojis]
  );

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      {items.map((h, i) => (
        <span
          key={i}
          className="absolute -bottom-10 animate-heart-float"
          style={{
            left: `${h.left}%`,
            fontSize: `${h.size}px`,
            animationDelay: `${h.delay}s`,
            animationDuration: `${h.dur}s`,
          }}
        >
          {h.emoji}
        </span>
      ))}
    </div>
  );
}
