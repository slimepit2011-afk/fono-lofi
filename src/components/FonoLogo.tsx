import React from 'react';

export interface FonoLogoProps {
  size?: number;
  className?: string;
  variant?: 'badge' | 'mark' | 'transparent';
  alt?: string;
}

export const FonoLogo: React.FC<FonoLogoProps> = ({
  size = 40,
  className = '',
  variant = 'badge',
  alt = 'FONO lofi Logo'
}) => {
  const imgSrc = variant === 'transparent' || variant === 'mark'
    ? '/fono-logo-mark.png'
    : '/fono-logo-badge.png';

  return (
    <img
      src={imgSrc}
      alt={alt}
      width={size}
      height={size}
      className={`fono-logo fono-logo--${variant} ${className}`}
      style={{
        display: 'inline-block',
        verticalAlign: 'middle',
        flexShrink: 0,
        width: `${size}px`,
        height: `${size}px`,
        objectFit: 'contain',
        transition: 'transform 0.2s cubic-bezier(0.16, 1, 0.3, 1)'
      }}
      loading="eager"
    />
  );
};

export default FonoLogo;
