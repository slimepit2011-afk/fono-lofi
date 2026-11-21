import React from 'react';

interface GuestAvatarProps {
  size?: number;
  className?: string;
}

export const GuestAvatar: React.FC<GuestAvatarProps> = ({
  size = 76,
  className = ''
}) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 80 80"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`guest-avatar ${className}`}
      style={{ display: 'block', borderRadius: '50%' }}
    >
      <defs>
        <radialGradient id="guest_bg" cx="50%" cy="35%" r="65%">
          <stop offset="0%" stopColor="#faecd8" />
          <stop offset="60%" stopColor="#f3d7ba" />
          <stop offset="100%" stopColor="#e8c29e" />
        </radialGradient>
        <linearGradient id="guest_headband" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#e5633b" />
          <stop offset="100%" stopColor="#f0885f" />
        </linearGradient>
      </defs>

      {/* Warm Peach/Clay Circular Base */}
      <circle cx="40" cy="40" r="40" fill="url(#guest_bg)" />

      {/* Acoustic Vinyl Disc Halo */}
      <circle cx="40" cy="40" r="34" stroke="rgba(240, 100, 54, 0.15)" strokeWidth="1" strokeDasharray="3 3" />
      <circle cx="40" cy="40" r="30" stroke="rgba(61, 43, 31, 0.08)" strokeWidth="0.75" />

      {/* Cozy Listener Head & Shoulders Silhouette */}
      {/* Shoulders */}
      <path
        d="M20 72 C20 58 28 53 40 53 C52 53 60 58 60 72 Z"
        fill="#3d2b1f"
      />
      {/* Head */}
      <circle cx="40" cy="38" r="14" fill="#3d2b1f" />

      {/* Hi-Fi Over-Ear Headphones */}
      {/* Headband Arc */}
      <path
        d="M23 38 C23 27 30 20 40 20 C50 20 57 27 57 38"
        stroke="url(#guest_headband)"
        strokeWidth="3.5"
        strokeLinecap="round"
        fill="none"
      />
      {/* Left Ear Cushion */}
      <rect x="20" y="32" width="6" height="13" rx="3" fill="#fffcf7" stroke="#e5633b" strokeWidth="1.5" />
      {/* Right Ear Cushion */}
      <rect x="54" y="32" width="6" height="13" rx="3" fill="#fffcf7" stroke="#e5633b" strokeWidth="1.5" />

      {/* Spindle Spool Center Accent */}
      <circle cx="40" cy="38" r="2.5" fill="#f0885f" />
    </svg>
  );
};
