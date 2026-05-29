import { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { getAsk, updateAsk, bumpNo } from '../lib/supabase';
import { importKeyB64, decryptPhotoPayload } from '../lib/crypto';
import { playYes, playNo } from '../lib/sounds';
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
