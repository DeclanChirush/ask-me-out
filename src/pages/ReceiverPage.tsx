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

          {/* Receiver's name — big handwritten */}
          <motion.h1
            initial={{ opacity: 0, scale: 0.85, rotate: -2 }}
            animate={{ opacity: 1, scale: 1, rotate: -2 }}
            transition={{ type: 'spring', stiffness: 220, damping: 18, delay: 0.25 }}
            className="script leading-none mt-2"
            style={{
              fontSize: 68,
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
            className="text-[13px] italic text-ink-soft mt-5"
          >
            a note from <b className="text-pink-600 not-italic">{ask.sender_name}</b>
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

          {/* Hint text */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 1.3 }}
            className="text-[11px] text-ink-soft italic mt-4"
          >
            tap to turn the page →
          </motion.div>

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

        {/* "From X" pill */}
        <div className="px-5 pt-12 text-center relative">
          <div
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-extrabold uppercase tracking-wider text-pink-600"
            style={{ background: 'rgba(255,255,255,.7)', border: '1px solid #fbcfe8' }}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-pink-500" />
            {t('fromX', { name: ask.sender_name })}
          </div>

          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="mt-4"
          >
            <div className={`text-[22px] font-extrabold leading-tight text-ink ${i18n.language === 'si' ? 'sin' : ''}`}>
              <span className="text-pink-600">{ask.receiver_name}</span>
              {', '}
              {t('greeting', { name: '' }).replace('{{name}},', '').replace(', ', '')}
            </div>
          </motion.div>
        </div>

        {/* Couple match / star constellation */}
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1.0, delay: 0.2 }}
          className="px-5 pt-5"
        >
          {hasPhotos ? (
            <CoupleMatch
              senderPhotos={senderPhotos}
              receiverPhotos={receiverPhotos}
              senderName={ask.sender_name}
              receiverName={ask.receiver_name}
            />
          ) : (
            <div
              className="rounded-3xl overflow-hidden relative shadow-pink-lg"
              style={{ background: 'linear-gradient(180deg, #1f0a1a, #3a0f2a)', padding: '20px 8px' }}
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
        </motion.div>

        {/* Personal message bubble */}
        {ask.personal_message && (
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.9, delay: 0.35 }}
            className="relative mx-5 mt-4 rounded-2xl px-4 py-3 italic text-[13px] text-ink-soft"
            style={{ background: 'rgba(255,255,255,.85)', border: '1px solid #fbcfe8' }}
          >
            <div className="absolute -top-3 left-3 text-3xl text-pink-300 leading-none">"</div>
            {ask.personal_message}
          </motion.div>
        )}

        {/* The question */}
        <motion.div
          initial={{ opacity: 0, scale: 0.7 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, delay: 0.5, type: 'spring' }}
          className="px-6 pt-5 text-center"
        >
          <div className={`text-2xl font-extrabold leading-tight text-pink-700 ${i18n.language === 'si' ? 'sin' : ''}`}>
            {t('question')}
          </div>
        </motion.div>

        {/* YES / NO buttons */}
        <div ref={buttonsRef} className="relative mt-6 mb-8 h-[260px] px-6">
          <div className="absolute left-1/2 -translate-x-1/2 top-2">
            <YesButton onClick={handleYes} glow={attempts >= 3} label={t('yes')} />
          </div>
          <NoButton onAttempt={handleNoAttempt} maxAttempts={5} containerRef={buttonsRef} />
          <div className="absolute left-0 right-0 bottom-0 text-center text-[11px] italic text-ink-soft sin px-6">
            {t('noFootnote')}
          </div>
        </div>

      </div>
    </PhoneShell>
  );
}
