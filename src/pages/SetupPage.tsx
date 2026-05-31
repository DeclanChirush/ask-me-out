import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAskStore } from '../store/useAskStore';
import { createAsk } from '../lib/supabase';
import {
  generatePhotoKey,
  exportKeyB64,
  encryptPhotoPayload,
} from '../lib/crypto';
import { compressImage } from '../lib/imageUtils';
import { playStep, playConfirm, playPhotoAdd, playClick, playPageFlip } from '../lib/sounds';
import PhoneShell from '../components/PhoneShell';
import FloatingHearts from '../components/FloatingHearts';
import CoupleMatch from '../components/CoupleMatch';
import type { Lang } from '../types';

const STEPS = [
  { title: "Who's asking?",        sub: 'Names go on the invite',          chapter: 'chapter 1 · the names' },
  { title: 'Pick your language',   sub: 'Sinhala, English or both',         chapter: 'chapter 2 · the tongue' },
  { title: 'Add your photos',      sub: 'Yours + theirs — up to 2 each',    chapter: 'chapter 3 · the photos' },
  { title: 'Say something sweet',  sub: "A message only they'd get",         chapter: 'chapter 4 · a love note' },
];

/* Book-page flip — same model as YesPage. Always rotates around the
   left spine. Forward: current page flips left. Back: previous page
   un-flips into place. */
const pageVariants = {
  enter: (dir: number) => ({
    rotateY: dir > 0 ? 0 : -120,
    opacity: dir > 0 ? 0 : 1,
  }),
  center: { rotateY: 0, opacity: 1 },
  exit: (dir: number) => ({
    rotateY: dir > 0 ? -120 : 0,
    opacity: dir > 0 ? 1 : 0,
  }),
};

function StepDots({ step }: { step: number }) {
  return (
    <div className="flex gap-1.5 items-center">
      {STEPS.map((_, i) => (
        <div
          key={i}
          className="h-1 flex-1 rounded transition-colors"
          style={{ background: i <= step ? '#ec4899' : '#fce7f3' }}
        />
      ))}
    </div>
  );
}

