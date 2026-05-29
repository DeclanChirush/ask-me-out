import { useMemo } from 'react';

interface Props { count?: number; }

export default function SakuraPetals({ count = 14 }: Props) {
  const items = useMemo(
    () =>
      Array.from({ length: count }).map(() => ({
        left: Math.random() * 100,
        size: 8 + Math.random() * 12,
        delay: -Math.random() * 8,
        dur: 8 + Math.random() * 6,
      })),
    [count]
  );

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      {items.map((p, i) => (
        <div
          key={i}
          className="absolute -top-2 animate-sakura-fall"
          style={{
            left: `${p.left}%`,
            width: p.size,
            height: p.size,
            background: 'radial-gradient(circle at 30% 30%, #ffd0e3, #f9a8d4)',
            borderRadius: '50% 0 50% 50%',
            animationDelay: `${p.delay}s`,
            animationDuration: `${p.dur}s`,
            opacity: 0.85,
          }}
        />
      ))}
    </div>
  );
}
