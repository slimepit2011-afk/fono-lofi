export type Genre = 'pop' | 'lofi' | 'hiphop' | 'rock' | 'jazz';

export interface Track {
  id: string;
  title: string;
  artist: string;
  album: string;
  genre: Genre;
  dur: number; // in seconds
  loved: boolean;
  lovedAt?: number;
  added?: number;
  explicit?: boolean;
  plays?: number;
  audioUrl?: string; // custom audio stream or file
  youtubeId?: string; // YouTube video ID for video playback & audio
  spotifyId?: string; // Spotify track ID
  cover?: string; // cover image slug or direct URL
}

export interface Album {
  id: string;
  title: string;
  artist: string;
  year: number;
  cover: string;
  genre: Genre;
}

export interface Artist {
  id: string;
  name: string;
  genre: Genre;
  listeners: number;
  followed: boolean;
  cover: string;
  from: string;
}

export interface Playlist {
  id: string;
  name: string;
  desc: string;
  cover: string;
  mine: boolean;
  made: number;
  tracks: string[]; // track IDs
  isYouTube?: boolean;
  isSpotify?: boolean;
}

export interface Episode {
  id: string;
  show: string;
  title: string;
  dur: number; // seconds
  t: number;
  played?: boolean;
  progress?: number;
  downloaded?: boolean;
  audioUrl?: string;
  youtubeId?: string;
}

export interface Show {
  id: string;
  name: string;
  host: string;
  cover: string;
  topic: string;
  followed: boolean;
  about: string;
}

export interface ListeningHistoryItem {
  k: string; // track id
  t: number; // timestamp
  s: number; // seconds listened
}

export interface Notice {
  id: string;
  t: number;
  tone: 'good' | 'plain' | 'warn';
  icon: string;
  title: string;
  body: string;
  read: boolean;
  href: string;
}

export interface PlayerState {
  kind: 'track' | 'episode';
  id: string;
  pos: number; // seconds
  playing: boolean;
  queue: string[];
  shuffle: boolean;
  repeat: 'off' | 'all' | 'one';
  volume: number; // 0 to 1
  showVideo: boolean; // toggle floating/stage YouTube video display
}

export interface UserPrefs {
  crossfade: number;
  quality: 'normal' | 'high' | 'lossless';
  hifiAudio?: boolean; // Real 320kbps studio warmth filter
  tactileSound?: boolean; // Micro-interaction tactile acoustic clicks
  vipSkin?: 'obsidian' | 'latte' | 'matcha' | 'neon'; // Turntable vinyl styling
  ambientLevels?: { rain: number; crackle: number; cafe: number }; // VIP ambient noise mixer
  autoplay: boolean;
  normalise: boolean;
  explicit: boolean;
  digest: boolean;
  newMusic: boolean;
  podcastAlerts: boolean;
  theme: 'light' | 'dark' | 'system';
  sidebarRail: boolean;
  youtubeApiKey?: string;
  spotifyClientId?: string;
  spotifyAccessToken?: string;
}

export interface UserProfile {
  id?: string;
  name: string;
  handle: string;
  email: string;
  city: string;
  bio?: string;
  avatar?: string;
  avatarPreset?: string;
  provider?: 'google' | 'apple' | 'email' | 'guest';
  isRegistered?: boolean;
  registeredAt?: number;
  rememberMe?: boolean;
  redeemedCodes?: string[];
}

export type PaymentProvider = 'stripe' | 'apple_pay' | 'google_pay';
export type CardBrand = 'visa' | 'mastercard' | 'amex' | 'discover' | 'generic';

export interface PaymentMethod {
  id: string;
  type: PaymentProvider;
  isDefault: boolean;
  brand?: CardBrand;
  last4?: string;
  expMonth?: number;
  expYear?: number;
  cardholderName?: string;
  walletEmail?: string;
  addedAt: number;
}

export interface BillingInvoice {
  id: string;
  date: number;
  amount: string;
  planId: 'free' | 'plus' | 'duo';
  planName: string;
  paymentMethodLabel: string;
  status: 'paid' | 'refunded';
  receiptNumber: string;
}

export interface AppData {
  tracks: Track[];
  albums: Album[];
  artists: Artist[];
  playlists: Playlist[];
  shows: Show[];
  episodes: Episode[];
  history: ListeningHistoryItem[];
  notices: Notice[];
  tickets: any[];
  player: PlayerState;
  goal: number; // minutes per day
  plan: 'free' | 'plus' | 'duo';
  prefs: UserPrefs;
  profile: UserProfile;
  paymentMethods?: PaymentMethod[];
  invoices?: BillingInvoice[];
  seq: number;
}
