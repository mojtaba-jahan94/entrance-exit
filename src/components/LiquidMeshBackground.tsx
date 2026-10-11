import React from 'react';

/**
 * Pillar 1: Dynamic Fluid Mesh Background Engine
 * High-energy, organic ambient light beneath the frosted glass
 * to create authentic refraction, prismatic dispersion, and depth.
 */
export const LiquidMeshBackground: React.FC = () => {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 -z-10 overflow-hidden bg-[#07080f] select-none"
    >
      {/* Deep Canvas Gradient */}
      <div className="absolute inset-0 bg-radial from-[#12162a]/60 via-[#0a0d18] to-[#07080f]" />

      {/* Blob 1: Top-Left Electric Indigo / Violet */}
      <div
        className="absolute -top-[10%] -left-[10%] h-[600px] w-[600px] rounded-full opacity-70 mix-blend-screen filter"
        style={{
          background:
            'radial-gradient(circle, rgba(99, 102, 241, 0.48) 0%, rgba(129, 140, 248, 0.25) 45%, transparent 70%)',
          filter: 'blur(120px)',
          animation: 'liquid-blob-1 22s cubic-bezier(0.4, 0, 0.2, 1) infinite',
        }}
      />

      {/* Blob 2: Center-Right Cyan / Sky Blue */}
      <div
        className="absolute top-[20%] -right-[12%] h-[700px] w-[700px] rounded-full opacity-65 mix-blend-screen filter"
        style={{
          background:
            'radial-gradient(circle, rgba(6, 182, 212, 0.42) 0%, rgba(56, 189, 248, 0.22) 50%, transparent 70%)',
          filter: 'blur(140px)',
          animation: 'liquid-blob-2 26s cubic-bezier(0.4, 0, 0.2, 1) infinite',
        }}
      />

      {/* Blob 3: Bottom-Center Fuchsia / Magenta */}
      <div
        className="absolute -bottom-[12%] left-[25%] h-[550px] w-[550px] rounded-full opacity-60 mix-blend-screen filter"
        style={{
          background:
            'radial-gradient(circle, rgba(236, 72, 153, 0.38) 0%, rgba(217, 70, 239, 0.2) 48%, transparent 70%)',
          filter: 'blur(110px)',
          animation: 'liquid-blob-3 20s cubic-bezier(0.4, 0, 0.2, 1) infinite',
        }}
      />

      {/* Blob 4: Ambient Emerald/Teal accent for multi-spectrum depth */}
      <div
        className="absolute top-[50%] left-[5%] h-[500px] w-[500px] rounded-full opacity-45 mix-blend-screen filter"
        style={{
          background:
            'radial-gradient(circle, rgba(20, 184, 166, 0.32) 0%, rgba(99, 102, 241, 0.15) 55%, transparent 70%)',
          filter: 'blur(130px)',
          animation: 'liquid-blob-4 28s cubic-bezier(0.4, 0, 0.2, 1) infinite',
        }}
      />

      {/* Subtle Film Grain Noise Overlay (removes digital banding, adds physical glass substrate) */}
      <svg
        className="absolute inset-0 h-full w-full opacity-[0.035] mix-blend-overlay pointer-events-none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <filter id="liquid-glass-grain">
          <feTurbulence
            type="fractalNoise"
            baseFrequency="0.75"
            numOctaves="3"
            stitchTiles="stitch"
          />
          <feColorMatrix type="saturate" values="0" />
        </filter>
        <rect width="100%" height="100%" filter="url(#liquid-glass-grain)" />
      </svg>
    </div>
  );
};

export default LiquidMeshBackground;
