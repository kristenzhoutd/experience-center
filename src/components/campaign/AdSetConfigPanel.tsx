/**
 * AdSetConfigPanel — Review panel for AI-generated ad set configuration variants.
 * Shows 3 variant tabs (conservative / balanced / aggressive) with editable fields
 * and an "Approve & Create" action to create the ad set via Meta API.
 */

import { useState } from 'react';
import {
  Sparkles,
  X,
  ChevronDown,
  CheckCircle,
  AlertTriangle,
  Loader2,
  Target,
  Users,
  TrendingUp,
  BarChart3,
} from 'lucide-react';
import { useAdSetConfigStore } from '../../stores/adSetConfigStore';
import type { AdSetConfig } from '../../stores/adSetConfigStore';

const OPTIMIZATION_GOALS = [
  { value: 'OFFSITE_CONVERSIONS', label: 'Conversions' },
  { value: 'LINK_CLICKS', label: 'Link Clicks' },
  { value: 'IMPRESSIONS', label: 'Impressions' },
  { value: 'REACH', label: 'Reach' },
  { value: 'LANDING_PAGE_VIEWS', label: 'Landing Page Views' },
  { value: 'VALUE', label: 'Value' },
];

const BILLING_EVENTS = [
  { value: 'IMPRESSIONS', label: 'Impressions (CPM)' },
  { value: 'LINK_CLICKS', label: 'Link Clicks (CPC)' },
];

interface AdSetConfigPanelProps {
  onClose: () => void;
}

