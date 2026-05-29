import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { getAsk, updateAsk } from '../lib/supabase';
import { playStep, playConfirm, playClick } from '../lib/sounds';
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

  const [ask, setAsk]   = useState<Ask | null>(null);
  const [step, setStep] = useState(0);

  /* receiver's choices */
  const [selectedPlace, setSelectedPlace] = useState('');
  const [customPlace, setCustomPlace]     = useState('');
  const [selectedDate, setSelectedDate]   = useState('');
  const [selectedTime, setSelectedTime]   = useState('');
  const [selectedColor, setSelectedColor] = useState('');
  const [customOutfit, setCustomOutfit]   = useState('');
  const [pickupSpot, setPickupSpot]       = useState('');
  const [receiverMsg, setReceiverMsg]     = useState('');

  const [confirmed, setConfirmed] = useState(false);
  const [copied, setCopied]       = useState(false);
  const [sharing, setSharing]     = useState(false);

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
            <span
              className="inline-block uppercase tracking-widest text-[11px] font-black px-3 py-1 rounded-full text-white"
              style={{ background: 'linear-gradient(135deg,#ec4899,#f472b6)' }}
            >
              It's official 💕
            </span>

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
              <div className="label mb-3">Your plan 💕</div>

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
              <div className="label mb-2">Sweet notes 💌</div>
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
      <div className="h-full flex flex-col">

        {/* Celebration header — always visible */}
        <div className="relative pt-6 pb-2">
          <FloatingHearts count={step === 0 ? 18 : 8} />
          {step === 0 && <ConfettiCanvas fire />}

          <div className="text-center relative">
            <motion.div
              animate={{ scale: [1, 1.05, 1] }}
              transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
              className="font-black leading-none"
              style={{
                fontSize: step === 0 ? 72 : 40,
                background: 'linear-gradient(135deg, #ec4899 0%, #f472b6 50%, #be185d 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                letterSpacing: '-.04em',
                transition: 'font-size .4s ease',
              }}
            >
              YES!
            </motion.div>
            {step === 0 && (
              <motion.div
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="text-ink-soft font-bold text-sm mt-1"
              >
                It's official! Now let's plan it ✨
              </motion.div>
            )}
          </div>
        </div>

        {/* Progress dots (steps 1 – 5) */}
        {step > 0 && <StepDots step={step - 1} total={5} />}

        {/* Step content */}
        <div className="flex-1 overflow-y-auto no-scrollbar px-5 pb-32 pt-3">
          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              initial={{ opacity: 0, x: 24 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -24 }}
              transition={{ duration: 0.3 }}
            >

              {/* ── Step 0: Celebration ─────────────────────────── */}
              {step === 0 && (
                <div className="grid gap-4 mt-2">
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
                  <button className="btn btn-primary btn-block" onClick={() => setStep(1)}>
                    Let's plan it 🗓️
                  </button>
                </div>
              )}

              {/* ── Step 1: Where? ──────────────────────────────── */}
              {step === 1 && (
                <div className="grid gap-3">
                  <div className="text-xl font-black">Where do you want to go?</div>
                  <div className="grid grid-cols-2 gap-2">
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
                        padding: '12px 10px',
                        display: 'flex', gap: 10, alignItems: 'center',
                        boxShadow: selectedPlace === CUSTOM_PLACE_ID ? '0 8px 18px -10px rgba(236,72,153,.45)' : 'none',
                      }}
                    >
                      <div className="text-2xl">✏️</div>
                      <div>
                        <div className="font-extrabold text-sm text-ink">Somewhere else</div>
                        <div className="text-[11px] text-ink-soft">Type it in</div>
                      </div>
                      {selectedPlace === CUSTOM_PLACE_ID && (
                        <div className="absolute top-2 right-2 w-[18px] h-[18px] rounded-full bg-pink-500 text-white grid place-items-center text-[10px] font-black">✓</div>
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
                <div className="grid gap-4">
                  <div className="text-xl font-black">When do you want to go?</div>
                  <div
                    className="rounded-3xl p-5 text-center"
                    style={{ background: 'linear-gradient(135deg,#fff1f7,#fce7f3)', border: '1.5px solid #fbcfe8' }}
                  >
                    <div className="text-3xl mb-2">📅</div>
                    <input
                      type="date"
                      className="input text-center"
                      min={new Date().toISOString().split('T')[0]}
                      value={selectedDate}
                      onChange={(e) => setSelectedDate(e.target.value)}
                    />
                  </div>
                  {selectedDate && (
                    <motion.div
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="text-center font-extrabold text-pink-600"
                    >
                      {fmtDate(selectedDate)} 🗓️
                    </motion.div>
                  )}
                  <div className="label">Pick a time</div>
                  <div className="grid grid-cols-3 gap-2">
                    {TIME_CHIPS.map((t) => (
                      <button
                        key={t}
                        onClick={() => setSelectedTime(selectedTime === t ? '' : t)}
                        className="rounded-xl py-2.5 font-extrabold text-[12px] transition-all"
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
                <div className="grid gap-4">
                  <div className="text-xl font-black">What will you wear? 👗</div>
                  <div className="grid grid-cols-4 gap-2">
                    {OUTFIT_COLORS.map((c) => {
                      const active = selectedColor === c.id;
                      return (
                        <button
                          key={c.id}
                          onClick={() => setSelectedColor(active ? '' : c.id)}
                          className="flex flex-col items-center gap-1.5 rounded-2xl py-3 transition-all"
                          style={{
                            border: active ? '2px solid #ec4899' : '1.5px solid #fbcfe8',
                            background: active ? 'linear-gradient(135deg,#fff1f7,#fce7f3)' : 'white',
                            boxShadow: active ? '0 6px 16px -8px rgba(236,72,153,.45)' : 'none',
                          }}
                        >
                          <div
                            className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-black"
                            style={{
                              background: c.hex,
                              border: c.id === 'white' ? '1.5px solid #fbcfe8' : 'none',
                              color: ['white', 'yellow', 'nude'].includes(c.id) ? '#831843' : 'white',
                            }}
                          >
                            {active && '✓'}
                          </div>
                          <span className="text-[9px] font-extrabold text-ink uppercase tracking-wide">
                            {c.label}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                  <div>
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
                <div className="grid gap-3">
                  <div>
                    <div className="text-xl font-black">Where should I pick you up? 🚗</div>
                    <div className="text-[13px] text-ink-soft mt-0.5">
                      Totally optional — skip if you'll meet at the venue 😊
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    {PICKUP_OPTIONS.map((o) => {
                      const isActive = pickupSpot === o.label;
                      return (
                        <button
                          key={o.id}
                          onClick={() => setPickupSpot(isActive ? '' : o.label)}
                          className="relative rounded-2xl text-left transition-all"
                          style={{
                            border: '1.5px solid ' + (isActive ? '#ec4899' : '#fbcfe8'),
                            background: isActive ? 'linear-gradient(135deg,#fff1f7,#fce7f3)' : 'white',
                            padding: '12px 10px',
                            display: 'flex', gap: 8, alignItems: 'center',
                            boxShadow: isActive ? '0 8px 18px -10px rgba(236,72,153,.45)' : 'none',
                          }}
                        >
                          <span className="text-xl">{o.emoji}</span>
                          <span className="font-extrabold text-[12px] text-ink leading-tight">{o.label}</span>
                          {isActive && (
                            <div
                              style={{
                                position: 'absolute', top: 7, right: 7,
                                width: 16, height: 16, borderRadius: '50%',
                                background: '#ec4899', color: 'white',
                                display: 'grid', placeItems: 'center',
                                fontSize: 9, fontWeight: 900,
                              }}
                            >✓</div>
                          )}
                        </button>
                      );
                    })}
                  </div>
                  {/* Free-text override — chips just pre-fill this input */}
                  <div>
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
                <div className="grid gap-4">
                  <div className="text-xl font-black">Say something back 💌</div>

                  {/* Sender's message for reference */}
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

                  <textarea
                    className="textarea"
                    rows={4}
                    maxLength={240}
                    placeholder={`Say something to ${ask.sender_name}… optional`}
                    value={receiverMsg}
                    onChange={(e) => setReceiverMsg(e.target.value)}
                  />
                  <div className="text-right text-[11px] text-ink-soft -mt-2">
                    {receiverMsg.length} / 240
                  </div>
                </div>
              )}

            </motion.div>
          </AnimatePresence>
        </div>

        {/* Bottom CTA */}
        {step > 0 && (
          <div
            className="absolute left-0 right-0 bottom-0 px-5 py-4 pt-7"
            style={{ background: 'linear-gradient(180deg, transparent, #fff7fb 28%)' }}
          >
            <button
              className="btn btn-primary btn-block"
              onClick={() => {
                if (isLastStep) { playConfirm(); confirm(); }
                else { playStep(); setStep(step + 1); }
              }}
              disabled={!canGoNext}
              style={{ opacity: canGoNext ? 1 : 0.5, cursor: canGoNext ? 'pointer' : 'not-allowed' }}
            >
              {isLastStep ? 'Confirm my answer 💕' : 'Continue →'}
            </button>
            <button
              className="btn btn-ghost btn-block mt-2"
              style={{ padding: '10px' }}
              onClick={() => { playClick(); setStep(Math.max(0, step - 1)); }}
            >
              ‹ Back
            </button>
          </div>
        )}

      </div>
    </PhoneShell>
  );
}
