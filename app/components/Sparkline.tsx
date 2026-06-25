'use client';

import { LineChart, Line, ResponsiveContainer } from 'recharts';

interface SparklineProps {
  data: number[];
  positive: boolean;
}

export default function Sparkline({ data, positive }: SparklineProps) {
  if (!data || data.length < 2) return <div className="w-16 h-6" />;

  const chartData = data.map((v, i) => ({ v, i }));
  const color = positive ? '#22C55E' : '#EF4444';

  return (
    <ResponsiveContainer width={64} height={24}>
      <LineChart data={chartData} margin={{ top: 2, right: 2, bottom: 2, left: 2 }}>
        <Line
          type="monotone"
          dataKey="v"
          stroke={color}
          strokeWidth={1.5}
          dot={false}
          isAnimationActive={false}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
