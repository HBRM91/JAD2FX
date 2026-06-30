import React, { useState } from 'react';

interface Props {
  countryCode: string;
  size?: 'xs' | 'sm' | 'md' | 'lg';
  className?: string;
}

const DIMS: Record<string, [number, number]> = {
  xs: [16, 12],
  sm: [20, 15],
  md: [24, 18],
  lg: [32, 24],
};

// Special mappings: currency country codes that differ from ISO 3166-1
const CODE_OVERRIDES: Record<string, string> = {
  eu: 'eu',  // EU flag for EUR
};

function Fallback({ code, w, h, className }: { code: string; w: number; h: number; className: string }) {
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
        fontSize: Math.max(7, Math.floor(h * 0.55)),
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

export default function CurrencyFlag({ countryCode, size = 'sm', className = '' }: Props) {
  const [errored, setErrored] = useState(false);
  const [w, h] = DIMS[size] ?? DIMS.sm;
  const code = (countryCode ?? '').toLowerCase().trim();

  if (!code) return <Fallback code="??" w={w} h={h} className={className} />;

  const isoCode = CODE_OVERRIDES[code] ?? code;

  if (errored) return <Fallback code={code} w={w} h={h} className={className} />;

  return (
    <img
      src={`https://flagcdn.com/${isoCode}.svg`}
      alt={code.toUpperCase()}
      aria-label={code.toUpperCase()}
      width={w}
      height={h}
      className={className}
      onError={() => setErrored(true)}
      style={{
        display: 'inline-block',
        flexShrink: 0,
        verticalAlign: 'middle',
        borderRadius: 2,
        objectFit: 'cover',
      }}
      loading="lazy"
    />
  );
}
