import { useEffect, useState } from 'react';

interface Drop {
  id: number;
  x: number;        // % from left
  delay: number;    // ms
  duration: number; // ms
  size: number;     // px font-size
}

interface Props {
  emoji: string;
  /** Increment this value to fire a new burst */
  trigger: number;
  count?: number;
}

/**
 * Renders a burst of falling emoji over the parent element (parent must be
 * position:relative / absolute / fixed).  Self-clears after the animation ends.
 */
export default function EmojiRain({ emoji, trigger, count = 14 }: Props) {
  const [drops, setDrops] = useState<Drop[]>([]);

  useEffect(() => {
    if (!trigger) return;

    const newDrops: Drop[] = Array.from({ length: count }, (_, i) => ({
      id: Date.now() + i,
      x: 5 + Math.random() * 90,
      delay: Math.random() * 450,
      duration: 950 + Math.random() * 550,
      size: 18 + Math.random() * 16,
    }));

    setDrops(newDrops);

    // Clean up after the longest possible animation finishes
    const maxDuration = Math.max(...newDrops.map((d) => d.delay + d.duration)) + 100;
    const t = setTimeout(() => setDrops([]), maxDuration);
    return () => clearTimeout(t);
  }, [trigger]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!drops.length) return null;

  return (
    <div
      aria-hidden
      style={{
        position: 'absolute',
        inset: 0,
        pointerEvents: 'none',
        overflow: 'hidden',
        zIndex: 50,
      }}
    >
      {drops.map((d) => (
        <span
          key={d.id}
          style={{
            position: 'absolute',
            left: `${d.x}%`,
            top: '-2rem',
            fontSize: `${d.size}px`,
            animationName: 'emojiDrop',
            animationDuration: `${d.duration}ms`,
            animationDelay: `${d.delay}ms`,
            animationFillMode: 'both',
            animationTimingFunction: 'ease-in',
            userSelect: 'none',
          }}
        >
          {emoji}
        </span>
      ))}
    </div>
  );
}
