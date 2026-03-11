/**
 * Ad Sets section — targeting, audiences, budgets, optimization goals.
 */

import type { CampaignLaunchPageState } from '../../../../hooks/useCampaignLaunchPageState';
import {
  OBJECTIVE_OPTIMIZATION_GOALS,
  inputClass,
  selectClass,
  selectStyle,
  labelClass,
} from '../../../../pages/campaignLaunch/constants';

interface Props {
  state: CampaignLaunchPageState;
}

export default function AdSetsSection({ state }: Props) {
  const { config, updateAdSet, addAdSet, removeAdSet } = state;

  return (
    <section id="section-adSets" className="w-full">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-sm font-semibold text-gray-900 m-0 uppercase tracking-wide">
          Ad Sets ({config.adSets.length})
        </h2>
        <button
          onClick={addAdSet}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-[#1957DB] bg-[#EFF6FF] rounded-lg hover:bg-[#DBEAFE] transition-colors border-none cursor-pointer"
        >
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add Ad Set
        </button>
      </div>
      <div className="flex flex-col gap-3">
        {config.adSets.map((adSet) => (
          <div key={adSet.localId} className="bg-white rounded-xl shadow-sm px-6 py-5">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium text-gray-400 uppercase">{adSet.audienceLabel}</span>
                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-[#00B140]/10 text-[9px] font-medium text-[#00B140]" title="Audience will be enriched via LiveRamp">
                  <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  LiveRamp
                </span>
              </div>
              {config.adSets.length > 1 && (
                <button
                  onClick={() => removeAdSet(adSet.localId)}
                  className="text-gray-300 hover:text-red-500 transition-colors bg-transparent border-none cursor-pointer p-1"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              )}
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <label className={labelClass}>Name</label>
                <input
                  type="text"
                  value={adSet.name}
                  onChange={(e) => updateAdSet(adSet.localId, { name: e.target.value })}
                  className={inputClass}
                />
              </div>
              <div>
                <label className={labelClass}>Daily Budget ($)</label>
                <input
                  type="number"
                  min="1"
                  step="0.01"
                  value={(adSet.dailyBudget / 100).toFixed(2)}
                  onChange={(e) => updateAdSet(adSet.localId, { dailyBudget: Math.max(100, Math.round(parseFloat(e.target.value || '0') * 100)) })}
                  className={inputClass}
                />
              </div>
              <div>
                <label className={labelClass}>Optimization Goal</label>
                <select
                  value={adSet.optimizationGoal}
                  onChange={(e) => updateAdSet(adSet.localId, { optimizationGoal: e.target.value })}
                  className={selectClass}
                  style={selectStyle}
                >
                  {(OBJECTIVE_OPTIMIZATION_GOALS[config.campaign.objective] || OBJECTIVE_OPTIMIZATION_GOALS.OUTCOME_TRAFFIC).map((goal) => (
                    <option key={goal.value} value={goal.value}>{goal.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className={labelClass}>Countries</label>
                <input
                  type="text"
                  value={adSet.targeting.geoLocations?.countries?.join(', ') || ''}
                  onChange={(e) => updateAdSet(adSet.localId, {
                    targeting: {
                      ...adSet.targeting,
                      geoLocations: { countries: e.target.value.split(',').map((s) => s.trim()).filter(Boolean) },
                    },
                  })}
                  placeholder="US, GB, CA"
                  className={inputClass}
                />
              </div>
              <div className="flex gap-2">
                <div className="flex-1">
                  <label className={labelClass}>Age Min</label>
                  <input
                    type="number"
                    min="13"
                    max="65"
                    value={adSet.targeting.ageMin || 18}
                    onChange={(e) => updateAdSet(adSet.localId, {
                      targeting: { ...adSet.targeting, ageMin: parseInt(e.target.value) || 18 },
                    })}
                    className={inputClass}
                  />
                </div>
                <div className="flex-1">
                  <label className={labelClass}>Age Max</label>
                  <input
                    type="number"
                    min="13"
                    max="65"
                    value={adSet.targeting.ageMax || 65}
                    onChange={(e) => updateAdSet(adSet.localId, {
                      targeting: { ...adSet.targeting, ageMax: parseInt(e.target.value) || 65 },
                    })}
                    className={inputClass}
                  />
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
