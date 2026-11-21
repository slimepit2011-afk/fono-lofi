import React, { useLayoutEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import { formatMinutes } from '../ui/format';

export interface CircularGoalProps {
  value: number; // 0 to 1+
  size?: number;
  stroke?: number;
  label?: string;
  children?: React.ReactNode;
}

export const CircularGoal: React.FC<CircularGoalProps> = ({
  value,
  size = 54,
  stroke = 6,
  label,
  children
}) => {
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const clamped = Math.max(0, Math.min(1, value));
  const offset = circ - clamped * circ;

  return (
    <div
      className="donut"
      style={{ width: size, height: size, position: 'relative', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}
      role="progressbar"
      aria-valuenow={Math.round(value * 100)}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={label}
    >
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)', position: 'absolute', inset: 0 }}>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="var(--solid-2)"
          strokeWidth={stroke}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="var(--accent)"
          strokeWidth={stroke}
          strokeDasharray={circ}
          strokeDashoffset={offset}
          strokeLinecap="round"
          style={{ transition: 'stroke-dashoffset 0.8s cubic-bezier(0.22, 1, 0.36, 1)' }}
        />
      </svg>
      {children}
    </div>
  );
};

export interface BarData {
  key: string;
  label: string;
  sub: string;
  v: number; // minutes
  hi?: boolean;
}

export interface WeekBarsProps {
  bars: BarData[];
  goal: number;
  label: string;
}

export const WeekBars: React.FC<WeekBarsProps> = ({ bars, goal, label }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  const maxVal = Math.max(goal || 0, ...bars.map(b => b.v)) || 1;
  const step = maxVal > 600 ? 300 : maxVal > 240 ? 120 : maxVal > 120 ? 60 : 30;
  const ceiling = Math.ceil(maxVal / step) * step;
  const gridSteps = Array.from({ length: Math.floor(ceiling / step) + 1 }, (_, i) => ceiling - i * step);

  useLayoutEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    gsap.fromTo(
      el.querySelectorAll('.wbars__bar'),
      { scaleY: 0 },
      {
        scaleY: 1,
        duration: 1,
        ease: 'elastic.out(1, 0.75)',
        stagger: 0.06,
        delay: 0.15,
        clearProps: 'transform'
      }
    );

    gsap.fromTo(
      el.querySelectorAll('.wbars__goal'),
      { scaleX: 0 },
      {
        scaleX: 1,
        duration: 0.9,
        ease: 'expo.out',
        delay: 0.5,
        clearProps: 'transform'
      }
    );
  }, [bars.map(b => b.v).join(',')]);

  const activeBar = hoveredIndex !== null ? bars[hoveredIndex] : null;

  return (
    <div className="wbars" ref={containerRef} role="group" aria-label={label}>
      <div className="wbars__grid" aria-hidden="true">
        {gridSteps.map(stepVal => (
          <div key={stepVal}>
            <span>{stepVal ? formatMinutes(stepVal) : '0'}</span>
          </div>
        ))}
      </div>

      {goal !== undefined && goal <= ceiling && (
        <div
          className="wbars__goal"
          style={{ bottom: `calc(28px + (100% - 28px) * ${goal / ceiling})` }}
          aria-hidden="true"
        >
          <span>Goal {formatMinutes(goal)}</span>
        </div>
      )}

      <div className="wbars__cols" onPointerLeave={() => setHoveredIndex(null)}>
        {bars.map((bar, idx) => (
          <button
            key={bar.key}
            type="button"
            className={`wbars__col${bar.hi ? ' is-hi' : ''}`}
            style={{ '--c': `var(--b${idx % 7})` } as React.CSSProperties}
            aria-label={`${bar.sub}: ${formatMinutes(bar.v)}`}
            onPointerEnter={() => setHoveredIndex(idx)}
            onFocus={() => setHoveredIndex(idx)}
            onBlur={() => setHoveredIndex(null)}
          >
            <span className="wbars__track">
              <i
                className="wbars__bar"
                style={{ height: `${Math.max(1.5, (bar.v / ceiling) * 100)}%` }}
              />
            </span>
            <small>{bar.label}</small>
          </button>
        ))}
      </div>

      {activeBar && (
        <div className="wbars__pop" role="status" aria-live="polite">
          <b>{formatMinutes(activeBar.v)}</b>
          <span>{activeBar.sub}</span>
        </div>
      )}
    </div>
  );
};
