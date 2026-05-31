import { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { getAsk, updateAsk, bumpNo } from '../lib/supabase';
import { importKeyB64, decryptPhotoPayload } from '../lib/crypto';
import { playYes, playNo, playPageFlip } from '../lib/sounds';
import { useAskStore } from '../store/useAskStore';
import type { Ask } from '../types';
import PhoneShell from '../components/PhoneShell';
import FloatingHearts from '../components/FloatingHearts';
import LoadingHeart from '../components/LoadingHeart';
import CoupleMatch from '../components/CoupleMatch';
import StarConstellation from '../components/StarConstellation';
import YesButton from '../components/YesButton';
import NoButton from '../components/NoButton';
import LanguageToggle from '../components/LanguageToggle';

export default function ReceiverPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const setCurrent = useAskStore((s) => s.setCurrent);

  const [ask, setAsk]                     = useState<Ask | null>(null);
  const [senderPhotos, setSenderPhotos]   = useState<string[]>([]);
  const [receiverPhotos, setReceiverPhotos] = useState<string[]>([]);
  const [loading, setLoading]             = useState(true);
  const [attempts, setAttempts]           = useState(0);
  const [coverOpen, setCoverOpen]         = useState(false);
  const [nameInput, setNameInput]         = useState('');
  const [savingName, setSavingName]       = useState(false);
  const buttonsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!id) return;
    (async () => {
      const a = await getAsk(id);
      if (a) {
        setAsk(a);
        setCurrent(a);
        i18n.changeLanguage(a.lang === 'en' ? 'en' : 'si');
        if (!a.opened_at) {
          await updateAsk(id, { opened_at: new Date().toISOString() });
        }

        // Decrypt photos — key is in the URL hash, never sent to server
        if (a.photos && a.photos.length > 0) {
          const keyB64 = window.location.hash.slice(1);
          if (keyB64) {
            try {
              const key = await importKeyB64(keyB64);
              const payload = await decryptPhotoPayload(a.photos[0], key);
              setSenderPhotos(payload.s || []);
              setReceiverPhotos(payload.r || []);
            } catch {
              // Wrong key or unencrypted — show names-only couple match
            }
          }
        }
      }
      setLoading(false);
    })();
  }, [id, i18n, setCurrent]);

  const handleYes = async () => {
    if (!id) return;
    playYes();
    await updateAsk(id, { answer: 'yes', answered_at: new Date().toISOString() });
    navigate(`/yes/${id}${window.location.hash}`);
  };

  const handleNoAttempt = (n: number) => {
    setAttempts(n);
    playNo();
    if (id) bumpNo(id);
  };

  if (loading) return <LoadingHeart message="Preparing your invite…" />;

  // ── Cover page — beautiful "envelope" before the invite opens ──
  if (ask && !coverOpen) {
    const hasName = !!ask.receiver_name?.trim();

    const handleSaveName = async () => {
      const trimmed = nameInput.trim();
      if (!trimmed || !id) return;
      setSavingName(true);
      const updated = await updateAsk(id, { receiver_name: trimmed });
      if (updated) {
        setAsk(updated);
        setCurrent(updated);
      } else {
        // Fallback: still update local UI so they can keep going
        setAsk({ ...ask, receiver_name: trimmed });
      }
      setSavingName(false);
      playPageFlip();
      setCoverOpen(true);
    };

    return (
      <PhoneShell>
        <div className="relative h-full flex flex-col items-center justify-center px-6 text-center overflow-hidden">
          <FloatingHearts count={18} />

          {/* Sparkles in the corners */}
          <span className="absolute select-none pointer-events-none text-pink-300" style={{ top: 30, left: 28, fontSize: 18, transform: 'rotate(-15deg)' }}>✨</span>
          <span className="absolute select-none pointer-events-none text-pink-300" style={{ top: 50, right: 32, fontSize: 14, transform: 'rotate(20deg)' }}>♡</span>
          <span className="absolute select-none pointer-events-none text-pink-300" style={{ bottom: 70, left: 36, fontSize: 14, transform: 'rotate(8deg)' }}>♡</span>
          <span className="absolute select-none pointer-events-none text-pink-300" style={{ bottom: 110, right: 28, fontSize: 18, transform: 'rotate(-12deg)' }}>✦</span>

          {/* Washi-tape chapter tag */}
          <motion.div
            initial={{ opacity: 0, y: -8, rotate: -2 }}
            animate={{ opacity: 1, y: 0, rotate: -2 }}
            transition={{ duration: 0.5 }}
            className="washi"
          >
            ~ a love letter ~
          </motion.div>

          {/* "for" */}
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.15 }}
            className="text-[11px] uppercase tracking-[.4em] font-extrabold text-pink-500 mt-6"
          >
            for
          </motion.div>

          {hasName ? (
            <>
              {/* Receiver's name — calligraphy */}
              <motion.h1
                initial={{ opacity: 0, scale: 0.85, rotate: -2 }}
                animate={{ opacity: 1, scale: 1, rotate: -2 }}
                transition={{ type: 'spring', stiffness: 220, damping: 18, delay: 0.25 }}
                className="romance leading-none mt-2"
                style={{
                  fontSize: 64,
                  fontWeight: 700,
                  background: 'linear-gradient(135deg, #ec4899 0%, #f472b6 45%, #be185d 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  filter: 'drop-shadow(0 6px 14px rgba(236,72,153,.35))',
                  maxWidth: '100%',
                  wordBreak: 'break-word',
                }}
              >
                {ask.receiver_name}
              </motion.h1>

              {/* Hand-drawn underline */}
              <motion.span
                initial={{ scaleX: 0 }}
                animate={{ scaleX: 1 }}
                transition={{ duration: 0.7, delay: 0.6 }}
                className="ink-underline mt-1"
                style={{ width: 180, transformOrigin: 'left center' }}
              />

              {/* "from X" */}
              <motion.div
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.7 }}
                className="text-[14px] italic text-ink-soft mt-5"
              >
                a note from <span className="romance text-pink-600 not-italic" style={{ fontSize: 22, fontWeight: 600 }}>{ask.sender_name}</span>
              </motion.div>

              {/* Envelope illustration */}
              <motion.div
                initial={{ opacity: 0, scale: 0.7 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ type: 'spring', stiffness: 200, damping: 15, delay: 0.85 }}
                className="my-7 text-6xl"
                style={{ filter: 'drop-shadow(0 8px 14px rgba(236,72,153,.35))' }}
              >
                💌
              </motion.div>

              {/* Open CTA */}
              <motion.button
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 1.0 }}
                whileTap={{ scale: 0.96 }}
                onClick={() => { playPageFlip(); setCoverOpen(true); }}
                className="btn btn-primary"
                style={{ fontSize: 16, padding: '14px 36px' }}
              >
                Open me ✨
              </motion.button>

              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5, delay: 1.3 }}
                className="text-[11px] text-ink-soft italic mt-4"
              >
                tap to turn the page →
              </motion.div>
            </>
          ) : (
            <>
              {/* Name-entry flow — sender didn't know receiver's name */}
              <motion.div
                initial={{ opacity: 0, scale: 0.85 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ type: 'spring', stiffness: 220, damping: 18, delay: 0.25 }}
                className="romance leading-none mt-2 text-pink-500"
                style={{ fontSize: 52, fontWeight: 600 }}
              >
                you ♡
              </motion.div>

              <motion.span
                initial={{ scaleX: 0 }}
                animate={{ scaleX: 1 }}
                transition={{ duration: 0.7, delay: 0.55 }}
                className="ink-underline mt-1"
                style={{ width: 120, transformOrigin: 'left center' }}
              />

              <motion.div
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.65 }}
                className="text-[14px] italic text-ink-soft mt-5"
              >
                a note from <span className="romance text-pink-600 not-italic" style={{ fontSize: 22, fontWeight: 600 }}>{ask.sender_name}</span>
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
                  onKeyDown={(e) => { if (e.key === 'Enter') handleSaveName(); }}
                />
                <button
                  onClick={handleSaveName}
                  disabled={!nameInput.trim() || savingName}
                  className="btn btn-primary btn-block mt-3"
                  style={{
                    fontSize: 15,
                    opacity: nameInput.trim() && !savingName ? 1 : 0.5,
                    cursor: nameInput.trim() && !savingName ? 'pointer' : 'not-allowed',
                  }}
                >
                  {savingName ? 'opening…' : 'Open my letter ✨'}
                </button>
                <p className="text-[10px] text-ink-soft italic mt-2 text-center">
                  so we can write this just for you 💕
                </p>
              </motion.div>
            </>
          )}

          {/* Language toggle in the top-right */}
          <div className="absolute top-3 right-4 z-10">
            <LanguageToggle />
          </div>
        </div>
      </PhoneShell>
    );
  }

  if (!ask) {
    return (
      <PhoneShell>
        <div className="h-full grid place-items-center text-center p-6">
          <div>
            <div className="text-5xl">💔</div>
            <div className="font-extrabold mt-2">This invite was not found.</div>
            <div className="text-ink-soft text-sm mt-1">Check the link and try again.</div>
          </div>
        </div>
      </PhoneShell>
    );
  }

  const hasPhotos = senderPhotos.length > 0 || receiverPhotos.length > 0;

  return (
    <PhoneShell>
      <div className="relative h-full overflow-y-auto no-scrollbar">

        {/* Lots of hearts in the background */}
        <FloatingHearts count={20} />

        <div className="absolute top-3 right-4 z-10">
          <LanguageToggle />
        </div>

        {/* ── Romantic greeting block ───────────────────────────── */}
        <div className="px-5 pt-10 text-center relative">
          {/* Washi tape chapter label */}
          <motion.div
            initial={{ opacity: 0, y: -6, rotate: -2 }}
            animate={{ opacity: 1, y: 0, rotate: -2 }}
            transition={{ duration: 0.5 }}
            className="washi"
          >
            ~ {t('fromX', { name: ask.sender_name })} ~
          </motion.div>

          {/* "dear" */}
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.15 }}
            className="text-[11px] uppercase tracking-[.4em] font-extrabold text-pink-500 mt-5"
          >
            dear
          </motion.div>

          {/* Receiver's name in romantic calligraphy */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, rotate: -1 }}
            animate={{ opacity: 1, scale: 1, rotate: -1 }}
            transition={{ type: 'spring', stiffness: 220, damping: 18, delay: 0.25 }}
            className={`romance leading-none mt-1.5 ${i18n.language === 'si' ? 'sin' : ''}`}
            style={{
              fontSize: i18n.language === 'si' ? 38 : 48,
              fontWeight: 700,
              background: 'linear-gradient(135deg, #ec4899 0%, #f472b6 45%, #be185d 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              filter: 'drop-shadow(0 6px 14px rgba(236,72,153,.35))',
              wordBreak: 'break-word',
            }}
          >
            {ask.receiver_name}
          </motion.div>

          <motion.span
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ duration: 0.7, delay: 0.55 }}
            className="ink-underline mx-auto mt-1 block"
            style={{ width: 140, transformOrigin: 'center' }}
          />

          {/* Greeting in romantic body */}
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.55 }}
            className={`text-[15px] italic text-ink-soft mt-3 leading-snug ${i18n.language === 'si' ? 'sin' : ''}`}
          >
            {t('greeting', { name: '' }).replace('{{name}},', '').replace(/^,?\s*/, '')}
          </motion.div>
        </div>

        {/* ── Polaroid-framed constellation / couple match ───────── */}
        <motion.div
          initial={{ opacity: 0, y: 14, rotate: -1.5 }}
          animate={{ opacity: 1, y: 0, rotate: -1.5 }}
          transition={{ type: 'spring', stiffness: 180, damping: 18, delay: 0.4 }}
          className="mx-6 mt-6 relative"
          style={{
            background: 'white',
            padding: '10px 10px 32px',
            borderRadius: 14,
            border: '1px solid #fce7f3',
            boxShadow: '0 14px 28px -10px rgba(190,24,93,.30)',
          }}
        >
          {/* Washi tape strips holding the polaroid down */}
          <span
            aria-hidden
            className="absolute -top-2 left-6 select-none"
            style={{
              width: 56, height: 14,
              background: 'repeating-linear-gradient(45deg, rgba(244,114,182,.55) 0 5px, rgba(252,207,232,.7) 5px 10px)',
              transform: 'rotate(-6deg)',
              borderRadius: 2,
              boxShadow: '0 2px 4px rgba(190,24,93,.2)',
            }}
          />
          <span
            aria-hidden
            className="absolute -top-2 right-6 select-none"
            style={{
              width: 56, height: 14,
              background: 'repeating-linear-gradient(45deg, rgba(244,114,182,.55) 0 5px, rgba(252,207,232,.7) 5px 10px)',
              transform: 'rotate(8deg)',
              borderRadius: 2,
              boxShadow: '0 2px 4px rgba(190,24,93,.2)',
            }}
          />

          {hasPhotos ? (
            <CoupleMatch
              senderPhotos={senderPhotos}
              receiverPhotos={receiverPhotos}
              senderName={ask.sender_name}
              receiverName={ask.receiver_name}
            />
          ) : (
            <div
              className="rounded-xl overflow-hidden relative"
              style={{ background: 'linear-gradient(180deg, #1f0a1a, #3a0f2a)', padding: '18px 6px' }}
            >
              <StarConstellation name={ask.receiver_name} />
              <div
                className="text-center text-[10px] uppercase tracking-wider mt-1 font-bold"
                style={{ color: 'rgba(255,255,255,.7)' }}
              >
                {t('starsCaption')}
              </div>
            </div>
          )}

          {/* Polaroid handwritten caption */}
          <div
            className="absolute left-0 right-0 text-center script text-pink-600"
            style={{ bottom: 8, fontSize: 18, transform: 'rotate(-1deg)' }}
          >
            you & me ♡
          </div>
        </motion.div>

        {/* ── Personal message — handwritten letter card ────────── */}
        {ask.personal_message && (
          <motion.div
            initial={{ opacity: 0, y: 14, rotate: 1 }}
            animate={{ opacity: 1, y: 0, rotate: 1 }}
            transition={{ duration: 0.9, delay: 0.5 }}
            className="relative mx-6 mt-5 px-4 py-4"
            style={{
              background: 'linear-gradient(180deg, #fffdf7 0%, #fff6fb 100%)',
              backgroundImage:
                'repeating-linear-gradient(180deg, transparent 0 24px, rgba(244,114,182,.18) 24px 25px)',
              border: '1px solid #fbcfe8',
              borderRadius: 12,
              boxShadow: '0 8px 20px -10px rgba(190,24,93,.25)',
            }}
          >
            <div className="absolute -top-4 left-3 text-5xl text-pink-300 leading-none romance" style={{ fontWeight: 700 }}>"</div>
            <div className={`script text-pink-700 leading-snug ${i18n.language === 'si' ? 'sin' : ''}`} style={{ fontSize: 19 }}>
              {ask.personal_message}
            </div>
            <div className="text-right text-[12px] italic text-ink-soft mt-2">
              — <span className="romance text-pink-600 not-italic" style={{ fontSize: 18, fontWeight: 600 }}>{ask.sender_name}</span>
            </div>
          </motion.div>
        )}

        {/* ── The question — big romantic calligraphy ───────────── */}
        <motion.div
          initial={{ opacity: 0, scale: 0.85 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, delay: 0.65, type: 'spring' }}
          className="px-6 pt-7 text-center relative"
        >
          {/* Hearts framing the question */}
          <span className="absolute select-none pointer-events-none text-pink-300" style={{ top: 6, left: 14, fontSize: 14, transform: 'rotate(-12deg)' }}>♡</span>
          <span className="absolute select-none pointer-events-none text-pink-300" style={{ top: 14, right: 18, fontSize: 12, transform: 'rotate(15deg)' }}>♡</span>

          <div
            className={`romance leading-tight text-pink-700 ${i18n.language === 'si' ? 'sin' : ''}`}
            style={{
              fontSize: i18n.language === 'si' ? 28 : 34,
              fontWeight: 700,
              filter: 'drop-shadow(0 4px 10px rgba(236,72,153,.25))',
            }}
          >
            {t('question')}
          </div>
        </motion.div>

        {/* YES / NO buttons */}
        <div ref={buttonsRef} className="relative mt-6 mb-8 h-[260px] px-6">
          <div className="absolute left-1/2 -translate-x-1/2 top-2">
            <YesButton onClick={handleYes} glow={attempts >= 3} label={t('yes')} />
          </div>
          <NoButton onAttempt={handleNoAttempt} maxAttempts={5} containerRef={buttonsRef} />
          <div className={`absolute left-0 right-0 bottom-0 text-center text-[11px] italic text-ink-soft px-6 ${i18n.language === 'si' ? 'sin' : ''}`}>
            {t('noFootnote')}
          </div>
        </div>

      </div>
    </PhoneShell>
  );
}
