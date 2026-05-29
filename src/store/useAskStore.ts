import { create } from 'zustand';
import type { Ask, Lang } from '../types';

interface DraftAsk {
  sender_name: string;
  receiver_name: string;
  lang: Lang;
  /** Your own photos (up to 2, compressed) */
  sender_photos: string[];
  /** Photos of them (up to 2, compressed) */
  receiver_photos: string[];
  /** Optional — shown on the share screen so receiver can WhatsApp you back */
  sender_whatsapp: string;
  personal_message: string;
}

interface AskStore {
  draft: DraftAsk;
  setDraft: (patch: Partial<DraftAsk>) => void;
  resetDraft: () => void;

  current: Ask | null;
  setCurrent: (a: Ask | null) => void;
  patchCurrent: (patch: Partial<Ask>) => void;
}

const initial: DraftAsk = {
  sender_name: '',
  receiver_name: '',
  lang: 'both',
  sender_photos: [],
  receiver_photos: [],
  sender_whatsapp: '',
  personal_message: '',
};

export const useAskStore = create<AskStore>((set) => ({
  draft: initial,
  setDraft: (patch) => set((s) => ({ draft: { ...s.draft, ...patch } })),
  resetDraft: () => set({ draft: initial }),

  current: null,
  setCurrent: (a) => set({ current: a }),
  patchCurrent: (patch) => set((s) => ({ current: s.current ? { ...s.current, ...patch } : null })),
}));

/** All pick-a-place options shown to the receiver. */
export const PLACES = [
  { id: 'pizza',     emoji: '🍕', label: 'Pizza'              },
  { id: 'burger',    emoji: '🍔', label: 'Burger'             },
  { id: 'coffee',    emoji: '☕', label: 'Coffee'             },
  { id: 'icecream',  emoji: '🍦', label: 'Ice cream'          },
  { id: 'galleface', emoji: '🌊', label: 'Galle Face walk'    },
  { id: 'arcade',    emoji: '🎡', label: 'Arcade'             },
  { id: 'kottu',     emoji: '🍜', label: 'Kottu'              },
  { id: 'movie',     emoji: '🎬', label: 'Movie Time'         },
  { id: 'mc',        emoji: '🛍️', label: 'Majestic City'     },
  { id: 'sunset',    emoji: '🌅', label: 'Mt. Lavinia sunset' },
  { id: 'beach',     emoji: '🏖️', label: 'Beach with sunset' },
  { id: 'ogf',       emoji: '🌆', label: 'One Gall Face'      },
];

/** Quick-pick options for "Where should I pick you up?" step. */
export const PICKUP_OPTIONS = [
  { id: 'home',     emoji: '🏠', label: 'Home'          },
  { id: 'busstand', emoji: '🚌', label: 'Bus Stand'     },
  { id: 'train',    emoji: '🚂', label: 'Train Station' },
  { id: 'junction', emoji: '🛣️', label: 'Junction'     },
  { id: 'school',   emoji: '🏫', label: 'School / Uni'  },
  { id: 'work',     emoji: '💼', label: 'Work / Office' },
  { id: 'mall',     emoji: '🏬', label: 'Mall'          },
  { id: 'other',    emoji: '📍', label: 'Other place'   },
];

export const OUTFIT_COLORS = [
  { id: 'pink',   label: 'Pink',   hex: '#ec4899' },
  { id: 'red',    label: 'Red',    hex: '#ef4444' },
  { id: 'blue',   label: 'Blue',   hex: '#3b82f6' },
  { id: 'purple', label: 'Purple', hex: '#a855f7' },
  { id: 'white',  label: 'White',  hex: '#f3f4f6' },
  { id: 'yellow', label: 'Yellow', hex: '#facc15' },
  { id: 'green',  label: 'Green',  hex: '#22c55e' },
  { id: 'black',  label: 'Black',  hex: '#1f2937' },
  { id: 'orange', label: 'Orange', hex: '#f97316' },
  { id: 'teal',   label: 'Teal',   hex: '#0d9488' },
  { id: 'nude',   label: 'Nude',   hex: '#d4a088' },
  { id: 'maroon', label: 'Maroon', hex: '#9f1239' },
];
