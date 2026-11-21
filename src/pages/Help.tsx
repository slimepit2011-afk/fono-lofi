import React from 'react';
import { Icon } from '../ui/icons';

export const Help: React.FC = () => {
  const faqs = [
    {
      q: 'How do I connect YouTube and watch videos?',
      a: 'You can paste any YouTube video link or playlist link directly into the Search box (press ⌘K or click Search & Import in the sidebar), or use the "Import YouTube" button inside any playlist. When a YouTube song is playing, click the "Video" button on the dock or "Watch Video" on the stage to open the synchronized cinema video player!'
    },
    {
      q: 'How do I connect Spotify and access my playlists?',
      a: 'You have two options: (1) Paste any Spotify track, album, or playlist URL directly into ⌘K or the Spotify Resolver in Settings—it instantly fetches all tracks and audio previews with zero login needed! (2) Or connect via Spotify OAuth in Settings to access private and collaborative playlists.'
    },
    {
      q: 'How does the vinyl record animation work?',
      a: 'FONO lofi features physics-driven GSAP animation. When you press play, the tonearm lifts and smoothly swings onto the outer groove of the record with spring physics while the turntable disc accelerates to 33 RPM. Pausing decelerates the disc realistically and swings the tonearm back to its cradle.'
    },
    {
      q: 'Can I add custom songs from YouTube to my own playlists?',
      a: 'Yes! Open any playlist (or create a new one with the + button) and click "Import YouTube". Paste any video link and it will be permanently added to your playlist.'
    }
  ];

  const shortcuts = [
    { key: 'Space', desc: 'Play / Pause audio & vinyl' },
    { key: '⌘ + K', desc: 'Search & Import any YouTube / Spotify link' },
    { key: '→ / ←', desc: 'Next / Previous track' },
    { key: 'M', desc: 'Mute / Unmute audio' },
    { key: 'L', desc: 'Toggle Love on current song' },
    { key: 'Esc', desc: 'Close open dialogs or video modal' }
  ];

  return (
    <div className="page help">
      {/* Page Header */}
      <header className="pagehead">
        <div className="pagehead__title">
          <h1>Help & shortcuts</h1>
        </div>
        <p className="pagehead__sub">
          Answers, quick keyboard shortcuts, and listening guidance
        </p>
      </header>

      <div className="setgrid">
        {/* FAQ Section */}
        <section className="card p-6" style={{ padding: '24px' }}>
          <h2 style={{ fontSize: 'var(--fs-xl)', fontWeight: 700, marginBottom: '16px' }}>
            Frequently asked questions
          </h2>
          <div className="faq">
            {faqs.map((faq, idx) => (
              <details key={idx} open={idx === 0}>
                <summary>
                  <span>{faq.q}</span>
                  <Icon name="chevD" />
                </summary>
                <p>{faq.a}</p>
              </details>
            ))}
          </div>
        </section>

        {/* Shortcuts */}
        <section className="card p-6" style={{ padding: '24px' }}>
          <h2 style={{ fontSize: 'var(--fs-xl)', fontWeight: 700, marginBottom: '16px' }}>
            Keyboard shortcuts
          </h2>
          <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {shortcuts.map((sc, i) => (
              <li
                key={i}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '10px 0',
                  borderBottom: i < shortcuts.length - 1 ? '1px solid var(--line)' : 'none'
                }}
              >
                <span style={{ fontSize: 'var(--fs-md)', color: 'var(--ink)' }}>{sc.desc}</span>
                <kbd
                  style={{
                    background: 'var(--card-2)',
                    border: '1px solid var(--line-2)',
                    borderRadius: '8px',
                    padding: '4px 10px',
                    fontSize: 'var(--fs-xs)',
                    fontWeight: 700,
                    fontFamily: 'inherit',
                    color: 'var(--muted)'
                  }}
                >
                  {sc.key}
                </kbd>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  );
};

export default Help;
