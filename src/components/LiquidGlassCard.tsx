import React, { useState, useEffect, useRef, ReactNode, PointerEvent } from 'react';
import { useVisualEffects } from '../utils/uiSettings';

export interface LiquidGlassCardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  className?: string;
  interactive?: boolean;
  glowColor?: string; // Optional custom sheen color
  sheenColor?: string; // Alias for glowColor
  variant?: 'primary' | 'subtle' | 'modal';
  as?: React.ElementType;
}

function checkCanHoverFine(): boolean {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(hover: hover) and (pointer: fine)').matches;
}

/**
 * High-Performance Liquid Glass Card:
 * - Specular reflection rim
 * - Zero React re-renders on mouse move (updates CSS variables via requestAnimationFrame)
 * - Only enabled on desktop fine pointer devices ((hover: hover) and (pointer: fine))
 * - Disabled completely on mobile / touch or in 'low' effects mode
 */
export const LiquidGlassCard: React.FC<LiquidGlassCardProps> = ({
  children,
  className = '',
  interactive = true,
  glowColor = 'rgba(166, 138, 100, 0.12)',
  sheenColor,
  variant = 'primary',
  as: Component = 'div',
  onPointerMove,
  onPointerLeave,
  style,
  ...props
}) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const rafId = useRef<number | null>(null);
  const effectsMode = useVisualEffects();
  const isLowEffects = effectsMode === 'low';

  const [hasFinePointer, setHasFinePointer] = useState<boolean>(() => checkCanHoverFine());

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const mediaQuery = window.matchMedia('(hover: hover) and (pointer: fine)');
    const handlePointerChange = (e: MediaQueryListEvent) => {
      setHasFinePointer(e.matches);
    };

    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', handlePointerChange);
    } else if ((mediaQuery as any).addListener) {
      (mediaQuery as any).addListener(handlePointerChange);
    }

    return () => {
      if (mediaQuery.removeEventListener) {
        mediaQuery.removeEventListener('change', handlePointerChange);
      } else if ((mediaQuery as any).removeListener) {
        (mediaQuery as any).removeListener(handlePointerChange);
      }
    };
  }, []);

  const isSheenActive = interactive && hasFinePointer && !isLowEffects;

  const handlePointerMove = (e: PointerEvent<HTMLDivElement>) => {
    if (isSheenActive) {
      const target = e.currentTarget;
      const clientX = e.clientX;
      const clientY = e.clientY;

      if (rafId.current) {
        cancelAnimationFrame(rafId.current);
      }

      rafId.current = requestAnimationFrame(() => {
        if (!cardRef.current) return;
        const rect = target.getBoundingClientRect();
        const x = clientX - rect.left;
        const y = clientY - rect.top;
        cardRef.current.style.setProperty('--sheen-x', `${x}px`);
        cardRef.current.style.setProperty('--sheen-y', `${y}px`);
        cardRef.current.style.setProperty('--sheen-opacity', '1');
      });
    }

    if (onPointerMove) onPointerMove(e);
  };

  const handlePointerLeave = (e: PointerEvent<HTMLDivElement>) => {
    if (isSheenActive) {
      if (rafId.current) {
        cancelAnimationFrame(rafId.current);
      }
      if (cardRef.current) {
        cardRef.current.style.setProperty('--sheen-opacity', '0');
      }
    }

    if (onPointerLeave) onPointerLeave(e);
  };

  const variantClass =
    variant === 'modal'
      ? 'liquid-glass-modal'
      : variant === 'subtle'
      ? 'liquid-glass-subtle'
      : 'liquid-glass';

  return (
    <Component
      ref={cardRef}
      onPointerMove={handlePointerMove}
      onPointerLeave={handlePointerLeave}
      style={style}
      className={`relative overflow-hidden transition-all duration-300 ${variantClass} ${
        interactive
          ? 'hover:-translate-y-0.5 hover:scale-[1.006] transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]'
          : ''
      } ${className}`}
      {...props}
    >
      {/* Top Edge Specular Reflection (Physical Glass Rim) */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 h-[1.5px] bg-gradient-to-r from-transparent via-[var(--border-strong)]/40 to-transparent opacity-80 z-20"
      />

      {/* Mouse-Tracking Liquid Sheen Overlay (Only rendered for fine pointer desktop devices, driven by CSS vars) */}
      {isSheenActive && (
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 z-10 rounded-[inherit] transition-opacity duration-300"
          style={{
            opacity: 'var(--sheen-opacity, 0)',
            background: `radial-gradient(380px circle at var(--sheen-x, -999px) var(--sheen-y, -999px), ${
              sheenColor || glowColor
            }, transparent 75%)`,
          }}
        />
      )}

      {/* Card Content */}
      <div className="relative z-10">{children}</div>
    </Component>
  );
};

export default LiquidGlassCard;
