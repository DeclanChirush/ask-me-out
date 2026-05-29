import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface Props { photos: string[]; }

const PLACEHOLDER_TONES = [
  ['#fbcfe8', '#ec4899'],
  ['#fcd34d', '#f59e0b'],
  ['#a7f3d0', '#34d399'],
];

function Placeholder({ tone = 0, label = 'photo' }: { tone?: number; label?: string }) {
  const [bg, fg] = PLACEHOLDER_TONES[tone % PLACEHOLDER_TONES.length];
  return (
    <div
      className="w-full h-full relative overflow-hidden grid place-items-center"
      style={{ background: `linear-gradient(135deg, ${bg}, white 60%, ${bg})` }}
    >
      <div
        className="absolute inset-0"
        style={{ backgroundImage: 'repeating-linear-gradient(45deg, transparent 0 14px, rgba(255,255,255,.4) 14px 16px)' }}
      />
      <div
        className="relative z-10 font-mono text-[11px] font-bold bg-white/85 px-2 py-1 rounded-md tracking-wider"
        style={{ color: fg }}
      >
        {label}
      </div>
    </div>
  );
}

export default function PhotoSlideshow({ photos }: Props) {
  const [idx, setIdx] = useState(0);
  const list = photos.length > 0 ? photos : [null, null];

  useEffect(() => {
    if (list.length <= 1) return;
    const t = setInterval(() => setIdx((i) => (i + 1) % list.length), 3000);
    return () => clearInterval(t);
  }, [list.length]);

  return (
    <div className="relative w-full aspect-[4/5] rounded-3xl overflow-hidden border-4 border-white shadow-pink-lg">
      <AnimatePresence mode="sync">
        <motion.div
          key={idx}
          className="absolute inset-0"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.8 }}
        >
          {photos.length > 0 ? (
            <img src={photos[idx]} alt="" className="w-full h-full object-cover" />
          ) : (
            <Placeholder tone={idx} label={`her photo ${idx + 1}`} />
          )}
        </motion.div>
      </AnimatePresence>

      <div className="absolute bottom-2 left-0 right-0 flex justify-center gap-1.5">
        {list.map((_, i) => (
          <div
            key={i}
            className="h-1.5 rounded-full transition-all duration-300"
            style={{
              width: idx === i ? 18 : 6,
              background: idx === i ? 'white' : 'rgba(255,255,255,.5)',
            }}
          />
        ))}
      </div>
    </div>
  );
}
