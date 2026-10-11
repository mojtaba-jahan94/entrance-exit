import React, { useState, useRef, ReactNode, PointerEvent } from 'react';

export interface LiquidGlassCardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  className?: string;
  interactive?: boolean;
  glowColor?: string; // Optional custom sheen color
  sheenColor?: string; // Alias for glowColor
  variant?: 'primary' | 'subtle' | 'modal';
  as?: React.ElementType;
}

/**
 * Pillars 2 & 3: Physical Specular & Refractive Liquid Glass Card
 * Features:
 * - Backdrop diffusion: blur(28px) saturate(210%) contrast(108%)
 * - Surface translucency with linear gradient
 * - Edge specular highlight & prismatic reflections
 * - Mouse-Tracking Liquid Sheen (Interactive Micro-Refraction)
 * - Spring-like cubic-bezier hover lift
 */
export const LiquidGlassCard: React.FC<LiquidGlassCardProps> = ({
  children,
  className = '',
  interactive = true,
  glowColor = 'rgba(255, 255, 255, 0.16)',
  sheenColor,
  variant = 'primary',
  as: Component = 'div',
  onPointerMove,
  onPointerLeave,
  ...props
}) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const [coords, setCoords] = useState<{ x: number; y: number } | null>(null);
  const [isHovered, setIsHovered] = useState<boolean>(false);

  const handlePointerMove = (e: PointerEvent<HTMLDivElement>) => {
    if (!interactive) return;
    const rect = e.currentTarget.getBoundingClientRect();
    setCoords({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    });
    setIsHovered(true);
    if (onPointerMove) onPointerMove(e);
  };

  const handlePointerLeave = (e: PointerEvent<HTMLDivElement>) => {
    if (!interactive) return;
    setIsHovered(false);
    setCoords(null);
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
      className={`relative overflow-hidden transition-all duration-300 ${variantClass} ${
        interactive ? 'hover:-translate-y-0.5 hover:scale-[1.006] transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]' : ''
      } ${className}`}
      {...props}
    >
      {/* Top Edge Specular Reflection (Physical Glass Rim) */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 h-[1.5px] bg-gradient-to-r from-transparent via-white/50 to-transparent opacity-90 z-20"
      />

      {/* Mouse-Tracking Liquid Sheen Overlay */}
      {interactive && coords && (
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 z-10 rounded-[inherit] transition-opacity duration-300"
          style={{
            opacity: isHovered ? 1 : 0,
            background: `radial-gradient(380px circle at ${coords.x}px ${coords.y}px, ${sheenColor || glowColor}, transparent 75%)`,
          }}
        />
      )}

      {/* Card Content */}
      <div className="relative z-10">{children}</div>
    </Component>
  );
};

export default LiquidGlassCard;
