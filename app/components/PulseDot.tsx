'use client';

export default function PulseDot({ active = true }: { active?: boolean }) {
  if (!active) {
    return <span className="inline-block w-2 h-2 rounded-full bg-gray-600" />;
  }
  return (
    <span className="relative inline-flex h-2 w-2">
      <span
        className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-60"
        style={{ backgroundColor: '#00C896' }}
      />
      <span
        className="relative inline-flex rounded-full h-2 w-2"
        style={{ backgroundColor: '#00C896' }}
      />
    </span>
  );
}
