// Promo & Gift Code Redemption Service
// Validates codes and returns unlocked perks, tiers, and skins

export interface RedeemResult {
  success: boolean;
  code: string;
  title: string;
  message: string;
  perksUnlocked: string[];
  plan?: 'plus' | 'duo' | 'free';
  skin?: 'obsidian' | 'latte' | 'matcha' | 'neon';
  hifi?: boolean;
}

interface CatalogEntry {
  canonicalCode?: string;
  title: string;
  message: string;
  perks: string[];
  plan?: 'plus' | 'duo';
  skin?: 'obsidian' | 'latte' | 'matcha' | 'neon';
  hifi?: boolean;
}

const FOUNDER_PERK: CatalogEntry = {
  canonicalCode: 'FOUNDER1129',
  title: '👑 FONO Founder 1129 Master Pass',
  message: 'Founder Pass 1129 verified! Lifetime VIP Max, all bespoke turntable finishes, Hi-Fi 320kbps pipeline, and complete founder privileges unlocked.',
  perks: [
    '👑 Founder Edition Status',
    'VIP Max Lifetime Access',
    'All Turntable Finishes (Obsidian, Latte, Matcha, Neon)',
    'Hi-Fi Lossless 320kbps Audio Pipeline',
    'Full Ambient Soundscape Mixer (Rain, Campfire, Cafe)',
    'Unlimited AI DJ Recommendation Sessions',
    'Private Upload Audio Vault Unlocked',
    'Zero Advertisements'
  ],
  plan: 'plus',
  skin: 'obsidian',
  hifi: true
};

const REDEEM_CATALOG: Record<string, CatalogEntry> = {
  // 1. Founder Functions Pass (Special Founder 1129 Edition & Aliases)
  'FOUNDER1129': FOUNDER_PERK,
  'FOUNDER': FOUNDER_PERK,
  'FOUNDER-1129': FOUNDER_PERK,
  '1129': FOUNDER_PERK,

  // 2. VIP Max Tier (Two 15-digit alphanumeric random codes)
  'XH7CCSRX92GQS6M': {
    canonicalCode: 'XH7CCSRX92GQS6M',
    title: 'VIP Max Lifetime Pass (Tier 1)',
    message: 'VIP Max Pass verified! Full studio audio suite, bespoke skins, and ad-free listening unlocked.',
    perks: [
      'VIP Max Status',
      'Zero Advertisements',
      'Lossless 320kbps Studio Audio',
      'Custom Vinyl Finishes',
      'Ambient Soundscape Mixer',
      'Unlimited AI DJ'
    ],
    plan: 'plus',
    hifi: true
  },
  '3PNETUBDMJRV8ZZ': {
    canonicalCode: '3PNETUBDMJRV8ZZ',
    title: 'VIP Max Lifetime Pass (Tier 1)',
    message: 'VIP Max Pass verified! Full studio audio suite, bespoke skins, and ad-free listening unlocked.',
    perks: [
      'VIP Max Status',
      'Zero Advertisements',
      'Lossless 320kbps Studio Audio',
      'Custom Vinyl Finishes',
      'Ambient Soundscape Mixer',
      'Unlimited AI DJ'
    ],
    plan: 'plus',
    hifi: true
  },

  // 3. Duo Mix Tier (Two 15-digit alphanumeric random codes)
  'GWZQSL55ALZBR6Q': {
    canonicalCode: 'GWZQSL55ALZBR6Q',
    title: 'Duo Mix Membership Pass (Tier 2)',
    message: 'Duo Mix Pass verified! Two-seat access, shared Duo blend playlists, and complete studio features unlocked.',
    perks: [
      'Duo Mix 2-Account Status',
      'Shared Duo Blend Playlist',
      'Zero Advertisements',
      'Lossless 320kbps Studio Audio',
      'Full Soundscape Mixer & Vinyl Finishes'
    ],
    plan: 'duo',
    hifi: true
  },
  '4RTBLUBGBACXKH2': {
    canonicalCode: '4RTBLUBGBACXKH2',
    title: 'Duo Mix Membership Pass (Tier 2)',
    message: 'Duo Mix Pass verified! Two-seat access, shared Duo blend playlists, and complete studio features unlocked.',
    perks: [
      'Duo Mix 2-Account Status',
      'Shared Duo Blend Playlist',
      'Zero Advertisements',
      'Lossless 320kbps Studio Audio',
      'Full Soundscape Mixer & Vinyl Finishes'
    ],
    plan: 'duo',
    hifi: true
  }
};

/**
 * Robust code normalization:
 * - Converts full-width unicode characters (CJK keyboard entry) to ASCII
 * - Strips zero-width spaces, BOM, control characters
 * - Strips hyphens, underscores, and all whitespace
 * - Uppercases
 */
export function normalizeRedeemCode(raw: string): string {
  if (!raw) return '';
  return raw
    .replace(/[\uFF01-\uFF5E]/g, (ch) => String.fromCharCode(ch.charCodeAt(0) - 0xFEE0))
    .replace(/[\u200B-\u200D\uFEFF\u00A0]/g, '')
    .replace(/[\s\-_]+/g, '')
    .toUpperCase();
}

class RedeemCodeService {
  /**
   * Redeem a gift code
   */
  public redeem(rawCode: string, alreadyRedeemed: string[] = []): RedeemResult {
    const code = normalizeRedeemCode(rawCode);

    if (!code) {
      return {
        success: false,
        code: rawCode,
        title: 'Empty Code',
        message: 'Please enter a valid gift or voucher code.',
        perksUnlocked: []
      };
    }

    // Check catalog for authentic authorized codes
    const perkData = REDEEM_CATALOG[code];
    const canonical = perkData?.canonicalCode || code;

    // Check if canonical code or variant was already redeemed
    const isAlreadyRedeemed = alreadyRedeemed.some(c => {
      const norm = normalizeRedeemCode(c);
      return norm === canonical || norm === code;
    });

    if (isAlreadyRedeemed) {
      return {
        success: false,
        code: canonical,
        title: 'Already Redeemed',
        message: `You have already redeemed code "${canonical}". Its perks are permanently active on your account.`,
        perksUnlocked: []
      };
    }

    if (perkData) {
      return {
        success: true,
        code: canonical,
        title: perkData.title,
        message: perkData.message,
        perksUnlocked: perkData.perks,
        plan: perkData.plan,
        skin: perkData.skin,
        hifi: perkData.hifi
      };
    }

    return {
      success: false,
      code,
      title: 'Invalid Code',
      message: `Code "${code}" was not recognized. Please check your voucher code and try again.`,
      perksUnlocked: []
    };
  }
}

export const redeemService = new RedeemCodeService();
