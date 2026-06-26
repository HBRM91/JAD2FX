/**
 * LogoJad2Fx — Navbar & brand logo component.
 *
 * Layout: [JAD2 logo image] + ["FX" wordmark]
 *
 * On dark backgrounds (default, navy UI):
 *   - Logo image: brightness(0) invert(1) → pure white
 *   - "FX": white text with gold accent on the "X"
 *
 * On light/clear backgrounds:
 *   - Logo image: brightness(0) → black, then sepia+hue to navy
 *   - "FX": navy blue text
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
}

export default function LogoJad2Fx({ height = 32, dark = true, showSub = false, className = '' }: Props) {
  // CSS filter to convert the coloured PNG logo to white (dark bg) or navy (light bg)
  const logoFilter = dark
    ? 'brightness(0) invert(1)'                                    // white version
    : 'brightness(0) saturate(100%) invert(14%) sepia(49%) saturate(700%) hue-rotate(190deg)'; // navy version

  const fxColorJ  = dark ? '#E2E8F0' : '#0E2336';  // white / navy-900
  const fxColorX  = dark ? '#D4AF37' : '#B5952F';  // gold  / gold-600
  const subColor  = dark ? '#4E7EAC' : '#64748b';  // navy-400 / slate-500

  // "FX" font size relative to height
  const fxSize   = Math.round(height * 0.75);
  const subSize  = Math.round(height * 0.28);

  return (
    <div className={`flex items-center gap-2 flex-shrink-0 select-none ${className}`}>
      {/* JAD2 logo mark — PNG filtered to white or navy */}
      <img
        src="/jad2-logo.png"
        alt="JAD2"
        height={height}
        width={height}
        style={{
          height,
          width: height,
          objectFit: 'contain',
          filter: logoFilter,
          display: 'block',
        }}
        draggable={false}
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
