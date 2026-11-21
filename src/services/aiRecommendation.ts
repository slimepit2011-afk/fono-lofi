// AI Recommendation Engine (Mood & Vibe DJ)
// Synthesizes natural language vibe requests into curated acoustic playlists
// Evaluates track metadata, genre, mood resonance, and acoustic profile

import { Track } from '../types';
import { INITIAL_TRACKS } from '../store/initialData';

export interface AIMixResult {
  id: string;
  title: string;
  vibe: string;
  rationale: string;
  tags: string[];
  matchedTracks: Track[];
}

interface VibeProfile {
  keywords: string[];
  genres: string[];
  descriptors: string[];
  bpmHint: string;
  titleTemplate: string;
}

const VIBE_PROFILES: Record<string, VibeProfile> = {
  coding: {
    keywords: ['code', 'coding', 'program', 'dev', 'terminal', 'debug', 'focus', 'deep work', 'flow'],
    genres: ['lofi', 'jazz', 'pop'],
    descriptors: ['Hypnotic 80-85 BPM drum loops', 'Subtle vinyl dust', 'Minimal distracting vocals', 'Warm electric piano'],
    bpmHint: '84 BPM',
    titleTemplate: 'Midnight Terminal // Deep Code'
  },
  rainy: {
    keywords: ['rain', 'rainy', 'storm', 'window', 'cozy', 'droplets', 'grey', 'autumn', 'winter'],
    genres: ['lofi', 'jazz'],
    descriptors: ['Gentle tape hiss', 'Mellow Fender Rhodes chords', 'Soft acoustic kick drums', 'Melancholic warm pads'],
    bpmHint: '76 BPM',
    titleTemplate: 'Rain on the Windowpane'
  },
  coffee: {
    keywords: ['coffee', 'cafe', 'espresso', 'morning', 'latte', 'breakfast', 'sunrise', 'bakery'],
    genres: ['jazz', 'lofi', 'pop'],
    descriptors: ['Bossa nova acoustic guitar', 'Smooth upright bass', 'Warm ceramic cafe aesthetic', 'Uplifting morning melody'],
    bpmHint: '92 BPM',
    titleTemplate: 'Morning Espresso & Croissant'
  },
  night: {
    keywords: ['night', 'late', 'midnight', 'sleep', 'bed', 'insomnia', 'dark', 'moon', 'stars'],
    genres: ['lofi', 'jazz'],
    descriptors: ['Down-tempo sub bass', 'Dreamy reverbed synths', 'Sleep-inducing harmonic pads', 'Low-light ambient calm'],
    bpmHint: '68 BPM',
    titleTemplate: '2 AM Tokyo Balcony'
  },
  study: {
    keywords: ['study', 'exam', 'read', 'reading', 'library', 'homework', 'concentration', 'work'],
    genres: ['lofi', 'pop'],
    descriptors: ['Alpha wave frequency focus', 'Consistent head-bob rhythm', 'Gentle acoustic strumming', 'Zero vocal interference'],
    bpmHint: '80 BPM',
    titleTemplate: 'Lo-Fi Study Hall'
  },
  chill: {
    keywords: ['chill', 'relax', 'peace', 'unwind', 'calm', 'weekend', 'lounge', 'lazy'],
    genres: ['lofi', 'pop', 'jazz', 'hiphop'],
    descriptors: ['Warm analog tape compression', 'Soothing neo-soul progressions', 'Laid-back grooves', 'Cozy room atmosphere'],
    bpmHint: '82 BPM',
    titleTemplate: 'Sunlight Through the Blinds'
  },
  energized: {
    keywords: ['energy', 'hype', 'drive', 'groove', 'upbeat', 'dance', 'fun', 'bop'],
    genres: ['pop', 'hiphop', 'rock'],
    descriptors: ['Punchy snare hits', 'Bouncy synth basslines', 'Infectious rhythm guitars', 'High spirits'],
    bpmHint: '110 BPM',
    titleTemplate: 'Neon Boulevard Drive'
  }
};

export const QUICK_PROMPTS = [
  { label: '🌧️ Rainy Night Coding', query: 'rainy night coding deep focus' },
  { label: '☕ Morning Cafe Jazz', query: 'morning coffee cafe bossa jazz' },
  { label: '🌙 2 AM Sleepless Chill', query: 'late midnight slow sleep ambient' },
  { label: '📚 Library Study Flow', query: 'deep study concentration focus' },
  { label: '🚗 Sunset Neon Cruise', query: 'upbeat energized sunset drive groove' }
];

