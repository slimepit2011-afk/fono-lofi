import React, { useState, useEffect, useRef } from 'react';
import { useStore, storeActions } from '../store';
import { Icon } from '../ui/icons';
import { formatDuration } from '../ui/format';
import { youtubeService } from '../services/youtube';
import { spotifyService } from '../services/spotify';
import { aiDJ, QUICK_PROMPTS, AIMixResult } from '../services/aiRecommendation';
import { tactile } from '../services/tactileFeedback';

export interface FinderProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (route: string) => void;
}

export const Finder: React.FC<FinderProps> = ({ isOpen, onClose, onNavigate }) => {
  const store = useStore();
  const [query, setQuery] = useState('');
  const [importing, setImporting] = useState(false);
  const [importStatus, setImportStatus] = useState<string | null>(null);
  const [aiMix, setAiMix] = useState<AIMixResult | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
      setQuery('');
      setImportStatus(null);
      setAiMix(null);
    }
  }, [isOpen]);

  const handleRunAiDJ = (promptText: string) => {
    tactile.click('snap');
    const mix = aiDJ.generateMix(promptText, store.tracks);
    setAiMix(mix);
    setQuery(promptText);
  };

  // Global keyboard shortcut ⌘K / Ctrl+K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        if (isOpen) onClose();
        else {
          // Open finder
          const btn = document.querySelector('.side__search-btn') as HTMLButtonElement;
          btn?.click();
        }
      }
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const isYouTubeUrl = youtubeService.parseUrl(query) !== null;
  const isSpotifyUrl = spotifyService.parseUrl(query) !== null;
  const spotifyParsed = spotifyService.parseUrl(query);

  const filteredTracks = store.tracks.filter(t => {
    const q = query.toLowerCase().trim();
    if (!q) return true;
    const artist = store.artists.find(a => a.id === t.artist)?.name || t.artist;
    const album = store.albums.find(a => a.id === t.album)?.title || '';
    return t.title.toLowerCase().includes(q) || artist.toLowerCase().includes(q) || album.toLowerCase().includes(q);
  }).slice(0, 8);

  const filteredPlaylists = store.playlists.filter(p =>
    query.trim() ? p.name.toLowerCase().includes(query.toLowerCase().trim()) : false
  ).slice(0, 4);

  const handleImportYouTube = async () => {
    if (!isYouTubeUrl) return;
    setImporting(true);
    setImportStatus('Resolving YouTube video...');
    try {
      const track = await storeActions.importYouTubeTrack(query);
      if (track) {
        setImportStatus(`Added "${track.title}"! Playing now...`);
        setTimeout(() => {
          storeActions.playTrack(track.id);
          onClose();
        }, 800);
      } else {
        setImportStatus('Could not resolve YouTube video ID.');
      }
    } catch (err: any) {
      setImportStatus('Failed to import YouTube video: ' + err.message);
    } finally {
      setImporting(false);
    }
  };

  const handleImportSpotify = async () => {
    if (!isSpotifyUrl) return;
    setImporting(true);
    setImportStatus(spotifyParsed?.type === 'track' ? 'Importing Spotify track...' : 'Importing Spotify playlist & songs...');
    try {
      const pl = await storeActions.importSpotifyPlaylistUrl(query);
      if (pl) {
        if (spotifyParsed?.type === 'track' && pl.tracks.length > 0) {
          setImportStatus(`Added "${pl.name}"! Playing now...`);
          setTimeout(() => {
            storeActions.playTrack(pl.tracks[0]);
            onClose();
          }, 600);
        } else {
          setImportStatus(`Imported "${pl.name}" with ${pl.tracks.length} tracks!`);
          setTimeout(() => {
            onNavigate(`playlist:${pl.id}`);
            onClose();
          }, 800);
        }
      } else {
        setImportStatus('Could not extract Spotify playlist. Please ensure the playlist is Public on Spotify or connect in Settings.');
      }
    } catch (err: any) {
      setImportStatus(err.message || 'Failed to import Spotify playlist.');
    } finally {
      setImporting(false);
    }
  };

  const handleSelectTrack = (trackId: string) => {
    storeActions.playTrack(trackId);
    onClose();
  };

  return (
    <div className="finder-backdrop" onClick={onClose}>
      <div
        className="finder card modal"
        role="dialog"
        aria-modal="true"
        aria-label="Search and import music"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="finder__head">
          <Icon name="search" className="finder__search-ico" />
          <input
            ref={inputRef}
            type="search"
            className="finder__input"
            placeholder="Search songs, artists, or paste a YouTube / Spotify link..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <button
            type="button"
            className="btn btn--ghost btn--icon finder__close"
            onClick={onClose}
            aria-label="Close"
          >
            <Icon name="close" size="sm" />
          </button>
        </div>

        {/* AI DJ Quick Vibe Strip (Item 5) */}
        <div className="finder__vibe-strip" style={{ display: 'flex', gap: '6px', padding: '8px 16px', overflowX: 'auto', background: 'var(--well)', borderBottom: '1px solid var(--line)' }}>
          <span style={{ fontSize: 'var(--fs-xs)', color: 'var(--muted)', display: 'flex', alignItems: 'center', gap: '4px', whiteSpace: 'nowrap' }}>
            <Icon name="sparkles" size="xs" /> AI DJ:
          </span>
          {QUICK_PROMPTS.map(qp => (
            <button
              key={qp.label}
              type="button"
              className="btn btn--xs btn--soft"
              style={{ whiteSpace: 'nowrap' }}
              onClick={() => handleRunAiDJ(qp.query)}
            >
              {qp.label}
            </button>
          ))}
        </div>

        {/* AI Curated Mix Banner if active */}
        {aiMix && (
          <div className="finder__import-banner" style={{ background: 'var(--t-butter)', borderColor: 'var(--accent)' }}>
            <div className="finder__import-info">
              <Icon name="sparkles" size="md" />
              <div>
                <b>{aiMix.title} ({aiMix.matchedTracks.length} tracks)</b>
                <p>{aiMix.rationale}</p>
              </div>
            </div>
            <button
              type="button"
              className="btn btn--primary btn--sm"
              onClick={() => {
                tactile.click('snap');
                const ids = aiMix.matchedTracks.map(t => t.id);
                storeActions.playTrack(ids[0], ids);
                onClose();
              }}
            >
              Play AI Mix
            </button>
          </div>
        )}

        {/* Quick URL Import Banner */}
        {isYouTubeUrl && (
          <div className="finder__import-banner">
            <div className="finder__import-info">
              <Icon name="youtube" size="md" />
              <div>
                <b>Import YouTube Track & Video</b>
                <p>Add this video to your library with live spinning vinyl playback.</p>
              </div>
            </div>
            <button
              type="button"
              className="btn btn--primary btn--sm"
              disabled={importing}
              onClick={handleImportYouTube}
            >
              {importing ? 'Importing...' : 'Play & Save Video'}
            </button>
          </div>
        )}

        {isSpotifyUrl && (
          <div className="finder__import-banner">
            <div className="finder__import-info">
              <Icon name="spotify" size="md" />
              <div>
                <b>Import Spotify {spotifyParsed?.type === 'track' ? 'Track' : spotifyParsed?.type === 'album' ? 'Album' : 'Playlist'}</b>
                <p>
                  {spotifyParsed?.type === 'track'
                    ? 'Import and play this Spotify track with vinyl animation.'
                    : 'Import all tracks, artists, and audio previews directly into FONO lofi.'}
                </p>
              </div>
            </div>
            <button
              type="button"
              className="btn btn--primary btn--sm"
              disabled={importing}
              onClick={handleImportSpotify}
            >
              {importing ? 'Importing...' : spotifyParsed?.type === 'track' ? 'Play Track' : 'Import Playlist'}
            </button>
          </div>
        )}

        {importStatus && (
          <div
            className={`finder__status label ${
              importStatus.includes('Imported') || importStatus.includes('Added')
                ? 'label--success'
                : importStatus.includes('Private') || importStatus.includes('Could not') || importStatus.includes('Failed')
                ? 'label--warning'
                : 'label--ink'
            }`}
            style={{ whiteSpace: 'normal', lineHeight: '1.4', padding: '8px 12px' }}
          >
            {importStatus}
          </div>
        )}

        {/* Search Results */}
        <div className="finder__body">
          {filteredPlaylists.length > 0 && (
            <div className="finder__group">
              <div className="finder__group-title">Playlists</div>
              <ul className="finder__list">
                {filteredPlaylists.map(pl => (
                  <li key={pl.id}>
                    <button
                      type="button"
                      className="finder__item"
                      onClick={() => {
                        onNavigate(`playlist:${pl.id}`);
                        onClose();
                      }}
                    >
                      <Icon name="playlist" className="finder__item-ico" />
                      <div className="finder__item-meta">
                        <span className="finder__item-title">{pl.name}</span>
                        <span className="finder__item-sub">{pl.tracks.length} tracks</span>
                      </div>
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="finder__group">
            <div className="finder__group-title">
              {query ? 'Matching Songs' : 'Recent & Recommended'}
            </div>
            <ul className="finder__list">
              {filteredTracks.map(track => {
                const artist = store.artists.find(a => a.id === track.artist)?.name || track.artist;
                const album = store.albums.find(a => a.id === track.album);
                const cover = album?.cover || 'pour';
                const coverSrc = track.cover?.startsWith('http') || track.cover?.startsWith('/')
                  ? track.cover
                  : `/photos/306-lullo/${cover}.jpg`;

                return (
                  <li key={track.id}>
                    <button
                      type="button"
                      className="finder__item"
                      onClick={() => handleSelectTrack(track.id)}
                    >
                      <img
                        src={coverSrc}
                        alt=""
                        className="finder__art"
                        width={38}
                        height={38}
                        loading="lazy"
                      />
                      <div className="finder__item-meta">
                        <span className="finder__item-title">{track.title}</span>
                        <span className="finder__item-sub">
                          {artist} · {album?.title || 'Single'}
                          {track.youtubeId && <span className="finder__yt-tag">YouTube</span>}
                        </span>
                      </div>
                      <span className="finder__dur">{formatDuration(track.dur)}</span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        </div>

        <div className="finder__foot">
          <span>Navigate with arrows, Enter to play, Esc to close</span>
          <kbd className="side__kbd">ESC</kbd>
        </div>
      </div>
    </div>
  );
};

export default Finder;
