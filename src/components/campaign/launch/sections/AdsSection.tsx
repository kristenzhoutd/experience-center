/**
 * Ads section — ad name, ad set assignment, creative assignment.
 */

import type { CampaignLaunchPageState } from '../../../../hooks/useCampaignLaunchPageState';
import { inputClass, selectClass, selectStyle, labelClass } from '../../../../pages/campaignLaunch/constants';

interface Props {
  state: CampaignLaunchPageState;
}

export default function AdsSection({ state }: Props) {
  const { config, updateAd, addAd, removeAd } = state;

  return (
    <section id="section-ads" className="bg-white rounded-xl shadow-sm overflow-hidden">
      <div className="px-6 py-4 border-b border-[#E8ECF3] flex items-center justify-between">
        <h2 className="text-sm font-semibold text-gray-900 m-0 uppercase tracking-wide">
          Ads ({config.ads.length})
        </h2>
        <button
          onClick={addAd}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-[#1957DB] bg-[#EFF6FF] rounded-lg hover:bg-[#DBEAFE] transition-colors border-none cursor-pointer"
        >
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add Ad
        </button>
      </div>
      <div className="divide-y divide-[#E8ECF3]">
        {config.ads.map((ad) => (
          <div key={ad.localId} className="px-6 py-5">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-medium text-gray-400 uppercase">{ad.name}</span>
              {config.ads.length > 1 && (
                <button
                  onClick={() => removeAd(ad.localId)}
                  className="text-gray-300 hover:text-red-500 transition-colors bg-transparent border-none cursor-pointer p-1"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              )}
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className={labelClass}>Name</label>
                <input
                  type="text"
                  value={ad.name}
                  onChange={(e) => updateAd(ad.localId, { name: e.target.value })}
                  className={inputClass}
                />
              </div>
              <div>
                <label className={labelClass}>Ad Set</label>
                <select
                  value={ad.adSetLocalId}
                  onChange={(e) => updateAd(ad.localId, { adSetLocalId: e.target.value })}
                  className={selectClass}
                  style={selectStyle}
                >
                  <option value="">Select...</option>
                  {config.adSets.map((as) => (
                    <option key={as.localId} value={as.localId}>{as.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className={labelClass}>Creative</label>
                <select
                  value={ad.creativeLocalId}
                  onChange={(e) => updateAd(ad.localId, { creativeLocalId: e.target.value })}
                  className={selectClass}
                  style={selectStyle}
                >
                  <option value="">Select...</option>
                  {config.creatives.map((c) => (
                    <option key={c.localId} value={c.localId}>{c.name}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
