import React, { useState } from 'react';
import { formatMinutes } from '../ui/format';
import { tactile } from '../services/tactileFeedback';

// 1. Nine-Week Spline Curve Chart
export interface NineWeeksDataPoint {
  date: string;
  minutes: number;
  songs: number;
}

export interface NineWeeksChartProps {
  data: NineWeeksDataPoint[];
}

export const NineWeeksChart: React.FC<NineWeeksChartProps> = ({ data }) => {
  const [metric, setMetric] = useState<'minutes' | 'songs'>('minutes');
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  const values = data.map(d => metric === 'minutes' ? d.minutes : d.songs);
  const maxVal = Math.max(...values, metric === 'minutes' ? 120 : 15);
  const ceiling = Math.ceil(maxVal * 1.15);

  // SVG Coordinates
  const width = 540;
  const height = 180;
  const paddingX = 40;
  const paddingY = 25;
  const graphW = width - paddingX * 2;
  const graphH = height - paddingY * 2;

  const points = data.map((d, i) => {
    const val = metric === 'minutes' ? d.minutes : d.songs;
    const x = paddingX + (i / (data.length - 1)) * graphW;
    const y = height - paddingY - (val / ceiling) * graphH;
    return { x, y, val, date: d.date };
  });

  // Generate smooth cubic Bezier curve path
  const generateSmoothPath = (pts: { x: number; y: number }[]) => {
    if (pts.length < 2) return '';
    let d = `M ${pts[0].x} ${pts[0].y}`;
    for (let i = 0; i < pts.length - 1; i++) {
      const p0 = i > 0 ? pts[i - 1] : pts[0];
      const p1 = pts[i];
      const p2 = pts[i + 1];
      const p3 = i < pts.length - 2 ? pts[i + 2] : p2;

      const cp1x = p1.x + (p2.x - p0.x) / 6;
      const cp1y = p1.y + (p2.y - p0.y) / 6;
      const cp2x = p2.x - (p3.x - p1.x) / 6;
      const cp2y = p2.y - (p3.y - p1.y) / 6;

      d += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${p2.x} ${p2.y}`;
    }
    return d;
  };

  const linePath = generateSmoothPath(points);
  const areaPath = linePath
    ? `${linePath} L ${points[points.length - 1].x} ${height - paddingY} L ${points[0].x} ${height - paddingY} Z`
    : '';

  return (
    <div className="card nineweeks-card">
      <div className="nineweeks-card__head">
        <div>
          <h3 className="title title--sm">Nine weeks</h3>
          <p className="text-xs muted-ink">
            {metric === 'minutes' ? 'Minutes listened each week' : 'Songs played each week'}
          </p>
        </div>
        <div className="pill-toggle">
          <button
            type="button"
            className={`pill-toggle__btn ${metric === 'minutes' ? 'is-active' : ''}`}
            onClick={() => {
              tactile.click('switch');
              setMetric('minutes');
            }}
          >
            Minutes
          </button>
          <button
            type="button"
            className={`pill-toggle__btn ${metric === 'songs' ? 'is-active' : ''}`}
            onClick={() => {
              tactile.click('switch');
              setMetric('songs');
            }}
          >
            Songs
          </button>
        </div>
      </div>

      <div className="nineweeks-card__chart" style={{ position: 'relative', width: '100%', height: `${height}px` }}>
        {/* Y Axis Guide labels */}
        <div className="nineweeks-card__y-axis">
          <span>{metric === 'minutes' ? formatMinutes(ceiling) : `${ceiling} plays`}</span>
          <span>{metric === 'minutes' ? formatMinutes(Math.round(ceiling / 2)) : `${Math.round(ceiling / 2)} plays`}</span>
          <span>0</span>
        </div>

        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="nineweeks-svg"
          preserveAspectRatio="none"
          style={{ width: '100%', height: '100%' }}
        >
          <defs>
            <linearGradient id="curveGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--coral)" stopOpacity="0.32" />
              <stop offset="100%" stopColor="var(--coral)" stopOpacity="0.01" />
            </linearGradient>
          </defs>

          {/* Area Fill */}
          <path d={areaPath} fill="url(#curveGradient)" />

          {/* Line Path */}
          <path
            d={linePath}
            fill="none"
            stroke="var(--coral)"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Points */}
          {points.map((p, idx) => (
            <g key={idx} className="cursor-pointer" onMouseEnter={() => setHoveredIdx(idx)} onMouseLeave={() => setHoveredIdx(null)}>
              <circle
                cx={p.x}
                cy={p.y}
                r={hoveredIdx === idx ? 6 : 4}
                fill={hoveredIdx === idx ? 'var(--coral)' : 'var(--card)'}
                stroke="var(--coral)"
                strokeWidth="2.5"
                style={{ transition: 'all 0.15s ease' }}
              />
            </g>
          ))}
        </svg>

        {/* Hover Tooltip */}
        {hoveredIdx !== null && (
          <div
            className="chart-tooltip"
            style={{
              position: 'absolute',
              left: `${(points[hoveredIdx].x / width) * 100}%`,
              top: `${points[hoveredIdx].y - 34}px`,
              transform: 'translateX(-50%)',
              pointerEvents: 'none'
            }}
          >
            <b>{metric === 'minutes' ? formatMinutes(points[hoveredIdx].val) : `${points[hoveredIdx].val} songs`}</b>
            <small>{points[hoveredIdx].date}</small>
          </div>
        )}
      </div>

      {/* X Axis Dates */}
      <div className="nineweeks-card__x-axis">
        {data.filter((_, i) => i % 2 === 0).map((d, i) => (
          <span key={i}>{d.date}</span>
        ))}
      </div>
    </div>
  );
};


// 2. 24-Hour Circular Sunburst Petal Clock
export interface HourClockProps {
  hourlyDistribution: number[]; // 24 numbers (minutes per hour 0..23)
  peakHour?: number;
}

export const HourClock: React.FC<HourClockProps> = ({
  hourlyDistribution,
  peakHour = 8
}) => {
  const [hoveredHour, setHoveredHour] = useState<number | null>(null);

  const maxVal = Math.max(...hourlyDistribution, 1);
  const size = 260;
  const center = size / 2;
  const innerRadius = 46;
  const maxPetalLength = 48;

  // Palette for petal bars around the 24 hours
  const colors = [
    '#FAB08B', '#FBBA52', '#F7B58B', '#E0B4C1', '#B0BF9C', '#6CA090',
    '#9AB4C3', '#FAB08B', '#F4895F', '#FBBA52', '#8FBAB0', '#A6B9C8',
    '#F09064', '#F48C68', '#FBBA52', '#B0BF9C', '#6CA090', '#9AB4C3',
    '#E0B4C1', '#FAB08B', '#F4895F', '#FBBA52', '#8FBAB0', '#B0BF9C'
  ];

  const displayHour = hoveredHour !== null ? hoveredHour : peakHour;
  const displayMin = hourlyDistribution[displayHour] || 0;
  const peakStr = `${String(displayHour).padStart(2, '0')}:00`;

  return (
    <div className="card hclock-card">
      <div className="hclock-card__head">
        <h3 className="title title--sm">When you listen</h3>
        <p className="text-xs muted-ink">Minutes by hour, 30 days</p>
      </div>

      <div className="hclock-wrapper" style={{ position: 'relative', width: `${size}px`, height: `${size}px`, margin: '12px auto' }}>
        {/* Outer 4 hour markers */}
        <span className="hclock-marker hclock-marker--top">00</span>
        <span className="hclock-marker hclock-marker--right">06</span>
        <span className="hclock-marker hclock-marker--bottom">12</span>
        <span className="hclock-marker hclock-marker--left">18</span>

        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
          {/* Inner ring track */}
          <circle
            cx={center}
            cy={center}
            r={innerRadius}
            fill="var(--card)"
            stroke="var(--line-2)"
            strokeWidth="1.5"
            strokeDasharray="3 3"
          />

          {/* 24 Radial Petal Bars */}
          {Array.from({ length: 24 }).map((_, hour) => {
            const angle = (hour / 24) * 360 - 90; // 00 at top
            const rad = (angle * Math.PI) / 180;
            const val = hourlyDistribution[hour] || 0;
            const lengthRatio = val > 0 ? 0.35 + (val / maxVal) * 0.65 : 0.15;
            const petalLen = maxPetalLength * lengthRatio;

            const x1 = center + innerRadius * Math.cos(rad);
            const y1 = center + innerRadius * Math.sin(rad);
            const x2 = center + (innerRadius + petalLen) * Math.cos(rad);
            const y2 = center + (innerRadius + petalLen) * Math.sin(rad);

            const isHovered = hoveredHour === hour;
            const isPeak = hour === peakHour;

            return (
              <line
                key={hour}
                x1={x1}
                y1={y1}
                x2={x2}
                y2={y2}
                stroke={colors[hour % colors.length]}
                strokeWidth={isHovered ? 7 : isPeak ? 6 : 4.5}
                strokeLinecap="round"
                opacity={hoveredHour !== null ? (isHovered ? 1 : 0.45) : (isPeak ? 1 : 0.8)}
                style={{
                  transition: 'all 0.15s ease',
                  cursor: 'pointer'
                }}
                onMouseEnter={() => {
                  tactile.click('tap');
                  setHoveredHour(hour);
                }}
                onMouseLeave={() => setHoveredHour(null)}
              />
            );
          })}
        </svg>

        {/* Center Peak Hour Readout */}
        <div className="hclock-center">
          <span className="hclock-center__time">{peakStr}</span>
          <span className="hclock-center__label">
            {hoveredHour !== null ? `${displayMin}m listened` : 'your peak hour'}
          </span>
        </div>
      </div>
    </div>
  );
};
