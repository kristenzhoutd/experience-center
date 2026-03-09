import { useEffect } from 'react';
import { useCampaignConfigStore } from '../../stores/campaignConfigStore';
import { useChatStore } from '../../stores/chatStore';
import { TextField, TextArea, Select } from '@/design-system';
import SelectableElement from '../chat/SelectableElement';

const CTX = { domain: 'campaign-setup' as const };

export default function CampaignSetupStep() {
  const config = useCampaignConfigStore((s) => s.config);
  const updateSetup = useCampaignConfigStore((s) => s.updateSetup);
  const setPageContext = useChatStore((s) => s.setPageContext);

  useEffect(() => {
    setPageContext('campaign-setup');
    return () => setPageContext(null);
  }, [setPageContext]);

  if (!config) return null;

  const { setup } = config;

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-auto p-6 space-y-4">
        {/* Campaign Name */}
        <section className="bg-white border border-gray-200 rounded-xl p-5">
          <h2 className="text-base font-semibold text-gray-900 mb-4">Campaign Details</h2>
          <div className="space-y-4">
            <SelectableElement refId="setup.name" refType="text-field" path={['Campaign Setup', 'Campaign Name']} label="Campaign Name" currentValue={setup.name} context={CTX}>
              <TextField
                label="Campaign Name"
                value={setup.name}
                onChange={(e) => updateSetup({ name: e.target.value })}
              />
            </SelectableElement>
            <SelectableElement refId="setup.objective" refType="text-field" path={['Campaign Setup', 'Objective']} label="Objective" currentValue={setup.objective} context={CTX}>
              <TextArea
                label="Objective"
                value={setup.objective}
                onChange={(e) => updateSetup({ objective: e.target.value })}
                rows={2}
              />
            </SelectableElement>
          </div>
        </section>

        {/* Goal & KPI */}
        <section className="bg-white border border-gray-200 rounded-xl p-5">
          <h2 className="text-base font-semibold text-gray-900 mb-4">Goal & KPIs</h2>
          <div className="grid grid-cols-2 gap-4">
            <SelectableElement refId="setup.businessGoal" refType="text-field" path={['Campaign Setup', 'Business Goal']} label="Business Goal" currentValue={setup.businessGoal} context={CTX}>
              <TextField
                label="Business Goal"
                value={setup.businessGoal}
                onChange={(e) => updateSetup({ businessGoal: e.target.value })}
              />
            </SelectableElement>
            <SelectableElement refId="setup.goalType" refType="select-field" path={['Campaign Setup', 'Goal Type']} label="Goal Type" currentValue={setup.goalType} context={CTX}>
              <Select
                label="Goal Type"
                value={setup.goalType}
                onChange={(e) => updateSetup({ goalType: e.target.value as typeof setup.goalType })}
              >
                <option value="conversion">Conversion</option>
                <option value="engagement">Engagement</option>
                <option value="retention">Retention</option>
                <option value="revenue">Revenue</option>
                <option value="awareness">Awareness</option>
              </Select>
            </SelectableElement>
            <SelectableElement refId="setup.primaryKpi" refType="text-field" path={['Campaign Setup', 'Primary KPI']} label="Primary KPI" currentValue={setup.primaryKpi} context={CTX}>
              <TextField
                label="Primary KPI"
                value={setup.primaryKpi}
                onChange={(e) => updateSetup({ primaryKpi: e.target.value })}
              />
            </SelectableElement>
          </div>
          {/* Secondary KPIs */}
          <SelectableElement refId="setup.secondaryKpis" refType="tag-list" path={['Campaign Setup', 'Secondary KPIs']} label="Secondary KPIs" currentValue={setup.secondaryKpis.join(', ')} context={CTX}>
            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-600 mb-2">Secondary KPIs</label>
              <div className="flex flex-wrap gap-2">
                {setup.secondaryKpis.map((kpi, idx) => (
                  <span
                    key={idx}
                    className="inline-flex items-center gap-1 px-3 py-1 bg-gray-100 text-gray-700 text-xs rounded-full"
                  >
                    {kpi}
                    <button
                      onClick={() => {
                        const updated = setup.secondaryKpis.filter((_, i) => i !== idx);
                        updateSetup({ secondaryKpis: updated });
                      }}
                      className="text-gray-400 hover:text-gray-600"
                    >
                      &times;
                    </button>
                  </span>
                ))}
              </div>
            </div>
          </SelectableElement>
        </section>

        {/* Dates */}
        <section className="bg-white border border-gray-200 rounded-xl p-5">
          <h2 className="text-base font-semibold text-gray-900 mb-4">Timeline</h2>
          <div className="grid grid-cols-2 gap-4">
            <SelectableElement refId="setup.startDate" refType="date-field" path={['Campaign Setup', 'Start Date']} label="Start Date" currentValue={setup.startDate} context={CTX}>
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">Start Date</label>
                <input
                  type="date"
                  value={setup.startDate}
                  onChange={(e) => updateSetup({ startDate: e.target.value })}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-gray-300"
                />
              </div>
            </SelectableElement>
            <SelectableElement refId="setup.endDate" refType="date-field" path={['Campaign Setup', 'End Date']} label="End Date" currentValue={setup.endDate} context={CTX}>
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">End Date</label>
                <input
                  type="date"
                  value={setup.endDate}
                  onChange={(e) => updateSetup({ endDate: e.target.value })}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-gray-300"
                />
              </div>
            </SelectableElement>
          </div>
        </section>
      </div>
    </div>
  );
}
