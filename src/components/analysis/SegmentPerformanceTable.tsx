import type { SegmentPerformance } from '../../types/campaignAnalysis';

interface SegmentPerformanceTableProps {
  data: SegmentPerformance[];
}

export default function SegmentPerformanceTable({ data }: SegmentPerformanceTableProps) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-5">
      <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wide mb-4">
        Segment Performance
      </p>
      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-gray-200">
              <th className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide pb-2 pr-3">Segment</th>
              <th className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide pb-2 pr-3 text-right">Visitors</th>
              <th className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide pb-2 pr-3 text-right">Conversions</th>
              <th className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide pb-2 pr-3 text-right">Conv. Rate</th>
              <th className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide pb-2 pr-3 text-right">Avg Time</th>
              <th className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide pb-2 pr-3 text-right">Bounce Rate</th>
              <th className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide pb-2 text-right">Pers. Lift</th>
            </tr>
          </thead>
          <tbody>
            {data.map((segment) => (
              <tr key={segment.segmentId} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                <td className="py-2.5 pr-3 text-[11px] font-medium text-gray-700">{segment.segmentName}</td>
                <td className="py-2.5 pr-3 text-[11px] text-gray-700 text-right">{segment.visitors.toLocaleString()}</td>
                <td className="py-2.5 pr-3 text-[11px] text-gray-700 text-right">{segment.conversions.toLocaleString()}</td>
                <td className="py-2.5 pr-3 text-[11px] text-gray-700 text-right">{segment.conversionRate.toFixed(1)}%</td>
                <td className="py-2.5 pr-3 text-[11px] text-gray-700 text-right">{Math.floor(segment.avgTimeOnPage / 60)}m {Math.round(segment.avgTimeOnPage % 60)}s</td>
                <td className="py-2.5 pr-3 text-[11px] text-gray-700 text-right">{segment.bounceRate.toFixed(1)}%</td>
                <td className={`py-2.5 text-[11px] text-right font-medium ${segment.personalizationLift >= 0 ? 'text-green-600' : 'text-red-500'}`}>
                  {segment.personalizationLift > 0 ? '+' : ''}{segment.personalizationLift.toFixed(1)}%
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
