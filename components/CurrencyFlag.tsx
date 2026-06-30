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

function codeToEmoji(code: string): string {
  if (!code || code.length < 2) return '';
  const upper = code.toUpperCase();
  const chars = [...upper.slice(0, 2)];
  return String.fromCodePoint(...chars.map(c => 0x1F1E6 + c.charCodeAt(0) - 65));
}

export default function CurrencyFlag({ countryCode, size = 'sm', className = '' }: Props) {
  const [errored, setErrored] = useState(false);
  const [w, h] = DIMS[size] ?? DIMS.sm;
  const code = (countryCode ?? '').toLowerCase().trim();
  const emoji = codeToEmoji(code);

  if (!code || errored || !emoji) {
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
    <span
      aria-label={code.toUpperCase()}
      className={className}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: w,
        height: h,
        fontSize: `${h * 1.1}px`,
        lineHeight: 1,
        flexShrink: 0,
        verticalAlign: 'middle',
      }}
    >
      {emoji}
    </span>
  );
}
