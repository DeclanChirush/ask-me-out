import { useMemo } from 'react';

interface Props { name?: string; }

export default function StarConstellation({ name = 'Nethmi' }: Props) {
  const letters = (name || 'You').toUpperCase().split('');
  const w = 300, h = 160;

  const dots = letters.map((c, i) => {
    const t = (i + 1) / (letters.length + 1);
    const x = 30 + (w - 60) * t;
    const arc = Math.sin(t * Math.PI) * 50;
    const y = h / 2 - arc;
    return { c, x, y, delay: i * 0.18 };
  });

  const bgStars = useMemo(
    () =>
      Array.from({ length: 30 }).map(() => ({
        sx: Math.random() * 100,
        sy: Math.random() * 100,
        s: 1.5 + Math.random() * 2.5,
        d: 2 + Math.random() * 2,
        delay: -Math.random() * 3,
      })),
    []
  );

  return (
    <div className="relative w-full h-[200px]">
      {bgStars.map((s, i) => (
        <div
          key={i}
          className="absolute rounded-full bg-white animate-twinkle"
          style={{
            left: `${s.sx}%`,
            top: `${s.sy}%`,
            width: s.s,
            height: s.s,
            boxShadow: '0 0 6px white',
            animationDuration: `${s.d}s`,
            animationDelay: `${s.delay}s`,
          }}
        />
      ))}
      <svg
        width="100%"
        height="100%"
        viewBox={`0 0 ${w} ${h}`}
        preserveAspectRatio="xMidYMid meet"
        className="absolute inset-0"
      >
        <polyline
          points={dots.map((d) => `${d.x},${d.y}`).join(' ')}
          fill="none"
          stroke="rgba(255,255,255,.5)"
          strokeWidth="1"
          strokeDasharray="2 3"
        />
        {dots.map((d, i) => (
          <g key={i} style={{ animationDelay: `${d.delay}s`, transformOrigin: `${d.x}px ${d.y}px` }}
             className="animate-twinkle">
            <circle cx={d.x} cy={d.y} r="6" fill="#ffd1e8" opacity=".5" />
            <circle cx={d.x} cy={d.y} r="3" fill="white" />
            <text x={d.x} y={d.y + 22} textAnchor="middle"
              fontSize="11" fontWeight="800" fill="white" opacity=".9">{d.c}</text>
          </g>
        ))}
      </svg>
    </div>
  );
}
