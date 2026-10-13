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
      className="pointer-events-none fixed inset-0 -z-10 overflow-hidden bg-[#07080f] select-none"
    >
      {/* Deep Canvas Gradient */}
      <div className="absolute inset-0 bg-radial from-[#12162a]/60 via-[#0a0d18] to-[#07080f]" />

      {/* Blob 1: Top-Left Electric Indigo / Violet */}
      <div
        className="absolute -top-[10%] -left-[10%] h-[520px] w-[520px] rounded-full mix-blend-screen filter transition-opacity duration-500"
        style={{
          background:
            'radial-gradient(circle, rgba(99, 102, 241, 0.42) 0%, rgba(129, 140, 248, 0.2) 45%, transparent 70%)',
          filter: 'blur(70px)',
          opacity: isLowEffects ? 0.35 : 0.65,
          animation: isLowEffects ? 'none' : 'liquid-blob-1 22s cubic-bezier(0.4, 0, 0.2, 1) infinite',
          animationPlayState: animPlayState,
        }}
      />

      {/* Blob 2: Center-Right Cyan / Sky Blue */}
      <div
        className="absolute top-[20%] -right-[12%] h-[580px] w-[580px] rounded-full mix-blend-screen filter transition-opacity duration-500"
        style={{
          background:
            'radial-gradient(circle, rgba(6, 182, 212, 0.36) 0%, rgba(56, 189, 248, 0.18) 50%, transparent 70%)',
          filter: 'blur(75px)',
          opacity: isLowEffects ? 0.3 : 0.6,
          animation: isLowEffects ? 'none' : 'liquid-blob-2 26s cubic-bezier(0.4, 0, 0.2, 1) infinite',
          animationPlayState: animPlayState,
        }}
      />

      {/* Blob 3: Bottom-Center Fuchsia / Magenta */}
      <div
        className="absolute -bottom-[12%] left-[25%] h-[480px] w-[480px] rounded-full mix-blend-screen filter transition-opacity duration-500"
        style={{
          background:
            'radial-gradient(circle, rgba(236, 72, 153, 0.32) 0%, rgba(217, 70, 239, 0.16) 48%, transparent 70%)',
          filter: 'blur(65px)',
          opacity: isLowEffects ? 0.25 : 0.55,
          animation: isLowEffects ? 'none' : 'liquid-blob-3 20s cubic-bezier(0.4, 0, 0.2, 1) infinite',
          animationPlayState: animPlayState,
        }}
      />

      {/* Static Noise Overlay (replaces live feTurbulence filter; hidden in low effects mode) */}
      {!isLowEffects && (
        <div
          aria-hidden="true"
          className="absolute inset-0 h-full w-full opacity-40 mix-blend-overlay pointer-events-none"
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
