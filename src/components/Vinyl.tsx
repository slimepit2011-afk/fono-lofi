import React, { useLayoutEffect, useRef } from 'react';
import gsap from 'gsap';

export interface VinylProps {
  size?: number;
  cover?: string;
  isPlaying: boolean;
  skin?: 'obsidian' | 'latte' | 'matcha' | 'neon';
}

export const Vinyl: React.FC<VinylProps> = ({ size = 276, cover = 'pour', isPlaying, skin = 'obsidian' }) => {
  const discRef = useRef<HTMLDivElement>(null);
  const armRef = useRef<HTMLDivElement>(null);
  const tweenRef = useRef<gsap.core.Tween | null>(null);

  // Initialize infinite spinning tween
  useLayoutEffect(() => {
    if (discRef.current) {
      tweenRef.current = gsap.to(discRef.current, {
        rotation: '+=360',
        duration: 2.4,
        ease: 'none',
        repeat: -1,
        paused: true
      });
      tweenRef.current.timeScale(0);
      return () => {
        tweenRef.current?.kill();
      };
    }
  }, []);

  // Animate disc spin up/down and tonearm rotation
  useLayoutEffect(() => {
    const tween = tweenRef.current;
    if (tween && armRef.current) {
      if (isPlaying) {
        tween.play();
        gsap.to(tween, {
          timeScale: 1,
          duration: 1.4,
          ease: 'power2.in',
          overwrite: true
        });
      } else {
        gsap.to(tween, {
          timeScale: 0,
          duration: 1.6,
          ease: 'power2.out',
          overwrite: true,
          onComplete: () => {
            tween.pause();
          }
        });
      }

      // Tonearm swings 24 deg when playing, 0 deg when resting
      gsap.to(armRef.current, {
        rotation: isPlaying ? 24 : 0,
        duration: isPlaying ? 0.9 : 0.7,
        ease: isPlaying ? 'back.out(1.4)' : 'power3.inOut',
        overwrite: true
      });
    }
  }, [isPlaying]);

  // Handle direct image URLs vs cover slugs
  const coverSrc = cover && (cover.startsWith('http') || cover.startsWith('/'))
    ? cover
    : `/photos/306-lullo/${cover || 'pour'}.jpg`;

  return (
    <div className={`vinyl vinyl--${skin}`} style={{ '--s': `${size}px` } as React.CSSProperties}>
      <div className="vinyl__disc" ref={discRef}>
        <span className="vinyl__grooves" aria-hidden="true" />
        <img
          className="vinyl__label"
          src={coverSrc}
          alt=""
          width={Math.round(size * 0.42)}
          height={Math.round(size * 0.42)}
          decoding="async"
        />
        <span className="vinyl__hole" aria-hidden="true" />
      </div>
      <div className="vinyl__arm" ref={armRef} aria-hidden="true">
        <i className="vinyl__pivot" />
        <i className="vinyl__rod" />
        <i className="vinyl__head" />
      </div>
    </div>
  );
};

export default Vinyl;
