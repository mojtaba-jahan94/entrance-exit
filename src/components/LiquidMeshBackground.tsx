import React, { useState, useEffect } from 'react';
import { useVisualEffects } from '../utils/uiSettings';

/**
 * Static noise tile (pre-rasterized via data URI)
 * Replaces live GPU/CPU heavy <feTurbulence> SVG filter.
 */
const STATIC_NOISE_BG =
  "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)' opacity='0.06'/%3E%3C/svg%3E\")";

/**
 * Optimized Ambient Fluid Mesh Background Engine:
 * - 3 lightweight blobs with reduced blur (65-75px instead of 110-140px)
 * - Auto-pauses on document.hidden
 * - Disabled animations & noise in 'low' effects mode
 * - Clean transform & opacity only transitions
 */
export const LiquidMeshBackground: React.FC = () => {
  const effectsMode = useVisualEffects();
  const isLowEffects = effectsMode === 'low';

  const [isTabHidden, setIsTabHidden] = useState<boolean>(() =>
    typeof document !== 'undefined' ? document.hidden : false
  );

  useEffect(() => {
    const handleVisibility = () => {
      setIsTabHidden(document.hidden);
    };
    document.addEventListener('visibilitychange', handleVisibility);
    return () => document.removeEventListener('visibilitychange', handleVisibility);
  }, []);

  const shouldAnimate = !isLowEffects && !isTabHidden;
  const animPlayState = shouldAnimate ? 'running' : 'paused';

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 -z-10 overflow-hidden bg-[var(--bg)] select-none transition-colors duration-300"
    >
      {/* Deep Canvas Ambient Vignette */}
      <div className="absolute inset-0 bg-radial from-[var(--surface-2)] via-transparent to-transparent opacity-60" />

      {/* Blob 1: Top-Left Subtle Fjord Gray (#6B7280) */}
      <div
        className="absolute -top-[10%] -left-[10%] h-[520px] w-[520px] rounded-full mix-blend-plus-lighter filter transition-opacity duration-500"
        style={{
          background:
            'radial-gradient(circle, rgba(107, 114, 128, 0.14) 0%, rgba(107, 114, 128, 0.06) 45%, transparent 70%)',
          filter: 'blur(70px)',
          opacity: isLowEffects ? 0.2 : 0.55,
          animation: isLowEffects ? 'none' : 'liquid-blob-1 26s cubic-bezier(0.4, 0, 0.2, 1) infinite',
          animationPlayState: animPlayState,
        }}
      />

      {/* Blob 2: Center-Right Gentle Warm Wood (#A68A64) */}
      <div
        className="absolute top-[20%] -right-[12%] h-[580px] w-[580px] rounded-full mix-blend-plus-lighter filter transition-opacity duration-500"
        style={{
          background:
            'radial-gradient(circle, rgba(166, 138, 100, 0.12) 0%, rgba(166, 138, 100, 0.05) 50%, transparent 70%)',
          filter: 'blur(75px)',
          opacity: isLowEffects ? 0.2 : 0.5,
          animation: isLowEffects ? 'none' : 'liquid-blob-2 30s cubic-bezier(0.4, 0, 0.2, 1) infinite',
          animationPlayState: animPlayState,
        }}
      />

      {/* Blob 3: Bottom-Center Soft Cloud Gray (#D1D5DB) */}
      <div
        className="absolute -bottom-[12%] left-[25%] h-[480px] w-[480px] rounded-full mix-blend-plus-lighter filter transition-opacity duration-500"
        style={{
          background:
            'radial-gradient(circle, rgba(209, 213, 219, 0.09) 0%, rgba(209, 213, 219, 0.03) 48%, transparent 70%)',
          filter: 'blur(65px)',
          opacity: isLowEffects ? 0.15 : 0.45,
          animation: isLowEffects ? 'none' : 'liquid-blob-1 22s cubic-bezier(0.4, 0, 0.2, 1) infinite',
          animationPlayState: animPlayState,
        }}
      />

      {/* Static Noise Overlay (replaces live feTurbulence filter; hidden in low effects mode) */}
      {!isLowEffects && (
        <div
          aria-hidden="true"
          className="absolute inset-0 h-full w-full opacity-20 mix-blend-overlay pointer-events-none"
          style={{
            backgroundImage: STATIC_NOISE_BG,
            backgroundRepeat: 'repeat',
          }}
        />
      )}
    </div>
  );
};

export default LiquidMeshBackground;
