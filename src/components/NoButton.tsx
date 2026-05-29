import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';

interface Props {
  onAttempt: (count: number) => void;
  maxAttempts?: number;
  containerRef: React.RefObject<HTMLElement>;
}

interface Pos { x: number; y: number; rot: number; scale: number; }

export default function NoButton({ onAttempt, maxAttempts = 5, containerRef }: Props) {
  const { t } = useTranslation();
  const taunts = t('taunts', { returnObjects: true }) as string[];

  const [attempts, setAttempts] = useState(0);
  const [pos, setPos] = useState<Pos>({ x: 60, y: 70, rot: -6, scale: 1 });
  const [taunt, setTaunt] = useState<string | null>(null);
  const btnRef = useRef<HTMLButtonElement>(null);
  const cooldownRef = useRef(false);

  // initial offset/rotate
  useEffect(() => { /* mounted */ }, []);

  const escape = () => {
    if (cooldownRef.current) return;
    cooldownRef.current = true;
    setTimeout(() => { cooldownRef.current = false; }, 250);

    const container = containerRef.current;
    if (!container) return;
    const cw = container.clientWidth;
    const ch = container.clientHeight;
    const bw = (btnRef.current?.offsetWidth  || 80) * pos.scale;
    const bh = (btnRef.current?.offsetHeight || 40) * pos.scale;

    const pad = 14;
    const maxX = Math.max(pad, cw - bw - pad);
    const maxY = Math.max(pad + 40, ch - bh - pad);
    const nx = pad + Math.random() * (maxX - pad);
    const ny = pad + 40 + Math.random() * (maxY - pad - 40);

    const next = attempts + 1;
    const shrink = Math.max(0.35, 1 - next * 0.15);
    const rot = (Math.random() - 0.5) * 50;

    setPos({ x: nx, y: ny, rot, scale: shrink });
    setTaunt(taunts[next % taunts.length]);
    setAttempts(next);
    onAttempt(next);
  };

  if (attempts >= maxAttempts) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        className="absolute left-0 right-0 bottom-4 text-center pointer-events-none"
      >
        <div className="sin text-xs italic font-bold text-ink-soft">
          {t('noVanished')}
        </div>
      </motion.div>
    );
  }

  return (
    <>
      <motion.button
        ref={btnRef}
        onMouseEnter={escape}
        onTouchStart={escape}
        onClick={escape}
        animate={{
          left: pos.x,
          top: pos.y,
          rotate: pos.rot,
          scale: pos.scale,
        }}
        initial={{ left: pos.x, top: pos.y, rotate: pos.rot, scale: 1 }}
        transition={{ type: 'spring', stiffness: 300, damping: 20 }}
        className="absolute btn btn-ghost font-bold pointer-events-auto"
        style={{
          fontSize: 14,
          padding: '8px 22px',
          borderRadius: 999,
          color: '#a44b73',
          touchAction: 'none',
        }}
      >
        {t('no')}
      </motion.button>

      <AnimatePresence>
        {taunt && (
          <motion.div
            key={taunt + attempts}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="absolute sin text-xs font-bold text-pink-700 bg-white border border-pink-200 rounded-xl px-2.5 py-1 shadow"
            style={{
              left: Math.max(8, Math.min((containerRef.current?.clientWidth || 300) - 140, pos.x - 30)),
              top:  Math.max(20, pos.y - 30),
              maxWidth: 140,
              pointerEvents: 'none',
            }}
          >
            {taunt}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
