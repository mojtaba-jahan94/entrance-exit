import React, { useState, useEffect } from 'react';
import './PageLoader.css';

export interface PageLoaderProps {
  /**
   * Whether the loader overlay is currently active.
   * When switched from true to false, triggers a smooth 0.4s fade-out before unmounting.
   * Defaults to true.
   */
  isLoading?: boolean;
  /**
   * Optional helper or status message displayed below the metaball loader.
   */
  message?: React.ReactNode;
  /**
   * Optional additional CSS classes for the overlay container.
   */
  className?: string;
  /**
   * If true, keeps the overlay mounted with visibility: hidden when idle.
   * If false (default), unmounts the overlay from DOM after the 0.4s fade-out.
   */
  keepMounted?: boolean;
}

/**
 * SVG Filter definition for Liquid Metaball Fusion effect.
 * Stays mounted in the DOM to preserve cross-browser SVG filter integrity.
 */
export const MetaballFilterDefs: React.FC = () => (
  <svg
    width="0"
    height="0"
    style={{ position: 'absolute', width: 0, height: 0, pointerEvents: 'none' }}
    aria-hidden="true"
    data-testid="gooey-metaball-filter-svg"
  >
    <filter id="gooey-metaball-filter">
      <feGaussianBlur in="SourceGraphic" stdDeviation="7" result="blur" />
      <feColorMatrix
        in="blur"
        mode="matrix"
        values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 21 -9"
        result="goo"
      />
      <feBlend in="SourceGraphic" in2="goo" />
    </filter>
  </svg>
);

/**
 * Pure Liquid Metaball Fusion gooey loader element.
 */
export const LiquidMetaballLoader: React.FC<{ className?: string }> = ({ className = '' }) => (
  <div className={`gooey-loader ${className}`} aria-label="Liquid Metaball Fusion Loader">
    <div className="gooey-center" />
    <div className="gooey-drop gooey-drop-1" />
    <div className="gooey-drop gooey-drop-2" />
    <div className="gooey-drop gooey-drop-3" />
  </div>
);

/**
 * Full-screen page loading overlay with Liquid Metaball Fusion physics,
 * theme-adaptive backdrop, and smooth 0.4s fade-out transition.
 */
export const PageLoader: React.FC<PageLoaderProps> = ({
  isLoading = true,
  message,
  className = '',
  keepMounted = false,
}) => {
  const [shouldRender, setShouldRender] = useState<boolean>(isLoading);

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | undefined;

    if (isLoading) {
      setShouldRender(true);
    } else {
      // 0.4s fade-out transition before unmounting from DOM
      timer = setTimeout(() => {
        if (!keepMounted) {
          setShouldRender(false);
        }
      }, 400);
    }

    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [isLoading, keepMounted]);

  // When isLoading is false, overlay is immediately hidden & click-through via styles and CSS
  const isHidden = !isLoading;

  return (
    <>
      {/* SVG Filter block permanently mounted in DOM for cross-browser stability */}
      <MetaballFilterDefs />

      {/* Full-viewport overlay with guaranteed fade-out and pointer-events: none */}
      {(shouldRender || keepMounted) && (
        <div
          className={`page-loader-overlay ${isHidden ? 'page-loader-hidden' : ''} ${className}`.trim()}
          style={{
            opacity: isHidden ? 0 : 1,
            visibility: isHidden ? 'hidden' : 'visible',
            pointerEvents: isHidden ? 'none' : 'auto',
            transition: 'opacity 0.4s ease, visibility 0.4s ease',
          }}
          aria-live="polite"
          aria-busy={isLoading}
          aria-hidden={isHidden}
          role="status"
        >
          <LiquidMetaballLoader />

          {message && <div className="page-loader-message">{message}</div>}
        </div>
      )}
    </>
  );
};

export default PageLoader;
