import React from 'react';

interface Props {
  countryCode: string;  // ISO 3166-1 alpha-2 (e.g. 'us', 'eu', 'gb')
  size?: 'xs' | 'sm' | 'md' | 'lg';
  className?: string;
}

// [width, height] in px — 4:3 ratio matches standard flag proportions
const DIMS: Record<string, [number, number]> = {
  xs: [16, 12],
  sm: [20, 15],
  md: [24, 18],
  lg: [32, 24],
};

export default function CurrencyFlag({ countryCode, size = 'sm', className = '' }: Props) {
  const [w, h] = DIMS[size] ?? DIMS.sm;
  const code = countryCode.toLowerCase();
  return (
    <img
      src={`https://flagcdn.com/w${w * 2}/${code}.png`}
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
      onError={e => { (e.currentTarget as HTMLImageElement).style.visibility = 'hidden'; }}
    />
  );
}
