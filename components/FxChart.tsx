import React from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface FxChartProps {
    pair: string;
    data: Array<{time: string, value: number}>;
}

const FxChart: React.FC<FxChartProps> = ({ pair, data }) => {
  const isUp = data[data.length - 1].value >= data[0].value;
  const change = ((data[data.length - 1].value - data[0].value) / data[0].value) * 100;

  return (
    <div className="w-full h-64 bg-navy-900 rounded-lg p-4 border border-navy-700">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-white font-serif font-semibold">{pair} Intraday</h3>
        <span className={`text-xs font-medium ${isUp ? 'text-green-600' : 'text-red-600'}`}>
          {isUp ? '+' : ''}{change.toFixed(2)}%
        </span>
      </div>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data}>
          <defs>
            <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#D4AF37" stopOpacity={0.3}/>
              <stop offset="95%" stopColor="#D4AF37" stopOpacity={0}/>
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#1E3E5C" />
          <XAxis dataKey="time" axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#94a3b8'}} />
          <YAxis
            domain={['dataMin - 0.05', 'dataMax + 0.05']}
            axisLine={false}
            tickLine={false}
            tick={{fontSize: 12, fill: '#94a3b8'}}
            tickFormatter={(value) => value.toFixed(2)}
          />
          <Tooltip 
            contentStyle={{ backgroundColor: '#0F2645', border: 'none', borderRadius: '4px', color: '#fff' }}
            itemStyle={{ color: '#D4AF37' }}
            formatter={(value: number) => [value.toFixed(4), pair]}
          />
          <Area type="monotone" dataKey="value" stroke="#0F2645" strokeWidth={2} fillOpacity={1} fill="url(#colorValue)" />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};

export default FxChart;