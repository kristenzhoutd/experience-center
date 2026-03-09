import type { ConversionByCreative } from '../../types/campaignAnalysis';

interface ConversionByCreativeTableProps {
  data: ConversionByCreative[];
}

const statusStyles: Record<string, string> = {
  winner: 'bg-green-50 text-green-700',
  underperforming: 'bg-red-50 text-red-600',
  neutral: 'bg-gray-100 text-gray-600',
};

export default function ConversionByCreativeTable({ data }: ConversionByCreativeTableProps) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-5">
      <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wide mb-4">
        Conversion by Creative
      </p>
      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-gray-200">
              <th className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide pb-2 pr-3">Creative</th>
              <th className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide pb-2 pr-3">Variant</th>
              <th className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide pb-2 pr-3 text-right">Impressions</th>
              <th className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide pb-2 pr-3 text-right">CTR</th>
              <th className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide pb-2 pr-3 text-right">Conversions</th>
              <th className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide pb-2 pr-3 text-right">Conv. Rate</th>
              <th className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide pb-2 text-right">Status</th>
            </tr>
          </thead>
          <tbody>
            {data.map((creative) => (
              <tr key={creative.creativeId} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                <td className="py-2 pr-3 text-[11px] font-medium text-gray-700">{creative.creativeName}</td>
                <td className="py-2 pr-3 text-[11px] text-gray-500">{creative.variant}</td>
                <td className="py-2 pr-3 text-[11px] text-gray-700 text-right">{creative.impressions.toLocaleString()}</td>
                <td className="py-2 pr-3 text-[11px] text-gray-700 text-right">{creative.ctr.toFixed(2)}%</td>
                <td className="py-2 pr-3 text-[11px] text-gray-700 text-right">{creative.conversions.toLocaleString()}</td>
                <td className="py-2 pr-3 text-[11px] text-gray-700 text-right">{creative.conversionRate.toFixed(1)}%</td>
                <td className="py-2 text-right">
                  <span className={`text-[9px] font-semibold px-2 py-0.5 rounded-full ${statusStyles[creative.status] || statusStyles.neutral}`}>
                    {creative.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