export class AIRecommendationEngine {
  /**
   * Generates a tailored AI playlist from a natural language prompt
   */
  public generateMix(prompt: string, catalog: Track[]): AIMixResult {
    const p = prompt.toLowerCase().trim();

    // Pool tracks: prioritize user catalog, but always ensure access to master studio catalog
    // so freshly registered users or users with sparse libraries never get empty mixes.
    const userTracks = catalog || [];
    const masterPool = INITIAL_TRACKS || [];
    
    // Combine unique tracks: user tracks take precedence
    const seenIds = new Set<string>();
    const pool: { track: Track; isUserUpload: boolean }[] = [];
    
    for (const t of userTracks) {
      if (!seenIds.has(t.id)) {
        seenIds.add(t.id);
        pool.push({ track: t, isUserUpload: true });
      }
    }
    for (const t of masterPool) {
      if (!seenIds.has(t.id)) {
        seenIds.add(t.id);
        pool.push({ track: t, isUserUpload: false });
      }
    }

    // Detect matched vibe profile
    let bestProfileKey = 'chill';
    let maxMatchCount = 0;

    for (const [key, profile] of Object.entries(VIBE_PROFILES)) {
      let count = 0;
      for (const kw of profile.keywords) {
        if (p.includes(kw)) count += 2;
      }
      for (const g of profile.genres) {
        if (p.includes(g)) count += 1;
      }
      if (count > maxMatchCount) {
        maxMatchCount = count;
        bestProfileKey = key;
      }
    }

    // Fallback profile if no clear match
    if (maxMatchCount === 0) {
      if (p.includes('rain') || p.includes('storm')) bestProfileKey = 'rainy';
      else if (p.includes('night') || p.includes('late')) bestProfileKey = 'night';
      else if (p.includes('cafe') || p.includes('coffee')) bestProfileKey = 'coffee';
      else if (p.includes('code') || p.includes('work')) bestProfileKey = 'coding';
      else bestProfileKey = 'chill';
    }

    const selectedProfile = VIBE_PROFILES[bestProfileKey];

    // Score and rank pool tracks
    const scoredTracks = pool.map(({ track, isUserUpload }) => {
      let score = Math.random() * 0.8; // slight organic variation

      // User upload boost (prioritize their personal uploads if they match)
      if (isUserUpload) score += 2.0;

      // Genre resonance
      if (selectedProfile.genres.includes(track.genre)) {
        score += 3.5;
      }

      // Track title / artist keyword matching
      const trackText = `${track.title} ${track.artist} ${track.album}`.toLowerCase();
      for (const kw of selectedProfile.keywords) {
        if (trackText.includes(kw)) score += 3.0;
      }
      for (const word of p.split(/\s+/)) {
        if (word.length > 2 && trackText.includes(word)) score += 2.0;
      }

      // Bonus if user loved the track
      if (track.loved) score += 1.5;

      // Bonus if frequently played
      if (track.plays && track.plays > 0) score += Math.min(2.0, track.plays * 0.2);

      return { track, score };
    });

    // Sort descending by score
    scoredTracks.sort((a, b) => b.score - a.score);

    // Pick top unique tracks (always at least 4, up to 6)
    const selectedTracks = scoredTracks.slice(0, Math.min(6, scoredTracks.length)).map(item => item.track);

    // Generate rationale
    const rationale = `Curated ${selectedTracks.length} tracks tailored for "${prompt}". Features ${selectedProfile.descriptors.join(', ')} tuned to approximately ${selectedProfile.bpmHint}.`;

    const title = prompt.length < 24 && prompt.length > 3
      ? `${prompt.charAt(0).toUpperCase() + prompt.slice(1)} Mix`
      : selectedProfile.titleTemplate;

    return {
      id: `ai-${Date.now()}`,
      title,
      vibe: bestProfileKey.toUpperCase(),
      rationale,
      tags: [bestProfileKey, ...selectedProfile.genres],
      matchedTracks: selectedTracks
    };
  }
}

export const aiDJ = new AIRecommendationEngine();
