# 💕 AskOut — Romantic Date Ask Web App

A bilingual (Sinhala + English) interactive web app to ask someone out on a date — with a runaway No button, photo uploads, real-time answer tracking, and smooth animations.

---

## ✨ Features

- 🌍 **Bilingual** — Sinhala & English, toggleable anytime
- 📸 **Photo upload** — Upload her photos for a personal slideshow; falls back to animated starry constellation or sakura petals
- 🏃 **Runaway No button** — Escapes on hover (desktop) and tap (mobile), shrinks each time, disappears after 5 attempts
- 💕 **Animated Yes experience** — Confetti burst, celebration card, date place & day picker
- 📊 **Live sender dashboard** — Real-time feed of when she opens, how many times she tried No, and what she chose
- 🔗 **Shareable link** — Unique URL per ask, WhatsApp share built in
- 📱 **Mobile-first** — Works perfectly on any screen size

---

## 🛠 Tech Stack

| Layer | Technology |
|---|---|
| Framework | Vite + React 18 + TypeScript |
| Styling | Tailwind CSS |
| Animations | Framer Motion + CSS keyframes |
| State | Zustand |
| i18n | i18next + react-i18next |
| Backend | Supabase (Postgres + Realtime + Storage) |
| Confetti | canvas-confetti |
| Routing | React Router v6 |

---

## 📁 Project Structure

```
askout/
├── public/
├── src/
│   ├── main.tsx                  # App entry point
│   ├── App.tsx                   # Router + AnimatePresence
│   ├── i18n/
│   │   ├── index.ts              # i18next setup
│   │   ├── si.json               # Sinhala strings
│   │   └── en.json               # English strings
│   ├── lib/
│   │   ├── supabase.ts           # Supabase client (with localStorage fallback)
│   │   └── confetti.ts           # Confetti helper (3-burst)
│   ├── store/
│   │   └── useAskStore.ts        # Zustand global store
│   ├── types/
│   │   └── index.ts              # Shared TypeScript types
│   ├── pages/
│   │   ├── SetupPage.tsx         # Sender fills this out
│   │   ├── ReceiverPage.tsx      # What she sees
│   │   ├── YesPage.tsx           # Celebration + date picker
│   │   └── DashboardPage.tsx     # Sender live dashboard
│   └── components/
│       ├── FloatingHearts.tsx    # Animated bg hearts
│       ├── PhotoSlideshow.tsx    # Crossfade photo viewer
│       ├── StarConstellation.tsx # SVG star fallback (no photos)
│       ├── SakuraPetals.tsx      # Falling petals fallback (no photos)
│       ├── NoButton.tsx          # The runaway button
│       ├── YesButton.tsx         # Pulsing yes button
│       ├── LanguageToggle.tsx    # සිං / EN switcher
│       ├── PlaceCard.tsx         # Date option card
│       └── ConfettiCanvas.tsx    # Confetti wrapper
├── .env                          # Supabase credentials (never commit)
├── .env.example
├── tailwind.config.js
├── vite.config.ts
└── tsconfig.json
```

---

## 🗺 Routes

| Route | Page | Who sees it |
|---|---|---|
| `/setup` | SetupPage | Sender only |
| `/ask/:id` | ReceiverPage | Her (the receiver) |
| `/yes/:id` | YesPage | Her, after saying yes |
| `/dashboard/:id` | DashboardPage | Sender, live tracking |

---

## 🗄 Supabase Setup

### 1. Create a project at [supabase.com](https://supabase.com)

### 2. Run this SQL in the Supabase SQL editor:

```sql
create table asks (
  id               uuid primary key default gen_random_uuid(),
  sender_name      text,
  receiver_name    text,
  lang             text default 'both',
  photos           text[],
  places           text[],
  suggested_date   date,
  personal_message text,
  answer           text,
  chosen_place     text,
  chosen_day       text,
  no_count         int default 0,
  opened_at        timestamptz,
  answered_at      timestamptz,
  created_at       timestamptz default now()
);

alter table asks enable row level security;
create policy "public read/write" on asks for all using (true);
```

### 3. Copy your project URL and anon key from Supabase → Settings → API

---

## ⚙️ Local Setup

```bash
# 1. Clone the repo
git clone https://github.com/yourname/askout.git
cd askout

# 2. Install dependencies
npm install

# 3. Set up environment variables
cp .env.example .env
# Edit .env and add your Supabase credentials

# 4. Start dev server
npm run dev
```

App runs at `http://localhost:5173`

---

## 🔑 Environment Variables

Create a `.env` file in the project root:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

> **No Supabase?** The app works in localStorage-only mode automatically if these vars are missing. No realtime dashboard, but the core experience works fine.

