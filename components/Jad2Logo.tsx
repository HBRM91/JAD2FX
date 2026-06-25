import React from 'react';

interface Jad2LogoProps {
  /** Width of the logo in px (height scales proportionally) */
  width?: number;
  /** Show "ADVISORY" text below — hide for compact nav use */
  showAdvisory?: boolean;
  className?: string;
}

/**
 * JAD2 Advisory brand logo — gold JAD2 wordmark + navy ADVISORY sub-text.
 * Pure SVG, no external asset dependency.
 */
export default function Jad2Logo({ width = 120, showAdvisory = true, className = '' }: Jad2LogoProps) {
  const h = showAdvisory ? width * 0.58 : width * 0.38;
  const gold  = '#C9A020';
  const navy  = '#E2E8F0'; // slate-200 — legible on dark navy backgrounds

  return (
    <svg
      width={width}
      height={h}
      viewBox={`0 0 200 ${showAdvisory ? 115 : 75}`}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-label="JAD2 Advisory"
    >
      {/* ── JAD2 wordmark ─── */}
      <text
        x="4"
        y="62"
        fontFamily="'Georgia', serif"
        fontWeight="700"
        fontSize="68"
        letterSpacing="-1"
        fill={gold}
      >
        JAD
      </text>

      {/* "2" with circular accent overlay */}
      <text
        x="144"
        y="62"
        fontFamily="'Georgia', serif"
        fontWeight="700"
        fontSize="68"
        fill={gold}
      >
        2
      </text>
      {/* Circular decorative element inside the "2" */}
      <circle cx="164" cy="28" r="14" stroke={gold} strokeWidth="3.5" fill="none" opacity="0.7" />
      <circle cx="164" cy="28" r="8"  stroke={gold} strokeWidth="2.5" fill="none" opacity="0.45" />
      <line x1="155" y1="19" x2="173" y2="37" stroke={gold} strokeWidth="2" opacity="0.55" />
      <line x1="155" y1="37" x2="173" y2="19" stroke={gold} strokeWidth="2" opacity="0.55" />

      {/* ── ADVISORY sub-text ─── */}
      {showAdvisory && (
        <text
          x="4"
          y="105"
          fontFamily="'Arial', sans-serif"
          fontWeight="700"
          fontSize="28"
          letterSpacing="6"
          fill={navy}
        >
          ADVISORY
        </text>
      )}
    </svg>
  );
}
