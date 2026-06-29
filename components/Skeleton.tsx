/**
 * P2.23 — Loading skeletons.
 * Reusable shimmer placeholders for async content.
 */

interface SkeletonProps {
  className?: string;
  rows?: number;
  height?: number;
  width?: string;
  rounded?: boolean;
}

export function Skeleton({ className = '', height = 16, width = '100%', rounded = true }: SkeletonProps) {
  return (
    <div
      className={`bg-navy-800 ${rounded ? 'rounded' : ''} animate-pulse ${className}`}
      style={{ height: `${height}px`, width }}
    />
  );
}

export function SkeletonCard({ rows = 3, height = 14 }: { rows?: number; height?: number }) {
  return (
    <div className="bg-navy-900 border border-navy-700 rounded-2xl p-5 space-y-3">
      <Skeleton height={20} width="40%" />
      {Array.from({ length: rows }).map((_, i) => (
        <Skeleton key={i} height={height} width={`${60 + (i * 7) % 35}%`} />
      ))}
    </div>
  );
}

export function SkeletonTable({ rows = 5, cols = 4 }: { rows?: number; cols?: number }) {
  return (
    <div className="space-y-2">
      {Array.from({ length: rows }).map((_, r) => (
        <div key={r} className="flex gap-3">
          {Array.from({ length: cols }).map((_, c) => (
            <Skeleton key={c} height={12} width={`${100 / cols}%`} />
          ))}
        </div>
      ))}
    </div>
  );
}

export function SkeletonChart({ height = 240 }: { height?: number }) {
  return (
    <div className="space-y-2">
      <Skeleton height={height} />
      <div className="flex gap-1.5">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} height={10} width="16%" />
        ))}
      </div>
    </div>
  );
}
