export type Lang = 'si' | 'en' | 'both';
export type Answer = 'yes' | 'no' | null;

export interface Place {
  id: string;
  emoji: string;
  labelKey: string;
}

export interface Ask {
  id: string;
  sender_name: string;
  receiver_name: string;
  lang: Lang;
  photos: string[];          // ["enc:<blob>"] — PhotoPayload encrypted
  places: string[];          // legacy / unused
  sender_whatsapp?: string | null;
  personal_message?: string | null;  // sender's message to receiver
  receiver_message?: string | null;  // receiver's reply message
  answer?: Answer;
  chosen_place?: string | null;
  chosen_place_custom?: string | null;
  chosen_day?: string | null;
  outfit_color?: string | null;
  outfit_custom?: string | null;
  how_we_met?: string | null;
  expires_at?: string | null;
  no_count: number;
  opened_at?: string | null;
  answered_at?: string | null;
  created_at?: string;
}

export interface FeedEvent {
  id: string;
  emoji: string;
  text: string;
  sub?: string;
  color: string;
  at: number;
}