---

## 🎨 Design System

### Colors

| Name | Hex | Usage |
|---|---|---|
| Primary pink | `#ec4899` | Buttons, accents |
| Deep rose | `#831843` | Headings, dark text |
| Mid rose | `#9d174d` | Body text |
| Muted rose | `#be185d` | Secondary text |
| Pink surface | `#fce7f3` | Card backgrounds |
| Pink bg | `#fff0f6` | Page background |
| Pink border | `#f9a8d4` | Borders, dividers |

### Fonts

- **English** — `Nunito` (Google Fonts)
- **Sinhala** — `Noto Sans Sinhala` (Google Fonts)

### Animations

| Animation | Implementation | Duration |
|---|---|---|
| Page transitions | Framer Motion, y+opacity | 0.6s |
| Floating hearts | CSS keyframes, 8 hearts | 6–12s loop |
| Sakura petals | CSS keyframes, 12 petals | random |
| Star twinkling | CSS keyframes on SVG | 2–4s loop |
| Photo crossfade | Framer Motion AnimatePresence | 0.8s |
| Yes heartbeat | Framer Motion scale loop | 2s loop |
| No button escape | Framer Motion spring | stiffness 300 |
| Confetti | canvas-confetti, 3 bursts | on YES click |
| Yes card entrance | Framer Motion spring | stiffness 260 |

---

## 🏃 No Button Behaviour

| Attempt | What happens |
|---|---|
| 1st hover/tap | Jumps 200px+ away, shows funny message |
| 2nd | Shrinks 15%, rotates 12°, new message |
| 3rd | Shrinks more, Yes button grows + glows |
| 4th | Tiny, barely visible, dramatic message |
| 5th+ | Vanishes entirely with exit animation |

**Desktop:** Escapes on `mouseenter` before cursor reaches it.  
**Mobile:** Teleports on `touchstart` before finger lifts.  
Button is always clamped within safe viewport bounds — never off-screen.

---

## 🌍 Adding / Editing Translations

Edit `src/i18n/si.json` for Sinhala and `src/i18n/en.json` for English.

```json
// si.json example
{
  "greeting": "{{name}}, ඔයාට කියන්න ඕන දෙයක් තියෙනවා…",
  "question": "ඔයා එක්ක date එකක් යන්න පුළුවන්ද? 🌹",
  "yes": "ඔව්, යමු! 💕",
  "no": "නෑ"
}
```

The `{{name}}` placeholder is replaced with the receiver's name at runtime.

---

## 📍 Date Place Options

These are the options the sender can offer. Kept casual and affordable:

| Emoji | Place | Vibe |
|---|---|---|
| 🍕 | Pizza | Chill & cheesy |
| 🍔 | Burger spot | Casual & fun |
| ☕ | Coffee date | Talk for hours |
| 🍦 | Ice cream walk | Sweet & easy |
| 🌊 | Galle Face Green | Beach walk, sunset |
| 🎡 | Arcade / bowling | Compete & laugh |
| 🍜 | Kottu date | Local & cozy |
| 🎬 | Movie night | Classic |
| 🛍️ | Majestic City walk | Explore together |
| 🌅 | Mt. Lavinia beach | Romantic sunset |

---

## 📊 Sender Dashboard — Live Feed Events

The dashboard subscribes to Supabase Realtime and shows:

```
👀  She opened the link          — on ReceiverPage mount
🏃  She tried to click No (×N)  — on no_count update
💕  She said YES!               — on answer = 'yes'
🍕  She picked: Pizza + Saturday — on chosen_place + chosen_day
```

---

## 📦 Build for Production

```bash
npm run build
# Output in /dist — deploy to Vercel, Netlify, or any static host
```

### Deploy to Vercel (recommended)

```bash
npm install -g vercel
vercel
# Follow prompts, add env vars in Vercel dashboard
```

---

## 🔒 Privacy Notes

- Photos are stored as base64 strings in Supabase
- No user accounts required — everything is linked by UUID
- The sender's setup page is not linked from anywhere — only they have the URL
- Consider adding an `expires_at` column and a Supabase Edge Function to auto-delete old rows after 7 days

---

## 🤝 Handoff Notes for Claude Code

When handing this README to Claude Code, also provide:

1. **The full design prompt** (Claude Design output) — describes every screen visually
2. **The full code prompt** — describes every file, component, and behaviour in detail
3. **This README** — for project structure, Supabase SQL, env vars, and animation specs

Claude Code should build files in this order:
```
main.tsx → App.tsx → types/index.ts → i18n/ → lib/ → store/ → components/ → pages/
```

---

## 💕 Good luck!

*May she always click Yes.*