/* tiny photo thumbnail with remove button */
function Thumb({ src, onRemove }: { src: string; onRemove: () => void }) {
  return (
    <motion.div
      initial={{ scale: 0.6, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      className="relative aspect-square rounded-xl overflow-hidden border border-pink-200"
    >
      <img src={src} alt="" className="w-full h-full object-cover" />
      <button
        onClick={onRemove}
        className="absolute top-1 right-1 w-5 h-5 rounded-full bg-pink-900/85 text-white text-xs font-black"
      >
        ×
      </button>
    </motion.div>
  );
}

export default function SetupPage() {
  const navigate = useNavigate();
  const { draft, setDraft } = useAskStore();
  const [step, setStep] = useState(0);
  const [direction, setDirection] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState<{ url: string; id: string } | null>(null);
  const [copied, setCopied] = useState(false);

  const LAST = STEPS.length - 1;
  const goToStep = (next: number) => {
    setDirection(next > step ? 1 : -1);
    playPageFlip();
    setStep(next);
  };
  const next = () => {
    if (step < LAST) { playStep(); goToStep(step + 1); }
    else submit();
  };
  const back = () => { playClick(); goToStep(Math.max(0, step - 1)); };

  const canNext = (() => {
    if (step === 0) return draft.sender_name.trim() && draft.receiver_name.trim();
    return true;
  })();

  /* ── Photo helpers ───────────────────────────────────────────────── */
  async function addPhotos(files: FileList | null, side: 'sender' | 'receiver') {
    if (!files) return;
    const existing = side === 'sender' ? draft.sender_photos : draft.receiver_photos;
    const remaining = 2 - existing.length;
    const take = Array.from(files).slice(0, Math.max(0, remaining));
    if (!take.length) return;

    const rawUrls = await Promise.all(
      take.map(
        (f) =>
          new Promise<string>((res, rej) => {
            const r = new FileReader();
            r.onload = () => res(r.result as string);
            r.onerror = rej;
            r.readAsDataURL(f);
          })
      )
    );
    const compressed = await Promise.all(rawUrls.map((u) => compressImage(u)));
    playPhotoAdd();
    if (side === 'sender') {
      setDraft({ sender_photos: [...existing, ...compressed] });
    } else {
      setDraft({ receiver_photos: [...existing, ...compressed] });
    }
  }

  /* ── Submit ──────────────────────────────────────────────────────── */
  async function submit() {
    setSubmitting(true);
    try {
      // Encrypt photos client-side; key goes in URL hash only
      let photos: string[] = [];
      let photoKey: string | null = null;

      if (draft.sender_photos.length > 0 || draft.receiver_photos.length > 0) {
        const key = await generatePhotoKey();
        photoKey = await exportKeyB64(key);
        const blob = await encryptPhotoPayload(
          { s: draft.sender_photos, r: draft.receiver_photos },
          key,
        );
        photos = [blob];
      }

      const ask = await createAsk({
        sender_name: draft.sender_name,
        receiver_name: draft.receiver_name,
        lang: draft.lang,
        photos,
        sender_whatsapp: draft.sender_whatsapp || null,
        personal_message: draft.personal_message || null,
      });

      const hash = photoKey ? `#${photoKey}` : '';
      playConfirm();
      setDone({ id: ask.id, url: `${window.location.origin}/ask/${ask.id}${hash}` });
    } finally {
      setSubmitting(false);
    }
  }

  /* ── Done screen ─────────────────────────────────────────────────── */
  if (done) {
    return (
      <PhoneShell>
        <div className="h-full flex flex-col">
          <div className="p-5 pb-4 flex items-center justify-between">
            <span className="text-lg">💌 AskOut</span>
            <span className="pill">DONE</span>
          </div>
          <div className="px-5 pb-6 flex-1 overflow-y-auto no-scrollbar">
            <div
              className="relative rounded-3xl p-6 text-white text-center overflow-hidden"
              style={{ background: 'linear-gradient(135deg,#ec4899,#f472b6)' }}
            >
              <FloatingHearts count={8} />
              <div className="text-4xl relative">💌</div>
              <div className="text-xl font-black mt-1 relative">Your link is ready!</div>
              <div className="text-sm opacity-90 mt-1 relative">
                Send it to <b>{draft.receiver_name || 'them'}</b> and see what they say 💕
              </div>
            </div>

            <div className="card mt-4 p-4">
              <div className="label">Shareable link</div>
              <div
                className="flex items-center gap-2 rounded-xl px-3 py-2.5 font-mono text-[12px]"
                style={{ background: '#fff7fb', border: '1.5px solid #fbcfe8', color: '#831843' }}
              >
                <span className="flex-1 truncate">{done.url}</span>
                <button
                  className="btn btn-primary"
                  style={{ padding: '6px 10px', fontSize: 12 }}
                  onClick={() => {
                    navigator.clipboard.writeText(done.url);
                    setCopied(true);
                    setTimeout(() => setCopied(false), 1400);
                  }}
                >
                  {copied ? 'Copied!' : 'Copy'}
                </button>
              </div>
            </div>

            {/* <a
              href={`https://wa.me/?text=${encodeURIComponent(`💕 ${done.url}`)}`}
              target="_blank"
              rel="noreferrer"
              className="btn btn-block mt-4"
              style={{ background: '#25D366', color: 'white', boxShadow: '0 10px 24px -10px rgba(37,211,102,.6)' }}
            >
              💬 Share on WhatsApp
            </a> */}

            <button
              className="btn btn-ghost btn-block mt-3"
              onClick={() => navigate(`/dashboard/${done.id}`)}
            >
              📊 Open live dashboard
            </button>

            <p className="text-center text-xs text-ink-soft mt-4">
              You'll see when they open it and what they decide.
            </p>
          </div>
        </div>
      </PhoneShell>
    );
  }

  /* ── Wizard ──────────────────────────────────────────────────────── */
  return (
    <PhoneShell>
      <div className="h-full flex flex-col overflow-hidden">

        <div className="px-5 pt-4 pb-1 flex items-center justify-between">
          {step > 0 ? (
            <button onClick={back} className="text-pink-500 font-extrabold text-lg leading-none">‹</button>
          ) : (
            <span className="w-4" />
          )}
          <span className="font-extrabold text-sm">💌 AskOut</span>
          <span className="page-number">page {step + 1} of {STEPS.length}</span>
        </div>

        <div className="px-5">
          <StepDots step={step} />
        </div>

        {/* The book page — flips on every step change */}
        <div className="flex-1 relative" style={{ perspective: 1400 }}>
          <AnimatePresence initial={false} custom={direction}>
            <motion.div
              key={step}
              custom={direction}
              variants={pageVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.55, ease: [0.32, 0.72, 0.24, 1] }}
              style={{
                transformOrigin: 'left center',
                transformStyle: 'preserve-3d',
                backfaceVisibility: 'hidden',
                boxShadow: '0 8px 28px -10px rgba(190,24,93,.25)',
              }}
              className="absolute inset-0 px-5 pt-4 pb-3 paper rounded-xl overflow-y-auto no-scrollbar"
            >
              {/* Handwritten chapter header */}
              <div className="mb-3">
                <div className="washi">{STEPS[step].chapter}</div>
                <h2 className="script text-pink-600 leading-tight mt-1.5" style={{ fontSize: 28, color: '#be185d' }}>
                  {STEPS[step].title}
                </h2>
                <span className="ink-underline" style={{ width: 110, marginTop: 2 }} />
                <div className="text-ink-soft text-[12px] mt-1 italic">~ {STEPS[step].sub} ~</div>
              </div>

              <div>

              {/* ── Step 0: Names + optional WhatsApp ────────────── */}
              {step === 0 && (
                <div className="grid gap-4">
                  <div>
                    <label className="label">Your name</label>
                    <input
                      className="input"
                      value={draft.sender_name}
                      onChange={(e) => setDraft({ sender_name: e.target.value })}
                      placeholder="e.g. Kasun"
                    />
                  </div>
                  <div>
                    <label className="label">Their name</label>
                    <input
                      className="input"
                      value={draft.receiver_name}
                      onChange={(e) => setDraft({ receiver_name: e.target.value })}
                      placeholder="e.g. Nethmi"
                    />
                  </div>
                  <div>
                    <label className="label">
                      Your WhatsApp number
                      <span className="text-ink-soft font-normal normal-case tracking-normal ml-1">(optional)</span>
                    </label>
                    {/* +94 prefix row — mimics .input styling */}
                    <div
                      className="flex items-center overflow-hidden"
                      style={{
                        border: '1.5px solid #fbcfe8',
                        background: '#fff7fb',
                        borderRadius: 12,
                      }}
                      onFocusCapture={(e) => (e.currentTarget.style.borderColor = '#f472b6')}
                      onBlurCapture={(e) => (e.currentTarget.style.borderColor = '#fbcfe8')}
                    >
                      <span
                        className="flex-none font-extrabold text-pink-600 text-[13px] select-none"
                        style={{
                          padding: '12px 10px 12px 14px',
                          background: 'linear-gradient(135deg,#fff1f7,#fce7f3)',
                          borderRight: '1.5px solid #fbcfe8',
                        }}
                      >
                        +94
                      </span>
                      <input
                        type="tel"
                        inputMode="numeric"
                        value={draft.sender_whatsapp}
                        onChange={(e) => setDraft({ sender_whatsapp: e.target.value })}
                        placeholder="077 123 4567"
                        style={{
                          flex: 1, border: 'none', outline: 'none',
                          background: 'transparent', padding: '12px 14px',
                          font: 'inherit', color: '#831843',
                        }}
                      />
                    </div>
                    <p className="text-[11px] text-ink-soft mt-1.5 leading-snug">
                      If you add this, they can send their answer directly to your WhatsApp 💬
                    </p>
                  </div>
                  <div
                    className="flex gap-2 items-start rounded-xl p-3 text-xs leading-snug text-ink-soft"
                    style={{ background: '#fff1f7', border: '1px dashed #f9a8d4' }}
                  >
                    <span className="text-base">💡</span>
                    <span>
                      The invite will be sent to{' '}
                      <b className="text-pink-700">{draft.receiver_name || '…'}</b> from{' '}
                      <b className="text-pink-700">{draft.sender_name || '…'}</b>.
                    </span>
                  </div>
                </div>
              )}

              {/* ── Step 1: Language ──────────────────────────── */}
              {step === 1 && (
                <div className="grid gap-3">
                  <div className="flex gap-2">
                    {(['si', 'en', 'both'] as Lang[]).map((L) => (
                      <button
                        key={L}
                        onClick={() => setDraft({ lang: L })}
                        className="flex-1 rounded-2xl py-3 px-2 font-extrabold transition-all"
                        style={{
                          border: '1.5px solid ' + (draft.lang === L ? '#ec4899' : '#fbcfe8'),
                          background: draft.lang === L ? 'linear-gradient(135deg,#fff1f7,#fce7f3)' : 'white',
                          color: '#831843',
                          boxShadow: draft.lang === L ? '0 6px 16px -8px rgba(236,72,153,.45)' : 'none',
                        }}
                      >
                        <div className="text-base">
                          {L === 'si' ? <span className="sin">සිං</span> : L === 'en' ? 'EN' : 'සිං · EN'}
                        </div>
                        <div className="text-[10px] font-semibold text-ink-soft uppercase tracking-wider mt-0.5">
                          {L === 'si' ? 'Sinhala' : L === 'en' ? 'English' : 'Both'}
                        </div>
                      </button>
                    ))}
                  </div>
                  <div
                    className="rounded-2xl p-4 border border-pink-200"
                    style={{ background: 'linear-gradient(135deg, #fff1f7, #fce7f3)' }}
                  >
                    <div className="label mb-1">Preview</div>
                    {draft.lang === 'si' && (
                      <div className="sin text-base font-bold">ඔයාට කියන්න ඕන දෙයක් තියෙනවා…</div>
                    )}
                    {draft.lang === 'en' && (
                      <div className="text-base font-bold">I've got something I need to ask you…</div>
                    )}
                    {draft.lang === 'both' && (
                      <>
                        <div className="sin text-[15px] font-bold">ඔයාට කියන්න ඕන දෙයක් තියෙනවා…</div>
                        <div className="text-[13px] text-ink-soft italic mt-1">I've got something to ask you…</div>
                      </>
                    )}
                  </div>
                </div>
              )}

              {/* ── Step 2: Photos — yours + theirs ──────────── */}
              {step === 2 && (
                <div className="grid gap-4">
                  <div className="grid grid-cols-2 gap-3">

                    {/* Sender photos */}
                    <div>
                      <div className="label mb-2">Your photo(s)</div>
                      <label
                        className="flex flex-col items-center justify-center rounded-2xl py-4 px-2 cursor-pointer text-center transition-all"
                        style={{ border: '2px dashed #f9a8d4', background: '#fff7fb', minHeight: 80 }}
                      >
                        <input
                          type="file" accept="image/*" multiple hidden
                          onChange={(e) => addPhotos(e.target.files, 'sender')}
                        />
                        <div className="text-2xl">{draft.sender_photos.length < 2 ? '🤳' : '✓'}</div>
                        <div className="text-[11px] font-extrabold mt-1">
                          {draft.sender_photos.length < 2 ? 'Add photo' : 'Max reached'}
                        </div>
                        <div className="text-[10px] text-ink-soft">
                          {2 - draft.sender_photos.length} left
                        </div>
                      </label>
                      {draft.sender_photos.length > 0 && (
                        <div className="grid grid-cols-2 gap-1.5 mt-2">
                          {draft.sender_photos.map((src, i) => (
                            <Thumb
                              key={i}
                              src={src}
                              onRemove={() =>
                                setDraft({ sender_photos: draft.sender_photos.filter((_, x) => x !== i) })
                              }
                            />
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Receiver photos */}
                    <div>
                      <div className="label mb-2">Their photo(s)</div>
                      <label
                        className="flex flex-col items-center justify-center rounded-2xl py-4 px-2 cursor-pointer text-center transition-all"
                        style={{ border: '2px dashed #f9a8d4', background: '#fff7fb', minHeight: 80 }}
                      >
                        <input
                          type="file" accept="image/*" multiple hidden
                          onChange={(e) => addPhotos(e.target.files, 'receiver')}
                        />
                        <div className="text-2xl">{draft.receiver_photos.length < 2 ? '📸' : '✓'}</div>
                        <div className="text-[11px] font-extrabold mt-1">
                          {draft.receiver_photos.length < 2 ? 'Add photo' : 'Max reached'}
                        </div>
                        <div className="text-[10px] text-ink-soft">
                          {2 - draft.receiver_photos.length} left
                        </div>
                      </label>
                      {draft.receiver_photos.length > 0 && (
                        <div className="grid grid-cols-2 gap-1.5 mt-2">
                          {draft.receiver_photos.map((src, i) => (
                            <Thumb
                              key={i}
                              src={src}
                              onRemove={() =>
                                setDraft({ receiver_photos: draft.receiver_photos.filter((_, x) => x !== i) })
                              }
                            />
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Live preview of couple match */}
                  {(draft.sender_photos.length > 0 || draft.receiver_photos.length > 0) ? (
                    <div>
                      <div className="label mb-2 text-center">Preview</div>
                      <CoupleMatch
                        senderPhotos={draft.sender_photos}
                        receiverPhotos={draft.receiver_photos}
                        senderName={draft.sender_name || 'You'}
                        receiverName={draft.receiver_name || 'Them'}
                      />
                    </div>
                  ) : (
                    <p className="text-center text-xs text-ink-soft">
                      Optional — no photos? We'll show their name in the stars ✨
                    </p>
                  )}
                </div>
              )}

              {/* ── Step 3: Personal message ──────────────────── */}
              {step === 3 && (
                <div>
                  <textarea
                    className="textarea"
                    rows={5}
                    maxLength={240}
                    value={draft.personal_message}
                    onChange={(e) => setDraft({ personal_message: e.target.value })}
                    placeholder="Something only they'd recognise… ✨"
                  />
                  <div className="text-right text-[11px] text-ink-soft mt-2">
                    {draft.personal_message.length} / 240
                  </div>
                  <p className="text-[11px] text-ink-soft mt-2 text-center leading-relaxed">
                    They'll see this on the invite — and can write something back to you too 💕
                  </p>
                </div>
              )}

              </div>
            </motion.div>
          </AnimatePresence>
        </div>

        <div
          className="px-5 pb-3 pt-3 flex-none"
          style={{ background: 'linear-gradient(180deg, transparent, #fff7fb 40%)' }}
        >
          <button
            className="btn btn-primary btn-block"
            onClick={next}
            disabled={!canNext || submitting}
            style={{
              opacity: canNext && !submitting ? 1 : 0.5,
              cursor: canNext && !submitting ? 'pointer' : 'not-allowed',
            }}
          >
            {step < LAST ? 'Continue →' : submitting ? 'Generating…' : 'Generate my link →'}
          </button>
        </div>

      </div>
    </PhoneShell>
  );
}
