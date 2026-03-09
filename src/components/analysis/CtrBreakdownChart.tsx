import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import type { CtrBreakdownEntry } from '../../types/campaignAnalysis';

interface CtrBreakdownChartProps {
  data: CtrBreakdownEntry[];
}

export default function CtrBreakdownChart({ data }: CtrBreakdownChartProps) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-5">
      <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wide mb-4">
        Click-Through Rate Breakdown
      </p>
      <div className="h-48">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ left: 0, right: 10, top: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="label" tick={{ fontSize: 10, fill: '#6b7280' }} />
            <YAxis tick={{ fontSize: 10, fill: '#9ca3af' }} unit="%" />
            <Tooltip
              contentStyle={{ fontSize: 11, borderRadius: 8, border: '1px solid #e5e7eb' }}
              formatter={(value: number | undefined) => [`${(value ?? 0).toFixed(2)}%`, 'CTR']}
            />
            <Bar dataKey="ctr" fill="#8b5cf6" radius={[4, 4, 0, 0]} barSize={32} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
