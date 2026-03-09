import type { ConversionBySpot } from '../../types/campaignAnalysis';

interface ConversionBySpotGridProps {
  data: ConversionBySpot[];
}

export default function ConversionBySpotGrid({ data }: ConversionBySpotGridProps) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-5">
      <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wide mb-4">
        Conversion by Spot
      </p>
      <div className="space-y-5">
        {data.map((page) => (
          <div key={page.pageId}>
            <p className="text-xs font-semibold text-gray-800 mb-2">{page.pageName}</p>
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
              {page.spots.map((spot) => (
                <div key={spot.spotId} className="rounded-xl border border-gray-100 bg-gray-50 p-3">
                  <p className="text-[11px] font-medium text-gray-700 mb-2 truncate">{spot.spotName}</p>
                  <div className="grid grid-cols-2 gap-x-3 gap-y-1">
                    <div>
                      <p className="text-[9px] text-gray-400 uppercase">Impressions</p>
                      <p className="text-[11px] font-semibold text-gray-800">{spot.impressions.toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-[9px] text-gray-400 uppercase">Clicks</p>
                      <p className="text-[11px] font-semibold text-gray-800">{spot.clicks.toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-[9px] text-gray-400 uppercase">CTR</p>
                      <p className="text-[11px] font-semibold text-gray-800">{spot.ctr.toFixed(1)}%</p>
                    </div>
                    <div>
                      <p className="text-[9px] text-gray-400 uppercase">Lift</p>
                      <p className={`text-[11px] font-semibold ${spot.personalizationLift >= 0 ? 'text-green-600' : 'text-red-500'}`}>
                        {spot.personalizationLift > 0 ? '+' : ''}{spot.personalizationLift.toFixed(1)}%
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
