import React, { useState } from 'react';

interface Props {
  countryCode: string;
  size?: 'xs' | 'sm' | 'md' | 'lg';
  className?: string;
}

// Display dimensions
const DIMS: Record<string, [number, number]> = {
  xs: [16, 12],
  sm: [20, 15],
  md: [24, 18],
  lg: [32, 24],
};

// flagcdn.com only serves these exact widths: 20, 40, 80, 160, 320, 640, 1280, 2560
// Map each display size to the nearest valid CDN width
const CDN_W: Record<string, number> = {
  xs: 20,
  sm: 40,
  md: 40,
  lg: 80,
};

export default function CurrencyFlag({ countryCode, size = 'sm', className = '' }: Props) {
  const [errored, setErrored] = useState(false);
  const [w, h] = DIMS[size] ?? DIMS.sm;
  const code = (countryCode ?? '').toLowerCase().trim();

  // If no valid code or image failed — show a small letter badge
  if (!code || errored) {
    return (
      <span
        aria-label={code.toUpperCase()}
        className={className}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: w,
          height: h,
          background: '#1e3a5f',
          color: '#94a3b8',
          fontSize: Math.max(7, Math.floor(h * 0.6)),
          fontWeight: 700,
          borderRadius: 2,
          flexShrink: 0,
          verticalAlign: 'middle',
          letterSpacing: '-0.03em',
          fontFamily: 'ui-monospace, monospace',
        }}
      >
        {code.slice(0, 2).toUpperCase()}
      </span>
    );
  }

  return (
    <img
      src={`https://flagcdn.com/w${CDN_W[size]}/${code}.png`}
      width={w}
      height={h}
      alt={code.toUpperCase()}
      loading="lazy"
      decoding="async"
      className={className}
      style={{
        borderRadius: 2,
        objectFit: 'cover',
        flexShrink: 0,
        display: 'inline-block',
        verticalAlign: 'middle',
      }}
      onError={() => setErrored(true)}
    />
  );
}
