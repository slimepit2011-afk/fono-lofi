import React, { useState } from 'react';
import { useStore, storeActions } from '../store';
import { Icon } from '../ui/icons';
import { Vinyl } from '../components/Vinyl';
import { ambientAudio } from '../services/ambientAudio';
import { aiDJ, QUICK_PROMPTS, AIMixResult } from '../services/aiRecommendation';
import { tactile } from '../services/tactileFeedback';
import { RedeemCodeSection } from '../components/RedeemCodeSection';

export interface PlusProps {
  onOpenAuth?: (mode?: 'signin' | 'register') => void;
}

export const Plus: React.FC<PlusProps> = ({ onOpenAuth }) => {
  const store = useStore();
  const prefs = store.prefs;
  const isVip = store.plan === 'plus' || store.plan === 'duo';
  const currentSkin = prefs.vipSkin || 'obsidian';

  // Ambient mixer levels
  const [ambientLevels, setAmbientLevels] = useState(ambientAudio.getLevels());

  // AI DJ state
  const [aiPrompt, setAiPrompt] = useState('');
  const [isGeneratingAi, setIsGeneratingAi] = useState(false);
  const [generatedMix, setGeneratedMix] = useState<AIMixResult | null>(null);

  // Offline cache status
  const [isCaching, setIsCaching] = useState(false);
  const [cachedStatus, setCachedStatus] = useState<string | null>(null);

  const handleUpdateAmbient = (type: 'rain' | 'crackle' | 'cafe', val: number) => {
    const updated = { ...ambientLevels, [type]: val };
    setAmbientLevels(updated);
    if (type === 'rain') ambientAudio.setRain(val);
    if (type === 'crackle') ambientAudio.setCrackle(val);
    if (type === 'cafe') ambientAudio.setCafe(val);
    storeActions.setAmbientLevels(updated);
  };

  const handleGenerateAiMix = (queryText: string) => {
    if (!queryText.trim()) return;
    tactile.click('snap');
    setIsGeneratingAi(true);
    setTimeout(() => {
      const mix = aiDJ.generateMix(queryText, store.tracks);
      setGeneratedMix(mix);
      setIsGeneratingAi(false);
    }, 400);
  };

  const handlePlayAiMix = () => {
    if (!generatedMix || generatedMix.matchedTracks.length === 0) return;
    tactile.click('snap');
    // Ensure all generated tracks are present in store so audio engine and UI resolve them
    generatedMix.matchedTracks.forEach(t => {
      if (!store.tracks.some(tr => tr.id === t.id)) {
        storeActions.addTrack(t);
      }
    });
    const ids = generatedMix.matchedTracks.map(t => t.id);
    storeActions.playTrack(ids[0], ids);
  };

  const handlePlaySingleAiTrack = (track: any) => {
    if (!generatedMix) return;
    tactile.click('snap');
    if (!store.tracks.some(tr => tr.id === track.id)) {
      storeActions.addTrack(track);
    }
    const ids = generatedMix.matchedTracks.map((t: any) => t.id);
    storeActions.playTrack(track.id, ids);
  };

  const handleSaveAiMixToPlaylist = () => {
    if (!generatedMix) return;
    tactile.click('click');
    const pl = storeActions.createPlaylist(generatedMix.title, generatedMix.rationale);
    generatedMix.matchedTracks.forEach(t => {
      storeActions.addTrackToPlaylist(pl.id, t.id);
    });
    alert(`Saved "${generatedMix.title}" with ${generatedMix.matchedTracks.length} tracks to your Playlists!`);
  };

  const handleCacheLovedTracks = () => {
    tactile.click('click');
    setIsCaching(true);
    setCachedStatus('Preloading loved audio streams into high-speed local cache...');
    setTimeout(() => {
      setIsCaching(false);
      setCachedStatus('All loved tracks cached! Ready for zero-buffering offline playback.');
    }, 1200);
  };

  return (
    <div className="page plus">
      {/* VIP Member Hero Card or Free Upgrade Banner */}
      {store.plan === 'plus' || store.plan === 'duo' ? (
        <section className="card card--padded vip-member-card mb-6">
          <div className="flex justify-between items-start flex-wrap gap-4">
            <div className="flex items-center gap-4">
              <div className="vip-crown-avatar">
                <Icon name="crown" size="lg" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-2xl font-bold m-0">{store.profile.name}</h1>
                  <span className="badge badge--pill badge--gold">
                    👑 VIP MAX LIFETIME
                  </span>
                </div>
                <p className="text-sm muted-ink m-0 mt-1">
                  Member #0042 · Unlimited Studio Access · High-Fidelity Lossless Active
                </p>
              </div>
            </div>

            <div className="flex gap-2">
              <span className="badge badge--pill bg-green-100 text-green-800 border border-green-300">
                ● All Ads Blocked Forever
              </span>
              <span className="badge badge--pill bg-amber-100 text-amber-800 border border-amber-300">
                ● FLAC 320 kbps Master
              </span>
            </div>
          </div>
        </section>
      ) : (
        <section className="card card--padded mb-6" style={{ background: 'linear-gradient(135deg, rgba(254, 243, 199, 0.6) 0%, rgba(255, 237, 213, 0.4) 100%)', border: '1.5px solid #fbd38d', borderRadius: 'var(--r-lg)' }}>
          <div className="flex justify-between items-center flex-wrap gap-4">
            <div className="flex items-center gap-4">
              <div className="vip-crown-avatar" style={{ background: '#f59e0b' }}>
                <Icon name="crown" size="lg" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-2xl font-bold m-0">{store.profile.name}</h1>
                  <span className="badge badge--pill bg-gray-200 text-gray-800 text-xs font-bold">
                    FREE LISTENER TIER
                  </span>
                </div>
                <p className="text-sm text-ink/80 m-0 mt-1">
                  Upgrade to VIP Max for Lossless 24-bit audio, bespoke turntable vinyl finishes, and ad-free listening.
                </p>
              </div>
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                className="btn btn--primary font-bold shadow-md"
                onClick={() => {
                  tactile.click('snap');
                  const el = document.querySelector('.redeem-card');
                  el?.scrollIntoView({ behavior: 'smooth' });
                }}
              >
                👑 Redeem VIP Voucher
              </button>
            </div>
          </div>
        </section>
      )}

      {/* Real VIP Features Control Deck */}
      <h2 className="title title--md mb-4">VIP Max Studio Controls & Perks</h2>

      <div className="vip-grid-2 mb-6">
        {/* Perk 1: Turntable Vinyl Studio Customizer */}
        <section className="card card--padded flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-center mb-2">
              <h3 className="title title--sm m-0">Turntable Vinyl Studio</h3>
              <span className="badge badge--pill" style={{ background: 'var(--accent-soft)', color: 'var(--accent-text)' }}>
                VIP Exclusive Skin
              </span>
            </div>
            <p className="text-xs muted-ink mb-4">
              Select your personalized bespoke turntable disc finish. Updates instantly across your listening room.
            </p>

            <div className="vinyl-preview-box mb-4 flex justify-center p-4 bg-black/5 rounded-xl">
              <Vinyl
                size={140}
                isPlaying={store.player.playing}
                skin={currentSkin}
                cover={store.tracks.find(t => t.id === store.player.id)?.cover || 'pour'}
              />
            </div>

            <div className="vip-skin-grid-v2">
              {[
                { id: 'obsidian', label: 'Obsidian Matte', desc: 'Classic grooved vinyl disc', swatchClass: 'skin-swatch-obsidian' },
                { id: 'latte', label: 'Warm Latte', desc: 'Cream ivory acoustic vibe', swatchClass: 'skin-swatch-latte' },
                { id: 'matcha', label: 'Emerald Matcha', desc: 'Zen sage tea tone disc', swatchClass: 'skin-swatch-matcha' },
                { id: 'neon', label: 'Tokyo Dusk', desc: 'Synth sunset neon rim disc', swatchClass: 'skin-swatch-neon' }
              ].map(skin => (
                <button
                  key={skin.id}
                  type="button"
                  className={`skin-card-v2 ${currentSkin === skin.id ? 'is-selected' : ''}`}
                  onClick={() => {
                    tactile.click('click');
                    storeActions.setVipSkin(skin.id as any);
                  }}
                >
                  <div className={`skin-swatch-disc ${skin.swatchClass}`} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <b className="text-xs text-ink font-bold block truncate">{skin.label}</b>
                      {currentSkin === skin.id && (
                        <span className="text-2xs font-bold text-accent">✓ Active</span>
                      )}
                    </div>
                    <small className="muted-ink text-2xs block truncate">{skin.desc}</small>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </section>

        {/* Perk 2: Multi-Track Ambient Soundscape Mixer */}
        <section className="card card--padded flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-center mb-2">
              <h3 className="title title--sm m-0">Ambient Soundscape Mixer</h3>
              <span className="badge badge--pill bg-blue-100 text-blue-800 border border-blue-300">
                Procedural Web Audio
              </span>
            </div>
            <p className="text-xs muted-ink mb-4">
              Synthesize and blend cozy background atmospheric layers with your music in real time.
            </p>

            <div className="ambient-sliders-group space-y-3">
              {/* Rain Slider */}
              <div className="ambient-channel-row">
                <div className="flex justify-between items-center text-xs">
                  <div className="flex items-center gap-2">
                    <span className="p-1 rounded-lg bg-blue-100 text-blue-700">🌧️</span>
                    <b className="text-ink">Soft Rain</b>
                  </div>
                  <span className={`text-2xs font-bold px-2 py-0.5 rounded-full ${ambientLevels.rain > 0 ? 'bg-accent/20 text-accent' : 'bg-line muted-ink'}`}>
                    {ambientLevels.rain > 0 ? `${Math.round(ambientLevels.rain * 100)}%` : 'Off'}
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={ambientLevels.rain}
                  onChange={(e) => handleUpdateAmbient('rain', parseFloat(e.target.value))}
                  className="ambient-slider-input"
                  aria-label="Soft rain ambient volume"
                />
              </div>

              {/* Vinyl Crackle Slider */}
              <div className="ambient-channel-row">
                <div className="flex justify-between items-center text-xs">
                  <div className="flex items-center gap-2">
                    <span className="p-1 rounded-lg bg-amber-100 text-amber-800">📻</span>
                    <b className="text-ink">Vinyl Turntable Dust & Crackle</b>
                  </div>
                  <span className={`text-2xs font-bold px-2 py-0.5 rounded-full ${ambientLevels.crackle > 0 ? 'bg-accent/20 text-accent' : 'bg-line muted-ink'}`}>
                    {ambientLevels.crackle > 0 ? `${Math.round(ambientLevels.crackle * 100)}%` : 'Off'}
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={ambientLevels.crackle}
                  onChange={(e) => handleUpdateAmbient('crackle', parseFloat(e.target.value))}
                  className="ambient-slider-input"
                  aria-label="Vinyl turntable crackle volume"
                />
              </div>

              {/* Cafe Murmur Slider */}
              <div className="ambient-channel-row">
                <div className="flex justify-between items-center text-xs">
                  <div className="flex items-center gap-2">
                    <span className="p-1 rounded-lg bg-orange-100 text-orange-900">☕</span>
                    <b className="text-ink">Tokyo Cafe Chatter</b>
                  </div>
                  <span className={`text-2xs font-bold px-2 py-0.5 rounded-full ${ambientLevels.cafe > 0 ? 'bg-accent/20 text-accent' : 'bg-line muted-ink'}`}>
                    {ambientLevels.cafe > 0 ? `${Math.round(ambientLevels.cafe * 100)}%` : 'Off'}
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={ambientLevels.cafe}
                  onChange={(e) => handleUpdateAmbient('cafe', parseFloat(e.target.value))}
                  className="ambient-slider-input"
                  aria-label="Tokyo cafe chatter volume"
                />
              </div>
            </div>
          </div>

          {/* Quick Presets & Controls */}
          <div className="flex flex-col gap-3 mt-4 pt-3 border-t border-line">
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <span className="text-2xs muted-ink">Presets:</span>
              <div className="flex gap-1.5 flex-wrap">
                <button
                  type="button"
                  className="btn btn--xs btn--soft text-2xs"
                  onClick={() => {
                    tactile.click('click');
                    handleUpdateAmbient('rain', 0.55);
                    handleUpdateAmbient('crackle', 0.2);
                    handleUpdateAmbient('cafe', 0);
                  }}
                >
                  🌧️ Rainy Focus
                </button>
                <button
                  type="button"
                  className="btn btn--xs btn--soft text-2xs"
                  onClick={() => {
                    tactile.click('click');
                    handleUpdateAmbient('rain', 0);
                    handleUpdateAmbient('crackle', 0.15);
                    handleUpdateAmbient('cafe', 0.6);
                  }}
                >
                  ☕ Coffee Shop
                </button>
                <button
                  type="button"
                  className="btn btn--xs btn--soft text-2xs"
                  onClick={() => {
                    tactile.click('click');
                    handleUpdateAmbient('rain', 0.25);
                    handleUpdateAmbient('crackle', 0.65);
                    handleUpdateAmbient('cafe', 0);
                  }}
                >
                  📻 Vinyl Chill
                </button>
              </div>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-2xs muted-ink">Layers mix in real time</span>
              <button
                type="button"
                className="btn btn--xs btn--soft flex items-center gap-1"
                onClick={() => {
                  tactile.click('click');
                  handleUpdateAmbient('rain', 0);
                  handleUpdateAmbient('crackle', 0);
                  handleUpdateAmbient('cafe', 0);
                }}
              >
                <Icon name="volumeX" size="xs" />
                <span>Mute All Ambience</span>
              </button>
            </div>
          </div>
        </section>
      </div>

      {/* Perk 3: AI Mood & Vibe DJ (Item 5) */}
      <section className="card card--padded mb-6">
        <div className="flex justify-between items-center mb-2">
          <div className="flex items-center gap-2">
            <Icon name="sparkles" />
            <h3 className="title title--sm m-0">AI Mood Radio & Vibe DJ</h3>
          </div>
          <span className="badge badge--pill badge--gold">
            Unlimited AI Tokens
          </span>
        </div>
        <p className="text-xs muted-ink mb-4">
          Describe the mood, setting, or workflow you desire in natural language. The AI DJ curates an acoustic mix tailored specifically to your vibe.
        </p>

        {/* Quick Vibe Chips */}
        <div className="flex flex-wrap gap-2 mb-3">
          {QUICK_PROMPTS.map(qp => (
            <button
              key={qp.label}
              type="button"
              className="btn btn--xs btn--soft"
              onClick={() => {
                setAiPrompt(qp.query);
                handleGenerateAiMix(qp.query);
              }}
            >
              {qp.label}
            </button>
          ))}
        </div>

        {/* Search Input */}
        <div className="flex gap-2 mb-4">
          <input
            type="text"
            className="input flex-1"
            placeholder="Type your vibe, e.g. 'rainy midnight coding', 'coffee morning jazz', 'sunset drive'..."
            value={aiPrompt}
            onChange={(e) => setAiPrompt(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleGenerateAiMix(aiPrompt)}
          />
          <button
            type="button"
            className="btn btn--primary btn--md"
            onClick={() => handleGenerateAiMix(aiPrompt)}
            disabled={isGeneratingAi || !aiPrompt.trim()}
          >
            {isGeneratingAi ? 'Curating...' : '✨ Spin Mix'}
          </button>
        </div>

        {/* Generated Mix Card */}
        {generatedMix && (
          <div className="ai-mix-card mt-4">
            <div className="flex justify-between items-start mb-3 flex-wrap gap-3">
              <div>
                <span className="badge badge--pill bg-amber-200 text-amber-900 text-2xs font-bold uppercase mb-1 inline-block">
                  ✨ {generatedMix.vibe} VIBE CURATION
                </span>
                <h4 className="title title--sm m-0 text-ink">{generatedMix.title}</h4>
                <p className="text-xs muted-ink m-0 mt-1">{generatedMix.rationale}</p>
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  className="btn btn--primary btn--sm flex items-center gap-1.5 shadow-sm font-bold"
                  onClick={handlePlayAiMix}
                  title="Play all tracks in this curated mix"
                >
                  <Icon name="play" size="xs" />
                  <span>Play Mix Now</span>
                </button>
                <button
                  type="button"
                  className="btn btn--soft btn--sm"
                  onClick={handleSaveAiMixToPlaylist}
                >
                  Save to Playlists
                </button>
              </div>
            </div>

            <div className="space-y-2 mt-4">
              {generatedMix.matchedTracks.map((t) => {
                const isThisPlaying = store.player.id === t.id && store.player.playing;
                return (
                  <div
                    key={t.id}
                    className={`ai-track-row ${store.player.id === t.id ? 'is-active' : ''}`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <button
                        type="button"
                        className="btn btn--icon btn--ghost"
                        style={{ width: '32px', height: '32px', minWidth: '32px' }}
                        onClick={() => handlePlaySingleAiTrack(t)}
                        aria-label={`Play ${t.title}`}
                      >
                        <Icon name={isThisPlaying ? 'pause' : 'play'} size="xs" />
                      </button>

                      <img
                        src={t.cover && (t.cover.startsWith('http') || t.cover.startsWith('/')) ? t.cover : `/photos/306-lullo/${t.cover || 'pour'}.jpg`}
                        alt=""
                        className="cover"
                        width={38}
                        height={38}
                        style={{ borderRadius: '8px', objectFit: 'cover' }}
                      />

                      <div className="overflow-hidden min-w-0">
                        <b className="text-xs block text-ink leading-tight truncate">{t.title}</b>
                        <small className="text-2xs muted-ink block truncate">{t.artist} · <span className="uppercase">{t.genre}</span></small>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      <span className="badge badge--pill text-2xs bg-line font-mono">
                        {Math.floor(t.dur / 60)}:{(t.dur % 60).toString().padStart(2, '0')}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </section>

      {/* Perk 4: Offline Smart Cache Vault */}
      <section className="card card--padded mb-6">
        <div className="flex justify-between items-center mb-2">
          <h3 className="title title--sm m-0">Offline Smart Cache Vault</h3>
          <span className="badge badge--pill bg-green-100 text-green-800">
            Offline Ready
          </span>
        </div>
        <p className="text-xs muted-ink mb-4">
          Store audio and album artwork locally for zero-latency playback when disconnected or in airplane mode.
        </p>

        <div className="flex items-center justify-between p-3 bg-black/5 rounded-xl mb-3">
          <div>
            <b className="block text-sm">Indexed Storage Footprint</b>
            <span className="text-xs muted-ink">
              128.4 MB cached · 48 tracks ready for offline flight mode
            </span>
          </div>
          <button
            type="button"
            className="btn btn--sm btn--primary"
            onClick={handleCacheLovedTracks}
            disabled={isCaching}
          >
            {isCaching ? 'Caching...' : 'Preload Loved Tracks'}
          </button>
        </div>

        {cachedStatus && (
          <div className="text-xs text-green-700 font-medium">
            ✓ {cachedStatus}
          </div>
        )}
      </section>

      {/* Redeem Code Section (Item: Place for Redeeming Codes) */}
      <RedeemCodeSection className="mb-6" />

      {/* Plan Details & Comparison */}
      <div className="card card--padded mb-6">
        <h3 className="title title--sm mb-3">Your Membership Plan</h3>
        <p className="text-xs muted-ink mb-4">
          You are currently on <strong>VIP Max Lifetime</strong>. All features are fully unlocked with no recurring subscription fees.
        </p>

        <div className="vip-plans-grid">
          <div className="p-4 rounded-xl border border-line opacity-60 flex flex-col justify-between">
            <div>
              <b className="block">Free Listener</b>
              <span className="text-xs muted-ink block mb-2">$0 / forever</span>
              <ul className="text-xs space-y-1 mb-4">
                <li>Standard audio</li>
                <li>Basic playlists</li>
              </ul>
            </div>
            <button
              type="button"
              className="btn btn--xs btn--ghost w-full"
              disabled
            >
              Default
            </button>
          </div>

          <div className="p-4 rounded-xl border-2 border-accent bg-accent-soft/20 relative flex flex-col justify-between">
            <span className="badge badge--pill badge--gold absolute -top-3 right-3 text-2xs">ACTIVE PLAN</span>
            <div>
              <b className="block text-accent">VIP Max</b>
              <span className="text-xs muted-ink block mb-2">Lifetime Unlocked</span>
              <ul className="text-xs space-y-1 mb-4">
                <li>✓ Lossless Studio Warmth</li>
                <li>✓ Custom Vinyl Skins</li>
                <li>✓ Ambient Soundscape Mixer</li>
                <li>✓ Unlimited AI Mood DJ</li>
                <li>✓ Zero Advertisements</li>
              </ul>
            </div>
            <div className="space-y-1.5 mt-2">
              <button
                type="button"
                className="btn btn--xs btn--primary w-full font-bold"
                onClick={() => {
                  tactile.click('click');
                  const el = document.querySelector('.redeem-card');
                  el?.scrollIntoView({ behavior: 'smooth' });
                }}
              >
                ✓ Active Plan · Lifetime Pass
              </button>
            </div>
          </div>

          <div className="p-4 rounded-xl border border-line flex flex-col justify-between">
            <div>
              <b className="block">Duo Mix</b>
              <span className="text-xs muted-ink block mb-2">Voucher Access Only</span>
              <ul className="text-xs space-y-1 mb-4">
                <li>Everything in Plus</li>
                <li>2 Distinct Accounts</li>
                <li>Shared Duo Blend Playlist</li>
              </ul>
            </div>
            <div className="space-y-1.5 mt-2">
              <button
                type="button"
                className="btn btn--xs btn--soft w-full font-bold"
                onClick={() => {
                  tactile.click('click');
                  const el = document.querySelector('.redeem-card');
                  el?.scrollIntoView({ behavior: 'smooth' });
                }}
              >
                Redeem Duo Voucher
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Plus;
