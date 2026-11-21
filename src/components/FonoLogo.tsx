import React from 'react';

interface FonoLogoProps {
  size?: number;
  className?: string;
  variant?: 'badge' | 'minimal' | 'flat';
}

export const FonoLogo: React.FC<FonoLogoProps> = ({
  size = 40,
  className = '',
  variant = 'badge'
}) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`fono-logo ${className}`}
      style={{ display: 'block', flexShrink: 0 }}
      aria-label="FONO lofi Logo"
    >
      <defs>
        {/* Deep vinyl record body gradient */}
        <radialGradient id="fono_vinyl_bg" cx="45%" cy="40%" r="60%">
          <stop offset="0%" stopColor="#2c211a" />
          <stop offset="65%" stopColor="#1a130f" />
          <stop offset="90%" stopColor="#261c16" />
          <stop offset="100%" stopColor="#0f0b09" />
        </radialGradient>

        {/* Radiant coral/terracotta spindle glow */}
        <linearGradient id="fono_coral_grad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#ff9566" />
          <stop offset="50%" stopColor="#f06436" />
          <stop offset="100%" stopColor="#d44215" />
        </linearGradient>

        {/* Gold ruby tonearm stylus jewel */}
        <linearGradient id="fono_gold_needle" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#fff9f0" />
          <stop offset="60%" stopColor="#fed085" />
          <stop offset="100%" stopColor="#df9430" />
        </linearGradient>

        {/* Tactile hardware drop shadow */}
        <filter id="fono_badge_shadow" x="-10%" y="-10%" width="125%" height="125%">
          <feDropShadow dx="0" dy="3" stdDeviation="4" floodColor="#140d09" floodOpacity="0.32" />
        </filter>
      </defs>

      {/* Hardware Badge Container (squircle vinyl chassis) */}
      <rect
        width="64"
        height="64"
        rx="18"
        fill="url(#fono_vinyl_bg)"
        filter="url(#fono_badge_shadow)"
      />
      {/* Subtle chamfered rim highlight */}
      <rect
        x="1"
        y="1"
        width="62"
        height="62"
        rx="17"
        stroke="rgba(255, 255, 255, 0.12)"
        strokeWidth="1.5"
        fill="none"
      />

      {/* Lathe-Cut Vinyl Grooves */}
      <circle cx="32" cy="32" r="23" stroke="rgba(255, 255, 255, 0.05)" strokeWidth="1" fill="none" />
      <circle cx="32" cy="32" r="18" stroke="rgba(255, 255, 255, 0.07)" strokeWidth="1" fill="none" />
      <circle cx="32" cy="32" r="13" stroke="rgba(255, 255, 255, 0.04)" strokeWidth="1" fill="none" />

      {/* Center 45-RPM Record Core (Terracotta Coral) */}
      <circle cx="32" cy="32" r="10" fill="url(#fono_coral_grad)" />
      <circle cx="32" cy="32" r="8.8" stroke="rgba(255, 255, 255, 0.22)" strokeWidth="0.8" fill="none" />

      {/* Master Sculpted Ivory Monogram "F" / Acoustic Tonearm */}
      {/* Vertical Tonearm Stem */}
      <path
        d="M22 15 C22 13.3 23.3 12 25 12 C26.7 12 28 13.3 28 15 V45 C28 46.7 26.7 48 25 48 C23.3 48 22 46.7 22 45 V15 Z"
        fill="#fffcf7"
      />
      {/* Top Acoustic Bar */}
      <path
        d="M25 12 H40 C42.2 12 44 13.8 44 16 C44 18.2 42.2 20 40 20 H25 V12 Z"
        fill="#fffcf7"
      />
      {/* Mid Acoustic Bar */}
      <path
        d="M25 25 H36 C38 25 39.5 26.5 39.5 28.5 C39.5 30.5 38 32 36 32 H25 V25 Z"
        fill="#fffcf7"
      />

      {/* Turntable Spindle Center Hole */}
      <circle cx="32" cy="32" r="2.8" fill="#140d09" />
      <circle cx="32" cy="32" r="1.2" fill="#fffcf7" opacity="0.9" />

      {/* Glowing Gold Stylus Ruby Needletip */}
      <circle cx="41.5" cy="16" r="2.5" fill="url(#fono_gold_needle)" stroke="#1a130f" strokeWidth="0.5" />
      <circle cx="37" cy="28.5" r="1.8" fill="url(#fono_coral_grad)" stroke="#fff" strokeWidth="0.6" />
    </svg>
  );
};
