/**
 * LogoJad2Fx — Navbar & brand logo component.
 *
 * Layout: [JAD2 SVG logo] + ["FX" wordmark]
 *
 * On dark backgrounds (default, navy UI):
 *   - SVG logo: inverts to white via filter
 *   - "FX": white text with gold accent on the "X"
 *
 * On light/clear backgrounds:
 *   - SVG logo: inverts to navy
 *   - "FX": navy blue text
 *
 * Uses the inline SVG (jad2-logo.svg) instead of PNG for:
 *   - 5x smaller file size (<2KB vs 302KB PNG)
 *   - Crisp rendering at any DPI
 *   - Theme-aware via filter
 */
import React from 'react';

interface Props {
  /** Height of the logo mark in px */
  height?: number;
  /** true = dark navbar (default), false = light background */
  dark?: boolean;
  /** Show "by JAD2 Advisory" sub-label */
  showSub?: boolean;
  className?: string;
  /** Loading hint for accessibility */
  ariaLabel?: string;
}

export default function LogoJad2Fx({
  height = 32,
  dark = true,
  showSub = false,
  className = '',
  ariaLabel = 'JAD2FX — Conseil FX & Stratégie Maroc',
}: Props) {
  // CSS filter to convert the SVG logo: white (dark bg) or navy (light bg)
  const logoFilter = dark
    ? 'brightness(0) invert(1)'
    : 'brightness(0) saturate(100%) invert(14%) sepia(49%) saturate(700%) hue-rotate(190deg)';

  const fxColorJ = dark ? '#E2E8F0' : '#0E2336';
  const fxColorX = dark ? '#D4AF37' : '#B5952F';
  const subColor = dark ? '#4E7EAC' : '#64748b';

  const fxSize  = Math.round(height * 0.75);
  const subSize = Math.round(height * 0.28);

  return (
    <div
      className={`flex items-center gap-2 flex-shrink-0 select-none ${className}`}
      role="img"
      aria-label={ariaLabel}
    >
      {/* JAD2 SVG logo mark */}
      <img
        src="/jad2-logo.svg"
        alt="JAD2"
        height={height}
        width={height * (200 / 60)} // SVG viewBox 200x60, aspect 10:3
        style={{
          height,
          width: height * (200 / 60),
          objectFit: 'contain',
          filter: logoFilter,
          display: 'block',
        }}
        draggable={false}
        loading="eager"
        decoding="async"
      />

      {/* FX wordmark */}
      <div className="flex flex-col justify-center leading-none">
        <div
          style={{
            fontSize: fxSize,
            fontFamily: "'Georgia', 'Playfair Display', serif",
            fontWeight: 700,
            letterSpacing: '-0.02em',
            lineHeight: 1,
          }}
        >
          <span style={{ color: fxColorJ }}>F</span>
          <span style={{ color: fxColorX }}>X</span>
        </div>
        {showSub && (
          <span
            style={{
              fontSize: subSize,
              color: subColor,
              fontFamily: "'Inter', system-ui, sans-serif",
              fontWeight: 600,
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              marginTop: 2,
            }}
          >
            by JAD2 Advisory
          </span>
        )}
      </div>
    </div>
  );
}
