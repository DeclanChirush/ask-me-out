import { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { getAsk, updateAsk } from '../lib/supabase';
import { playStep, playConfirm, playClick, playPageFlip } from '../lib/sounds';
import { PLACES, OUTFIT_COLORS, PICKUP_OPTIONS } from '../store/useAskStore';
import type { Ask } from '../types';
import PhoneShell from '../components/PhoneShell';
import FloatingHearts from '../components/FloatingHearts';
import ConfettiCanvas from '../components/ConfettiCanvas';
import PlaceCard from '../components/PlaceCard';
import LoadingHeart from '../components/LoadingHeart';

/* ─── constants ────────────────────────────────────────────────────── */
const CUSTOM_PLACE_ID = 'custom';

const TIME_CHIPS = [
  'Morning 🌅', 'Afternoon ☀️', '5:00 PM 🌆',
  '7:00 PM 🌙', '8:00 PM 🌙', '9:00 PM 🌙',
];

/* Prettify a YYYY-MM-DD string */
function fmtDate(ymd: string) {
  if (!ymd) return '';
  return new Date(ymd + 'T12:00').toLocaleDateString('en-US', {
    weekday: 'long', month: 'long', day: 'numeric',
  });
}

/* Build the shareable plan text — starts with a proper intro */
function buildMessage(
  ask: Ask,
  place: string,
  date: string,
  time: string,
  outfit: string,
  pickupSpot: string,
  msg: string,
) {
  // Use explicit Unicode escapes so emojis survive any file-encoding issues
  const lines = [
    `Hi, I'm ${ask.receiver_name}! \u{1F48C}`,
    '',
    `\u{1F495} YES, ${ask.sender_name}! I'd love to go out with you!`,
    '',
    place      ? `\u{1F4CD} Let's go: ${place}` : '',
    date       ? `\u{1F4C5} ${fmtDate(date)}${time ? ' · ' + time : ''}` : '',
    outfit     ? `\u{1F457} I'll wear: ${outfit}` : '',
    pickupSpot ? `\u{1F3E0} Pick up from: ${pickupSpot}` : '',
    msg        ? `\n\u{1F4AC} "${msg}"` : '',
  ];
  return lines.filter((l) => l !== '').join('\n');
}

/* Generate the next 6 days starting from today (local timezone) */
function getQuickDates() {
  const today = new Date();
  const toYMD = (d: Date) => {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  };
  const abbr = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  return Array.from({ length: 6 }, (_, i) => {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    return {
      label: i === 0 ? 'Today' : i === 1 ? 'Tomorrow' : abbr[d.getDay()],
      sub: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      value: toYMD(d),
    };
  });
}

/* Book-page flip animation — pages turn around their vertical axis,
   like the spine of a real book. `dir` is +1 for "forward" (turning a
   page rightward off the stack) and -1 for "back". */
const pageVariants = {
  enter: (dir: number) => ({
    rotateY: dir > 0 ? 75 : -75,
    x: dir > 0 ? 40 : -40,
    opacity: 0,
  }),
  center: { rotateY: 0, x: 0, opacity: 1 },
  exit: (dir: number) => ({
    rotateY: dir > 0 ? -75 : 75,
    x: dir > 0 ? -40 : 40,
    opacity: 0,
  }),
};

/* Handwritten "diary page" heading — Caveat font with hand-drawn underline. */
function PageTitle({
  chapter,
  title,
  size = 30,
}: { chapter: string; title: string; size?: number }) {
  return (
    <div className="mb-1">
      <div className="washi">{chapter}</div>
      <h2
        className="script text-pink-600 leading-tight mt-1.5"
        style={{ fontSize: size, color: '#be185d' }}
      >
        {title}
      </h2>
      <span className="ink-underline" style={{ width: 110, marginTop: 2 }} />
    </div>
  );
}

/* Doodled hearts scattered in the page margins. */
function DoodleHearts() {
  return (
    <>
      <span
        className="absolute select-none pointer-events-none text-pink-300"
        style={{ top: 4, right: 8, fontSize: 16, opacity: 0.55, transform: 'rotate(12deg)' }}
      >
        ♡
      </span>
      <span
        className="absolute select-none pointer-events-none text-pink-300"
        style={{ bottom: 30, right: 16, fontSize: 12, opacity: 0.4, transform: 'rotate(-18deg)' }}
      >
        ♡
      </span>
    </>
  );
}

/* ─── sub-components ────────────────────────────────────────────────── */
function StepDots({ step, total }: { step: number; total: number }) {
  return (
    <div className="flex gap-1 items-center px-5 mt-3">
      {Array.from({ length: total }, (_, i) => (
        <div
          key={i}
          className="h-1 flex-1 rounded transition-colors"
          style={{ background: i <= step ? '#ec4899' : '#fce7f3' }}
        />
      ))}
    </div>
  );
}

/* ─── main page ─────────────────────────────────────────────────────── */
export default function YesPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [ask, setAsk]    = useState<Ask | null>(null);
  const [step, setStep]  = useState(0);
  /** +1 = turning page forward, -1 = flipping back. Drives book animation. */
  const [direction, setDirection] = useState(1);

  /** Page-flip + step ding, plus state change. */
  const goToStep = (next: number) => {
    setDirection(next > step ? 1 : -1);
    playPageFlip();
    setStep(next);
  };

  /* receiver's choices */
  const [selectedPlace, setSelectedPlace] = useState('');
  const [customPlace, setCustomPlace]     = useState('');
  const [selectedDate, setSelectedDate]   = useState('');
  const [selectedTime, setSelectedTime]   = useState('');
  const [selectedColor, setSelectedColor] = useState('');
  const [customOutfit, setCustomOutfit]   = useState('');
  const [pickupSpot, setPickupSpot]       = useState('');
  const [receiverMsg, setReceiverMsg]     = useState('');

  const [showDateInput, setShowDateInput] = useState(false);

  const [confirmed, setConfirmed] = useState(false);
  const [copied, setCopied]       = useState(false);
  const [sharing, setSharing]     = useState(false);

  const dateInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!id) return;
    (async () => {
      const a = await getAsk(id);
      if (a) {
        setAsk(a);
        // Already confirmed — jump straight to done screen
        if (a.chosen_place) {
          setSelectedPlace(a.chosen_place);
          setCustomPlace(a.chosen_place_custom || '');
          setSelectedDate(a.chosen_day || '');
          setSelectedColor(a.outfit_color || '');
          setCustomOutfit(a.outfit_custom || '');
          setPickupSpot(a.how_we_met || '');
          setReceiverMsg(a.receiver_message || '');
          setConfirmed(true);
          setStep(6);
        }
      }
    })();
  }, [id]);

  /* ── confirm & persist ──────────────────────────────────────────── */
  async function confirm() {
    if (!id || !ask) return;
    const placeId = selectedPlace === CUSTOM_PLACE_ID ? CUSTOM_PLACE_ID : selectedPlace;

    await updateAsk(id, {
      chosen_place:        placeId,
      chosen_place_custom: placeId === CUSTOM_PLACE_ID ? customPlace : null,
      chosen_day:          selectedDate,
      outfit_color:        selectedColor || null,
      outfit_custom:       customOutfit  || null,
      how_we_met:          pickupSpot    || null,
      receiver_message:    receiverMsg   || null,
    });
    setConfirmed(true);
    setStep(6);
  }

  /* ── computed values ─────────────────────────────────────────────── */
  const placeData  = PLACES.find((p) => p.id === selectedPlace);
  const placeLabel = selectedPlace === CUSTOM_PLACE_ID
    ? customPlace
    : (placeData?.label ?? selectedPlace);

  const colorData   = OUTFIT_COLORS.find((c) => c.id === selectedColor);
  const outfitLabel = colorData
    ? `${colorData.label}${colorData.id === 'white' ? ' 🤍' : ''}`
    : customOutfit;

  const planMessage = ask
    ? buildMessage(ask, placeLabel, selectedDate, selectedTime, outfitLabel, pickupSpot, receiverMsg)
    : '';

  const canGoNext = (() => {
    if (step === 1) return !!(selectedPlace && (selectedPlace !== CUSTOM_PLACE_ID || customPlace.trim()));
    if (step === 2) return !!selectedDate;
    return true;
  })();

  if (!ask) return <LoadingHeart message="Getting everything ready…" />;

  /* ── STEP 6: Confirmed / share screen ────────────────────────────── */
  if (confirmed || step === 6) {
    return (
      <PhoneShell>
        <div className="relative h-full overflow-y-auto no-scrollbar">
          <FloatingHearts count={16} />
          <ConfettiCanvas fire repeatMs={6000} />

          <div className="text-center px-6 pt-8 relative">
            <span className="washi">~ chapter final ~</span>

            <motion.div
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ type: 'spring', stiffness: 260, damping: 16 }}
              className="mt-3"
            >
              <motion.div
                animate={{ scale: [1, 1.05, 1] }}
                transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                className="font-black leading-none"
                style={{
                  fontSize: 80,
                  background: 'linear-gradient(135deg, #ec4899 0%, #f472b6 50%, #be185d 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  letterSpacing: '-.04em',
                }}
              >
                YES!
              </motion.div>
            </motion.div>
          </div>

          {/* Plan summary card */}
          <div className="px-5 pt-4">
            <motion.div
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="card p-4 relative overflow-hidden"
            >
              <div
                className="absolute -top-6 -right-6 w-24 h-24 rounded-full"
                style={{ background: 'radial-gradient(circle, rgba(236,72,153,.15), transparent 70%)' }}
              />
              <div className="flex items-center justify-between mb-3">
                <h3 className="script text-pink-600 leading-none" style={{ fontSize: 26 }}>
                  our plan 💕
                </h3>
                <span className="page-number">~ the end ~</span>
              </div>

              {/* Place */}
              {placeLabel && (
                <div className="flex items-center gap-3 mb-3">
                  <div
                    className="w-12 h-12 rounded-2xl grid place-items-center text-2xl flex-none"
                    style={{ background: 'linear-gradient(135deg, #fce7f3, #fbcfe8)' }}
                  >
                    {placeData?.emoji ?? '📍'}
                  </div>
                  <div className="font-extrabold text-sm">{placeLabel}</div>
                </div>
              )}

              {/* Date / time / outfit / how we met */}
              <div
                className="rounded-xl px-3 py-2.5 grid gap-1.5"
                style={{ background: '#fff1f7', border: '1px dashed #f9a8d4' }}
              >
                {selectedDate && (
                  <div className="flex items-center gap-2 text-[13px]">
                    <span>📅</span>
                    <span className="font-extrabold">{fmtDate(selectedDate)}</span>
                    {selectedTime && <span className="text-ink-soft">· {selectedTime}</span>}
                  </div>
                )}
                {outfitLabel && (
                  <div className="flex items-center gap-2 text-[13px]">
                    <span>👗</span>
                    <span className="font-extrabold">I'll wear {outfitLabel}</span>
                    {colorData && (
                      <span
                        style={{
                          display: 'inline-block', width: 12, height: 12, borderRadius: '50%',
                          background: colorData.hex,
                          border: selectedColor === 'white' ? '1px solid #fbcfe8' : 'none',
                          verticalAlign: 'middle',
                        }}
                      />
                    )}
                  </div>
                )}
                {pickupSpot && (
                  <div className="flex items-center gap-2 text-[13px]">
                    <span>🏠</span>
                    <span className="font-extrabold">Pick up from: {pickupSpot}</span>
                  </div>
                )}
                <div className="flex items-center gap-2 text-[13px]">
                  <span>💕</span>
                  <span className="font-extrabold">With {ask.sender_name}</span>
                </div>
              </div>
            </motion.div>
          </div>

          {/* Message exchange */}
          {(ask.personal_message || receiverMsg) && (
            <div className="px-5 pt-3">
              <h3 className="script text-pink-600 leading-none mb-2" style={{ fontSize: 22 }}>
                sweet notes 💌
              </h3>
              {ask.personal_message && (
                <div
                  className="rounded-2xl px-4 py-3 text-[13px] italic text-ink-soft mb-2 relative"
                  style={{ background: 'rgba(255,255,255,.85)', border: '1px solid #fbcfe8' }}
                >
                  <div className="text-[10px] font-black text-pink-500 uppercase tracking-wider mb-1 not-italic">
                    {ask.sender_name} said
                  </div>
                  <div className="absolute -top-2 left-3 text-2xl text-pink-300 leading-none">"</div>
                  {ask.personal_message}
                </div>
              )}
              {receiverMsg && (
                <div
                  className="rounded-2xl px-4 py-3 text-[13px] italic mb-2 relative"
                  style={{ background: 'linear-gradient(135deg,#fff1f7,#fce7f3)', border: '1px solid #fbcfe8' }}
                >
                  <div className="text-[10px] font-black text-pink-500 uppercase tracking-wider mb-1 not-italic">
                    You said
                  </div>
                  <div className="absolute -top-2 left-3 text-2xl text-pink-300 leading-none">"</div>
                  {receiverMsg}
                </div>
              )}
            </div>
          )}

          {/* Share buttons */}
          <div className="px-5 pt-3 pb-8">
            <div className="grid gap-2">
              {/* WhatsApp direct — only shown when asker provided their number */}
              {ask.sender_whatsapp && (
                <a
                  href={(() => {
                    const digits = ask.sender_whatsapp!.replace(/\D/g, '');
                    // Normalise to international format: 0771234567 → 94771234567
                    const e164 = digits.startsWith('94') ? digits : '94' + digits.replace(/^0/, '');
                    return `https://wa.me/${e164}?text=${encodeURIComponent(planMessage)}`;
                  })()}
                  target="_blank"
                  rel="noreferrer"
                  className="btn btn-block"
                  style={{ background: '#25D366', color: 'white', boxShadow: '0 10px 22px -10px rgba(37,211,102,.55)' }}
                  onClick={() => playClick()}
                >
                  💬 Send to {ask.sender_name} on WhatsApp
                </a>
              )}
              <button
                className="btn btn-primary btn-block"
                onClick={async () => {
                  playClick();
                  setCopied(true);
                  await navigator.clipboard.writeText(planMessage);
                  setTimeout(() => setCopied(false), 1600);
                }}
              >
                {copied ? '✓ Copied!' : '📋 Copy my answer'}
              </button>
              {!!navigator.share && (
                <button
                  className="btn btn-ghost btn-block"
                  disabled={sharing}
                  onClick={async () => {
                    playClick();
                    setSharing(true);
                    try { await navigator.share({ text: planMessage }); }
                    catch { /* dismissed */ }
                    finally { setSharing(false); }
                  }}
                >
                  📤 Share via…
                </button>
              )}
            </div>
            <button
              className="btn btn-ghost btn-block mt-2"
              onClick={() => navigate(`/ask/${id}${window.location.hash}`)}
            >
              ↺ Replay the invite
            </button>
          </div>
        </div>
      </PhoneShell>
    );
  }

  /* ── Steps 0 – 5 ─────────────────────────────────────────────────── */
  // Steps: 0=Celebrate  1=Where  2=When  3=Wear  4=How we met  5=Message
  const isLastStep = step === 5;

  return (
    <PhoneShell>
      <div className="h-full flex flex-col overflow-hidden">

        {/* Header — compact "YES" stamp on planning pages, full cover on step 0 */}
        {step === 0 ? (
          <div className="relative pt-6 pb-2">
            <FloatingHearts count={14} />
            <ConfettiCanvas fire />
            <div className="text-center relative px-6">
              <div className="text-[10px] uppercase tracking-[.4em] font-extrabold text-pink-500 mb-2">
                · a love story ·
              </div>
              <motion.div
                animate={{ scale: [1, 1.05, 1] }}
                transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
                className="script leading-none"
                style={{
                  fontSize: 76,
                  background: 'linear-gradient(135deg, #ec4899 0%, #f472b6 50%, #be185d 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  transform: 'rotate(-2deg)',
                  filter: 'drop-shadow(0 4px 12px rgba(236,72,153,.35))',
                }}
              >
                YES!
              </motion.div>
              <motion.div
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="text-ink-soft font-bold text-sm mt-2 italic"
              >
                ~ now let's write our plan ~
              </motion.div>
            </div>
          </div>
        ) : (
          <div className="relative pt-3 pb-1 px-5">
            <FloatingHearts count={4} />
            <div className="flex items-center justify-between">
              <div
                className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-black uppercase tracking-widest text-pink-600"
                style={{ background: 'rgba(255,255,255,.85)', border: '1px solid #fbcfe8' }}
              >
                <span className="w-1.5 h-1.5 rounded-full bg-pink-500 animate-pulse" />
                YES · {ask.sender_name}
              </div>
              <div className="page-number">page {step} of 5</div>
            </div>
          </div>
        )}

        {/* Progress dots (steps 1 – 5) */}
        {step > 0 && <StepDots step={step - 1} total={5} />}

        {/* Step content — book-page flips, no inner scroll */}
        <div
          className="flex-1 px-5 pt-2 pb-3 relative"
          style={{ perspective: 1200 }}
        >
          <AnimatePresence mode="wait" custom={direction}>
            <motion.div
              key={step}
              custom={direction}
              variants={pageVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.45, ease: [0.4, 0, 0.2, 1] }}
              style={{ transformOrigin: direction > 0 ? 'left center' : 'right center', transformStyle: 'preserve-3d' }}
              className="h-full relative"
            >
              {step > 0 && <DoodleHearts />}

              {/* ── Step 0: Cover page ──────────────────────────── */}
              {step === 0 && (
                <div className="grid gap-3 mt-2 h-full content-center">
                  {ask.personal_message && (
                    <div
                      className="rounded-2xl px-4 py-3 italic text-[13px] text-ink-soft relative"
                      style={{ background: 'rgba(255,255,255,.85)', border: '1px solid #fbcfe8' }}
                    >
                      <div className="text-[10px] font-black text-pink-500 uppercase tracking-wider mb-1 not-italic">
                        {ask.sender_name} said
                      </div>
                      <div className="absolute -top-2 left-3 text-2xl text-pink-300 leading-none">"</div>
                      {ask.personal_message}
                    </div>
                  )}
                  {/* Book-cover spine — gives the "open the book" feel */}
                  <div
                    className="text-center text-[11px] uppercase tracking-[.25em] font-extrabold text-pink-500 py-1"
                  >
                    · Our date book ·
                  </div>
                  <button className="btn btn-primary btn-block" onClick={() => goToStep(1)}>
                    Open the book 📖
                  </button>
                </div>
              )}

              {/* ── Step 1: Where? ──────────────────────────────── */}
              {step === 1 && (
                <div className="grid gap-2">
                  <PageTitle chapter="chapter 1 · the place" title="Where shall we go?" />
                  <div className="grid grid-cols-2 gap-1.5">
                    {PLACES.map((p) => (
                      <PlaceCard
                        key={p.id}
                        emoji={p.emoji}
                        label={p.label}
                        active={selectedPlace === p.id}
                        onClick={() => setSelectedPlace(p.id)}
                        compact
                      />
                    ))}
                    {/* Somewhere else */}
                    <button
                      onClick={() => setSelectedPlace(CUSTOM_PLACE_ID)}
                      className="relative rounded-2xl text-left transition-all"
                      style={{
                        border: '1.5px solid ' + (selectedPlace === CUSTOM_PLACE_ID ? '#ec4899' : '#fbcfe8'),
                        background: selectedPlace === CUSTOM_PLACE_ID ? 'linear-gradient(135deg,#fff1f7,#fce7f3)' : 'white',
                        padding: '10px 10px',
                        display: 'flex', gap: 8, alignItems: 'center',
                        boxShadow: selectedPlace === CUSTOM_PLACE_ID ? '0 8px 18px -10px rgba(236,72,153,.45)' : 'none',
                      }}
                    >
                      <div className="text-xl">✏️</div>
                      <div>
                        <div className="font-extrabold text-[13px] text-ink leading-tight">Somewhere else</div>
                        <div className="text-[10px] text-ink-soft">Type it in</div>
                      </div>
                      {selectedPlace === CUSTOM_PLACE_ID && (
                        <div className="absolute top-1.5 right-1.5 w-[16px] h-[16px] rounded-full bg-pink-500 text-white grid place-items-center text-[9px] font-black">✓</div>
                      )}
                    </button>
                  </div>
                  {selectedPlace === CUSTOM_PLACE_ID && (
                    <input
                      className="input"
                      placeholder="Where would you like to go?"
                      value={customPlace}
                      onChange={(e) => setCustomPlace(e.target.value)}
                      autoFocus
                    />
                  )}
                </div>
              )}

              {/* ── Step 2: When? ───────────────────────────────── */}
              {step === 2 && (
                <div className="grid gap-2">
                  <PageTitle chapter="chapter 2 · the day" title="When shall we meet?" />

                  {/* Quick-pick day chips — no empty field, no iOS scroll wheel surprise */}
                  <div className="grid grid-cols-3 gap-1.5">
                    {getQuickDates().map(({ label, sub, value }) => {
                      const active = selectedDate === value && !showDateInput;
                      return (
                        <button
                          key={value}
                          onClick={() => { setSelectedDate(active ? '' : value); setShowDateInput(false); }}
                          className="rounded-xl py-2 px-1 flex flex-col items-center gap-0 transition-all"
                          style={{
                            border: active ? '2px solid #ec4899' : '1.5px solid #fbcfe8',
                            background: active ? 'linear-gradient(135deg,#fff1f7,#fce7f3)' : 'white',
                            boxShadow: active ? '0 6px 16px -8px rgba(236,72,153,.45)' : 'none',
                          }}
                        >
                          <span className="font-extrabold text-[12px] text-ink leading-tight">{label}</span>
                          <span className="text-[9px] text-ink-soft">{sub}</span>
                        </button>
                      );
                    })}
                  </div>

                  {/* Other date option */}
                  <button
                    onClick={() => {
                      setShowDateInput(true);
                      setSelectedDate('');
                      setTimeout(() => {
                        dateInputRef.current?.focus();
                        dateInputRef.current?.showPicker?.();
                      }, 60);
                    }}
                    className="rounded-xl py-2 px-3 flex items-center gap-2 transition-all text-left w-full"
                    style={{
                      border: showDateInput ? '2px solid #ec4899' : '1.5px solid #fbcfe8',
                      background: showDateInput ? 'linear-gradient(135deg,#fff1f7,#fce7f3)' : 'white',
                    }}
                  >
                    <span className="text-base">📅</span>
                    <div className="leading-tight">
                      <div className="font-extrabold text-[12px] text-ink">Different day…</div>
                      <div className="text-[10px] text-ink-soft">
                        {showDateInput && selectedDate ? fmtDate(selectedDate) : 'Pick from calendar'}
                      </div>
                    </div>
                    {showDateInput && selectedDate && (
                      <span className="ml-auto text-[10px] text-pink-500 font-black">✓</span>
                    )}
                  </button>

                  {/* Hidden-but-real date input — visible only when "Different day" chosen */}
                  {showDateInput && (
                    <input
                      ref={dateInputRef}
                      type="date"
                      className="input"
                      min={new Date().toISOString().split('T')[0]}
                      value={selectedDate}
                      onChange={(e) => setSelectedDate(e.target.value)}
                    />
                  )}

                  {/* Time chips */}
                  <div className="label -mb-0.5 mt-0.5">Pick a time</div>
                  <div className="grid grid-cols-3 gap-1.5">
                    {TIME_CHIPS.map((t) => (
                      <button
                        key={t}
                        onClick={() => setSelectedTime(selectedTime === t ? '' : t)}
                        className="rounded-lg py-1.5 font-extrabold text-[11px] transition-all"
                        style={{
                          border: '1.5px solid ' + (selectedTime === t ? '#ec4899' : '#fbcfe8'),
                          background: selectedTime === t ? 'linear-gradient(135deg,#fff1f7,#fce7f3)' : 'white',
                          color: '#831843',
                        }}
                      >
                        {t}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* ── Step 3: Outfit ──────────────────────────────── */}
              {step === 3 && (
                <div className="grid gap-2">
                  <PageTitle chapter="chapter 3 · the outfit" title="What will you wear?" />
                  <div className="grid grid-cols-6 gap-1.5">
                    {OUTFIT_COLORS.map((c) => {
                      const active = selectedColor === c.id;
                      return (
                        <button
                          key={c.id}
                          onClick={() => setSelectedColor(active ? '' : c.id)}
                          className="flex flex-col items-center gap-1 rounded-xl py-1.5 transition-all"
                          style={{
                            border: active ? '2px solid #ec4899' : '1.5px solid #fbcfe8',
                            background: active ? 'linear-gradient(135deg,#fff1f7,#fce7f3)' : 'white',
                            boxShadow: active ? '0 6px 16px -8px rgba(236,72,153,.45)' : 'none',
                          }}
                          title={c.label}
                        >
                          <div
                            className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-black"
                            style={{
                              background: c.hex,
                              border: c.id === 'white' ? '1.5px solid #fbcfe8' : 'none',
                              color: ['white', 'yellow', 'nude'].includes(c.id) ? '#831843' : 'white',
                            }}
                          >
                            {active && '✓'}
                          </div>
                          <span className="text-[8px] font-extrabold text-ink uppercase tracking-wide leading-none">
                            {c.label}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                  <div className="mt-1">
                    <label className="label">Or describe it</label>
                    <input
                      className="input"
                      placeholder="e.g. a white floral dress… optional"
                      value={customOutfit}
                      onChange={(e) => setCustomOutfit(e.target.value)}
                    />
                  </div>
                </div>
              )}

              {/* ── Step 4: Where to pick you up? ───────────────── */}
              {step === 4 && (
                <div className="grid gap-2">
                  <div>
                    <PageTitle chapter="chapter 4 · the rendezvous" title="Where shall I pick you up?" />
                    <div className="text-[11px] text-ink-soft mt-1 italic">
                      ✎ totally optional — skip if you'll meet at the venue
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-1.5">
                    {PICKUP_OPTIONS.map((o) => {
                      const isActive = pickupSpot === o.label;
                      return (
                        <button
                          key={o.id}
                          onClick={() => setPickupSpot(isActive ? '' : o.label)}
                          className="relative rounded-xl text-left transition-all"
                          style={{
                            border: '1.5px solid ' + (isActive ? '#ec4899' : '#fbcfe8'),
                            background: isActive ? 'linear-gradient(135deg,#fff1f7,#fce7f3)' : 'white',
                            padding: '9px 10px',
                            display: 'flex', gap: 8, alignItems: 'center',
                            boxShadow: isActive ? '0 8px 18px -10px rgba(236,72,153,.45)' : 'none',
                          }}
                        >
                          <span className="text-base">{o.emoji}</span>
                          <span className="font-extrabold text-[11.5px] text-ink leading-tight">{o.label}</span>
                          {isActive && (
                            <div
                              style={{
                                position: 'absolute', top: 5, right: 5,
                                width: 14, height: 14, borderRadius: '50%',
                                background: '#ec4899', color: 'white',
                                display: 'grid', placeItems: 'center',
                                fontSize: 8, fontWeight: 900,
                              }}
                            >✓</div>
                          )}
                        </button>
                      );
                    })}
                  </div>
                  {/* Free-text override — chips just pre-fill this input */}
                  <div className="mt-1">
                    <label className="label">Or type a specific place</label>
                    <input
                      className="input"
                      placeholder="e.g. Near the big temple… optional"
                      value={pickupSpot}
                      onChange={(e) => setPickupSpot(e.target.value)}
                    />
                  </div>
                </div>
              )}

              {/* ── Step 5: Message ─────────────────────────────── */}
              {step === 5 && (
                <div className="grid gap-2">
                  <PageTitle chapter="chapter 5 · a love note" title="Say something back…" />

                  {/* Sender's message for reference */}
                  {ask.personal_message && (
                    <div
                      className="rounded-xl px-3 py-2 italic text-[12px] text-ink-soft relative"
                      style={{ background: 'rgba(255,255,255,.85)', border: '1px solid #fbcfe8' }}
                    >
                      <div className="text-[9px] font-black text-pink-500 uppercase tracking-wider mb-0.5 not-italic">
                        {ask.sender_name} said
                      </div>
                      <div className="absolute -top-2 left-3 text-xl text-pink-300 leading-none">"</div>
                      {ask.personal_message}
                    </div>
                  )}

                  <textarea
                    className="textarea"
                    rows={3}
                    maxLength={240}
                    placeholder={`Say something to ${ask.sender_name}… optional`}
                    value={receiverMsg}
                    onChange={(e) => setReceiverMsg(e.target.value)}
                  />
                  <div className="text-right text-[10px] text-ink-soft -mt-1.5">
                    {receiverMsg.length} / 240
                  </div>
                </div>
              )}

            </motion.div>
          </AnimatePresence>
        </div>

        {/* Bottom CTA — compact, side-by-side */}
        {step > 0 && (
          <div
            className="px-5 pb-3 pt-2 flex gap-2 flex-none"
            style={{ background: 'linear-gradient(180deg, transparent, #fff7fb 40%)' }}
          >
            <button
              className="btn btn-ghost flex-none"
              style={{ padding: '12px 16px', minWidth: 80 }}
              onClick={() => { playClick(); goToStep(Math.max(0, step - 1)); }}
            >
              ‹ Back
            </button>
            <button
              className="btn btn-primary flex-1"
              onClick={() => {
                if (isLastStep) { playConfirm(); confirm(); }
                else { playStep(); goToStep(step + 1); }
              }}
              disabled={!canGoNext}
              style={{ opacity: canGoNext ? 1 : 0.5, cursor: canGoNext ? 'pointer' : 'not-allowed' }}
            >
              {isLastStep ? 'Confirm my answer 💕' : 'Continue →'}
            </button>
          </div>
        )}

      </div>
    </PhoneShell>
  );
}
