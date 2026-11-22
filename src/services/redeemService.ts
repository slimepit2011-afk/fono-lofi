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
  'VIPMAX': {
    title: 'VIP Max Lifetime Pass',
    message: 'Congratulations! You have redeemed full Lifetime VIP Max membership with zero ads and studio perks.',
    perks: ['VIP Max Status', 'Zero Advertisements', 'FLAC 320kbps Audio', 'Unlimited AI DJ'],
    plan: 'plus',
    hifi: true
  },
  'VIP2026': {
    title: 'VIP Max 2026 Pass',
    message: 'Welcome to VIP Max 2026! Full audio suite and turntable studio unlocked.',
    perks: ['VIP Max Status', 'Ambient Soundscape Mixer', 'All Vinyl Skins'],
    plan: 'plus',
    hifi: true
  },
  'LOFI2026': {
    title: 'Lo-Fi Chillhop Founder Pack',
    message: 'Founder code accepted! Warm Latte vinyl skin and studio audio unlocked.',
    perks: ['Warm Latte Turntable Skin', 'Ambient Soundscape Mixer', 'FLAC Master'],
    plan: 'plus',
    skin: 'latte',
    hifi: true
  },
  'STUDIO': {
    title: 'Studio Hi-Fi Audiophile Pass',
    message: 'Studio warmth filter and lossless 320kbps pipeline unlocked.',
    perks: ['Studio Hi-Fi Lossless Warmth', 'Lowpass Analog Harmonics'],
    hifi: true,
    plan: 'plus'
  },
  'NEONDUSK': {
    title: 'Tokyo Dusk Neon Vinyl Skin',
    message: 'Exclusive neon dusk turntable disc styling unlocked!',
    perks: ['Tokyo Dusk Vinyl Finish', 'Night Club Ambient Tone'],
    skin: 'neon',
    plan: 'plus'
  },
  'COZYRAIN': {
    title: 'Cozy Rain Soundscape Pack',
    message: 'Procedural Rain, Fireplace Crackle, and Tokyo Cafe ambience unlocked!',
    perks: ['Full Ambient Soundscape Mixer', 'Procedural Rain Generator'],
    plan: 'plus'
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
        message: 'Please enter a valid gift or promo code.',
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

    // Check catalog
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

    // Allow VIP prefix codes
    if (code.startsWith('VIP') || code.startsWith('PRO') || code.startsWith('LOFI')) {
      return {
        success: true,
        code,
        title: 'Special VIP Access Pass',
        message: `Code "${code}" verified! VIP perks and unlimited music streaming unlocked.`,
        perksUnlocked: ['VIP Max Status', 'Zero Advertisements', 'FLAC Audio'],
        plan: 'plus',
        hifi: true
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
