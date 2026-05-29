import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import FloatingHearts from './FloatingHearts';

interface PhotoCircleProps {
  photos: string[];
  name: string;
  fromLeft: boolean;
  /** ms between photo swaps — defaults to 2600 */
  interval?: number;
}

function PhotoCircle({ photos, name, fromLeft, interval = 2600 }: PhotoCircleProps) {
  const [idx, setIdx] = useState(0);

  // Cycle through photos automatically when there are multiple
  useEffect(() => {
    if (photos.length <= 1) return;
    const timer = setInterval(() => {
      setIdx((prev) => (prev + 1) % photos.length);
    }, interval);
    return () => clearInterval(timer);
  }, [photos.length, interval]);

  const photo = photos[idx];

  return (
    <motion.div
      initial={{ x: fromLeft ? -52 : 52, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ duration: 0.75, type: 'spring', stiffness: 75, damping: 14 }}
      className="flex flex-col items-center gap-2"
    >
      {/* Pulsing glow ring */}
      <motion.div
        animate={{
          boxShadow: [
            '0 0 0 0px rgba(236,72,153,0.55)',
            '0 0 0 11px rgba(236,72,153,0)',
            '0 0 0 0px rgba(236,72,153,0)',
          ],
        }}
        transition={{ duration: 2.3, repeat: Infinity, ease: 'easeOut' }}
        style={{ borderRadius: '50%' }}
      >
        {/* Photo circle */}
        <div
          style={{
            width: 90, height: 90,
            borderRadius: '50%',
            overflow: 'hidden',
            border: '3px solid #ec4899',
            position: 'relative',
          }}
        >
          <AnimatePresence mode="wait">
            <motion.div
              key={idx}
              initial={{ opacity: 0, scale: 1.08 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.93 }}
              transition={{ duration: 0.45 }}
              style={{ position: 'absolute', inset: 0 }}
            >
              {photo ? (
                <img
                  src={photo}
                  alt={name}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
              ) : (
                /* No photo — show initial in a gradient circle */
                <div
                  style={{
                    width: '100%', height: '100%',
                    background: 'linear-gradient(135deg, #ec4899, #be185d)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 34, fontWeight: 900, color: 'white',
                  }}
                >
                  {name.charAt(0).toUpperCase()}
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </motion.div>

      {/* Name label */}
      <span
        style={{
          fontSize: 11, fontWeight: 800,
          color: 'rgba(255,200,220,0.85)',
          textTransform: 'uppercase', letterSpacing: '0.08em',
        }}
      >
        {name}
      </span>

      {/* Photo count dots */}
      {photos.length > 1 && (
        <div style={{ display: 'flex', gap: 4, marginTop: -4 }}>
          {photos.map((_, i) => (
            <div
              key={i}
              style={{
                width: 5, height: 5, borderRadius: '50%',
                background: i === idx ? '#ec4899' : 'rgba(255,255,255,0.35)',
                transition: 'background 0.3s',
              }}
            />
          ))}
        </div>
      )}
    </motion.div>
  );
}

interface Props {
  senderPhotos: string[];
  receiverPhotos: string[];
  senderName: string;
  receiverName: string;
}

export default function CoupleMatch({ senderPhotos, receiverPhotos, senderName, receiverName }: Props) {
  return (
    <div
      style={{
        position: 'relative',
        borderRadius: 24,
        overflow: 'hidden',
        background: 'linear-gradient(180deg, #1f0a1a, #3a0f2a)',
        padding: '22px 16px 14px',
      }}
    >
      {/* Background hearts */}
      <FloatingHearts count={10} />

      {/* Two photos + heart */}
      <div
        style={{
          position: 'relative', zIndex: 1,
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 16,
        }}
      >
        {/* Sender — starts cycling immediately */}
        <PhotoCircle photos={senderPhotos} name={senderName} fromLeft={true} interval={2600} />

        {/* Centre heart — pops in after photos appear */}
        <motion.div
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.6, duration: 0.5, type: 'spring' }}
          style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}
        >
          <motion.span
            animate={{ scale: [1, 1.22, 1] }}
            transition={{ duration: 1.4, repeat: Infinity, ease: 'easeInOut' }}
            style={{ fontSize: 34, lineHeight: 1 }}
          >
            💕
          </motion.span>
        </motion.div>

        {/* Receiver — offset interval so both photos don't flip at the same moment */}
        <PhotoCircle photos={receiverPhotos} name={receiverName} fromLeft={false} interval={2800} />
      </div>

      {/* Caption */}
      <motion.div
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.9 }}
        style={{
          position: 'relative', zIndex: 1,
          textAlign: 'center', marginTop: 10,
          fontSize: 10, fontWeight: 800,
          letterSpacing: '0.12em', textTransform: 'uppercase',
          color: 'rgba(255,180,210,0.75)',
        }}
      >
        a perfect match ✦
      </motion.div>
    </div>
  );
}
