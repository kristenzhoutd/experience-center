import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import type { ConversionByPage } from '../../types/campaignAnalysis';

interface ConversionByPageChartProps {
  data: ConversionByPage[];
}

export default function ConversionByPageChart({ data }: ConversionByPageChartProps) {
  const chartData = data.map((page) => ({
    name: page.pageName,
    conversionRate: page.conversionRate,
    visitors: page.visitors,
    conversions: page.conversions,
    lift: page.personalizationLift,
  }));

  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-5">
      <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wide mb-4">
        Conversion by Page
      </p>
      <div className="h-56">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} layout="vertical" margin={{ left: 10, right: 20, top: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis type="number" tick={{ fontSize: 10, fill: '#9ca3af' }} domain={[0, 'auto']} unit="%" />
            <YAxis type="category" dataKey="name" tick={{ fontSize: 10, fill: '#6b7280' }} width={100} />
            <Tooltip
              contentStyle={{ fontSize: 11, borderRadius: 8, border: '1px solid #e5e7eb' }}
              formatter={(value: number | undefined) => [`${(value ?? 0).toFixed(1)}%`, 'Conv. Rate']}
            />
            <Bar dataKey="conversionRate" fill="#6366f1" radius={[0, 4, 4, 0]} barSize={16} />
          </BarChart>
        </ResponsiveContainer>
      </div>
      {/* Summary table */}
      <div className="mt-4 overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-gray-100">
              <th className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide pb-2 pr-3">Page</th>
              <th className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide pb-2 pr-3 text-right">Visitors</th>
              <th className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide pb-2 pr-3 text-right">Conversions</th>
              <th className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide pb-2 pr-3 text-right">Bounce Rate</th>
              <th className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide pb-2 text-right">Lift</th>
            </tr>
          </thead>
          <tbody>
            {data.map((page) => (
              <tr key={page.pageId} className="border-b border-gray-50">
                <td className="py-2 pr-3 text-[11px] text-gray-700">{page.pageName}</td>
                <td className="py-2 pr-3 text-[11px] text-gray-700 text-right">{page.visitors.toLocaleString()}</td>
                <td className="py-2 pr-3 text-[11px] text-gray-700 text-right">{page.conversions.toLocaleString()}</td>
                <td className="py-2 pr-3 text-[11px] text-gray-700 text-right">{page.bounceRate.toFixed(1)}%</td>
                <td className={`py-2 text-[11px] text-right font-medium ${page.personalizationLift >= 0 ? 'text-green-600' : 'text-red-500'}`}>
                  {page.personalizationLift > 0 ? '+' : ''}{page.personalizationLift.toFixed(1)}%
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
