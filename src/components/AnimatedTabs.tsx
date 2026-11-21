import React, { useRef, useLayoutEffect, useState } from 'react';
import { tactile } from '../services/tactileFeedback';

export interface TabItem {
  id: string;
  label: string;
  badge?: string | number;
}

export interface AnimatedTabsProps {
  tabs: TabItem[];
  activeId: string;
  onChange: (id: string) => void;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export const AnimatedTabs: React.FC<AnimatedTabsProps> = ({
  tabs,
  activeId,
  onChange,
  className = '',
  size = 'md'
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [lineStyle, setLineStyle] = useState<{ left: number; width: number; opacity: number }>({
    left: 0,
    width: 0,
    opacity: 0
  });

  const updateLine = () => {
    if (!containerRef.current) return;
    const activeEl = containerRef.current.querySelector<HTMLButtonElement>(`[data-tab-id="${activeId}"]`);
    if (activeEl) {
      setLineStyle({
        left: activeEl.offsetLeft,
        width: activeEl.offsetWidth,
        opacity: 1
      });
    }
  };

  useLayoutEffect(() => {
    updateLine();
    window.addEventListener('resize', updateLine);
    return () => window.removeEventListener('resize', updateLine);
  }, [activeId, tabs]);

  const handleTabClick = (id: string) => {
    tactile.click('tab');
    onChange(id);
  };

  return (
    <div
      ref={containerRef}
      className={`animated-tabs animated-tabs--${size} ${className}`}
      role="tablist"
    >
      {tabs.map(t => {
        const isActive = t.id === activeId;
        return (
          <button
            key={t.id}
            type="button"
            role="tab"
            aria-selected={isActive}
            data-tab-id={t.id}
            className={`animated-tabs__tab ${isActive ? 'is-active' : ''}`}
            onClick={() => handleTabClick(t.id)}
          >
            <span>{t.label}</span>
            {t.badge !== undefined && (
              <span className="animated-tabs__badge">{t.badge}</span>
            )}
          </button>
        );
      })}
      <span
        className="animated-tabs__line"
        style={{
          transform: `translateX(${lineStyle.left}px)`,
          width: `${lineStyle.width}px`,
          opacity: lineStyle.opacity
        }}
        aria-hidden="true"
      />
    </div>
  );
};
