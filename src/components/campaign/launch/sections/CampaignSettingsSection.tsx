/**
 * Campaign settings section — name, objective, budget, status, buying type, special ad category.
 */

import type { CampaignLaunchPageState } from '../../../../hooks/useCampaignLaunchPageState';
import {
  META_OBJECTIVES,
  SPECIAL_AD_CATEGORIES,
  inputClass,
  selectClass,
  selectStyle,
  labelClass,
} from '../../../../pages/campaignLaunch/constants';

interface Props {
  state: CampaignLaunchPageState;
}

export default function CampaignSettingsSection({ state }: Props) {
  const { config, updateCampaign, isEditMode, dailyBudgetDollars, specialAdCategory } = state;

  return (
    <section id="section-campaign" className="bg-white rounded-xl shadow-sm overflow-hidden w-full">
      <div className="px-6 py-4 border-b border-[#E8ECF3] flex items-center justify-between">
        <h2 className="text-sm font-semibold text-gray-900 m-0 uppercase tracking-wide">Campaign</h2>
      </div>
      <div className="px-6 py-5 grid grid-cols-2 gap-4">
        <div className="col-span-2">
          <label className={labelClass}>Campaign Name</label>
          <input
            type="text"
            value={config.campaign.name}
            onChange={(e) => updateCampaign({ name: e.target.value })}
            className={inputClass}
          />
        </div>
        <div>
          <label className={labelClass}>Objective</label>
          <select
            value={config.campaign.objective}
            onChange={(e) => updateCampaign({ objective: e.target.value })}
            disabled={isEditMode}
            className={`${selectClass} ${isEditMode ? 'opacity-50' : ''}`}
            style={selectStyle}
          >
            {META_OBJECTIVES.filter((obj) => obj.enabled).map((obj) => (
              <option key={obj.value} value={obj.value}>
                {obj.label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className={labelClass}>Status</label>
          <select
            value={config.campaign.status}
            onChange={(e) => updateCampaign({ status: e.target.value as 'PAUSED' | 'ACTIVE' })}
            className={selectClass}
            style={selectStyle}
          >
            <option value="PAUSED">Paused</option>
            <option value="ACTIVE">Active</option>
          </select>
        </div>
        <div>
          <label className={labelClass}>Daily Budget ($)</label>
          <input
            type="number"
            min="1"
            step="0.01"
            value={dailyBudgetDollars}
            onChange={(e) => updateCampaign({ dailyBudget: Math.max(100, Math.round(parseFloat(e.target.value || '0') * 100)) })}
            className={inputClass}
          />
        </div>
        <div>
          <label className={labelClass}>Buying Type</label>
          <select
            value={config.campaign.buyingType}
            onChange={(e) => updateCampaign({ buyingType: e.target.value })}
            className={selectClass}
            style={selectStyle}
          >
            <option value="AUCTION">Auction</option>
            <option value="RESERVED">Reservation</option>
          </select>
        </div>
        <div className="col-span-2">
          <label className={labelClass}>Special Ad Category</label>
          <select
            value={specialAdCategory}
            onChange={(e) => updateCampaign({
              specialAdCategories: e.target.value === 'NONE' ? [] : [e.target.value],
            })}
            className={selectClass}
            style={selectStyle}
          >
            {SPECIAL_AD_CATEGORIES.map((cat) => (
              <option key={cat.value} value={cat.value}>{cat.label}</option>
            ))}
          </select>
        </div>
        {config.campaign.status === 'ACTIVE' && (
          <div className="col-span-2 flex items-start gap-2 px-3 py-2.5 bg-amber-50 border border-amber-200 rounded-lg">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="flex-shrink-0 mt-0.5">
              <circle cx="8" cy="8" r="7" stroke="#D97706" strokeWidth="1.5"/>
              <path d="M8 5V8.5M8 11H8.01" stroke="#D97706" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
            <span className="text-xs text-amber-800">This campaign will start spending immediately once created.</span>
          </div>
        )}
      </div>
    </section>
  );
}
