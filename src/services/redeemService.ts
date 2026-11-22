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

const REDEEM_CATALOG: Record<string, {
  title: string;
  message: string;
  perks: string[];
  plan?: 'plus' | 'duo';
  skin?: 'obsidian' | 'latte' | 'matcha' | 'neon';
  hifi?: boolean;
}> = {
  // 1. Founder Functions Pass (Special Founder 1129 Edition)
  'FOUNDER1129': {
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
  },

  // 2. VIP Max Tier (Two 15-digit alphanumeric random codes)
  'XH7CCSRX92GQS6M': {
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

class RedeemCodeService {
  /**
   * Redeem a gift code
   */
  public redeem(rawCode: string, alreadyRedeemed: string[] = []): RedeemResult {
    const code = rawCode.trim().toUpperCase();

    if (!code) {
      return {
        success: false,
        code,
        title: 'Empty Code',
        message: 'Please enter a valid gift or voucher code.',
        perksUnlocked: []
      };
    }

    if (alreadyRedeemed.includes(code)) {
      return {
        success: false,
        code,
        title: 'Already Redeemed',
        message: `You have already redeemed code "${code}". Its perks are permanently active on your account.`,
        perksUnlocked: []
      };
    }

    // Check catalog for authentic authorized codes
    const perkData = REDEEM_CATALOG[code];
    if (perkData) {
      return {
        success: true,
        code,
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