export default function AdSetConfigPanel({ onClose }: AdSetConfigPanelProps) {
  const {
    configs,
    selectedConfigId,
    selectConfig,
    updateConfig,
    campaignContext,
    isCreating,
    createError,
    createdAdSetId,
    setCreating,
    setCreateError,
    setCreatedAdSetId,
  } = useAdSetConfigStore();

  const [showAdvanced, setShowAdvanced] = useState(false);

  const selectedConfig = configs.find((c) => c.id === selectedConfigId) || configs[0];
  if (!selectedConfig) return null;

  const confidenceBadgeStyle = (confidence: string) => {
    switch (confidence) {
      case 'High':
        return 'bg-emerald-100 text-emerald-700';
      case 'Medium':
        return 'bg-amber-100 text-amber-700';
      case 'Low':
        return 'bg-red-100 text-red-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  const handleApproveAndCreate = async () => {
    if (!selectedConfig || !campaignContext?.campaignId) return;
    setCreating(true);
    setCreateError(null);

    try {
      const api = (window as any).aiSuites?.adsets;
      if (!api?.create) throw new Error('Ad set API not available');

      const countries = selectedConfig.targeting.countries.map((c) => c.trim().toUpperCase()).filter(Boolean);

      const result = await api.create({
        campaignId: campaignContext.campaignId,
        name: selectedConfig.name,
        dailyBudget: selectedConfig.dailyBudget * 100, // convert to cents
        optimizationGoal: selectedConfig.optimizationGoal,
        billingEvent: selectedConfig.billingEvent,
        targeting: {
          geoLocations: { countries },
          ageMin: selectedConfig.targeting.ageMin,
          ageMax: selectedConfig.targeting.ageMax,
        },
        status: selectedConfig.status,
      });

      if (!result.success) throw new Error(result.error || 'Failed to create ad set');
      setCreatedAdSetId(result.id || 'created');
    } catch (err: any) {
      setCreateError(err.message || 'Failed to create ad set');
    } finally {
      setCreating(false);
    }
  };

  const handleFieldUpdate = (field: keyof AdSetConfig, value: any) => {
    updateConfig(selectedConfig.id, { [field]: value });
  };

  const handleTargetingUpdate = (field: string, value: any) => {
    updateConfig(selectedConfig.id, {
      targeting: { ...selectedConfig.targeting, [field]: value },
    });
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="shrink-0 px-5 py-4 border-b border-gray-200 bg-white">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-indigo-500 to-blue-500 flex items-center justify-center">
                <Sparkles className="w-3.5 h-3.5 text-white" />
              </div>
              <h3 className="text-sm font-semibold text-gray-900">AI Ad Group Configuration</h3>
            </div>
            {campaignContext?.campaignName && (
              <p className="text-xs text-gray-500 mt-1 ml-9">{campaignContext.campaignName}</p>
            )}
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-gray-100 transition-colors cursor-pointer border-none bg-transparent"
          >
            <X className="w-4 h-4 text-gray-400" />
          </button>
        </div>
      </div>

      {/* Variant Tabs */}
      <div className="shrink-0 flex border-b border-gray-200 bg-white">
        {configs.map((config) => {
          const isSelected = config.id === selectedConfig.id;
          return (
            <button
              key={config.id}
              onClick={() => selectConfig(config.id)}
              className={`flex-1 px-3 py-3 text-xs font-medium transition-all cursor-pointer border-none bg-transparent ${
                isSelected
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
              }`}
            >
              <div className="flex flex-col items-center gap-1">
                <span className="capitalize">{config.variant}</span>
                <span className={`text-[9px] px-1.5 py-0.5 rounded-full ${confidenceBadgeStyle(config.confidence)}`}>
                  {config.confidence}
                </span>
              </div>
            </button>
          );
        })}
      </div>

      {/* Config Body */}
      <div className="flex-1 overflow-y-auto p-5 space-y-4">
        {/* Success State */}
        {createdAdSetId && (
          <div className="bg-emerald-50 rounded-xl p-4 border border-emerald-100 animate-[fadeIn_300ms_ease-out]">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center shrink-0">
                <CheckCircle className="w-4 h-4 text-emerald-600" />
              </div>
              <div>
                <div className="text-xs font-semibold text-emerald-900">Ad group created successfully</div>
                <p className="text-[11px] text-emerald-700 mt-1">
                  {selectedConfig.name}
                  <span className="text-emerald-500"> (ID: {createdAdSetId})</span>
                </p>
                <p className="text-[10px] text-emerald-600 mt-1.5">
                  Add ad creatives to start delivering. You can close this panel and return to the dashboard.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Error State */}
        {createError && !createdAdSetId && (
          <div className="bg-red-50 rounded-xl p-4 border border-red-100 animate-[fadeIn_300ms_ease-out]">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-4 h-4 text-red-600" />
              </div>
              <div>
                <div className="text-xs font-semibold text-red-900">Failed to create ad group</div>
                <p className="text-[11px] text-red-700 mt-1">{createError}</p>
                <button
                  onClick={() => setCreateError(null)}
                  className="mt-2 text-[11px] font-medium text-red-700 hover:text-red-900 bg-transparent border-none cursor-pointer p-0 underline"
                >
                  Dismiss
                </button>
              </div>
            </div>
          </div>
        )}

        {!createdAdSetId && (
          <>
            {/* Ad Group Name */}
            <div>
              <label className="text-[10px] font-medium text-gray-500 uppercase tracking-wide block mb-1">
                Ad Group Name
              </label>
              <input
                type="text"
                value={selectedConfig.name}
                onChange={(e) => handleFieldUpdate('name', e.target.value)}
                className="w-full px-3 py-2.5 text-xs bg-gray-50 border border-gray-200 rounded-lg text-gray-900 focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all outline-none"
              />
            </div>

            {/* Daily Budget */}
            <div>
              <label className="text-[10px] font-medium text-gray-500 uppercase tracking-wide block mb-1">
                Daily Budget
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-gray-400">$</span>
                <input
                  type="number"
                  min={1}
                  value={selectedConfig.dailyBudget}
                  onChange={(e) => handleFieldUpdate('dailyBudget', Math.max(1, Number(e.target.value)))}
                  className="w-full pl-7 pr-3 py-2.5 text-xs bg-gray-50 border border-gray-200 rounded-lg text-gray-900 focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all outline-none font-mono"
                />
              </div>
            </div>

            {/* Optimization Goal */}
            <div>
              <label className="text-[10px] font-medium text-gray-500 uppercase tracking-wide block mb-1">
                Optimization Goal
              </label>
              <select
                value={selectedConfig.optimizationGoal}
                onChange={(e) => handleFieldUpdate('optimizationGoal', e.target.value)}
                className="w-full px-3 py-2.5 text-xs bg-gray-50 border border-gray-200 rounded-lg text-gray-900 focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all outline-none appearance-none cursor-pointer"
              >
                {OPTIMIZATION_GOALS.map((g) => (
                  <option key={g.value} value={g.value}>{g.label}</option>
                ))}
              </select>
            </div>

            {/* Target Countries */}
            <div>
              <label className="text-[10px] font-medium text-gray-500 uppercase tracking-wide block mb-1">
                Target Countries
              </label>
              <input
                type="text"
                value={selectedConfig.targeting.countries.join(', ')}
                onChange={(e) =>
                  handleTargetingUpdate(
                    'countries',
                    e.target.value.split(',').map((c) => c.trim()).filter(Boolean)
                  )
                }
                placeholder="US, CA, GB"
                className="w-full px-3 py-2.5 text-xs bg-gray-50 border border-gray-200 rounded-lg text-gray-900 focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all outline-none"
              />
            </div>

            {/* Advanced Toggle */}
            <button
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="flex items-center gap-1 text-[10px] text-gray-400 hover:text-gray-600 bg-transparent border-none cursor-pointer p-0 transition-colors"
            >
              <ChevronDown className={`w-3 h-3 transition-transform ${showAdvanced ? 'rotate-180' : ''}`} />
              Advanced settings
            </button>

            {showAdvanced && (
              <div className="space-y-4 animate-[fadeIn_200ms_ease-out]">
                {/* Billing Event + Status */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] font-medium text-gray-500 uppercase tracking-wide block mb-1">
                      Billing Event
                    </label>
                    <select
                      value={selectedConfig.billingEvent}
                      onChange={(e) => handleFieldUpdate('billingEvent', e.target.value)}
                      className="w-full px-3 py-2.5 text-xs bg-gray-50 border border-gray-200 rounded-lg text-gray-900 focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all outline-none appearance-none cursor-pointer"
                    >
                      {BILLING_EVENTS.map((b) => (
                        <option key={b.value} value={b.value}>{b.label}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] font-medium text-gray-500 uppercase tracking-wide block mb-1">
                      Initial Status
                    </label>
                    <select
                      value={selectedConfig.status}
                      onChange={(e) => handleFieldUpdate('status', e.target.value)}
                      className="w-full px-3 py-2.5 text-xs bg-gray-50 border border-gray-200 rounded-lg text-gray-900 focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all outline-none appearance-none cursor-pointer"
                    >
                      <option value="PAUSED">Paused</option>
                      <option value="ACTIVE">Active</option>
                    </select>
                  </div>
                </div>

                {/* Age Range */}
                <div>
                  <label className="text-[10px] font-medium text-gray-500 uppercase tracking-wide block mb-1">
                    Age Range
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min={13}
                      max={65}
                      value={selectedConfig.targeting.ageMin}
                      onChange={(e) => handleTargetingUpdate('ageMin', Number(e.target.value))}
                      className="w-20 px-3 py-2 text-xs bg-gray-50 border border-gray-200 rounded-lg text-gray-900 focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all outline-none font-mono text-center"
                    />
                    <span className="text-[10px] text-gray-400">to</span>
                    <input
                      type="number"
                      min={13}
                      max={65}
                      value={selectedConfig.targeting.ageMax}
                      onChange={(e) => handleTargetingUpdate('ageMax', Number(e.target.value))}
                      className="w-20 px-3 py-2 text-xs bg-gray-50 border border-gray-200 rounded-lg text-gray-900 focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all outline-none font-mono text-center"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* AI Rationale */}
            {selectedConfig.rationale && (
              <div className="bg-indigo-50 rounded-lg px-3 py-2.5 flex items-start gap-2">
                <Sparkles className="w-3 h-3 text-indigo-400 mt-0.5 shrink-0" />
                <p className="text-[10px] text-indigo-600 leading-relaxed">{selectedConfig.rationale}</p>
              </div>
            )}

            {/* Estimated Metrics */}
            {selectedConfig.estimatedMetrics && (
              <div>
                <label className="text-[10px] font-medium text-gray-500 uppercase tracking-wide block mb-2">
                  Estimated Performance
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <div className="bg-white rounded-lg p-3 border border-gray-100">
                    <div className="flex items-center gap-1.5 mb-1">
                      <Users className="w-3 h-3 text-blue-500" />
                      <span className="text-[9px] text-gray-400 uppercase">Daily Reach</span>
                    </div>
                    <span className="text-sm font-semibold text-gray-900 font-mono">
                      {selectedConfig.estimatedMetrics.dailyReach}
                    </span>
                  </div>
                  <div className="bg-white rounded-lg p-3 border border-gray-100">
                    <div className="flex items-center gap-1.5 mb-1">
                      <TrendingUp className="w-3 h-3 text-emerald-500" />
                      <span className="text-[9px] text-gray-400 uppercase">Est. CTR</span>
                    </div>
                    <span className="text-sm font-semibold text-gray-900 font-mono">
                      {selectedConfig.estimatedMetrics.estimatedCtr}
                    </span>
                  </div>
                  <div className="bg-white rounded-lg p-3 border border-gray-100">
                    <div className="flex items-center gap-1.5 mb-1">
                      <Target className="w-3 h-3 text-amber-500" />
                      <span className="text-[9px] text-gray-400 uppercase">Est. CPA</span>
                    </div>
                    <span className="text-sm font-semibold text-gray-900 font-mono">
                      {selectedConfig.estimatedMetrics.estimatedCpa}
                    </span>
                  </div>
                  <div className="bg-white rounded-lg p-3 border border-gray-100">
                    <div className="flex items-center gap-1.5 mb-1">
                      <BarChart3 className="w-3 h-3 text-purple-500" />
                      <span className="text-[9px] text-gray-400 uppercase">Est. Conversions</span>
                    </div>
                    <span className="text-sm font-semibold text-gray-900 font-mono">
                      {selectedConfig.estimatedMetrics.estimatedConversions}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Footer */}
      <div className="shrink-0 px-5 py-4 border-t border-gray-200 bg-white">
        {createdAdSetId ? (
          <button
            onClick={onClose}
            className="w-full px-4 py-2.5 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition-colors border-none cursor-pointer"
          >
            Done
          </button>
        ) : (
          <div className="flex items-center gap-2">
            <button
              onClick={handleApproveAndCreate}
              disabled={isCreating}
              className="flex-1 inline-flex items-center justify-center gap-1.5 px-4 py-2.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-colors border-none cursor-pointer"
            >
              {isCreating ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <CheckCircle className="w-3.5 h-3.5" />
                  Approve & Create
                </>
              )}
            </button>
            <button
              onClick={onClose}
              disabled={isCreating}
              className="px-4 py-2.5 text-xs font-medium text-gray-500 hover:text-gray-700 bg-gray-100 hover:bg-gray-200 disabled:opacity-50 rounded-lg transition-colors border-none cursor-pointer"
            >
              Cancel
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
