import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { getAsk, createAsk } from '../lib/supabase';
import { playPageFlip } from '../lib/sounds';
import { getScannedChildId, setScannedChildId } from '../lib/myCards';
import type { Ask } from '../types';
import PhoneShell from '../components/PhoneShell';
import FloatingHearts from '../components/FloatingHearts';
import LoadingHeart from '../components/LoadingHeart';
import LanguageToggle from '../components/LanguageToggle';

/**
 * Landing page for a reusable card (/card/:id). The card is a template
 * Ask record. When the scanner submits their name we spawn a fresh
 * child Ask copying the template's data + the scanner's name, then
 * redirect them into the normal invite flow at /ask/:newId.
 *
 * If this scanner has opened this card before on this device, we just
 * jump them straight to their existing invite.
 */
export default function CardLandingPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [template, setTemplate] = useState<Ask | null>(null);
  const [loading, setLoading] = useState(true);
  const [missing, setMissing] = useState(false);
  const [nameInput, setNameInput] = useState('');
  const [spawning, setSpawning] = useState(false);

  // Same hash (#photoKey) the scanner arrived with — we'll pass it on so
  // the child invite can decrypt the sender's photos.
  const hash = typeof window !== 'undefined' ? window.location.hash : '';

  useEffect(() => {
    if (!id) return;
    (async () => {
      // If they've scanned this card before on this device, jump to their existing invite
      const existing = getScannedChildId(id);
      if (existing) {
        navigate(`/ask/${existing}${hash}`, { replace: true });
        return;
      }
      const a = await getAsk(id);
      if (!a) {
        setMissing(true);
      } else {
        setTemplate(a);
      }
      setLoading(false);
    })();
  }, [id, hash, navigate]);

  const handleSpawn = async () => {
    const trimmed = nameInput.trim();
    if (!trimmed || !template || !id) return;
    setSpawning(true);
    try {
      // Spawn a fresh ask copied from the template. Same encrypted photo
      // blob → same hash key still decrypts it on the receiver page.
      const child = await createAsk({
        sender_name: template.sender_name,
        receiver_name: trimmed,
        lang: template.lang,
        photos: template.photos,
        sender_whatsapp: template.sender_whatsapp,
        personal_message: template.personal_message,
        parent_id: id, // links this response back to its reusable card
      });
      setScannedChildId(id, child.id);
      playPageFlip();
      navigate(`/ask/${child.id}${hash}`, { replace: true });
    } finally {
      setSpawning(false);
    }
  };

  if (loading) return <LoadingHeart message="Opening your letter…" />;

  if (missing) {
    return (
      <PhoneShell>
        <div className="h-full grid place-items-center text-center p-6">
          <div>
            <div className="text-5xl">💔</div>
            <div className="font-extrabold mt-2">This card was not found.</div>
            <div className="text-ink-soft text-sm mt-1">It may have expired. Ask them for a new one ✨</div>
          </div>
        </div>
      </PhoneShell>
    );
  }

  return (
    <PhoneShell>
      <div className="relative h-full flex flex-col items-center justify-center px-6 text-center overflow-hidden">
        <FloatingHearts count={18} />

        <span className="absolute select-none pointer-events-none text-pink-300" style={{ top: 30, left: 28, fontSize: 18, transform: 'rotate(-15deg)' }}>✨</span>
        <span className="absolute select-none pointer-events-none text-pink-300" style={{ top: 50, right: 32, fontSize: 14, transform: 'rotate(20deg)' }}>♡</span>
        <span className="absolute select-none pointer-events-none text-pink-300" style={{ bottom: 70, left: 36, fontSize: 14, transform: 'rotate(8deg)' }}>♡</span>
        <span className="absolute select-none pointer-events-none text-pink-300" style={{ bottom: 110, right: 28, fontSize: 18, transform: 'rotate(-12deg)' }}>✦</span>

        <motion.div
          initial={{ opacity: 0, y: -8, rotate: -2 }}
          animate={{ opacity: 1, y: 0, rotate: -2 }}
          transition={{ duration: 0.5 }}
          className="washi"
        >
          ~ a love letter ~
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.15 }}
          className="text-[11px] uppercase tracking-[.4em] font-extrabold text-pink-500 mt-6"
        >
          for
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.85 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: 'spring', stiffness: 220, damping: 18, delay: 0.25 }}
          className="romance leading-none mt-2 text-pink-500"
          style={{ fontSize: 56, fontWeight: 600 }}
        >
          you ♡
        </motion.div>

        <motion.span
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{ duration: 0.7, delay: 0.55 }}
          className="ink-underline mt-1"
          style={{ width: 130, transformOrigin: 'left center' }}
        />

        <motion.div
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.65 }}
          className="text-[14px] italic text-ink-soft mt-5"
        >
          a note from{' '}
          <span className="romance text-pink-600 not-italic" style={{ fontSize: 22, fontWeight: 600 }}>
            {template?.sender_name}
          </span>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.7 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: 'spring', stiffness: 200, damping: 15, delay: 0.8 }}
          className="mt-5 text-5xl"
          style={{ filter: 'drop-shadow(0 8px 14px rgba(236,72,153,.35))' }}
        >
          💌
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.95 }}
          className="mt-5 w-full max-w-[280px]"
        >
          <label className="block text-[12px] font-extrabold uppercase tracking-[.2em] text-pink-500 mb-2 text-center">
            what's your name? ♡
          </label>
          <input
            className="input text-center romance"
            style={{ fontSize: 22, fontWeight: 600 }}
            value={nameInput}
            onChange={(e) => setNameInput(e.target.value)}
            placeholder="type your name…"
            autoFocus
            maxLength={40}
            onKeyDown={(e) => { if (e.key === 'Enter') handleSpawn(); }}
          />
          <button
            onClick={handleSpawn}
            disabled={!nameInput.trim() || spawning}
            className="btn btn-primary btn-block mt-3"
            style={{
              fontSize: 15,
              opacity: nameInput.trim() && !spawning ? 1 : 0.5,
              cursor: nameInput.trim() && !spawning ? 'pointer' : 'not-allowed',
            }}
          >
            {spawning ? 'opening…' : 'Open my letter ✨'}
          </button>
          <p className="text-[10px] text-ink-soft italic mt-2 text-center">
            so we can write this just for you 💕
          </p>
        </motion.div>

        <div className="absolute top-3 right-4 z-10">
          <LanguageToggle />
        </div>
      </div>
    </PhoneShell>
  );
}
