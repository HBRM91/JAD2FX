import React from 'react';

interface Props {
  countryCode: string;
  size?: 'xs' | 'sm' | 'md' | 'lg';
  className?: string;
}

const SIZES: Record<string, React.CSSProperties> = {
  xs: { width: 16, height: 12, borderRadius: 2 },
  sm: { width: 20, height: 15, borderRadius: 2 },
  md: { width: 24, height: 18, borderRadius: 3 },
  lg: { width: 32, height: 24, borderRadius: 4 },
};

export default function CurrencyFlag({ countryCode, size = 'sm', className = '' }: Props) {
  return (
    <span
      className={`fi fi-${countryCode.toLowerCase()} flex-shrink-0 ${className}`}
      style={{ display: 'inline-block', ...SIZES[size] }}
      role="img"
      aria-label={countryCode}
    />
  );
}
